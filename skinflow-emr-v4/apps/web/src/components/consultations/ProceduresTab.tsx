import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { clinicalApi } from "@/lib/services/clinical";
import { mastersApi, ProcedureType } from "@/lib/services/masters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  PlusCircle,
  Search,
  CalendarPlus,
  CalendarDays,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Prescription } from "@/types/models";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProceduresTabProps {
  consultationId: number | string;
  patientId: number;
  existingPrescription?: Prescription;
  onPrescriptionUpdated: () => void;
  readOnly?: boolean;
}

export function ProceduresTab({
  consultationId,
  patientId,
  existingPrescription,
  onPrescriptionUpdated,
  readOnly = false,
}: ProceduresTabProps) {
  const [prescription, setPrescription] = useState<Prescription | undefined>(
    existingPrescription,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  // Combobox state
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProcedureType[]>([]);

  // Auto-search logic
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchTreatmentPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await clinicalApi.treatmentPlans.listByPatient(patientId);
      setTreatmentPlans(res.results);
    } catch {
      // silently fail
    } finally {
      setLoadingPlans(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTreatmentPlans();
  }, [fetchTreatmentPlans]);

  useEffect(() => {
    mastersApi.procedureTypes
      .search(debouncedSearch)
      .then((res) => {
        setSearchResults(res.results);
      })
      .catch(() => toast.error("Failed to fetch procedures"));
  }, [debouncedSearch]);

  // Single Session Form
  const sessionForm = useForm<{
    procedure: ProcedureType | null;
    manual_discount: number;
  }>({
    defaultValues: {
      procedure: null,
      manual_discount: 0,
    },
  });

  // Treatment Plan Form
  const planForm = useForm<{
    planName: string;
    procedure: ProcedureType | null;
    sessions: number;
  }>({
    defaultValues: {
      planName: "Acne Scar Revision Plan",
      procedure: null,
      sessions: 3,
    },
  });

  const handleAddImmediateProcedure = async (data: {
    procedure: ProcedureType | null;
    manual_discount: number;
  }) => {
    if (!data.procedure) {
      toast.error("Please select a procedure.");
      return;
    }

    setIsSaving(true);
    try {
      let currentRxId = prescription?.id;
      if (!currentRxId) {
        const newRx = await clinicalApi.prescriptions.create(consultationId);
        setPrescription(newRx);
        currentRxId = newRx.id;
      }

      await clinicalApi.prescriptions.addProcedure({
        prescription: currentRxId,
        procedure_type: data.procedure.id,
        sessions_planned: 1,
        base_price: data.procedure.base_price,
        manual_discount: data.manual_discount.toString(),
        is_selected_for_billing: true,
      });

      toast.success("Procedure added to today's prescription.");
      sessionForm.reset({ procedure: null, manual_discount: 0 });
      onPrescriptionUpdated();
    } catch (error: Error | unknown) {
      toast.error((error as Error).message || "Failed to add procedure.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTreatmentPlan = async (data: {
    planName: string;
    procedure: ProcedureType | null;
    sessions: number;
  }) => {
    if (!data.procedure) {
      toast.error("Please select a core procedure.");
      return;
    }

    setIsSaving(true);
    try {
      const planPayload = {
        patient: patientId,
        name: data.planName,
        items: [
          {
            procedure_type: data.procedure.id,
            planned_sessions: data.sessions,
          },
        ],
      };

      await clinicalApi.treatmentPlans.create(planPayload);
      toast.success("Treatment plan created successfully.");
      planForm.reset({ planName: "", procedure: null, sessions: 3 });
      // Since plans exist outside of *this specific session rx*, we just fire a toast.
      // In a full app, we'd append to a local display list of planned items.
    } catch (error: Error | unknown) {
      toast.error(
        (error as Error).message || "Failed to create treatment plan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // After plan created, also refresh plan list
  const handleCreateTreatmentPlanAndRefresh = async (data: {
    planName: string;
    procedure: ProcedureType | null;
    sessions: number;
  }) => {
    if (!data.procedure) {
      toast.error("Please select a core procedure.");
      return;
    }
    setIsSaving(true);
    try {
      const planPayload = {
        patient: patientId,
        name: data.planName,
        items: [
          {
            procedure_type: data.procedure.id,
            planned_sessions: data.sessions,
          },
        ],
      };
      await clinicalApi.treatmentPlans.create(planPayload);
      toast.success("Treatment plan created.");
      planForm.reset({
        planName: "Acne Scar Revision Plan",
        procedure: null,
        sessions: 3,
      });
      await fetchTreatmentPlans();
    } catch (error: Error | unknown) {
      toast.error(
        (error as Error).message || "Failed to create treatment plan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProcedure = async (procedureId: number) => {
    setDeletingId(procedureId);
    try {
      await clinicalApi.prescriptions.deleteProcedure(procedureId);
      toast.success("Procedure removed.");
      onPrescriptionUpdated();
    } catch (error) {
      toast.error((error as Error).message || "Failed to remove procedure.");
    } finally {
      setDeletingId(null);
    }
  };

  // Shared visual combo box for selecting procedures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ProcedureSelector = ({ formInstance }: { formInstance: any }) => (
    <FormField
      control={formInstance.control}
      name="procedure"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-1">
          <FormLabel className="text-[#1C1917] font-bold">
            Select Procedure
          </FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between bg-white border-[#D9D0C5] text-[#1C1917]",
                    !field.value && "text-[#A0978D] font-normal",
                  )}
                >
                  {field.value
                    ? field.value.name
                    : "Search clinical procedures..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#78706A]" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-[400px] p-0 border-[#D9D0C5] shadow-md"
              align="start"
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search procedure name..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No procedures found.</CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((proc) => (
                      <CommandItem
                        key={proc.id}
                        value={proc.id.toString()}
                        onSelect={() => {
                          formInstance.setValue("procedure", proc);
                          setOpen(false);
                        }}
                      >
                        <div className="flex justify-between w-full">
                          <span className="font-medium">{proc.name}</span>
                          <span className="text-muted-foreground">
                            ৳{proc.base_price}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-8">
      {!readOnly && <Tabs defaultValue="immediate" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#E8E1D6] p-1 rounded-xl h-auto">
          <TabsTrigger
            value="immediate"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1C1917] text-[#78706A] rounded-lg py-2.5 font-bold text-base transition-all"
          >
            Immediate Procedure (Today)
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1C1917] text-[#78706A] rounded-lg py-2.5 font-bold text-base transition-all"
          >
            Create Long-term Treatment Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="immediate"
          className="mt-6 border border-[#E8E1D6] p-6 rounded-2xl bg-white shadow-sm"
        >
          <Form {...sessionForm}>
            <form
              onSubmit={sessionForm.handleSubmit(handleAddImmediateProcedure)}
              className="flex flex-col sm:flex-row items-end gap-4"
            >
              <ProcedureSelector formInstance={sessionForm} />
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-56 bg-[#1C1917] hover:bg-[#3E3832] text-white h-10"
              >
                <PlusCircle className="mr-2 h-4 w-4 text-[#C4A882]" />
                Add to Session
              </Button>
            </form>
          </Form>

          <div className="mt-8">
            <h4 className="font-bold text-lg text-[#1C1917] mb-4">
              Procedures Prescribed for Today
            </h4>
            {existingPrescription?.procedures &&
            existingPrescription.procedures.length > 0 ? (
              <div className="space-y-3">
                {existingPrescription.procedures.map((proc) => (
                  <Card
                    key={proc.id}
                    className="bg-white border-[#E8E1D6] shadow-sm rounded-xl"
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex justify-between w-full pr-8">
                        <p className="font-bold text-[#1C1917] text-base">
                          {proc.procedure_name}
                        </p>
                        <p className="text-[#1C1917] font-medium text-base">
                          ৳{proc.base_price}
                        </p>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#C4705A] hover:text-[#A85A46] hover:bg-[#C4705A]/10 h-8 w-8"
                          disabled={deletingId === proc.id}
                          onClick={() => handleDeleteProcedure(proc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-base text-[#A0978D] italic border border-[#E8E1D6] border-dashed p-6 text-center rounded-xl">
                No procedures prescribed for this session.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="plan"
          className="mt-6 border border-[#E8E1D6] p-6 rounded-2xl bg-[#D9D0C5]/10 shadow-sm"
        >
          <Form {...planForm}>
            <form
              onSubmit={planForm.handleSubmit(
                handleCreateTreatmentPlanAndRefresh,
              )}
              className="space-y-5"
            >
              <FormField
                control={planForm.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1C1917] font-bold">
                      Treatment Plan Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Full Body Laser Hair Removal - 6 Sessions"
                        className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <ProcedureSelector formInstance={planForm} />
                <FormField
                  control={planForm.control}
                  name="sessions"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-32">
                      <FormLabel className="text-[#1C1917] font-bold">
                        Total Sessions
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full mt-2 bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 text-base font-bold shadow-md rounded-xl"
              >
                <CalendarPlus className="mr-2 h-5 w-5 text-[#C4A882]" />
                Generate Entitled Treatment Plan
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>}

      {/* ── EXISTING TREATMENT PLANS ── */}
      {/* ── EXISTING TREATMENT PLANS ── */}
      <div className="border-t border-[#E8E1D6] pt-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-[#1C1917] flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#7A9E8A]" />
            Patient's Treatment Plans (All Sessions)
            {treatmentPlans.length > 0 && (
              <Badge className="ml-2 text-xs h-6 px-2 bg-[#F7F3ED] text-[#1C1917] border border-[#D9D0C5] hover:bg-[#F7F3ED]">
                {treatmentPlans.length}
              </Badge>
            )}
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTreatmentPlans}
            disabled={loadingPlans}
            className="border-[#D9D0C5] text-[#1C1917] bg-white hover:bg-[#F7F3ED]"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loadingPlans && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {treatmentPlans.length === 0 ? (
          <p className="text-base text-[#A0978D] italic p-6 rounded-xl border border-[#E8E1D6] border-dashed text-center">
            No treatment plans exist for this patient yet.
            <br />
            Note: Treatment plans are tied to the{" "}
            <strong className="font-bold text-[#1C1917]">patient</strong>, not
            just today's session, so they will persist across multiple visits.
            Use the &ldquo;Create Long-term Treatment Plan&rdquo; tab above to
            generate one.
          </p>
        ) : (
          <div className="space-y-4">
            {treatmentPlans.map((plan: any) => (
              <Card
                key={plan.id}
                className="border-[#E8E1D6] bg-white shadow-sm rounded-xl"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#F7F3ED] p-2 rounded-lg border border-[#D9D0C5]">
                        <Stethoscope className="h-5 w-5 text-[#1C1917] shrink-0" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#1C1917] tracking-tight">
                          {plan.name}
                        </p>
                        <p className="text-sm text-[#78706A] font-medium mt-1">
                          Created:{" "}
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                        {plan.items && plan.items.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {plan.items.map((item: any) => (
                              <li
                                key={item.id}
                                className="text-base font-medium text-[#4E4843] flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#A0978D] shrink-0" />
                                {item.procedure_name ||
                                  `Procedure #${item.procedure_type}`}
                                <Badge className="text-xs px-2 py-0.5 ml-2 bg-[#C4A882] text-white border-0 shadow-sm">
                                  {item.planned_sessions} session
                                  {item.planned_sessions !== 1 ? "s" : ""}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#C4705A] hover:text-[#A85A46] hover:bg-[#C4705A]/10 shrink-0 h-9 w-9 rounded-lg"
                        disabled={deletingPlanId === plan.id}
                        onClick={async () => {
                          setDeletingPlanId(plan.id);
                          try {
                            await clinicalApi.treatmentPlans.deleteItem(plan.id);
                            toast.success("Treatment plan removed.");
                            await fetchTreatmentPlans();
                          } catch (error) {
                            toast.error((error as Error).message || "Failed to remove plan.");
                          } finally {
                            setDeletingPlanId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

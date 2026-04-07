"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { clinicalApi } from "@/lib/services/clinical";
import {
  mastersApi,
  MedicineMaster,
  PharmaseedMedicine,
} from "@/lib/services/masters";
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
import {
  Trash2,
  PlusCircle,
  Search,
  Info,
  FlaskConical,
  Database,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Prescription } from "@/types/models";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface RxTabProps {
  consultationId: number | string;
  existingPrescription?: Prescription;
  onPrescriptionUpdated: () => void;
}

// A unified result type for the search (either from local DB or Pharmaseed)
type MedicineSearchResult =
  | { source: "local"; data: MedicineMaster }
  | { source: "pharmaseed"; data: PharmaseedMedicine };

export function RxTab({
  consultationId,
  existingPrescription,
  onPrescriptionUpdated,
}: RxTabProps) {
  const [prescription, setPrescription] = useState<Prescription | undefined>(
    existingPrescription,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Combobox state
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [usePharmaseed, setUsePharmaseed] = useState(false);

  // Pharmacology info dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<{
    name: string;
    pharmacology: string;
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const form = useForm<{
    medicine: MedicineSearchResult | null;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>({
    defaultValues: {
      medicine: null,
      dose: "",
      route: "ORAL",
      frequency: "1-0-1",
      duration: "5 Days",
      instructions: "Take after meals",
    },
  });

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const doSearch = usePharmaseed
      ? mastersApi.medicines
          .pharmaseedSearch(debouncedSearch)
          .then((results) => {
            const normalised = Array.isArray(results) ? results : [];
            setSearchResults(
              normalised.map((r) => ({
                source: "pharmaseed" as const,
                data: r,
              })),
            );
          })
      : mastersApi.medicines.search(debouncedSearch).then((res) => {
          setSearchResults(
            (res.results ?? []).map((r) => ({
              source: "local" as const,
              data: r,
            })),
          );
        });

    doSearch
      .catch(() => toast.error("Failed to search medicines"))
      .finally(() => setIsSearching(false));
  }, [debouncedSearch, usePharmaseed]);

  const getMedicineName = (result: MedicineSearchResult): string => {
    const { data } = result;
    return `${data.generic_name}${data.brand_name ? ` (${data.brand_name})` : ""}${data.strength ? ` – ${data.strength}` : ""}`;
  };

  const handleInfoClick = (
    e: React.MouseEvent,
    result: MedicineSearchResult,
  ) => {
    e.stopPropagation();
    const pharmacology =
      result.source === "pharmaseed"
        ? (result.data.pharmacology_info ??
          "No pharmacology information available.")
        : (result.data.pharmacology_info ??
          "No pharmacology information available for this local entry.");
    setInfoContent({
      name: result.data.generic_name,
      pharmacology,
    });
    setInfoDialogOpen(true);
  };

  const handleAddMedication = async (data: {
    medicine: MedicineSearchResult | null;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    instructions: string;
  }) => {
    if (!data.medicine) {
      toast.error("Please select a medicine.");
      return;
    }

    setIsSaving(true);
    try {
      let currentRxId = prescription?.id;

      // Lazy-create prescription parent if needed
      if (!currentRxId) {
        const newRx = await clinicalApi.prescriptions.create(consultationId);
        setPrescription(newRx);
        currentRxId = newRx.id;
      }

      // Build the payload — if pharmaseed, send raw data so the backend can find-or-create locally
      const medicationPayload =
        data.medicine.source === "pharmaseed"
          ? {
              prescription: currentRxId,
              // medicine is optional here; the backend serializer will set it via pharmaseed_data
              dose: data.dose,
              route: data.route,
              frequency: data.frequency,
              duration: data.duration,
              instructions: data.instructions,
              pharmaseed_data: {
                pharmaseed_id: data.medicine.data.pharmaseed_id,
                generic_name: data.medicine.data.generic_name,
                brand_name: data.medicine.data.brand_name ?? "",
                strength: data.medicine.data.strength ?? "",
                pharmacology_info: data.medicine.data.pharmacology_info ?? "",
              },
            }
          : {
              prescription: currentRxId,
              medicine: data.medicine.data.id,
              dose: data.dose,
              route: data.route,
              frequency: data.frequency,
              duration: data.duration,
              instructions: data.instructions,
            };

      await clinicalApi.prescriptions.addMedication(medicationPayload);

      toast.success("Medication added.");
      form.reset({
        medicine: null,
        dose: "",
        route: "ORAL",
        frequency: "1-0-1",
        duration: "5 Days",
        instructions: "Take after meals",
      });
      setSearchQuery("");
      onPrescriptionUpdated();
    } catch (error: Error | unknown) {
      toast.error((error as Error).message || "Failed to add medication.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMedication = async (medicationId: number) => {
    setDeletingId(medicationId);
    try {
      await clinicalApi.prescriptions.deleteMedication(medicationId);
      toast.success("Medication removed.");
      onPrescriptionUpdated();
    } catch {
      toast.error("Failed to remove medication.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-3">
        <h3 className="font-bold text-xl text-[#1C1917]">
          Prescribe Medication
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={!usePharmaseed ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUsePharmaseed(false);
              setSearchResults([]);
              setSearchQuery("");
            }}
            className="gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            Local DB
          </Button>
          <Button
            variant={usePharmaseed ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUsePharmaseed(true);
              setSearchResults([]);
              setSearchQuery("");
            }}
            className="gap-1.5"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Pharmaseed
          </Button>
        </div>
      </div>

      {usePharmaseed && (
        <div className="rounded-xl bg-[#7A9E8A]/10 border border-[#7A9E8A]/30 p-4 text-sm text-[#4A6B5A] shadow-sm">
          Searching live via{" "}
          <strong className="font-bold">Pharmaseed API</strong>. Results include
          full pharmacology data. Selected medicines will be saved locally.
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleAddMedication)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="medicine"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[#1C1917] font-bold">
                    Medicine Search
                    {usePharmaseed && (
                      <Badge className="ml-2 text-[10px] bg-[#C4A882] text-white border-0 hover:bg-[#C4A882]">
                        Live
                      </Badge>
                    )}
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
                            ? getMedicineName(field.value)
                            : "Search medicine..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#78706A]" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[440px] p-0 border-[#D9D0C5] shadow-md"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={`Type to search ${usePharmaseed ? "Pharmaseed" : "local"} catalog...`}
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearching
                              ? "Searching..."
                              : debouncedSearch.length < 2
                                ? "Type at least 2 characters to search"
                                : "No medicine found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {searchResults.map((result, idx) => (
                              <CommandItem
                                key={
                                  result.source === "local"
                                    ? result.data.id
                                    : `ps-${result.data.pharmaseed_id ?? idx}`
                                }
                                value={
                                  result.source === "local"
                                    ? result.data.id.toString()
                                    : (result.data.pharmaseed_id ?? `ps-${idx}`)
                                }
                                onSelect={() => {
                                  form.setValue("medicine", result);
                                  setOpen(false);
                                }}
                                className="flex items-center justify-between pr-1"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium">
                                    {result.data.generic_name}
                                  </span>
                                  <span className="text-muted-foreground ml-2 text-sm">
                                    {result.data.brand_name}{" "}
                                    {result.data.strength &&
                                      `– ${result.data.strength}`}
                                  </span>
                                </div>
                                {(result.data.pharmacology_info ||
                                  result.source === "pharmaseed") && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => handleInfoClick(e, result)}
                                    title="View pharmacology info"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </Button>
                                )}
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
            <FormField
              control={form.control}
              name="dose"
              rules={{ required: "Dose is required (e.g. 500mg)" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1C1917] font-bold">
                    Dose <span className="text-[#C4705A]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 500mg"
                      className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1C1917] font-bold">
                    Frequency (Morning-Noon-Night)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1-0-1"
                      className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1C1917] font-bold">
                    Duration
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="5 Days"
                      className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-[#1C1917] font-bold">
                    Special Instructions
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Take after meals"
                      className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#1C1917] hover:bg-[#3E3832] text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-[#C4A882]" />
            Add Medication Line
          </Button>
        </form>
      </Form>

      <div className="mt-8">
        <h4 className="font-bold text-lg text-[#1C1917] mb-4">
          Current Medications
        </h4>
        {existingPrescription?.medications &&
        existingPrescription.medications.length > 0 ? (
          <div className="space-y-3">
            {existingPrescription.medications.map((med) => (
              <Card
                key={med.id}
                className="bg-white border-[#E8E1D6] rounded-xl shadow-sm"
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-[#1C1917] text-base">
                      {med.medicine_name}
                    </p>
                    <p className="text-sm text-[#78706A] font-medium mt-1">
                      {med.dose} | {med.frequency} | {med.duration} |{" "}
                      {med.route}
                    </p>
                    {med.instructions && (
                      <p className="text-sm italic text-[#C4A882] mt-1">
                        Note: {med.instructions}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#C4705A] hover:text-[#A85A46] hover:bg-[#C4705A]/10 h-8 w-8"
                    disabled={deletingId === med.id}
                    onClick={() => handleDeleteMedication(med.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-base text-[#A0978D] italic border border-[#E8E1D6] border-dashed p-6 text-center rounded-xl">
            No medications added yet.
          </p>
        )}
      </div>

      {/* Pharmacology Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-lg bg-[#F7F3ED] border-[#D9D0C5] sm:rounded-3xl">
          <DialogHeader className="bg-[#EDE7DC] px-6 py-5 border-b border-[#D9D0C5] sm:rounded-t-3xl">
            <DialogTitle className="flex items-center gap-3 text-2xl font-serif text-[#1C1917]">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <FlaskConical className="h-5 w-5 text-[#7A9E8A]" />
              </div>
              {infoContent?.name}
            </DialogTitle>
            <DialogDescription className="text-base text-[#78706A] mt-2 font-medium">
              Pharmacology Information
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto text-base text-[#1C1917] leading-relaxed whitespace-pre-wrap p-6 bg-white/50">
            {infoContent?.pharmacology || "No pharmacology data available."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

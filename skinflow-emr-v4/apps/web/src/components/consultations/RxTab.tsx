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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

// ── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: "1+0+0+0", label: "1+0+0+0 — Once daily (morning)" },
  { value: "0+1+0+0", label: "0+1+0+0 — Once daily (noon)" },
  { value: "0+0+1+0", label: "0+0+1+0 — Once daily (evening)" },
  { value: "0+0+0+1", label: "0+0+0+1 — Once daily (night)" },
  { value: "1+0+1+0", label: "1+0+1+0 — Twice daily (morning & evening)" },
  { value: "1+1+1+0", label: "1+1+1+0 — Three times daily" },
  { value: "1+1+1+1", label: "1+1+1+1 — Four times daily" },
  { value: "Every 8 hours", label: "Every 8 hours" },
  { value: "Every 12 hours", label: "Every 12 hours" },
  { value: "Once weekly", label: "Once weekly" },
  { value: "As needed (PRN)", label: "As needed (PRN)" },
];

const DURATION_OPTIONS = [
  "3 Days", "5 Days", "7 Days", "10 Days", "14 Days",
  "3 Weeks", "4 Weeks",
  "1 Month", "2 Months", "3 Months", "6 Months",
  "Ongoing", "Custom",
];

const ROUTE_OPTIONS = [
  "Oral", "Topical", "Injection", "Inhalation", "Sublingual", "Rectal", "Nasal",
];

const RECOMMENDATION_OPTIONS = [
  "Before meals",
  "After meals",
  "With water",
  "Empty stomach",
  "At bedtime",
  "With food",
];

// ── Types ────────────────────────────────────────────────────────────────────

interface RxTabProps {
  consultationId: number | string;
  existingPrescription?: Prescription;
  onPrescriptionUpdated: () => void;
}

type MedicineSearchResult =
  | { source: "local"; data: MedicineMaster }
  | { source: "pharmaseed"; data: PharmaseedMedicine };

type FormValues = {
  medicine: MedicineSearchResult | null;
  route: string;
  frequency: string;
  duration: string;
  customDuration: string;
  recommendations: string[];
  instructions: string;
};

// ── Component ────────────────────────────────────────────────────────────────

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
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usePharmaseed, setUsePharmaseed] = useState(false);

  // Pharmacology info dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<{
    name: string;
    pharmacology: string;
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const form = useForm<FormValues>({
    defaultValues: {
      medicine: null,
      route: "Oral",
      frequency: "1+0+1+0",
      duration: "7 Days",
      customDuration: "",
      recommendations: [],
      instructions: "",
    },
  });

  const watchedDuration = form.watch("duration");
  const watchedRecommendations = form.watch("recommendations");

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const doSearch = usePharmaseed
      ? mastersApi.medicines.pharmaseedSearch(debouncedSearch).then((results) => {
          setSearchResults(
            (Array.isArray(results) ? results : []).map((r) => ({
              source: "pharmaseed" as const,
              data: r,
            })),
          );
        })
      : mastersApi.medicines.search(debouncedSearch).then((res) => {
          setSearchResults(
            (res.results ?? []).map((r) => ({ source: "local" as const, data: r })),
          );
        });
    doSearch
      .catch(() => toast.error("Failed to search medicines"))
      .finally(() => setIsSearching(false));
  }, [debouncedSearch, usePharmaseed]);

  // "Brand (Generic) Strength" — spec §4.1
  const getMedicineName = (result: MedicineSearchResult): string => {
    const { data } = result;
    const brand = data.brand_name;
    const generic = data.generic_name;
    const strength = data.strength;
    if (brand) {
      return `${brand} (${generic})${strength ? ` ${strength}` : ""}`;
    }
    return `${generic}${strength ? ` ${strength}` : ""}`;
  };

  const handleInfoClick = (e: React.MouseEvent, result: MedicineSearchResult) => {
    e.stopPropagation();
    setInfoContent({
      name: result.data.generic_name,
      pharmacology:
        result.data.pharmacology_info ?? "No pharmacology information available.",
    });
    setInfoDialogOpen(true);
  };

  const toggleRecommendation = (option: string) => {
    const current = form.getValues("recommendations");
    form.setValue(
      "recommendations",
      current.includes(option)
        ? current.filter((r) => r !== option)
        : [...current, option],
    );
  };

  const handleAddMedication = async (data: FormValues) => {
    if (!data.medicine) {
      toast.error("Please select a medicine.");
      return;
    }

    const resolvedDuration =
      data.duration === "Custom" ? data.customDuration.trim() : data.duration;
    if (!resolvedDuration) {
      toast.error("Please enter a duration.");
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

      // Dose auto-populated from medicine strength (not shown in UI per spec §4.1)
      const dose = data.medicine.data.strength ?? "";

      const medicationPayload =
        data.medicine.source === "pharmaseed"
          ? {
              prescription: currentRxId,
              dose,
              route: data.route,
              frequency: data.frequency,
              duration: resolvedDuration,
              recommendations: data.recommendations.join(", "),
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
              dose,
              route: data.route,
              frequency: data.frequency,
              duration: resolvedDuration,
              recommendations: data.recommendations.join(", "),
              instructions: data.instructions,
            };

      await clinicalApi.prescriptions.addMedication(medicationPayload);
      toast.success("Medication added.");
      form.reset({
        medicine: null,
        route: "Oral",
        frequency: "1+0+1+0",
        duration: "7 Days",
        customDuration: "",
        recommendations: [],
        instructions: "",
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
      {/* Header + source toggle */}
      <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-3">
        <h3 className="font-bold text-xl text-[#1C1917]">Prescribe Medication</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={!usePharmaseed ? "default" : "outline"}
            size="sm"
            onClick={() => { setUsePharmaseed(false); setSearchResults([]); setSearchQuery(""); }}
            className="gap-1.5"
          >
            <Database className="h-3.5 w-3.5" /> Local DB
          </Button>
          <Button
            variant={usePharmaseed ? "default" : "outline"}
            size="sm"
            onClick={() => { setUsePharmaseed(true); setSearchResults([]); setSearchQuery(""); }}
            className="gap-1.5"
          >
            <FlaskConical className="h-3.5 w-3.5" /> Pharmaseed
          </Button>
        </div>
      </div>

      {usePharmaseed && (
        <div className="rounded-xl bg-[#7A9E8A]/10 border border-[#7A9E8A]/30 p-4 text-sm text-[#4A6B5A] shadow-sm">
          Searching live via <strong className="font-bold">Pharmaseed API</strong>. Results include
          full pharmacology data. Selected medicines will be saved locally.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddMedication)} className="space-y-4">

          {/* Row 1: Medicine search (full width) */}
          <FormField
            control={form.control}
            name="medicine"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[#1C1917] font-bold">
                  Medicine
                  {usePharmaseed && (
                    <Badge className="ml-2 text-[10px] bg-[#C4A882] text-white border-0 hover:bg-[#C4A882]">Live</Badge>
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
                        {field.value ? getMedicineName(field.value) : "Search by brand or generic name…"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#78706A]" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[480px] p-0 border-[#D9D0C5] shadow-md" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={`Search ${usePharmaseed ? "Pharmaseed" : "local"} catalog by brand or generic…`}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isSearching
                            ? "Searching…"
                            : debouncedSearch.length < 2
                              ? "Type at least 2 characters"
                              : "No medicine found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((result, idx) => (
                            <CommandItem
                              key={result.source === "local" ? result.data.id : `ps-${result.data.pharmaseed_id ?? idx}`}
                              value={result.source === "local" ? result.data.id.toString() : (result.data.pharmaseed_id ?? `ps-${idx}`)}
                              onSelect={() => { form.setValue("medicine", result); setOpen(false); }}
                              className="flex items-center justify-between pr-1"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{getMedicineName(result)}</span>
                              </div>
                              {(result.data.pharmacology_info || result.source === "pharmaseed") && (
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

          {/* Row 2: Frequency + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1C1917] font-bold">Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#D9D0C5]">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1C1917] font-bold">Duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-[#D9D0C5]">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {watchedDuration === "Custom" && (
                <FormField
                  control={form.control}
                  name="customDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="e.g. 45 days"
                          className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Row 3: Route */}
          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem className="md:w-1/2">
                <FormLabel className="text-[#1C1917] font-bold">Route</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-[#D9D0C5]">
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROUTE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Row 4: Recommendations checkboxes */}
          <FormItem>
            <FormLabel className="text-[#1C1917] font-bold">Recommendations</FormLabel>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
              {RECOMMENDATION_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-sm text-[#1C1917] cursor-pointer select-none"
                >
                  <Checkbox
                    checked={watchedRecommendations.includes(option)}
                    onCheckedChange={() => toggleRecommendation(option)}
                    className="border-[#D9D0C5] data-[state=checked]:bg-[#1C1917] data-[state=checked]:border-[#1C1917]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </FormItem>

          {/* Row 5: Special instructions */}
          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1C1917] font-bold">Special Instructions</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Any additional notes for the patient…"
                    className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

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

      {/* Current medications list */}
      <div className="mt-8">
        <h4 className="font-bold text-lg text-[#1C1917] mb-4">Current Medications</h4>
        {existingPrescription?.medications && existingPrescription.medications.length > 0 ? (
          <div className="space-y-3">
            {existingPrescription.medications.map((med) => (
              <Card key={med.id} className="bg-white border-[#E8E1D6] rounded-xl shadow-sm">
                <CardContent className="p-4 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-bold text-[#1C1917] text-base">{med.medicine_name}</p>
                    <p className="text-sm text-[#78706A] font-medium">
                      {med.frequency} · {med.duration} · {med.route}
                    </p>
                    {med.recommendations && (
                      <p className="text-sm text-[#A0978D]">{med.recommendations}</p>
                    )}
                    {med.instructions && (
                      <p className="text-sm italic text-[#C4A882]">Note: {med.instructions}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#C4705A] hover:text-[#A85A46] hover:bg-[#C4705A]/10 h-8 w-8 shrink-0 mt-0.5"
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

      {/* Pharmacology info dialog */}
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

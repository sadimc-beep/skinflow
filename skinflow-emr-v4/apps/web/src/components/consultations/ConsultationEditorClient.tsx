"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { clinicalApi } from "@/lib/services/clinical";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Save,
  Activity,
  FileText,
  Pill,
  Syringe,
  CheckCircle2,
  Stethoscope,
  AlertCircle,
  ShoppingBag,
  CalendarClock,
  ArrowLeft,
  AlertTriangle,
  Receipt,
  Download,
} from "lucide-react";
import type {
  Consultation,
  ConsultationFormData,
  ClinicalIntake,
} from "@/types/models";
import { RxTab } from "./RxTab";
import { SkincareTab } from "./SkincareTab";
import { ProceduresTab } from "./ProceduresTab";

type EditorProps = {
  consultation: Consultation;
  intake?: ClinicalIntake;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#D9D0C5]/40 text-[#78706A] border-[#D9D0C5]",
  FINALIZED: "bg-[#7A9E8A]/10 text-[#4A6B5A] border-[#7A9E8A]/30",
  CANCELLED: "bg-[#C4705A]/10 text-[#C4705A] border-[#C4705A]/30",
};

export function ConsultationEditorClient({
  consultation,
  intake,
}: EditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [liveConsultation, setLiveConsultation] = useState(consultation);
  const [isDownloadingRx, setIsDownloadingRx] = useState(false);

  const isFinalized = liveConsultation.status === "FINALIZED";

  const handleDownloadRx = async () => {
    setIsDownloadingRx(true);
    try {
      await clinicalApi.consultations.downloadPdf(liveConsultation.id);
    } catch {
      toast.error("Failed to generate prescription PDF. Please try again.");
    } finally {
      setIsDownloadingRx(false);
    }
  };

  // Refresh live prescription data when tabs update
  const refreshConsultation = useCallback(async () => {
    try {
      const updated = await clinicalApi.consultations.get(consultation.id);
      setLiveConsultation(updated);
    } catch {
      router.refresh();
    }
  }, [consultation.id, router]);

  const form = useForm<ConsultationFormData>({
    defaultValues: {
      chief_complaint: consultation.chief_complaint || "",
      history_of_present_illness: consultation.history_of_present_illness || "",
      examination_findings: consultation.examination_findings || "",
      assessment_and_plan: consultation.assessment_and_plan || "",
    },
  });

  const onSubmitNotes = async (data: ConsultationFormData) => {
    setIsSaving(true);
    try {
      await clinicalApi.consultations.update(consultation.id, data);
      toast.success("Clinical notes saved.");
    } catch (error: Error | unknown) {
      toast.error((error as Error).message || "Failed to save notes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmFinalize = async () => {
    setIsFinalizing(true);
    try {
      await clinicalApi.consultations.finalize(consultation.id);
      toast.success("Consultation finalized! Patient can proceed to billing.");
      setFinalizeModalOpen(false);
      setLiveConsultation({ ...liveConsultation, status: "FINALIZED" });
      router.refresh();
    } catch (error: Error | unknown) {
      toast.error(
        (error as Error).message || "Failed to finalize consultation.",
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  const rx = liveConsultation.prescription;

  return (
    <div className="space-y-6 pb-24">
      {/* ── Back to Patient breadcrumb ── */}
      {liveConsultation.patient_details?.id && (
        <div className="flex items-center gap-2">
          <a
            href={`/patients/${liveConsultation.patient_details.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patient
          </a>
        </div>
      )}

      {/* Top Patient Context Banner */}
      <Card
        className={`border shadow-sm rounded-2xl ${STATUS_COLORS[liveConsultation.status] || ""}`}
      >
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E8E1D6]">
              <Stethoscope className="h-8 w-8 text-[#C4A882]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                {liveConsultation.patient_details?.first_name}{" "}
                {liveConsultation.patient_details?.last_name}
              </h3>
              <p className="text-base text-[#78706A] mt-1 font-medium">
                {liveConsultation.patient_details?.gender}
                {liveConsultation.patient_details?.date_of_birth &&
                  ` · DOB: ${liveConsultation.patient_details.date_of_birth}`}
                {liveConsultation.patient_details?.phone_primary &&
                  ` · ${liveConsultation.patient_details.phone_primary}`}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right flex flex-col sm:items-end gap-2">
            <Badge
              className={`text-sm font-bold px-3 py-1.5 uppercase tracking-wider ${STATUS_COLORS[liveConsultation.status]} border`}
            >
              {isFinalized ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              {liveConsultation.status}
            </Badge>
            <p className="text-sm font-medium text-[#A0978D]">
              Consultation #{liveConsultation.id}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Finalized read-only notice + Generate Bill shortcut ── */}
      {isFinalized && (
        <div className="rounded-2xl bg-[#7A9E8A]/10 border border-[#7A9E8A]/30 p-5 text-base text-[#4A6B5A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-[#7A9E8A]" />
            </div>
            <p>
              This consultation is{" "}
              <strong className="font-bold">finalized</strong>. The patient has
              been directed to billing/discharge. Clinical records are now
              read-only.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRx}
              disabled={isDownloadingRx}
              className="rounded-full bg-white text-[#1C1917] border-[#D9D0C5] hover:bg-[#F7F3ED] hover:text-[#C4A882] shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloadingRx ? "Generating…" : "Print Rx"}
            </Button>
            <a
              href={`/billing?consultation=${liveConsultation.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full bg-white text-[#1C1917] border border-[#D9D0C5] hover:bg-[#F7F3ED] hover:text-[#C4A882] whitespace-nowrap transition-all shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              Generate Bill
            </a>
          </div>
        </div>
      )}

      {/* ── Patient Medical Alerts ── */}
      {(liveConsultation.patient_details as any)?.has_known_allergies && (
        <div className="rounded-xl border border-[#C4705A]/30 bg-[#C4705A]/5 p-4 text-base text-[#C4705A] flex items-center gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            <strong className="font-bold">⚠ Known Allergies:</strong> This
            patient has documented allergies. Review before prescribing.
          </span>
        </div>
      )}
      {(liveConsultation.patient_details as any)?.has_chronic_conditions && (
        <div className="rounded-xl border border-[#C4A882]/30 bg-[#C4A882]/5 p-4 text-base text-[#9A7D54] flex items-center gap-3 shadow-sm mt-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            <strong className="font-bold">⚠ Chronic Conditions:</strong> This
            patient has documented chronic conditions on file.
          </span>
        </div>
      )}

      <Tabs defaultValue="notes" className="w-full">
        <div className="bg-[#F7F3ED] p-2 rounded-2xl border border-[#E8E1D6] shadow-sm inline-flex mb-2 max-w-full overflow-x-auto">
          <TabsList className="bg-transparent space-x-2 p-0 h-auto">
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-2.5 font-medium text-[#78706A] hover:text-[#1C1917] transition-all text-base whitespace-nowrap"
            >
              <FileText className="mr-2 h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="vitals"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-2.5 font-medium text-[#78706A] hover:text-[#1C1917] transition-all text-base whitespace-nowrap"
            >
              <Activity className="mr-2 h-4 w-4" />
              Vitals
            </TabsTrigger>
            <TabsTrigger
              value="rx"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-2.5 font-medium text-[#78706A] hover:text-[#1C1917] transition-all text-base whitespace-nowrap"
            >
              <Pill className="mr-2 h-4 w-4" />
              Rx
              {rx?.medications?.length ? (
                <Badge className="ml-2 text-[10px] h-5 px-1.5 bg-[#C4A882] text-white hover:bg-[#C4A882] border-0">
                  {rx.medications.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="procedures"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-5 py-2.5 font-medium text-[#78706A] hover:text-[#1C1917] transition-all text-base whitespace-nowrap"
            >
              <Syringe className="mr-2 h-4 w-4" />
              Procedures
              {rx?.procedures?.length ? (
                <Badge className="ml-2 text-[10px] h-5 px-1.5 bg-[#C4A882] text-white hover:bg-[#C4A882] border-0">
                  {rx.procedures.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── NOTES TAB ── */}
        <TabsContent value="notes" className="mt-4">
          <Card className="bg-[#F7F3ED] border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#EDE7DC] border-b border-[#D9D0C5] py-5 px-6">
              <CardTitle className="text-2xl font-serif text-[#1C1917]">
                Clinical Notes
              </CardTitle>
              <CardDescription className="text-base text-[#78706A] mt-1">
                Record symptoms, examination findings, and assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitNotes)}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="chief_complaint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#1C1917]">
                            Chief Complaint
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Patient presents with..."
                              className="h-32 resize-none bg-[#F7F3ED] border-[#D9D0C5] text-[#1C1917] placeholder:text-[#A0978D] focus-visible:ring-[#C4A882] text-base"
                              disabled={isFinalized}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="history_of_present_illness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-[#1C1917]">
                            History of Present Illness
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Condition started 3 days ago..."
                              className="h-32 resize-none bg-[#F7F3ED] border-[#D9D0C5] text-[#1C1917] placeholder:text-[#A0978D] focus-visible:ring-[#C4A882] text-base"
                              disabled={isFinalized}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="examination_findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-[#1C1917]">
                          Examination Findings
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Objective clinical observations..."
                            className="h-28 resize-none bg-[#F7F3ED] border-[#D9D0C5] text-[#1C1917] placeholder:text-[#A0978D] focus-visible:ring-[#C4A882] text-base"
                            disabled={isFinalized}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assessment_and_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-[#1C1917]">
                          Assessment & Treatment Plan
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Diagnosis and plan..."
                            className="h-28 resize-none bg-[#F7F3ED] border-[#D9D0C5] text-[#1C1917] placeholder:text-[#A0978D] focus-visible:ring-[#C4A882] text-base"
                            disabled={isFinalized}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isFinalized && (
                    <div className="flex justify-end pt-4 border-t border-[#E8E1D6]">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-10 px-6 text-base shadow-sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Notes"}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── VITALS TAB ── */}
        <TabsContent value="vitals" className="mt-4">
          <Card className="bg-[#F7F3ED] border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#EDE7DC] border-b border-[#D9D0C5] py-5 px-6">
              <CardTitle className="text-2xl font-serif text-[#1C1917]">
                Vitals & Intake
              </CardTitle>
              <CardDescription className="text-base text-[#78706A] mt-1">
                Measurements recorded at check-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {intake ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Blood Pressure",
                      value: intake.blood_pressure || "—",
                      unit: "",
                    },
                    { label: "Pulse", value: intake.pulse || "—", unit: "bpm" },
                    {
                      label: "Weight",
                      value: intake.weight || "—",
                      unit: "kg",
                    },
                    { label: "BMI", value: intake.bmi || "—", unit: "" },
                  ].map((v) => (
                    <div
                      key={v.label}
                      className="bg-white rounded-xl p-5 text-center border border-[#E8E1D6] shadow-sm"
                    >
                      <p className="text-sm font-semibold text-[#A0978D] uppercase tracking-wider mb-2">
                        {v.label}
                      </p>
                      <p className="text-3xl font-bold text-[#1C1917]">
                        {v.value}
                      </p>
                      {v.unit && (
                        <p className="text-sm font-medium text-[#78706A] mt-1">
                          {v.unit}
                        </p>
                      )}
                    </div>
                  ))}
                  {intake.chief_complaint && (
                    <div className="col-span-2 md:col-span-4 bg-[#D9D0C5]/40 border border-[#D9D0C5] rounded-xl p-5 shadow-sm mt-2">
                      <p className="text-sm font-bold text-[#78706A] uppercase tracking-wider mb-2">
                        Chief Complaint (intake)
                      </p>
                      <p className="text-base font-medium text-[#1C1917]">
                        {intake.chief_complaint}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[#A0978D] font-medium text-center py-8 bg-white border border-[#E8E1D6] border-dashed rounded-xl">
                  No vitals recorded yet. Nurse can record during appointment
                  check-in.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RX TAB ── */}
        <TabsContent value="rx" className="mt-4">
          <Card className="bg-[#F7F3ED] border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#EDE7DC] border-b border-[#D9D0C5] py-5 px-6">
              <CardTitle className="text-2xl font-serif text-[#1C1917]">
                Prescriptions
              </CardTitle>
              <CardDescription className="text-base text-[#78706A] mt-1">
                Medications and recommended skincare products for this
                consultation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-10">
              <RxTab
                consultationId={liveConsultation.id}
                existingPrescription={liveConsultation.prescription}
                onPrescriptionUpdated={refreshConsultation}
              />
              <hr className="border-[#D9D0C5]" />
              <SkincareTab
                consultationId={liveConsultation.id}
                existingPrescription={liveConsultation.prescription}
                onPrescriptionUpdated={refreshConsultation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROCEDURES TAB ── */}
        <TabsContent value="procedures" className="mt-4">
          <Card className="bg-[#F7F3ED] border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#EDE7DC] border-b border-[#D9D0C5] py-5 px-6">
              <CardTitle className="text-2xl font-serif text-[#1C1917]">
                Procedures & Treatment Plans
              </CardTitle>
              <CardDescription className="text-base text-[#78706A] mt-1">
                Prescribe immediate procedures or create multi-session treatment
                plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProceduresTab
                consultationId={liveConsultation.id}
                patientId={liveConsultation.patient}
                existingPrescription={liveConsultation.prescription}
                onPrescriptionUpdated={refreshConsultation}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── STICKY FINALIZE BAR ── */}
      {!isFinalized && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D9D0C5] bg-[#F7F3ED]/95 backdrop-blur-md shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-base text-[#78706A]">
              <span className="font-semibold text-[#1C1917] tracking-tight">
                {rx?.medications?.length || 0} med
                {(rx?.medications?.length || 0) !== 1 ? "s" : ""}
                {" · "}
                {rx?.procedures?.length || 0} procedure
                {(rx?.procedures?.length || 0) !== 1 ? "s" : ""}
                {" · "}
                {rx?.products?.length || 0} skincare item
                {(rx?.products?.length || 0) !== 1 ? "s" : ""}
              </span>
              <span className="ml-2 text-[#A0978D] font-medium">
                · Consultation #{liveConsultation.id}
              </span>
            </div>
            <Button
              onClick={() => setFinalizeModalOpen(true)}
              className="bg-[#1C1917] hover:bg-[#3E3832] text-white px-8 h-12 text-base font-semibold rounded-full shadow-md w-full sm:w-auto transition-transform active:scale-95"
            >
              <CheckCircle2 className="mr-2 h-5 w-5 text-[#C4A882]" />
              Finalize Consultation
            </Button>
          </div>
        </div>
      )}

      {/* ── FINALIZE CONFIRMATION MODAL ── */}
      <Dialog open={finalizeModalOpen} onOpenChange={setFinalizeModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F7F3ED] border-[#D9D0C5] p-0 sm:rounded-3xl">
          <DialogHeader className="bg-[#EDE7DC] px-8 py-6 border-b border-[#D9D0C5]">
            <DialogTitle className="flex items-center gap-3 text-3xl font-serif text-[#1C1917]">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-[#7A9E8A]" />
              </div>
              Finalize Consultation
            </DialogTitle>
            <DialogDescription className="text-base text-[#78706A] mt-2 font-medium">
              Review the prescription summary before finalizing. Once confirmed,
              the consultation is locked. The patient will be directed to the
              front desk for billing and discharge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-6 px-8 bg-white/50">
            {/* Patient Banner */}
            <div className="rounded-2xl bg-white border border-[#E8E1D6] p-5 shadow-sm flex items-center gap-4">
              <div className="bg-[#F7F3ED] p-3 rounded-full border border-[#D9D0C5]">
                <Stethoscope className="h-6 w-6 text-[#1C1917]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1917]">
                  {liveConsultation.patient_details?.first_name}{" "}
                  {liveConsultation.patient_details?.last_name}
                </p>
                <p className="text-base text-[#78706A] font-medium mt-0.5">
                  {liveConsultation.patient_details?.phone_primary}
                </p>
              </div>
            </div>

            {/* Medications */}
            <SummarySection
              icon={<Pill className="h-5 w-5 text-[#C4A882]" />}
              title="Medications"
              items={
                rx?.medications?.map((m) => ({
                  primary: m.medicine_name || `#${m.medicine}`,
                  secondary: `${m.dose} · ${m.frequency} · ${m.duration}`,
                })) || []
              }
              emptyText="No medications prescribed."
            />

            {/* Procedures */}
            <SummarySection
              icon={<Syringe className="h-5 w-5 text-[#C4A882]" />}
              title="Procedures (Today)"
              items={
                rx?.procedures?.map((p) => ({
                  primary: p.procedure_name || `Procedure #${p.id}`,
                  secondary: `৳${p.base_price}`,
                  badge: `${p.sessions_planned} session${p.sessions_planned !== 1 ? "s" : ""}`,
                })) || []
              }
              emptyText="No procedures prescribed for today."
            />

            {/* Skincare */}
            <SummarySection
              icon={<ShoppingBag className="h-5 w-5 text-[#C4A882]" />}
              title="Skincare Products"
              items={
                rx?.products?.map((p) => ({
                  primary: p.product_name,
                  secondary: `৳${p.price} · qty ${p.quantity}`,
                })) || []
              }
              emptyText="No skincare products prescribed."
            />

            {/* Next Steps Notice */}
            <div className="rounded-2xl bg-[#D9D0C5]/40 border border-[#D9D0C5] p-5 text-base text-[#1C1917] shadow-sm">
              <p className="font-bold mb-3 flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-[#78706A]" />
                Post-Finalization Patient Flow
              </p>
              <ol className="list-decimal list-inside space-y-2 text-[#4E4843] font-medium marker:text-[#A0978D]">
                <li>
                  Patient proceeds to{" "}
                  <strong className="font-bold text-[#1C1917]">
                    front desk / billing
                  </strong>
                </li>
                <li>
                  Reception generates an invoice for today&apos;s consultation
                  fee + procedures
                </li>
                <li>Patient pays and receives prescription printout</li>
                <li>
                  If a treatment plan was created, entitlement sessions are
                  tracked in the system
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter className="gap-3 bg-[#EDE7DC] px-8 py-5 border-t border-[#D9D0C5] sm:rounded-b-3xl">
            <Button
              variant="outline"
              onClick={() => setFinalizeModalOpen(false)}
              className="h-12 px-6 text-base font-semibold border-[#D9D0C5] text-[#1C1917] hover:bg-white rounded-xl"
            >
              Go Back & Edit
            </Button>
            <Button
              onClick={handleConfirmFinalize}
              disabled={isFinalizing}
              className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-8 text-base font-semibold rounded-xl shadow-md transition-transform active:scale-95"
            >
              <CheckCircle2 className="mr-2 h-5 w-5 text-[#C4A882]" />
              {isFinalizing ? "Finalizing..." : "Confirm & Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper: Summary section component ──
interface SummaryItem {
  primary: string;
  secondary?: string;
  badge?: string;
}

function SummarySection({
  icon,
  title,
  items,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  items: SummaryItem[];
  emptyText: string;
}) {
  return (
    <div>
      <h4 className="font-bold text-xl text-[#1C1917] mb-4 flex items-center gap-2 border-b border-[#E8E1D6] pb-2">
        {icon}
        {title}
        {items.length > 0 && (
          <Badge className="ml-2 text-xs h-6 px-2 bg-[#F7F3ED] text-[#1C1917] border border-[#D9D0C5]">
            {items.length}
          </Badge>
        )}
      </h4>
      {items.length === 0 ? (
        <p className="text-base text-[#A0978D] italic font-medium">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-xl bg-white border border-[#E8E1D6] px-5 py-4 text-base flex justify-between items-center shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-bold text-[#1C1917] text-lg">
                  {item.primary}
                </span>
                {item.secondary && (
                  <span className="text-[#78706A] font-medium">
                    {item.secondary}
                  </span>
                )}
              </div>
              {item.badge && (
                <Badge className="text-xs px-2 py-0.5 bg-[#C4A882] text-white border-0 shadow-sm">
                  {item.badge}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

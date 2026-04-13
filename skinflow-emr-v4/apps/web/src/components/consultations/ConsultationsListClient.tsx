"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Receipt,
  ChevronDown,
  ChevronUp,
  Clock,
  Stethoscope,
} from "lucide-react";
import { clinicalApi } from "@/lib/services/clinical";
import { appointmentsApi, coreApi } from "@/lib/services/appointments";
import { useAuth } from "@/lib/context/AuthContext";
import type { Consultation, Appointment, Provider } from "@/types/models";
import { GenerateBillModal } from "./GenerateBillModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatWaitTime(arrivedAt: string | null | undefined): string {
  if (!arrivedAt) return "—";
  const mins = differenceInMinutes(new Date(), parseISO(arrivedAt));
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function FeeStatusBadge({ appt }: { appt: Appointment }) {
  if (appt.fee_waiver_requested && appt.fee_waiver_approved === true)
    return <Badge className="bg-[#7A9E8A]/10 text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20 border-0">Waived</Badge>;
  if (appt.is_fee_paid)
    return <Badge className="bg-[#7A9E8A]/10 text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20 border-0">Paid</Badge>;
  if (appt.fee_waiver_requested && appt.fee_waiver_approved === null)
    return <Badge className="bg-amber-100 text-amber-800 border-0">Waiver Pending</Badge>;
  return <Badge className="bg-[#C4A882]/10 text-[#9A7D54] border-0">Pending</Badge>;
}

function ConsultationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "DRAFT":
      return <Badge className="bg-[#D9D0C5] text-[#78706A] hover:bg-[#D9D0C5] border-0">In Progress</Badge>;
    case "FINALIZED":
      return <Badge className="bg-[#7A9E8A]/10 text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20 hover:bg-[#7A9E8A]/20 border-0">Finalized</Badge>;
    case "CANCELLED":
      return <Badge className="bg-[#C4705A]/10 text-[#C4705A] hover:bg-[#C4705A]/20 border-0">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="border-[#D9D0C5]">{status}</Badge>;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  initialData: Consultation[];
  patientView?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ConsultationsListClient({
  initialData,
  patientView = false,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isConsultant =
    user?.role?.name === "Owner" || user?.role?.name === "Doctor";

  // Shared billing modal state
  const [billingConsultation, setBillingConsultation] =
    useState<Consultation | null>(null);

  // ── patientView state (embedded in patient profile — unchanged behaviour) ──
  const [consultations, setConsultations] = useState(initialData);
  const [pvLoading, setPvLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // ── Queue/tabbed view state ──
  const [activeTab, setActiveTab] = useState<
    "waiting" | "in_progress" | "finalized"
  >("waiting");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [waitingQueue, setWaitingQueue] = useState<Appointment[]>([]);
  const [inProgress, setInProgress] = useState<Consultation[]>([]);
  const [finalized, setFinalized] = useState<Consultation[]>([]);
  const [loadingWaiting, setLoadingWaiting] = useState(true);
  const [loadingInProgress, setLoadingInProgress] = useState(true);
  const [loadingFinalized, setLoadingFinalized] = useState(true);

  // ── patientView: use passed initialData ──
  useEffect(() => {
    if (!patientView) return;
    setConsultations(initialData);
  }, [initialData, patientView]);

  // ── Queue view: fetch providers + default filter for doctors ──
  useEffect(() => {
    if (patientView) return;
    coreApi.providers
      .list({ is_active: true })
      .then((res) => {
        const list = res.results || [];
        setProviders(list);
        // Default doctor to their own queue
        if (isConsultant && user?.provider_id) {
          setSelectedProvider(user.provider_id.toString());
        }
      })
      .catch(console.error);
  }, [patientView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Queue view: fetch Waiting + In Progress when provider filter changes ──
  useEffect(() => {
    if (patientView) return;

    const providerParam =
      selectedProvider !== "all" ? parseInt(selectedProvider) : undefined;

    setLoadingWaiting(true);
    setLoadingInProgress(true);

    appointmentsApi
      .list({ status: "READY_FOR_CONSULT", ...(providerParam && { provider: providerParam }) })
      .then((res) => setWaitingQueue(res.results || []))
      .catch(console.error)
      .finally(() => setLoadingWaiting(false));

    clinicalApi.consultations
      .list({ status: "DRAFT", ...(providerParam && { provider: providerParam }), limit: 200 })
      .then((res) => setInProgress(res.results || []))
      .catch(console.error)
      .finally(() => setLoadingInProgress(false));
  }, [patientView, selectedProvider]);

  // ── Queue view: fetch Finalized (no provider filter — historical) ──
  useEffect(() => {
    if (patientView) return;
    clinicalApi.consultations
      .list({ status: "FINALIZED", limit: 100 })
      .then((res) => setFinalized(res.results || []))
      .catch(console.error)
      .finally(() => setLoadingFinalized(false));
  }, [patientView]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── patientView render (unchanged) ──────────────────────────────────────────
  if (patientView) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#E8E1D6] bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-[#E8E1D6]">
              <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                <TableHead className="w-10 py-4 px-4"></TableHead>
                <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Date</TableHead>
                <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Provider</TableHead>
                <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Status</TableHead>
                <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pvLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">Loading…</TableCell></TableRow>
              ) : consultations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">No consultations found.</TableCell></TableRow>
              ) : (
                consultations.map((consult) => (
                  <Fragment key={consult.id}>
                    <TableRow className={`${expandedIds.has(consult.id) ? "border-b-0" : "border-b border-[#E8E1D6]"} hover:bg-[#F7F3ED] transition-colors`}>
                      <TableCell className="py-4 px-4">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#A0978D] hover:text-[#1C1917]" onClick={() => toggleExpand(consult.id)}>
                          {expandedIds.has(consult.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-[#1C1917] text-sm py-3 px-4">
                        {format(parseISO(consult.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-[#78706A] text-sm">Dr. {consult.provider_details?.name}</TableCell>
                      <TableCell className="py-3 px-4"><ConsultationStatusBadge status={consult.status} /></TableCell>
                      <TableCell className="text-right space-x-2 py-3 px-4">
                        <Button variant="outline" size="sm" className="text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]" onClick={() => router.push(`/consultations/${consult.id}`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          {consult.status === "DRAFT" ? "Continue" : "View"}
                        </Button>
                        {consult.status === "FINALIZED" && (
                          <Button variant="outline" size="sm" className="bg-white text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]" onClick={() => setBillingConsultation(consult)}>
                            <Receipt className="mr-2 h-4 w-4 text-[#C4A882]" />Generate Bill
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedIds.has(consult.id) && (
                      <TableRow className="bg-[#F7F3ED]/50 border-b border-[#E8E1D6] hover:bg-[#F7F3ED]/50">
                        <TableCell colSpan={5} className="p-0">
                          <div className="py-5 px-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                            <div>
                              <span className="font-bold text-[#1C1917] block mb-1">Chief Complaint</span>
                              <p className="text-[#78706A]">{consult.chief_complaint || "No complaint recorded"}</p>
                            </div>
                            <div>
                              <span className="font-bold text-[#1C1917] block mb-1">Examination Findings</span>
                              <p className="text-[#78706A]">{consult.examination_findings || "No findings recorded"}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <GenerateBillModal consultation={billingConsultation} open={billingConsultation !== null} onClose={() => setBillingConsultation(null)} />
      </div>
    );
  }

  // ── Queue / tabbed view ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Provider filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-56 bg-white border-[#D9D0C5]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                Dr. {p.user_details?.first_name} {p.user_details?.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-[#EDE7DC] border border-[#D9D0C5]">
          <TabsTrigger value="waiting" className="data-[state=active]:bg-white data-[state=active]:text-[#1C1917] gap-2">
            <Clock className="h-3.5 w-3.5" />
            Waiting
            {waitingQueue.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C4705A] text-white text-[10px] font-bold">
                {waitingQueue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-white data-[state=active]:text-[#1C1917] gap-2">
            <Stethoscope className="h-3.5 w-3.5" />
            In Progress
            {inProgress.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C4A882] text-white text-[10px] font-bold">
                {inProgress.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finalized" className="data-[state=active]:bg-white data-[state=active]:text-[#1C1917]">
            Finalized
          </TabsTrigger>
        </TabsList>

        {/* ── Waiting tab ── */}
        <TabsContent value="waiting">
          <div className="rounded-2xl border border-[#E8E1D6] bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#E8E1D6]">
                <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Patient</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Provider</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Arrived</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Wait</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Fee</TableHead>
                  <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingWaiting ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-[#A0978D]">Loading…</TableCell></TableRow>
                ) : waitingQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-[#A0978D] font-medium">
                      No patients waiting for consultation.
                    </TableCell>
                  </TableRow>
                ) : (
                  waitingQueue.map((appt) => {
                    const patientName = `${appt.patient_details?.first_name ?? ""} ${appt.patient_details?.last_name ?? ""}`.trim() || "—";
                    const waitMins = appt.arrived_at ? differenceInMinutes(new Date(), parseISO(appt.arrived_at)) : null;
                    const isLongWait = waitMins !== null && waitMins >= 30;
                    return (
                      <TableRow
                        key={appt.id}
                        className="border-b border-[#E8E1D6] hover:bg-[#F7F3ED] transition-colors cursor-pointer"
                        onClick={() => router.push(`/appointments/${appt.id}`)}
                      >
                        <TableCell className="font-semibold text-[#1C1917] py-4 px-6">{patientName}</TableCell>
                        <TableCell className="text-[#78706A] text-sm py-4 px-6">
                          {appt.provider_details?.name ? `Dr. ${appt.provider_details.name}` : "—"}
                        </TableCell>
                        <TableCell className="text-[#78706A] text-sm py-4 px-6">
                          {appt.arrived_at ? format(parseISO(appt.arrived_at), "h:mm a") : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={`text-sm font-semibold ${isLongWait ? "text-[#C4705A]" : "text-[#4A6B5A]"}`}>
                            {formatWaitTime(appt.arrived_at)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <FeeStatusBadge appt={appt} />
                        </TableCell>
                        <TableCell className="text-right py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {isConsultant ? (
                            <Button
                              size="sm"
                              className="bg-[#1C1917] hover:bg-[#3E3832] text-white"
                              onClick={() => router.push(`/appointments/${appt.id}`)}
                            >
                              Start Consultation
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#D9D0C5] text-[#1C1917] hover:bg-[#EDE7DC]"
                              onClick={() => router.push(`/appointments/${appt.id}`)}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── In Progress tab ── */}
        <TabsContent value="in_progress">
          <div className="rounded-2xl border border-[#E8E1D6] bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#E8E1D6]">
                <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                  <TableHead className="w-10 py-4 px-4"></TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Date</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Patient</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Provider</TableHead>
                  <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingInProgress ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">Loading…</TableCell></TableRow>
                ) : inProgress.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">No consultations in progress.</TableCell></TableRow>
                ) : (
                  inProgress.map((consult) => (
                    <TableRow key={consult.id} className="border-b border-[#E8E1D6] hover:bg-[#F7F3ED] transition-colors">
                      <TableCell className="py-4 px-4">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#A0978D] hover:text-[#1C1917]" onClick={() => toggleExpand(consult.id)}>
                          {expandedIds.has(consult.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-[#1C1917] text-sm py-3 px-4">
                        {format(parseISO(consult.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="font-medium text-[#1C1917] text-sm py-3 px-4">
                        {consult.patient_details?.first_name} {consult.patient_details?.last_name}
                      </TableCell>
                      <TableCell className="text-[#78706A] text-sm py-3 px-4">Dr. {consult.provider_details?.name}</TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <Button variant="outline" size="sm" className="text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]" onClick={() => router.push(`/consultations/${consult.id}`)}>
                          <FileText className="mr-2 h-4 w-4" />Continue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Finalized tab ── */}
        <TabsContent value="finalized">
          <div className="rounded-2xl border border-[#E8E1D6] bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#E8E1D6]">
                <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                  <TableHead className="w-10 py-4 px-4"></TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Date</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Patient</TableHead>
                  <TableHead className="font-semibold text-[#1C1917] py-4 px-6">Provider</TableHead>
                  <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingFinalized ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">Loading…</TableCell></TableRow>
                ) : finalized.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-[#A0978D]">No finalized consultations.</TableCell></TableRow>
                ) : (
                  finalized.map((consult) => (
                    <Fragment key={consult.id}>
                      <TableRow className={`${expandedIds.has(consult.id) ? "border-b-0" : "border-b border-[#E8E1D6]"} hover:bg-[#F7F3ED] transition-colors`}>
                        <TableCell className="py-4 px-4">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#A0978D] hover:text-[#1C1917]" onClick={() => toggleExpand(consult.id)}>
                            {expandedIds.has(consult.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium text-[#1C1917] text-sm py-3 px-4">
                          {format(parseISO(consult.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="font-medium text-[#1C1917] text-sm py-3 px-4">
                          {consult.patient_details?.first_name} {consult.patient_details?.last_name}
                        </TableCell>
                        <TableCell className="text-[#78706A] text-sm py-3 px-4">Dr. {consult.provider_details?.name}</TableCell>
                        <TableCell className="text-right space-x-2 py-3 px-4">
                          <Button variant="outline" size="sm" className="text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]" onClick={() => router.push(`/consultations/${consult.id}`)}>
                            <FileText className="mr-2 h-4 w-4" />View
                          </Button>
                          <Button variant="outline" size="sm" className="bg-white text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]" onClick={() => setBillingConsultation(consult)}>
                            <Receipt className="mr-2 h-4 w-4 text-[#C4A882]" />Generate Bill
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedIds.has(consult.id) && (
                        <TableRow className="bg-[#F7F3ED]/50 border-b border-[#E8E1D6] hover:bg-[#F7F3ED]/50">
                          <TableCell colSpan={5} className="p-0">
                            <div className="py-5 px-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                              <div>
                                <span className="font-bold text-[#1C1917] block mb-1">Chief Complaint</span>
                                <p className="text-[#78706A]">{consult.chief_complaint || "No complaint recorded"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-[#1C1917] block mb-1">Examination Findings</span>
                                <p className="text-[#78706A]">{consult.examination_findings || "No findings recorded"}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <GenerateBillModal
        consultation={billingConsultation}
        open={billingConsultation !== null}
        onClose={() => setBillingConsultation(null)}
      />
    </div>
  );
}

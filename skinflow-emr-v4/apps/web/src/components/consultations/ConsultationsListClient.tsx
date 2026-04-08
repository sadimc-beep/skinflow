"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
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
import { FileText, Plus, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { clinicalApi } from "@/lib/services/clinical";
import type { Consultation } from "@/types/models";
import { GenerateBillModal } from "./GenerateBillModal";

type Props = {
  initialData: Consultation[];
  /** When true, hides patient column & new walk-in button (used inside patient profile) */
  patientView?: boolean;
};

export function ConsultationsListClient({
  initialData,
  patientView = false,
}: Props) {
  const router = useRouter();
  const [consultations, setConsultations] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!patientView);
  const [billingConsultation, setBillingConsultation] =
    useState<Consultation | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // patientView=true means embedded in the patient detail page, which passes its own initialData.
  // For the standalone /consultations list page, fetch client-side (JWT lives in localStorage).
  useEffect(() => {
    if (patientView) return;
    clinicalApi.consultations.list({ limit: 200 })
      .then(res => setConsultations(res.results || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [patientView]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge className="bg-[#D9D0C5] text-[#78706A] hover:bg-[#D9D0C5] border-0">
            Draft
          </Badge>
        );
      case "FINALIZED":
        return (
          <Badge className="bg-[#7A9E8A]/10 text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20 hover:bg-[#7A9E8A]/20 border-0">
            Finalized
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-[#C4705A]/10 text-[#C4705A] hover:bg-[#C4705A]/20 border-0">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-[#D9D0C5]">
            {status}
          </Badge>
        );
    }
  };
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E8E1D6] bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#E8E1D6]">
            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
              <TableHead className="w-10 py-4 px-4"></TableHead>
              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                Date
              </TableHead>
              {!patientView && (
                <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                  Patient
                </TableHead>
              )}
              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                Provider
              </TableHead>
              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-b border-[#E8E1D6]">
                <TableCell colSpan={6} className="h-24 text-center text-[#A0978D] font-medium">
                  Loading consultations…
                </TableCell>
              </TableRow>
            ) : consultations.length === 0 ? (
              <TableRow className="border-b border-[#E8E1D6]">
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-[#A0978D] font-medium"
                >
                  No consultations found. Book an appointment and check-in to
                  begin.
                </TableCell>
              </TableRow>
            ) : (
              consultations.map((consult) => (
                <Fragment key={consult.id}>
                  <TableRow
                    className={`${expandedIds.has(consult.id) ? "border-b-0" : "border-b border-[#E8E1D6]"} hover:bg-[#F7F3ED] transition-colors`}
                  >
                    <TableCell className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[#A0978D] hover:text-[#1C1917] hover:bg-[#EDE7DC]"
                        onClick={() => toggleExpand(consult.id)}
                      >
                        {expandedIds.has(consult.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-[#1C1917] text-sm whitespace-nowrap py-3 px-4">
                      {format(
                        parseISO(consult.created_at),
                        "MMM d, yyyy h:mm a",
                      )}
                    </TableCell>
                    {!patientView && (
                      <TableCell className="py-3 px-4 font-medium text-[#1C1917] text-sm">
                        {consult.patient_details?.first_name}{" "}
                        {consult.patient_details?.last_name}
                      </TableCell>
                    )}
                    <TableCell className="py-3 px-4 text-[#78706A] text-sm">
                      Dr. {consult.provider_details?.name}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {getStatusBadge(consult.status)}
                    </TableCell>
                    <TableCell className="text-right space-x-2 py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]"
                        onClick={() =>
                          router.push(`/consultations/${consult.id}`)
                        }
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {consult.status === "DRAFT" ? "Continue" : "View"}
                      </Button>

                      {consult.status === "FINALIZED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-[#1C1917] border-[#D9D0C5] hover:bg-[#EDE7DC]"
                          onClick={() => setBillingConsultation(consult)}
                        >
                          <Receipt className="mr-2 h-4 w-4 text-[#C4A882]" />
                          Generate Bill
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedIds.has(consult.id) && (
                    <TableRow className="bg-[#F7F3ED]/50 outline-none border-t-0 border-b border-[#E8E1D6] hover:bg-[#F7F3ED]/50">
                      <TableCell
                        colSpan={patientView ? 5 : 6}
                        className="p-0 border-t-0"
                      >
                        <div className="py-5 px-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                          <div>
                            <span className="font-bold text-[#1C1917] block mb-1">
                              Chief Complaint
                            </span>
                            <p className="text-[#78706A] whitespace-pre-wrap">
                              {consult.chief_complaint ||
                                "No complaint recorded"}
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-[#1C1917] block mb-1">
                              Examination Findings
                            </span>
                            <p className="text-[#78706A] whitespace-pre-wrap">
                              {consult.examination_findings ||
                                "No findings recorded"}
                            </p>
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

      <GenerateBillModal
        consultation={billingConsultation}
        open={billingConsultation !== null}
        onClose={() => setBillingConsultation(null)}
      />
    </div>
  );
}

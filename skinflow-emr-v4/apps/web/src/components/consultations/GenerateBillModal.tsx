import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { billingApi } from "@/lib/services/billing";
import type { Consultation } from "@/types/models";

interface GenerateBillModalProps {
  consultation: Consultation | null;
  open: boolean;
  onClose: () => void;
}

export function GenerateBillModal({
  consultation,
  open,
  onClose,
}: GenerateBillModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProcedures, setSelectedProcedures] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const unbilledProcedures =
    consultation?.prescription?.procedures.filter((p) => !p.billed_invoice) ||
    [];
  const unbilledProducts =
    consultation?.prescription?.products.filter((p) => !p.billed_invoice) || [];

  useEffect(() => {
    if (open && consultation) {
      // Auto-select all unbilled items by default
      setSelectedProcedures(unbilledProcedures.map((p) => p.id));
      setSelectedProducts(unbilledProducts.map((p) => p.id));
    }
  }, [open, consultation]);

  const handleProcedureToggle = (id: number) => {
    setSelectedProcedures((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handleProductToggle = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (!consultation) return;

    if (selectedProcedures.length === 0 && selectedProducts.length === 0) {
      toast.error("Please select at least one item to bill.");
      return;
    }

    setIsSubmitting(true);
    try {
      const invoice = await billingApi.invoices.generatePartial(
        consultation.id,
        selectedProcedures,
        selectedProducts,
      );
      toast.success("Invoice generated successfully.");
      onClose();
      router.push(`/billing/${invoice.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
    }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-[#F7F3ED] border-[#D9D0C5] p-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="bg-[#EDE7DC] px-6 py-5 border-b border-[#D9D0C5]">
          <DialogTitle className="text-2xl font-serif text-[#1C1917]">
            Generate Bill for Consultation
          </DialogTitle>
          <DialogDescription className="text-base text-[#78706A] mt-1 font-medium">
            Select the procedures and products the patient is purchasing today.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 px-6 space-y-8 max-h-[60vh] overflow-y-auto">
          {unbilledProcedures.length === 0 && unbilledProducts.length === 0 && (
            <div className="text-center py-10 bg-white border border-[#E8E1D6] border-dashed rounded-xl">
              <p className="text-[#A0978D] font-medium text-base">
                No unbilled items found for this consultation.
              </p>
            </div>
          )}

          {unbilledProcedures.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-[#1C1917] text-lg border-b border-[#E8E1D6] pb-2">
                Procedures to Bill
              </h4>
              {unbilledProcedures.map((proc) => {
                const total =
                  proc.sessions_planned * parseFloat(proc.base_price) -
                  parseFloat(proc.manual_discount);
                return (
                  <div
                    key={`proc-${proc.id}`}
                    className="flex items-start space-x-4 p-4 bg-white border border-[#E8E1D6] rounded-xl shadow-sm hover:border-[#C4A882] transition-colors"
                  >
                    <Checkbox
                      id={`proc-${proc.id}`}
                      checked={selectedProcedures.includes(proc.id)}
                      onCheckedChange={() => handleProcedureToggle(proc.id)}
                      className="mt-1 border-[#A0978D] data-[state=checked]:bg-[#1C1917] data-[state=checked]:border-[#1C1917]"
                    />
                    <div className="grid gap-1.5 leading-none w-full">
                      <div className="flex justify-between items-center w-full">
                        <Label
                          htmlFor={`proc-${proc.id}`}
                          className="font-bold text-base text-[#1C1917] cursor-pointer"
                        >
                          {proc.procedure_name || "Procedure"}{" "}
                          <span className="text-[#78706A] font-medium text-sm ml-1">
                            ({proc.sessions_planned} sessions)
                          </span>
                        </Label>
                        <span className="font-bold text-lg text-[#1C1917]">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <p className="text-base text-[#78706A] font-medium mt-1">
                        {formatCurrency(proc.base_price)} per session
                        {parseFloat(proc.manual_discount) > 0 &&
                          ` • Discount: ${formatCurrency(proc.manual_discount)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {unbilledProducts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-[#1C1917] text-lg border-b border-[#E8E1D6] pb-2 mt-6">
                Skincare Products to Bill
              </h4>
              {unbilledProducts.map((prod) => {
                const total =
                  prod.quantity * parseFloat(prod.price) -
                  parseFloat(prod.manual_discount);
                return (
                  <div
                    key={`prod-${prod.id}`}
                    className="flex items-start space-x-4 p-4 bg-white border border-[#E8E1D6] rounded-xl shadow-sm hover:border-[#C4A882] transition-colors"
                  >
                    <Checkbox
                      id={`prod-${prod.id}`}
                      checked={selectedProducts.includes(prod.id)}
                      onCheckedChange={() => handleProductToggle(prod.id)}
                      className="mt-1 border-[#A0978D] data-[state=checked]:bg-[#1C1917] data-[state=checked]:border-[#1C1917]"
                    />
                    <div className="grid gap-1.5 leading-none w-full">
                      <div className="flex justify-between items-center w-full">
                        <Label
                          htmlFor={`prod-${prod.id}`}
                          className="font-bold text-base text-[#1C1917] cursor-pointer"
                        >
                          {prod.product_name}{" "}
                          <span className="text-[#78706A] font-medium text-sm ml-1">
                            (Qty: {prod.quantity})
                          </span>
                        </Label>
                        <span className="font-bold text-lg text-[#1C1917]">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <p className="text-base text-[#78706A] font-medium mt-1">
                        {formatCurrency(prod.price)} each
                        {parseFloat(prod.manual_discount) > 0 &&
                          ` • Discount: ${formatCurrency(prod.manual_discount)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="bg-[#EDE7DC] px-6 py-4 border-t border-[#D9D0C5]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-[#D9D0C5] text-[#1C1917] hover:bg-white h-11 px-6 rounded-lg font-semibold text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isSubmitting ||
              (unbilledProcedures.length === 0 && unbilledProducts.length === 0)
            }
            className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-11 px-6 rounded-lg font-semibold text-base shadow-sm"
          >
            {isSubmitting ? "Generating..." : "Generate Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

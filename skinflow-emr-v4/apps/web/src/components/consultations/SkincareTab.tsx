"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { clinicalApi } from "@/lib/services/clinical";
import { inventoryApi, Product } from "@/lib/services/inventory";
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
import { Trash2, PlusCircle, Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface SkincareTabProps {
  consultationId: number | string;
  existingPrescription?: Prescription;
  onPrescriptionUpdated: () => void;
  readOnly?: boolean;
}

export function SkincareTab({
  consultationId,
  existingPrescription,
  onPrescriptionUpdated,
  readOnly = false,
}: SkincareTabProps) {
  const [prescription, setPrescription] = useState<Prescription | undefined>(
    existingPrescription,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Combobox state
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const form = useForm<{
    product: Product | null;
    quantity: number;
    manual_discount: number;
  }>({
    defaultValues: {
      product: null,
      quantity: 1,
      manual_discount: 0,
    },
  });

  // Automatically set the price when a product is selected
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedProduct = form.watch("product");

  useEffect(() => {
    inventoryApi.products
      .search(debouncedSearch, undefined, true)
      .then((res) => {
        setSearchResults(res.results);
      })
      .catch(() => toast.error("Failed to fetch products"));
  }, [debouncedSearch]);

  const handleAddProduct = async (data: {
    product: Product | null;
    quantity: number;
    manual_discount: number;
  }) => {
    if (!data.product) {
      toast.error("Please select a product.");
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

      await clinicalApi.prescriptions.addProduct({
        prescription: currentRxId,
        product: data.product.id,
        product_name: data.product.name,
        quantity: data.quantity,
        price: data.product.sale_price?.toString() || "0",
        manual_discount: data.manual_discount?.toString() || "0",
        is_selected_for_billing: true,
      });

      toast.success("Skincare item added.");
      form.reset({ product: null, quantity: 1, manual_discount: 0 });
      onPrescriptionUpdated();
    } catch (error: Error | unknown) {
      toast.error((error as Error).message || "Failed to add skincare item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    setDeletingId(productId);
    try {
      await clinicalApi.prescriptions.deleteProduct(productId);
      toast.success("Skincare item removed.");
      onPrescriptionUpdated();
    } catch {
      toast.error("Failed to remove skincare item.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-xl text-[#1C1917] border-b border-[#E8E1D6] pb-3">
        Prescribe Skincare Products
      </h3>

      {!readOnly && <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleAddProduct)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem className="flex flex-col col-span-2">
                  <FormLabel>Product</FormLabel>
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
                            : "Search products..."}
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
                          placeholder="Search by name or SKU…"
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No products found.</CommandEmpty>
                          <CommandGroup>
                            {searchResults.map((prod) => {
                              const outOfStock = prod.stock_quantity === 0;
                              return (
                                <CommandItem
                                  key={prod.id}
                                  value={prod.id.toString()}
                                  onSelect={() => {
                                    form.setValue("product", prod);
                                    setOpen(false);
                                  }}
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-medium truncate">{prod.name}</span>
                                      {outOfStock && (
                                        <Badge variant="outline" className="shrink-0 text-[10px] border-[#C4705A] text-[#C4705A] flex items-center gap-1 px-1.5 py-0">
                                          <AlertTriangle className="h-2.5 w-2.5" />
                                          Out of stock
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                                      <span>৳{prod.sale_price}</span>
                                      <span className={outOfStock ? "text-[#C4705A]" : "text-[#7A9E8A]"}>
                                        {prod.stock_quantity} in stock
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#1C1917] font-bold">
                    Quantity
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      className="bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882]"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#1C1917] hover:bg-[#3E3832] text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-[#C4A882]" />
              Add
            </Button>
          </div>
        </form>
      </Form>}

      <div className="mt-8">
        <h4 className="font-bold text-lg text-[#1C1917] mb-4">
          Prescribed Skincare
        </h4>
        {existingPrescription?.products &&
        existingPrescription.products.length > 0 ? (
          <div className="space-y-3">
            {existingPrescription.products.map((prod) => (
              <Card
                key={prod.id}
                className="bg-white border-[#E8E1D6] rounded-xl shadow-sm"
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex justify-between w-full pr-8">
                    <p className="font-bold text-[#1C1917] text-base">
                      {prod.product_name}{" "}
                      <span className="text-sm font-medium text-[#78706A] ml-2">
                        x{prod.quantity}
                      </span>
                    </p>
                    <p className="text-[#1C1917] font-medium text-base">
                      ৳{prod.price}
                    </p>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#C4705A] hover:text-[#A85A46] hover:bg-[#C4705A]/10 h-8 w-8"
                      disabled={deletingId === prod.id}
                      onClick={() => handleDeleteProduct(prod.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-base text-[#A0978D] italic p-6 rounded-xl border border-[#E8E1D6] border-dashed text-center">
            No skincare products prescribed.
          </p>
        )}
      </div>
    </div>
  );
}

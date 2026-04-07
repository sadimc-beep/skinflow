"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { accountingApi } from "@/lib/services/accounting";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

export function AccountingReportsClient() {
  const [activeTab, setActiveTab] = useState("general_ledger");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    // Fetch chart of accounts for the GL dropdown
    accountingApi
      .getAccounts()
      .then((res: any) => {
        setAccounts(res.results || []);
      })
      .catch(console.error);
  }, []);

  const fetchReport = async (type: string) => {
    try {
      setLoading(true);
      if (type === "trial_balance") {
        setData(await accountingApi.getTrialBalance());
      } else if (type === "income_statement") {
        setData(await accountingApi.getIncomeStatement());
      } else if (type === "balance_sheet") {
        setData(await accountingApi.getBalanceSheet());
      } else if (type === "general_ledger" && selectedAccountId) {
        setData(await accountingApi.getGeneralLedger(selectedAccountId));
      } else if (type === "general_ledger" && !selectedAccountId) {
        setData(null);
      }
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      toast.error("Failed to load financial report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, selectedAccountId]);

  return (
    <div className="space-y-6">
      <div className="bg-[#F7F3ED] p-2 rounded-2xl border border-[#E8E1D6] shadow-sm inline-flex mb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent space-x-2 p-0 h-auto">
            <TabsTrigger
              value="general_ledger"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 font-medium text-[#78706A] hover:text-[#1C1917] transition-all"
            >
              General Ledger
            </TabsTrigger>
            <TabsTrigger
              value="trial_balance"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 font-medium text-[#78706A] hover:text-[#1C1917] transition-all"
            >
              Trial Balance
            </TabsTrigger>
            <TabsTrigger
              value="income_statement"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 font-medium text-[#78706A] hover:text-[#1C1917] transition-all"
            >
              Income Statement
            </TabsTrigger>
            <TabsTrigger
              value="balance_sheet"
              className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2 font-medium text-[#78706A] hover:text-[#1C1917] transition-all"
            >
              Balance Sheet
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="bg-[#F7F3ED] border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#EDE7DC] border-b border-[#D9D0C5] py-5 px-6">
          <CardTitle className="text-2xl font-serif text-[#1C1917]">
            {activeTab === "general_ledger" && "General Ledger"}
            {activeTab === "trial_balance" && "Trial Balance"}
            {activeTab === "income_statement" && "Income Statement (P&L)"}
            {activeTab === "balance_sheet" && "Balance Sheet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#C4A882]" />
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-[#A0978D] font-medium text-sm">
              No data available for the selected report parameters.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {activeTab === "general_ledger" && (
                <>
                  <div className="w-full md:w-1/3 mb-6">
                    <label className="text-sm font-medium mb-1 block">
                      Select Account
                    </label>
                    <Select
                      value={selectedAccountId}
                      onValueChange={setSelectedAccountId}
                    >
                      <SelectTrigger className="h-12 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917] font-medium">
                        <SelectValue placeholder="Choose an account..." />
                      </SelectTrigger>
                      <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md max-h-[300px]">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                            {acc.code ? `${acc.code} - ` : ""}
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {data && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-[#D9D0C5] shadow-sm gap-4">
                        <div>
                          <h3 className="font-bold text-[#1C1917] text-xl">
                            {data.account.name}
                          </h3>
                          <span className="inline-flex mt-2 items-center rounded-md bg-[#1C1917]/5 px-2.5 py-1 text-sm font-semibold text-[#1C1917]">
                            Type: {data.account.account_type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-right bg-[#F7F3ED] p-4 rounded-lg w-full md:w-auto border border-[#E8E1D6]">
                          <p className="text-sm font-semibold tracking-wider uppercase text-[#A0978D] mb-1">
                            Current Balance
                          </p>
                          <p className="font-serif text-3xl text-[#1C1917]">
                            {formatCurrency(data.current_balance)}
                          </p>
                        </div>
                      </div>

                      <div className="border border-[#E8E1D6] rounded-xl overflow-hidden bg-white shadow-sm">
                        <Table>
                          <TableHeader className="bg-[#EDE7DC]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                                Date
                              </TableHead>
                              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                                Reference
                              </TableHead>
                              <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                                Description
                              </TableHead>
                              <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                                Debit
                              </TableHead>
                              <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                                Credit
                              </TableHead>
                              <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                                Running Balance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.entries?.length === 0 ? (
                              <TableRow className="border-b border-[#E8E1D6]">
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-12 text-[#A0978D] font-medium text-sm"
                                >
                                  No transactions found for this account.
                                </TableCell>
                              </TableRow>
                            ) : (
                              data.entries?.map((entry: any, i: number) => (
                                <TableRow
                                  key={i}
                                  className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                                >
                                  <TableCell className="whitespace-nowrap font-medium text-[#1C1917] py-4 px-6">
                                    {formatDate(entry.date)}
                                  </TableCell>
                                  <TableCell className="text-[#78706A] font-medium py-4 px-6">
                                    {entry.reference}
                                  </TableCell>
                                  <TableCell className="text-[#1C1917] font-bold py-4 px-6">
                                    {entry.description}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums text-[#C4705A] font-bold py-4 px-6">
                                    {Number(entry.debit) > 0
                                      ? formatCurrency(entry.debit)
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums text-[#7A9E8A] font-bold py-4 px-6">
                                    {Number(entry.credit) > 0
                                      ? formatCurrency(entry.credit)
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-[#1C1917] tabular-nums text-sm px-4 py-3 bg-[#F7F3ED]">
                                    {formatCurrency(entry.balance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "trial_balance" && (
                <div className="border border-[#E8E1D6] rounded-xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-[#EDE7DC]">
                      <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                          Account
                        </TableHead>
                        <TableHead className="font-semibold text-[#1C1917] py-4 px-6">
                          Type
                        </TableHead>
                        <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                          Debit
                        </TableHead>
                        <TableHead className="text-right font-semibold text-[#1C1917] py-4 px-6">
                          Credit
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.accounts?.map((acc: any) => (
                        <TableRow
                          key={acc.id}
                          className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                        >
                          <TableCell className="font-bold text-[#1C1917] text-sm px-4 py-3">
                            {acc.code ? `${acc.code} - ` : ""}
                            {acc.name}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="inline-flex items-center rounded-md bg-[#1C1917]/5 px-2 py-1 text-xs font-semibold text-[#1C1917]">
                              {acc.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-[#1C1917] py-4 px-6">
                            {formatCurrency(acc.total_debit)}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-[#1C1917] py-4 px-6">
                            {formatCurrency(acc.total_credit)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-[#EDE7DC] hover:bg-[#EDE7DC]">
                        <TableCell
                          colSpan={2}
                          className="font-bold text-right text-sm text-[#1C1917] py-5 px-6 "
                        >
                          Totals:
                        </TableCell>
                        <TableCell className="text-right font-bold text-xl text-[#1C1917] border-t-2 border-[#D9D0C5] py-5 px-6">
                          {formatCurrency(data.total_debit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xl text-[#1C1917] border-t-2 border-[#D9D0C5] py-5 px-6">
                          {formatCurrency(data.total_credit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "income_statement" && (
                <div className="space-y-10">
                  {/* Revenue Section */}
                  <div className="bg-white rounded-xl border border-[#E8E1D6] shadow-sm overflow-hidden">
                    <div className="bg-[#EDE7DC] px-6 py-4 border-b border-[#D9D0C5]">
                      <h3 className="font-serif text-2xl text-[#1C1917]">
                        Revenue
                      </h3>
                    </div>
                    <Table>
                      <TableBody>
                        {data.revenue?.map((acc: any) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                          >
                            <TableCell className="pl-8 py-4 font-bold text-[#1C1917] text-sm">
                              {acc.code ? `${acc.code} - ` : ""}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-right py-4 font-medium text-[#78706A] text-sm tabular-nums">
                              {formatCurrency(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F3ED] hover:bg-[#F7F3ED]">
                          <TableCell className="font-bold px-6 py-5 text-sm text-[#1C1917] ">
                            Total Revenue
                          </TableCell>
                          <TableCell className="text-right font-bold text-xl text-[#1C1917] py-5 tabular-nums">
                            {formatCurrency(data.total_revenue)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Expense Section */}
                  <div className="bg-white rounded-xl border border-[#E8E1D6] shadow-sm overflow-hidden">
                    <div className="bg-[#EDE7DC] px-6 py-4 border-b border-[#D9D0C5]">
                      <h3 className="font-serif text-2xl text-[#1C1917]">
                        Expenses
                      </h3>
                    </div>
                    <Table>
                      <TableBody>
                        {data.expenses?.map((acc: any) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                          >
                            <TableCell className="pl-8 py-4 font-bold text-[#1C1917] text-sm">
                              {acc.code ? `${acc.code} - ` : ""}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-right py-4 font-medium text-[#78706A] text-sm tabular-nums">
                              {formatCurrency(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F3ED] hover:bg-[#F7F3ED]">
                          <TableCell className="font-bold px-6 py-5 text-sm text-[#1C1917] ">
                            Total Expenses
                          </TableCell>
                          <TableCell className="text-right font-bold text-xl text-[#1C1917] py-5 tabular-nums">
                            {formatCurrency(data.total_expenses)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className="flex justify-between items-center p-6 bg-[#1C1917] text-white rounded-2xl shadow-md border-l-4 border-l-[#C4A882] transform transition-transform hover:scale-[1.01]">
                    <span className="font-serif text-3xl">Net Income</span>
                    <span className="font-bold text-4xl tracking-tight">
                      {formatCurrency(data.net_income)}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "balance_sheet" && (
                <div className="space-y-10">
                  {/* Assets */}
                  <div className="bg-white rounded-xl border border-[#E8E1D6] shadow-sm overflow-hidden">
                    <div className="bg-[#EDE7DC] px-6 py-4 border-b border-[#D9D0C5]">
                      <h3 className="font-serif text-2xl text-[#1C1917]">
                        Assets
                      </h3>
                    </div>
                    <Table>
                      <TableBody>
                        {data.assets?.map((acc: any) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                          >
                            <TableCell className="pl-8 py-4 font-bold text-[#1C1917] text-sm">
                              {acc.code ? `${acc.code} - ` : ""}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-right py-4 font-medium text-[#78706A] text-sm tabular-nums">
                              {formatCurrency(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F3ED] hover:bg-[#F7F3ED]">
                          <TableCell className="font-bold px-6 py-5 text-sm text-[#1C1917] ">
                            Total Assets
                          </TableCell>
                          <TableCell className="text-right font-bold text-xl text-[#1C1917] py-5 tabular-nums">
                            {formatCurrency(data.total_assets)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Liabilities */}
                  <div className="bg-white rounded-xl border border-[#E8E1D6] shadow-sm overflow-hidden">
                    <div className="bg-[#EDE7DC] px-6 py-4 border-b border-[#D9D0C5]">
                      <h3 className="font-serif text-2xl text-[#1C1917]">
                        Liabilities
                      </h3>
                    </div>
                    <Table>
                      <TableBody>
                        {data.liabilities?.map((acc: any) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                          >
                            <TableCell className="pl-8 py-4 font-bold text-[#1C1917] text-sm">
                              {acc.code ? `${acc.code} - ` : ""}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-right py-4 font-medium text-[#78706A] text-sm tabular-nums">
                              {formatCurrency(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F3ED] hover:bg-[#F7F3ED]">
                          <TableCell className="font-bold px-6 py-5 text-sm text-[#1C1917] ">
                            Total Liabilities
                          </TableCell>
                          <TableCell className="text-right font-bold text-xl text-[#1C1917] py-5 tabular-nums">
                            {formatCurrency(data.total_liabilities)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equity */}
                  <div className="bg-white rounded-xl border border-[#E8E1D6] shadow-sm overflow-hidden">
                    <div className="bg-[#EDE7DC] px-6 py-4 border-b border-[#D9D0C5]">
                      <h3 className="font-serif text-2xl text-[#1C1917]">
                        Equity
                      </h3>
                    </div>
                    <Table>
                      <TableBody>
                        {data.equity?.map((acc: any) => (
                          <TableRow
                            key={acc.id}
                            className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors"
                          >
                            <TableCell className="pl-8 py-4 font-bold text-[#1C1917] text-sm">
                              {acc.code ? `${acc.code} - ` : ""}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-right py-4 font-medium text-[#78706A] text-sm tabular-nums">
                              {formatCurrency(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F3ED] hover:bg-[#F7F3ED]">
                          <TableCell className="font-bold px-6 py-5 text-sm text-[#1C1917] ">
                            Total Equity
                          </TableCell>
                          <TableCell className="text-right font-bold text-xl text-[#1C1917] py-5 tabular-nums">
                            {formatCurrency(data.total_equity)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Balance Check */}
                  <div className="flex justify-between items-center p-6 bg-[#1C1917] text-white rounded-2xl shadow-md border-l-4 border-l-[#C4A882] transform transition-transform hover:scale-[1.01]">
                    <span className="font-serif text-3xl">
                      Total Liabilities & Equity
                    </span>
                    <span className="font-bold text-4xl tracking-tight">
                      {formatCurrency(
                        Number(data.total_liabilities) +
                        Number(data.total_equity),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

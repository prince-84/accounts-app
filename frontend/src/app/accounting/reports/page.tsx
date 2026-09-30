"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  Scale,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default function ReportsPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<"trial" | "pnl" | "bs" | "ledger">("trial");

  // Data states
  const [trialData, setTrialData] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadReportData = () => {
    setLoading(true);
    if (activeTab === "trial") {
      api.getTrialBalance().then((res) => {
        if (res.success) setTrialData(res.data);
        setLoading(false);
      });
    } else if (activeTab === "pnl") {
      api.getIncomeStatement().then((res) => {
        if (res.success) setPnlData(res.data);
        setLoading(false);
      });
    } else if (activeTab === "bs") {
      api.getBalanceSheet().then((res) => {
        if (res.success) setBsData(res.data);
        setLoading(false);
      });
    } else if (activeTab === "ledger") {
      api.getChartOfAccounts().then((coaRes) => {
        if (coaRes.success) {
          setAccounts(coaRes.data);
          const accId = selectedLedgerAccount || (coaRes.data[0]?.id ? coaRes.data[0].id.toString() : "");
          if (accId) {
            setSelectedLedgerAccount(accId);
            api.getLedger(accId).then((lRes) => {
              if (lRes.success) setLedgerData(lRes.data);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      });
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeCompany.id, activeTab, selectedLedgerAccount]);

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "FINANCIAL INTELLIGENCE", "FINANCIAL STATEMENTS"]}
        title="Financial Statements"
        description="Multi-period financial reporting, balance sheet reconciliations, profit & loss, and general ledger trial balance."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs"
            >
              Print Statement
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3 text-xs">
        <button
          onClick={() => setActiveTab("trial")}
          className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-semibold transition cursor-pointer ${
            activeTab === "trial"
              ? "bg-[#2563EB] text-white shadow-xs border border-[#2563EB]"
              : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          }`}
        >
          <Scale size={15} />
          Trial Balance
        </button>

        <button
          onClick={() => setActiveTab("pnl")}
          className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-semibold transition cursor-pointer ${
            activeTab === "pnl"
              ? "bg-[#2563EB] text-white shadow-xs border border-[#2563EB]"
              : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          }`}
        >
          <BarChart3 size={15} />
          Income Statement (P&L)
        </button>

        <button
          onClick={() => setActiveTab("bs")}
          className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-semibold transition cursor-pointer ${
            activeTab === "bs"
              ? "bg-[#2563EB] text-white shadow-xs border border-[#2563EB]"
              : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          }`}
        >
          <PieChart size={15} />
          Balance Sheet
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 font-semibold transition cursor-pointer ${
            activeTab === "ledger"
              ? "bg-[#2563EB] text-white shadow-xs border border-[#2563EB]"
              : "bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          }`}
        >
          <BookOpen size={15} />
          General Ledger
        </button>
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === "trial" && (
        <div className="space-y-4">
          {/* Integrity Banner */}
          {trialData && (
            <div
              className={`flex items-center justify-between rounded-lg p-4 border ${
                trialData.is_balanced
                  ? "bg-[#F8FAFC] border-[#10B981]/30 text-[#0F172A]"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                {trialData.is_balanced ? (
                  <>
                    <CheckCircle2 size={18} className="text-[#10B981]" />
                    <span>Trial Balance is perfectly in balance! (Total Debit = Total Credit)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-[#F59E0B]" />
                    <span>Imbalance detected: Difference {formatCurrency(trialData.difference)}</span>
                  </>
                )}
              </div>
              <div className="text-right font-mono text-xs font-bold text-[#0F172A]">
                Debit: <span className="text-[#0F172A]">{formatCurrency(trialData.total_debit)}</span> | Credit: <span className="text-[#0F172A]">{formatCurrency(trialData.total_credit)}</span>
              </div>
            </div>
          )}

          {/* Trial Balance Table */}
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Account Code</th>
                  <th className="px-5 py-3.5">Account Title</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 text-right">Debit Balance</th>
                  <th className="px-5 py-3.5 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                {trialData?.rows?.length > 0 ? (
                  trialData.rows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-5 py-3 font-mono font-bold text-[#2563EB]">{row.code}</td>
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">{row.name}</td>
                      <td className="px-5 py-3 capitalize text-[#64748B]">{row.type}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#64748B]">
                      No active balances on trial balance.
                    </td>
                  </tr>
                )}
              </tbody>
              {trialData && (
                <tfoot className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold text-[#0F172A] text-xs">
                  <tr>
                    <td colSpan={3} className="px-5 py-3.5 uppercase">
                      Total Trial Balance ({activeCompany.currency})
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#0F172A]">
                      {formatCurrency(trialData.total_debit)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#0F172A]">
                      {formatCurrency(trialData.total_credit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Profit & Loss */}
      {activeTab === "pnl" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Operating Revenue</h3>
              <span className="font-mono text-sm font-bold text-[#16A34A]">
                {formatCurrency(pnlData?.total_revenue || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {pnlData?.revenues?.map((r: any) => (
                <div key={r.code} className="flex justify-between py-1 border-b border-[#F8FAFC]">
                  <span className="text-[#64748B]">{r.code} - {r.name}</span>
                  <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Operating Expenses</h3>
              <span className="font-mono text-sm font-bold text-[#D93838]">
                {formatCurrency(pnlData?.total_expenses || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {pnlData?.expenses?.map((e: any) => (
                <div key={e.code} className="flex justify-between py-1 border-b border-[#F8FAFC]">
                  <span className="text-[#64748B]">{e.code} - {e.name}</span>
                  <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Net Profit Summary Card */}
          <div className="col-span-full rounded-2xl bg-[#0F172A] border border-[#152744] p-6 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-[#F59E0B] tracking-wider">NET INCOME / PROFIT</p>
              <h2 className="text-2xl font-bold mt-1 text-white">
                {formatCurrency(pnlData?.net_profit || 0)}
              </h2>
              <p className="text-xs text-[#B0C0D8] mt-1">
                {pnlData?.net_profit >= 0 ? "Surplus for current period" : "Deficit for current period"}
              </p>
            </div>
            <div className="text-right text-xs space-y-1 font-mono text-[#B0C0D8]">
              <p>Total Revenue: <span className="text-white font-bold">{formatCurrency(pnlData?.total_revenue || 0)}</span></p>
              <p>Total Expenses: <span className="text-white font-bold">{formatCurrency(pnlData?.total_expenses || 0)}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === "bs" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assets */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Assets</h3>
                <span className="font-mono text-sm font-bold text-[#F59E0B]">
                  {formatCurrency(bsData?.total_assets || 0)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {bsData?.assets?.map((a: any) => (
                  <div key={a.code} className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">{a.code} - {a.name}</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Liabilities & Equity</h3>
                <span className="font-mono text-sm font-bold text-[#0F172A]">
                  {formatCurrency(bsData?.total_liabilities_and_equity || 0)}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-[#64748B] mb-2">Liabilities</p>
                <div className="space-y-1.5 text-xs">
                  {bsData?.liabilities?.map((l: any) => (
                    <div key={l.code} className="flex justify-between py-0.5">
                      <span className="text-[#64748B]">{l.code} - {l.name}</span>
                      <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(l.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#E2E8F0]">
                    <span>Total Liabilities</span>
                    <span className="font-mono">{formatCurrency(bsData?.total_liabilities || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <p className="text-[11px] font-bold uppercase text-[#64748B] mb-2">Equity</p>
                <div className="space-y-1.5 text-xs">
                  {bsData?.equity?.map((eq: any) => (
                    <div key={eq.code} className="flex justify-between py-0.5">
                      <span className="text-[#64748B]">{eq.code} - {eq.name}</span>
                      <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(eq.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-0.5 text-[#F59E0B]">
                    <span>Current Period Net Profit</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(bsData?.current_period_profit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#E2E8F0]">
                    <span>Total Equity</span>
                    <span className="font-mono">{formatCurrency(bsData?.total_equity || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet Integrity Check */}
          <div className="rounded-2xl bg-[#0F172A] border border-[#152744] p-5 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#16A34A]" />
              <span className="font-bold">
                Fundamental Accounting Equation: Assets = Liabilities + Equity
              </span>
            </div>
            <div className="font-mono font-bold text-[#F59E0B]">
              {formatCurrency(bsData?.total_assets || 0)} = {formatCurrency(bsData?.total_liabilities_and_equity || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: General Ledger */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs text-xs">
            <label className="font-semibold text-[#0F172A]">Select Account:</label>
            <select
              value={selectedLedgerAccount}
              onChange={(e) => setSelectedLedgerAccount(e.target.value)}
              className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs min-w-[280px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Voucher #</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Debit</th>
                  <th className="px-5 py-3.5 text-right">Credit</th>
                  <th className="px-5 py-3.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                {ledgerData?.transactions?.length > 0 ? (
                  ledgerData.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-5 py-3 text-[#64748B] font-mono text-xs">
                        {formatDateDDMMYYYY(tx.date)}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-[#2563EB]">
                        {tx.entry_number}
                      </td>
                      <td className="px-5 py-3 text-[#0F172A]">{tx.description}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : "-"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : "-"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A] bg-[#F8FAFC]/50">
                        {formatCurrency(tx.running_balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#64748B]">
                      No posted transactions for this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

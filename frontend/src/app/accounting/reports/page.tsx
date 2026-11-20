"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  RotateCcw,
  Scale,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateDDMMYYYY } from "@/lib/utils";

type PeriodType = "all" | "monthly" | "quarterly" | "biannually" | "annually" | "custom";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AVAILABLE_YEARS = [2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020];

export default function ReportsPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<"trial" | "pnl" | "bs" | "ledger">("trial");

  // Date period states
  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear() > 2026 ? now.getFullYear() : 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((now.getMonth() + 1) / 3));
  const [selectedHalf, setSelectedHalf] = useState<number>(now.getMonth() + 1 <= 6 ? 1 : 2);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Compute startDate, endDate, and friendly label
  const { startDate, endDate, label: periodLabel } = useMemo(() => {
    if (periodType === "all") {
      return { startDate: "", endDate: "", label: "All Time (Cumulative)" };
    }

    if (periodType === "monthly") {
      const mStr = String(selectedMonth).padStart(2, "0");
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      return {
        startDate: `${selectedYear}-${mStr}-01`,
        endDate: `${selectedYear}-${mStr}-${String(lastDay).padStart(2, "0")}`,
        label: `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
      };
    }

    if (periodType === "quarterly") {
      if (selectedQuarter === 1) {
        return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-03-31`, label: `Q1 (Jan - Mar) ${selectedYear}` };
      } else if (selectedQuarter === 2) {
        return { startDate: `${selectedYear}-04-01`, endDate: `${selectedYear}-06-30`, label: `Q2 (Apr - Jun) ${selectedYear}` };
      } else if (selectedQuarter === 3) {
        return { startDate: `${selectedYear}-07-01`, endDate: `${selectedYear}-09-30`, label: `Q3 (Jul - Sep) ${selectedYear}` };
      } else {
        return { startDate: `${selectedYear}-10-01`, endDate: `${selectedYear}-12-31`, label: `Q4 (Oct - Dec) ${selectedYear}` };
      }
    }

    if (periodType === "biannually") {
      if (selectedHalf === 1) {
        return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-06-30`, label: `H1 (Jan - Jun) ${selectedYear}` };
      } else {
        return { startDate: `${selectedYear}-07-01`, endDate: `${selectedYear}-12-31`, label: `H2 (Jul - Dec) ${selectedYear}` };
      }
    }

    if (periodType === "annually") {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
        label: `FY ${selectedYear} (Jan 01 - Dec 31)`,
      };
    }

    if (periodType === "custom") {
      const startFmt = customStart ? formatDateDDMMYYYY(customStart) : "Beginning";
      const endFmt = customEnd ? formatDateDDMMYYYY(customEnd) : "Latest";
      return {
        startDate: customStart,
        endDate: customEnd,
        label: `${startFmt} → ${endFmt}`,
      };
    }

    return { startDate: "", endDate: "", label: "All Time" };
  }, [periodType, selectedYear, selectedMonth, selectedQuarter, selectedHalf, customStart, customEnd]);

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
    const params = startDate || endDate ? { start_date: startDate, end_date: endDate } : undefined;

    if (activeTab === "trial") {
      api.getTrialBalance(params).then((res) => {
        if (res.success) setTrialData(res.data);
        setLoading(false);
      });
    } else if (activeTab === "pnl") {
      api.getIncomeStatement(params).then((res) => {
        if (res.success) setPnlData(res.data);
        setLoading(false);
      });
    } else if (activeTab === "bs") {
      api.getBalanceSheet(params).then((res) => {
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
            api.getLedger(accId, params).then((lRes) => {
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
  }, [activeCompany.id, activeTab, selectedLedgerAccount, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Period Filter Toolbar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#2563EB]" />
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">Reporting Period:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
              {periodLabel}
            </span>
            {periodType !== "all" && (
              <button
                onClick={() => setPeriodType("all")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] ml-2"
                title="Reset to All Time"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>

          {/* Period Mode Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setPeriodType("all")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "all"
                  ? "bg-[#0F172A] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriodType("monthly")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "monthly"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType("quarterly")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "quarterly"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType("biannually")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "biannually"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              Biannually
            </button>
            <button
              onClick={() => setPeriodType("annually")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "annually"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              Annually
            </button>
            <button
              onClick={() => setPeriodType("custom")}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                periodType === "custom"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Period Pickers */}
        {periodType !== "all" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F1F5F9] text-xs">
            {/* Year Selector for Monthly, Quarterly, Biannually, Annually */}
            {periodType !== "custom" && (
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-[#64748B]">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 font-semibold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  {AVAILABLE_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly Picker: Month Dropdown */}
            {periodType === "monthly" && (
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-[#64748B]">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 font-semibold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name} ({String(idx + 1).padStart(2, "0")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quarterly Picker: Q1 - Q4 */}
            {periodType === "quarterly" && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#64748B]">Quarter:</span>
                <div className="inline-flex rounded-md border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
                  {[
                    { q: 1, label: "Q1 (Jan–Mar)" },
                    { q: 2, label: "Q2 (Apr–Jun)" },
                    { q: 3, label: "Q3 (Jul–Sep)" },
                    { q: 4, label: "Q4 (Oct–Dec)" },
                  ].map((item) => (
                    <button
                      key={item.q}
                      onClick={() => setSelectedQuarter(item.q)}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                        selectedQuarter === item.q
                          ? "bg-white text-[#2563EB] shadow-2xs border border-[#E2E8F0]"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Biannually Picker: H1 / H2 */}
            {periodType === "biannually" && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#64748B]">Half:</span>
                <div className="inline-flex rounded-md border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
                  <button
                    onClick={() => setSelectedHalf(1)}
                    className={`rounded px-3 py-1 text-xs font-semibold transition ${
                      selectedHalf === 1
                        ? "bg-white text-[#2563EB] shadow-2xs border border-[#E2E8F0]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    H1 (Jan 01 – Jun 30)
                  </button>
                  <button
                    onClick={() => setSelectedHalf(2)}
                    className={`rounded px-3 py-1 text-xs font-semibold transition ${
                      selectedHalf === 2
                        ? "bg-white text-[#2563EB] shadow-2xs border border-[#E2E8F0]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    H2 (Jul 01 – Dec 31)
                  </button>
                </div>
              </div>
            )}

            {/* Custom Range Picker */}
            {periodType === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <label className="font-semibold text-[#64748B]">From:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <ArrowRight size={14} className="text-[#94A3B8]" />
                <div className="flex items-center gap-1">
                  <label className="font-semibold text-[#64748B]">To:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                    <span>Trial Balance is in balance! ({periodLabel})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-[#F59E0B]" />
                    <span>Imbalance detected: Difference {formatCurrency(trialData.difference)}</span>
                  </>
                )}
              </div>
              <div className="text-right font-mono text-xs font-bold text-[#0F172A]">
                Debit: <span className="text-[#0F172A]">{formatCurrency(trialData.total_debit)}</span> | Credit:{" "}
                <span className="text-[#0F172A]">{formatCurrency(trialData.total_credit)}</span>
              </div>
            </div>
          )}

          {/* Trial Balance Table */}
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[11px] uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-4 py-3.5">Account Code</th>
                  <th className="px-4 py-3.5">Account Title</th>
                  <th className="px-3 py-3.5">Type</th>
                  {startDate && <th className="px-4 py-3.5 text-right">Opening Balance</th>}
                  {startDate && <th className="px-4 py-3.5 text-right">Period Debit</th>}
                  {startDate && <th className="px-4 py-3.5 text-right">Period Credit</th>}
                  <th className="px-4 py-3.5 text-right">{startDate ? "Closing Debit" : "Debit Balance"}</th>
                  <th className="px-4 py-3.5 text-right">{startDate ? "Closing Credit" : "Credit Balance"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#0F172A]">
                {trialData?.rows?.length > 0 ? (
                  trialData.rows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-4 py-3 font-mono font-bold text-[#2563EB]">{row.code}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F172A]">{row.name}</td>
                      <td className="px-3 py-3 capitalize text-[#64748B]">{row.type}</td>
                      {startDate && (
                        <td className="px-4 py-3 text-right font-mono text-[#64748B]">
                          {formatCurrency(row.opening_balance || 0)}
                        </td>
                      )}
                      {startDate && (
                        <td className="px-4 py-3 text-right font-mono text-[#0F172A]">
                          {row.period_debit > 0 ? formatCurrency(row.period_debit) : "-"}
                        </td>
                      )}
                      {startDate && (
                        <td className="px-4 py-3 text-right font-mono text-[#0F172A]">
                          {row.period_credit > 0 ? formatCurrency(row.period_credit) : "-"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#0F172A]">
                        {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={startDate ? 8 : 5} className="py-10 text-center text-[#64748B]">
                      {loading ? "Loading trial balance..." : "No active balances for this period."}
                    </td>
                  </tr>
                )}
              </tbody>
              {trialData && (
                <tfoot className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold text-[#0F172A] text-xs">
                  <tr>
                    <td colSpan={startDate ? 6 : 3} className="px-4 py-3.5 uppercase">
                      Total Trial Balance ({activeCompany.currency}) — {periodLabel}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#0F172A]">
                      {formatCurrency(trialData.total_debit)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#0F172A]">
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
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Operating Revenue</h3>
                <p className="text-[11px] text-[#64748B]">{periodLabel}</p>
              </div>
              <span className="font-mono text-sm font-bold text-[#16A34A]">
                {formatCurrency(pnlData?.total_revenue || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {pnlData?.revenues?.length > 0 ? (
                pnlData.revenues.map((r: any) => (
                  <div key={r.code} className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">{r.code} - {r.name}</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(r.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-[#94A3B8]">No revenue recorded for this period.</p>
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Operating Expenses</h3>
                <p className="text-[11px] text-[#64748B]">{periodLabel}</p>
              </div>
              <span className="font-mono text-sm font-bold text-[#D93838]">
                {formatCurrency(pnlData?.total_expenses || 0)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {pnlData?.expenses?.length > 0 ? (
                pnlData.expenses.map((e: any) => (
                  <div key={e.code} className="flex justify-between py-1 border-b border-[#F8FAFC]">
                    <span className="text-[#64748B]">{e.code} - {e.name}</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{formatCurrency(e.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-[#94A3B8]">No expenses recorded for this period.</p>
              )}
            </div>
          </div>

          {/* Net Profit Summary Card */}
          <div className="col-span-full rounded-2xl bg-[#0F172A] border border-[#152744] p-6 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-[#F59E0B] tracking-wider">
                NET INCOME / PROFIT ({periodLabel})
              </p>
              <h2 className="text-2xl font-bold mt-1 text-white">
                {formatCurrency(pnlData?.net_profit || 0)}
              </h2>
              <p className="text-xs text-[#B0C0D8] mt-1">
                {(pnlData?.net_profit || 0) >= 0 ? "Surplus for selected period" : "Deficit for selected period"}
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
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Assets</h3>
                  <p className="text-[11px] text-[#64748B]">As of {endDate ? formatDateDDMMYYYY(endDate) : "Latest"}</p>
                </div>
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
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Liabilities & Equity</h3>
                  <p className="text-[11px] text-[#64748B]">As of {endDate ? formatDateDDMMYYYY(endDate) : "Latest"}</p>
                </div>
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
                    <span>Period Net Profit</span>
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
          <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-[#0F172A]">Select Account:</label>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs min-w-[280px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs text-[#64748B]">
              Viewing Period: <span className="font-semibold text-[#0F172A]">{periodLabel}</span>
            </div>
          </div>

          {/* Ledger Period Summary Cards */}
          {ledgerData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase">Opening Balance</span>
                <p className="mt-1 font-mono text-base font-bold text-[#0F172A]">
                  {formatCurrency(ledgerData.opening_balance ?? 0)}
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  {startDate ? `Prior to ${formatDateDDMMYYYY(startDate)}` : "Initial Balance"}
                </p>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#16A34A] uppercase">Period Debits</span>
                <p className="mt-1 font-mono text-base font-bold text-[#16A34A]">
                  {formatCurrency(ledgerData.total_period_debit ?? 0)}
                </p>
                <p className="text-[10px] text-[#94A3B8]">Within selected period</p>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase">Period Credits</span>
                <p className="mt-1 font-mono text-base font-bold text-[#2563EB]">
                  {formatCurrency(ledgerData.total_period_credit ?? 0)}
                </p>
                <p className="text-[10px] text-[#94A3B8]">Within selected period</p>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#0F172A] uppercase">Closing Balance</span>
                <p className="mt-1 font-mono text-base font-bold text-[#0F172A]">
                  {formatCurrency(ledgerData.closing_balance ?? ledgerData.current_balance ?? 0)}
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  {endDate ? `As of ${formatDateDDMMYYYY(endDate)}` : "Current balance"}
                </p>
              </div>
            </div>
          )}

          {/* Transactions Table */}
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
                      {loading ? "Loading transactions..." : `No posted transactions found for this account in ${periodLabel}.`}
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

"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Coins,
  DollarSign,
  Landmark,
  Plus,
  Receipt,
  Wallet,
  X,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

export default function BankingPage() {
  const { activeCompany, formatCurrency } = useCompany();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [pettyCashFunds, setPettyCashFunds] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Petty Cash Modal
  const [showPettyModal, setShowPettyModal] = useState(false);
  const [pettyForm, setPettyForm] = useState({
    petty_cash_fund_id: "",
    account_id: "",
    voucher_date: new Date().toISOString().split("T")[0],
    amount: 0,
    paid_to: "",
    description: "",
  });
  const [submittingPetty, setSubmittingPetty] = useState(false);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    transfer_date: new Date().toISOString().split("T")[0],
    amount: 0,
    reference: "",
    narration: "",
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getBankAccounts(),
      api.getPettyCash(),
      api.getChartOfAccounts(),
    ])
      .then(([bankRes, pettyRes, coaRes]) => {
        if (bankRes.success) setBankAccounts(bankRes.data || []);
        if (pettyRes.success) {
          setPettyCashFunds(pettyRes.data || []);
          if (pettyRes.data?.length > 0) {
            setPettyForm((prev) => ({
              ...prev,
              petty_cash_fund_id: pettyRes.data[0].id.toString(),
            }));
          }
        }
        if (coaRes.success) {
          setAccounts(coaRes.data || []);
          const expenseAccs = coaRes.data.filter((a: any) => a.type === "expense");
          if (expenseAccs.length > 0) {
            setPettyForm((prev) => ({
              ...prev,
              account_id: expenseAccs[0].id.toString(),
            }));
          }
          const bankAccs = coaRes.data.filter(
            (a: any) => a.sub_type === "bank_cash" || a.type === "asset"
          );
          if (bankAccs.length >= 2) {
            setTransferForm((prev) => ({
              ...prev,
              from_account_id: bankAccs[0].id.toString(),
              to_account_id: bankAccs[1].id.toString(),
            }));
          }
        }
      })
      .catch((err) => console.error("Error loading banking:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeCompany.id]);

  const handlePettySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPetty(true);
    try {
      await api.createPettyCashVoucher({
        petty_cash_fund_id: parseInt(pettyForm.petty_cash_fund_id),
        account_id: parseInt(pettyForm.account_id),
        voucher_date: pettyForm.voucher_date,
        amount: parseFloat(pettyForm.amount.toString()),
        paid_to: pettyForm.paid_to,
        description: pettyForm.description,
      });

      setShowPettyModal(false);
      setPettyForm((prev) => ({ ...prev, amount: 0, paid_to: "", description: "" }));
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record petty cash voucher");
    } finally {
      setSubmittingPetty(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_account_id === transferForm.to_account_id) {
      alert("Source and Destination accounts must be different.");
      return;
    }

    setSubmittingTransfer(true);
    try {
      await api.transferFunds({
        company_id: activeCompany.id,
        from_account_id: parseInt(transferForm.from_account_id),
        to_account_id: parseInt(transferForm.to_account_id),
        transfer_date: transferForm.transfer_date,
        amount: parseFloat(transferForm.amount.toString()),
        reference: transferForm.reference || "TRANSFER",
        narration: transferForm.narration || "Inter-Account Fund Transfer",
      });

      setShowTransferModal(false);
      setTransferForm((prev) => ({ ...prev, amount: 0, reference: "", narration: "" }));
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to transfer funds");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching specimen */}
      <PageHeader
        breadcrumbs={["ENTERPRISE TREASURY", "CASH & LIQUIDITY", "BANKING & CASH"]}
        title="Banking & Cash"
        description="Corporate bank accounts, live liquidity balances, petty cash vouchers, and inter-account fund transfers."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setShowTransferModal(true)}
              variant="outline"
              className="inline-flex items-center gap-2 rounded-md border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shadow-2xs"
            >
              <ArrowLeftRight size={14} className="text-[#2563EB]" />
              Transfer Funds
            </Button>

            <Button
              onClick={() => setShowPettyModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#1D4ED8] text-xs cursor-pointer"
            >
              <Plus size={15} />
              Record Petty Cash Voucher
            </Button>
          </div>
        }
      />

      {/* Bank Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
          <Landmark size={16} className="text-[#2563EB]" />
          Operating Bank Accounts
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.length > 0 ? (
            bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4 hover:border-[#2563EB]/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-[#E2E8F0] uppercase">
                      {bank.currency_code} Account
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-[#0F172A]">{bank.account_name}</h3>
                    <p className="text-xs text-[#64748B]">{bank.bank_name}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
                    <Landmark size={18} />
                  </div>
                </div>

                <div className="rounded-md bg-[#F8FAFC] p-3 space-y-1 text-xs border border-[#E2E8F0]/60">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Account #</span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {bank.account_number}
                    </span>
                  </div>
                  {bank.iban && (
                    <div className="flex justify-between text-[#64748B]">
                      <span>IBAN</span>
                      <span className="font-mono text-[11px] text-[#0F172A]">{bank.iban}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 flex items-baseline justify-between border-t border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B] font-semibold uppercase">
                    Current Balance
                  </span>
                  <span className="font-mono text-lg font-bold text-[#0F172A]">
                    {formatCurrency(parseFloat(bank.current_balance))}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#94A3B8]">
              No bank accounts configured for this company.
            </div>
          )}
        </div>
      </div>

      {/* Petty Cash Funds Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
          <Coins size={16} className="text-[#10B981]" />
          Petty Cash Funds (Imprest System)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {pettyCashFunds.length > 0 ? (
            pettyCashFunds.map((fund) => {
              const floatVal = parseFloat(fund.float_amount);
              const currentVal = parseFloat(fund.current_balance);
              const pct = floatVal > 0 ? Math.round((currentVal / floatVal) * 100) : 100;

              return (
                <div
                  key={fund.id}
                  className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4 hover:border-[#10B981]/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">{fund.fund_name}</h3>
                      <p className="text-xs text-[#64748B]">
                        Custodian: <span className="font-semibold text-[#0F172A]">{fund.custodian_name}</span>
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                      <Wallet size={18} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>Available: <strong className="text-[#0F172A]">{formatCurrency(currentVal)}</strong></span>
                      <span>Float: <strong className="text-[#0F172A]">{formatCurrency(floatVal)}</strong></span>
                    </div>
                    <div className="h-1.5 w-full rounded-sm bg-[#F1F5F9] border border-[#E2E8F0]/60 overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          pct < 30 ? "bg-[#EF4444]" : "bg-[#10B981]"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Vouchers list */}
                  {fund.vouchers?.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <p className="text-[11px] font-bold text-[#64748B] uppercase mb-2">
                        Recent Disbursements
                      </p>
                      <div className="space-y-1.5 text-xs">
                        {fund.vouchers.slice(0, 3).map((v: any) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between text-[#0F172A] rounded-md bg-[#F8FAFC] px-2.5 py-1.5 border border-[#E2E8F0]/60"
                          >
                            <div>
                              <span className="font-mono text-[10px] text-[#2563EB] font-bold mr-2">
                                {v.voucher_number}
                              </span>
                              <span>{v.paid_to}</span>
                            </div>
                            <span className="font-mono font-bold text-[#EF4444]">
                              {formatCurrency(parseFloat(v.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#94A3B8]">
              No petty cash funds registered.
            </div>
          )}
        </div>
      </div>

      {/* Petty Cash Modal */}
      {showPettyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl text-xs border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Petty Cash Expense Voucher</h2>
                <p className="text-[11px] text-[#64748B]">Record cash expense and auto-post to General Ledger</p>
              </div>
              <button
                onClick={() => setShowPettyModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePettySubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Petty Cash Fund <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  required
                  value={pettyForm.petty_cash_fund_id}
                  onChange={(e) =>
                    setPettyForm({ ...pettyForm, petty_cash_fund_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {pettyCashFunds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fund_name} ({formatCurrency(parseFloat(f.current_balance))} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Expense Category (COA) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  required
                  value={pettyForm.account_id}
                  onChange={(e) => setPettyForm({ ...pettyForm, account_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {accounts
                    .filter((a) => a.type === "expense")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Date <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={pettyForm.voucher_date}
                    onChange={(e) => setPettyForm({ ...pettyForm, voucher_date: e.target.value })}
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Amount ({activeCompany.currency}) <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={pettyForm.amount || ""}
                    onChange={(e) =>
                      setPettyForm({ ...pettyForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 rounded-md font-mono font-bold border-[#E2E8F0] bg-white text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Paid To (Beneficiary) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Courier Rider, Office Supplies Store"
                  value={pettyForm.paid_to}
                  onChange={(e) => setPettyForm({ ...pettyForm, paid_to: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Description <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <Input
                  required
                  placeholder="Reason for cash disbursement"
                  value={pettyForm.description}
                  onChange={(e) => setPettyForm({ ...pettyForm, description: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowPettyModal(false)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPetty || pettyForm.amount <= 0}
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {submittingPetty ? "Posting..." : "Record & Post to GL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl text-xs border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Inter-Account Fund Transfer</h2>
                <p className="text-[11px] text-[#64748B]">Record bank-to-bank or bank-to-cash contra voucher</p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  From (Source Account) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  required
                  value={transferForm.from_account_id}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, from_account_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {accounts
                    .filter((a) => a.sub_type === "bank_cash" || a.type === "asset")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name} ({formatCurrency(parseFloat(acc.current_balance))})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  To (Destination Account) <span className="text-[#EF4444] ml-0.5">*</span>
                </label>
                <select
                  required
                  value={transferForm.to_account_id}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, to_account_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                >
                  {accounts
                    .filter((a) => a.sub_type === "bank_cash" || a.type === "asset")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Date <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={transferForm.transfer_date}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, transfer_date: e.target.value })
                    }
                    className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Amount ({activeCompany.currency}) <span className="text-[#EF4444] ml-0.5">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={transferForm.amount || ""}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-md font-mono font-bold border-[#E2E8F0] bg-white text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Reference / Narration</label>
                <Input
                  placeholder="Transfer note or cheque number"
                  value={transferForm.narration}
                  onChange={(e) => setTransferForm({ ...transferForm, narration: e.target.value })}
                  className="h-9 rounded-md border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="h-9 px-4 rounded-md border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingTransfer ||
                    transferForm.amount <= 0 ||
                    transferForm.from_account_id === transferForm.to_account_id
                  }
                  className="h-9 px-4 rounded-md bg-[#0F172A] hover:bg-[#1E293B] font-semibold text-white text-xs shadow-xs transition-colors"
                >
                  {submittingTransfer ? "Executing..." : "Transfer & Post to GL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

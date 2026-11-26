const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE && !process.env.NEXT_PUBLIC_API_BASE.includes(":8001")
    ? process.env.NEXT_PUBLIC_API_BASE
    : "http://127.0.0.1:8000/api";

function getActiveCompanyId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accounts_active_company_id") || "1";
  }
  return "1";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const companyId = getActiveCompanyId();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "X-Company-Id": companyId,
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err.name === "TypeError" || err.message?.includes("fetch")) {
      throw new Error(
        `Unable to reach the backend API server at ${API_BASE}. Please make sure 'php artisan serve' is running on port 8000.`
      );
    }
    throw err;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error (${res.status}): ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Companies & Currencies
  getCompanies: () => request<{ success: boolean; data: any[] }>("/companies"),
  getCompany: (id: string | number) => request<{ success: boolean; data: any }>(`/companies/${id}`),
  createCompany: (data: any) => request<{ success: boolean; data: any; message?: string }>("/companies", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateCompany: (id: string | number, data: any) => request<{ success: boolean; data: any; message?: string }>(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteCompany: (id: string | number) => request<{ success: boolean; message?: string }>(`/companies/${id}`, {
    method: "DELETE",
  }),
  getCurrencies: () => request<{ success: boolean; data: any[] }>("/currencies"),

  // Dashboard & Reports
  getDashboardSummary: () => request<{ success: boolean; data: any }>("/reports/dashboard-summary"),
  getTrialBalance: (params?: { start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    const qs = q.toString();
    return request<{ success: boolean; data: any }>(`/reports/trial-balance${qs ? `?${qs}` : ""}`);
  },
  getIncomeStatement: (params?: { start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    const qs = q.toString();
    return request<{ success: boolean; data: any }>(`/reports/income-statement${qs ? `?${qs}` : ""}`);
  },
  getBalanceSheet: (params?: { start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    const qs = q.toString();
    return request<{ success: boolean; data: any }>(`/reports/balance-sheet${qs ? `?${qs}` : ""}`);
  },
  getLedger: (accountId?: number | string, params?: { start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (accountId) q.append("account_id", accountId.toString());
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    const qs = q.toString();
    return request<{ success: boolean; data: any }>(`/reports/ledger${qs ? `?${qs}` : ""}`);
  },

  // Chart of Accounts
  getChartOfAccounts: () => request<{ success: boolean; data: any[]; grouped: any }>("/chart-of-accounts"),
  createAccount: (data: any) => request<{ success: boolean; data: any }>("/chart-of-accounts", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAccount: (id: string | number, data: any) => request<{ success: boolean; data: any }>(`/chart-of-accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  toggleAccountActive: (id: string | number) => request<{ success: boolean; data: any }>(`/chart-of-accounts/${id}/toggle-active`, {
    method: "POST",
  }),

  // Journal Entries
  getJournalEntries: (
    params:
      | string
      | {
          search?: string;
          start_date?: string;
          end_date?: string;
          voucher_type?: string;
          status?: string;
          page?: number;
          per_page?: number | string;
        } = ""
  ) => {
    let qs = "";
    if (typeof params === "string") {
      qs = params ? `?${params}` : "";
    } else if (params && typeof params === "object") {
      const q = new URLSearchParams();
      if (params.search) q.append("search", params.search);
      if (params.start_date) q.append("start_date", params.start_date);
      if (params.end_date) q.append("end_date", params.end_date);
      if (params.voucher_type) q.append("voucher_type", params.voucher_type);
      if (params.status) q.append("status", params.status);
      if (params.page) q.append("page", params.page.toString());
      if (params.per_page) q.append("per_page", params.per_page.toString());
      const queryStr = q.toString();
      qs = queryStr ? `?${queryStr}` : "";
    }
    return request<{ success: boolean; data: any }>(`/journal-entries${qs}`);
  },
  getJournalEntry: (id: string | number) => request<{ success: boolean; data: any }>(`/journal-entries/${id}`),
  createJournalEntry: (data: any) => request<{ success: boolean; data: any }>("/journal-entries", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateJournalEntry: (id: string | number, data: any) => request<{ success: boolean; data: any; message?: string }>(`/journal-entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteJournalEntry: (id: string | number) => request<{ success: boolean; message: string }>(`/journal-entries/${id}`, {
    method: "DELETE",
  }),
  bulkDeleteJournalEntries: (data: { ids?: number[]; all?: boolean }) =>
    request<{ success: boolean; message: string; count?: number }>("/journal-entries/bulk-delete", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  importJournalEntries: (body: FormData | any) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return request<{ success: boolean; message: string; count?: number }>("/journal-entries/import", {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  // Customers & Invoices
  getCustomers: () => request<{ success: boolean; data: any[] }>("/customers"),
  createCustomer: (data: any) => request<{ success: boolean; data: any }>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getInvoices: () => request<{ success: boolean; data: any }>("/invoices"),
  getInvoice: (id: string | number) => request<{ success: boolean; data: any }>(`/invoices/${id}`),
  createInvoice: (data: any) => request<{ success: boolean; data: any }>("/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  recordInvoicePayment: (invoiceId: string | number, data: any) =>
    request<{ success: boolean; data: any }>(`/invoices/${invoiceId}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Vendors & Bills
  getVendors: () => request<{ success: boolean; data: any[] }>("/vendors"),
  createVendor: (data: any) => request<{ success: boolean; data: any }>("/vendors", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getBills: () => request<{ success: boolean; data: any }>("/bills"),
  getBill: (id: string | number) => request<{ success: boolean; data: any }>(`/bills/${id}`),
  createBill: (data: any) => request<{ success: boolean; data: any }>("/bills", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  recordBillPayment: (billId: string | number, data: any) =>
    request<{ success: boolean; data: any }>(`/bills/${billId}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Banking & Petty Cash
  getBankAccounts: () => request<{ success: boolean; data: any[] }>("/banking/accounts"),
  getPettyCash: () => request<{ success: boolean; data: any[] }>("/banking/petty-cash"),
  createPettyCashVoucher: (data: any) => request<{ success: boolean; data: any }>("/banking/petty-cash/voucher", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  transferFunds: (data: any) => request<{ success: boolean; data: any }>("/banking/transfer", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  importBankStatement: (body: FormData | any) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return request<{ success: boolean; message: string; data?: any }>("/banking/import-statement", {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
};

# SCOPE.md
## Project: Professional Multi-Company Accounting Web Application (Services Business — UAE / Pakistan / Saudi Arabia)

---

## 1. Project Overview

Build a **complete, professional, production-grade, multi-company double-entry Accounting Web Application** for a **services-based business group operating in 3 countries: Dubai (UAE), Pakistan, and Saudi Arabia**. The system must follow standard accounting principles (double-entry bookkeeping, accrual basis) and every module must be **fully interconnected** — a single transaction (e.g., a Journal Voucher or an Invoice) must automatically flow through to the Ledger, Trial Balance, Financial Statements, and relevant Reports, exactly as real-world accounting software (QuickBooks / Zoho Books / Odoo Accounting) works.

This is a **multi-company (multi-tenant within one account) system**: the user owns 3 legally separate companies (UAE, Pakistan, KSA), each with its own **Chart of Accounts, ledgers, fiscal year, base currency, and financial statements** — but all accessible from a single login by switching between companies. Books of each company must NEVER mix with another company's data, while still allowing an optional **consolidated/group view** across all 3.

### 1.1 Tech Stack (Mandatory)

| Layer | Technology |
|---|---|
| Frontend | **Next.js** (latest stable, App Router, TypeScript) |
| Backend / API | **Laravel** (latest stable LTS version) — RESTful API |
| Styling | **Tailwind CSS** |
| Database | **MySQL** (RDBMS, InnoDB engine, foreign-key constraints enforced) |
| Auth | Laravel Sanctum / Passport (token-based, for Next.js SPA/API consumption) |
| State Management (Frontend) | React Context / Zustand / Redux Toolkit (developer's choice, must be consistent) |
| API Communication | Axios / Fetch with a typed API client layer |

### 1.2 Architecture Principles

- Laravel acts as a **pure API backend** (no Blade views for core app functionality).
- Next.js consumes Laravel APIs via REST (JSON), fully decoupled frontend/backend.
- Every accounting module must post to the **General Ledger** via **double-entry** (Debit = Credit) at the database level — no module should bypass this.
- All monetary calculations must use fixed-point/decimal types (never float) to avoid rounding errors.
- **Multi-company architecture is mandatory from day one** (not future-proofing — it's a core requirement). Every single financial/master table (Chart of Accounts, Vouchers, Invoices, Bills, Customers, Vendors, Bank Accounts, etc.) must carry a `company_id` foreign key, and **every query must be scoped to the active company** (via a global model scope / middleware — never trust a request without company context).
- A **Company Switcher** in the UI lets the user move between the 3 companies (UAE / Pakistan / KSA); switching company reloads the entire workspace (dashboard, COA, ledgers, reports) scoped to that company only.
- Each company has its own **independent Chart of Accounts** (a Pakistan expense account is NOT the same row as a Dubai expense account, even if named the same) — though a "Copy COA from another company" or "Use standard template" utility should exist to speed up setup.
- Soft deletes on all financial transaction tables (no hard delete of posted entries — only "void/reverse" via reversal entries, as per real accounting practice).

---

## 2. Multi-Company & Multi-Currency Management

### 2.1 Company Setup

The system must support an unlimited number of companies (starting with exactly 3: **UAE (Dubai)**, **Pakistan**, **Saudi Arabia (KSA)**), each configured independently:

| Setting | UAE (Dubai) | Pakistan | Saudi Arabia |
|---|---|---|---|
| Base/Functional Currency | AED | PKR | SAR |
| Legal Name / Trade License / CR Number | ✓ | ✓ | ✓ |
| Tax Registration | VAT (TRN) — 5% | Sales Tax / Income Tax (NTN, STRN) | VAT (ZATCA-registered, e-invoicing) |
| Fiscal Year Start | Configurable (default Jan–Dec, or company-specific) | Configurable | Configurable |
| Chart of Accounts | Independent | Independent | Independent |
| Address, Logo, Bank Accounts, Numbering Sequences | Independent | Independent | Independent |

Each company record stores: Legal Name, Country, Base Currency, Tax Registration Number, Fiscal Year settings, Address, Logo (used on invoice/report headers), and a unique `company_code` prefix used in all voucher/invoice numbering (e.g., `DXB-INV-0001`, `PK-INV-0001`, `KSA-INV-0001`).

### 2.2 Currency Rules per Company

- **Every company transacts in its own base currency** — Dubai entity books are entirely in AED, Pakistan entity in PKR, Saudi entity in SAR. There is no "default global currency" — each company's Trial Balance, Ledger, and Financial Statements are always in that company's base currency.
- **Foreign currency transactions within a company** (e.g., Dubai company receives a payment in USD, or Pakistan company pays a vendor in AED) must be supported:
  - Store the transaction in both: original currency + amount, and base-currency equivalent (converted using the exchange rate on the transaction date).
  - Maintain an **Exchange Rate table** (currency pair, rate, effective date) — either manually entered or fetched from a rate-provider API.
  - Calculate and post **realized/unrealized Foreign Exchange Gain or Loss** automatically:
    - Realized FX Gain/Loss: when a foreign-currency invoice/bill is settled at a different rate than it was raised.
    - Unrealized FX Gain/Loss: on revaluation of open foreign-currency AR/AP balances and bank balances at period-end (month-end/year-end), auto-posted via a system-generated reversing Journal Voucher.
  - COA needs a dedicated "Exchange Gain/Loss" income/expense account per company.

### 2.3 Data Isolation Rules

- No cross-company financial mixing: a Pakistan invoice can never be paid from a Dubai bank account inside the system directly — such inter-company transactions must go through a formal **Inter-Company Transaction** mechanism (see 2.5).
- Users/roles are assigned **per company** — e.g., a Pakistan accountant may not have access to Dubai or KSA books unless explicitly granted (a "Group Admin" role can access all 3).
- Numbering sequences (Invoice #, Voucher #, Bill #) are independent per company (never shared).

### 2.4 Consolidated / Group Reporting

- Optional **Group Dashboard**: converts all 3 companies' figures into one reporting currency (e.g., USD or AED) using period-end/average exchange rates, and shows a combined Income Statement, Balance Sheet, and cash position across UAE + Pakistan + KSA — for ownership-level visibility only (not used for statutory filing).
- Each company's own statutory financial statements remain strictly single-currency and single-entity, since UAE, Pakistan, and KSA each have separate legal, tax, and audit requirements.

### 2.5 Inter-Company Transactions (Recommended)

Since the 3 companies belong to the same owner, the system should support **Inter-Company Due To / Due From** accounts:
- e.g., if Dubai company pays an expense on behalf of Pakistan company, record it as: Dubai books → Dr. "Due from Pakistan Co." (Asset); Pakistan books → Cr. "Due to Dubai Co." (Liability).
- These Inter-Company Vouchers post simultaneously (as linked mirrored entries) into both companies' ledgers, converted at the transaction-date exchange rate, and appear on an **Inter-Company Reconciliation Report** to make sure both sides always match.

### 2.6 Branch Management (Within Each Company)

Each of the 3 companies can have **one or more branches/offices/locations** (e.g., Dubai company might have a Dubai + Abu Dhabi branch; Pakistan company might have Karachi + Lahore + Islamabad branches). Branches are a level **below** company — they share the same legal entity, base currency, and Chart of Accounts, but transactions are tagged by branch for internal reporting.

- **`branches` table**: `id`, `company_id`, `branch_name`, `branch_code`, `address`, `is_active`, `is_head_office`. Every company must have at least one default branch (Head Office) auto-created on company setup.
- **`branch_id` column added to all transaction tables** (Journal Vouchers, Invoices, Bills, Petty Cash Vouchers, Receipts, Payments) — nullable/optional at entry (defaults to Head Office if not specified), so branch-level tracking doesn't force extra data entry where not needed.
- Chart of Accounts stays **shared at the company level** (not duplicated per branch) — branches use the same COA, but reports can be filtered/grouped by branch.
- **Branch-wise Reporting**: Trial Balance, Income Statement, Balance Sheet, and all AR/AP reports must support an optional "Branch" filter (single branch, or "All Branches" combined for the whole company) — this is a **filter/dimension**, not a separate ledger, so a company's overall books always remain the sum of its branches.
- **Branch-wise Petty Cash**: each branch can have its own Petty Cash fund/custodian (common real-world need for services businesses with multiple offices).
- **Branch-wise numbering** (optional): Invoice/Voucher numbers can optionally include a branch code segment (e.g., `PK-LHR-INV-0001` for Lahore branch vs `PK-KHI-INV-0001` for Karachi), configurable per company.
- Users can be granted access to specific branches within a company (in addition to company-level access) for finer-grained permission control — e.g., a Lahore-office data-entry operator who should not see Karachi branch vouchers.
- **Bank Accounts and Customers/Vendors** may optionally be tagged to a "home branch" for reporting, but remain usable company-wide (a customer isn't locked to one branch).

---

## 3. User Roles & Permissions

Implement Role-Based Access Control (RBAC) using Laravel policies/spatie/laravel-permission, **scoped per company**:

- **Group Admin / Owner** — full access across all 3 companies, can switch freely, approve/post/lock periods in any company.
- **Company Admin** — full access within one assigned company only.
- **Accountant** — can create/edit vouchers, view reports, cannot delete posted entries (within assigned company/companies).
- **Data Entry Operator** — can create draft vouchers only (require Accountant/Admin approval to post), within assigned company.
- **Auditor / Viewer** — read-only access to all reports and ledgers (within assigned company, or all companies if Group-level).
- Optionally, **Branch-level restriction** on top of the above roles: a user's access can be narrowed to specific branch(es) within their assigned company (e.g., "Accountant — Pakistan — Lahore Branch only") for businesses where head office doesn't want branch staff seeing other branches' vouchers.

A `user_company` pivot table maps which user has access to which company(ies) and with what role in each — a single user can have different roles in different companies (e.g., Admin in Dubai, Viewer in Pakistan). An optional `user_branch` pivot table further restricts specific users to specific branches.

Every transaction must store `company_id`, `branch_id`, `created_by`, `approved_by`, `posted_by`, and timestamps for full audit trail.

---

## 4. Core Modules (All Interconnected)

> **Note:** Every module below is implicitly scoped by `company_id`. All lists, dropdowns (accounts, customers, vendors, bank accounts), numbering sequences, and reports only ever show data belonging to the **currently active company** — switching companies in the UI switches the entire module context.

### 4.1 Chart of Accounts (COA)
- **Each company (Dubai, Pakistan, KSA) has its own independent COA** — `chart_of_accounts` table scoped by `company_id`; no account is shared across companies.
- Hierarchical structure: **Account Group → Account Category → Sub-Account → Ledger Account**.
- Standard 5 account types: **Asset, Liability, Equity, Income, Expense** (with sub-types: Current Asset, Fixed Asset, Current Liability, Long-term Liability, Direct Expense, Indirect Expense, etc.)
- Each account has: Code (auto-generated, e.g., 1000, 1001...), Name, Type, Parent Account, Opening Balance, Opening Balance Date (in that company's base currency), Is Active/Inactive, Is System Account (locked, e.g., Retained Earnings, Cash, AR Control, AP Control).
- System-generated **control accounts** required per company: Accounts Receivable Control, Accounts Payable Control, Petty Cash, Bank(s), Retained Earnings/Owner's Equity, **Exchange Gain/Loss** (for foreign-currency transactions).
- Ability to add unlimited custom accounts under any group, per company.
- A **"Clone COA to another company"** utility (e.g., set up Pakistan's COA quickly by copying Dubai's structure, then adjust for local tax accounts) is recommended to speed up onboarding of the 3 companies.
- COA is the **foundation** — every other module references accounts from here, always within the active company's scope.

### 4.2 General Journal Vouchers (GJV) — Core Transaction Engine
- Manual Journal Voucher entry screen: Date, Voucher #(auto), Narration, multiple Debit/Credit lines referencing COA accounts.
- Validation: Total Debit MUST equal Total Credit before submission.
- Voucher Types: Journal Voucher (JV), Payment Voucher (PV), Receipt Voucher (RV), Contra Voucher (CV — bank-to-bank/cash-to-bank transfers).
- Draft → Pending Approval → Posted → (Void/Reversed) workflow.
- Attach supporting documents (PDF/image upload) to any voucher.
- Every other module (Invoicing, Petty Cash, Bank module, Payroll if added later) internally generates GJV entries automatically — GJV is the single source of truth that feeds the General Ledger.

### 4.3 Petty Cash Management
- Petty Cash Fund setup (Imprest system): initial float amount, custodian assignment.
- Petty Cash Expense Vouchers: Date, Category (linked to Expense accounts in COA), Amount, Description, Receipt attachment.
- Replenishment requests when fund runs low — auto-calculates replenishment amount (Float − Remaining Balance).
- Automatically posts to General Ledger (Dr. Expense, Cr. Petty Cash) on approval.
- Petty Cash Register/Report showing running balance.

### 4.4 Bank & Cash Management
- Multiple Bank Account setup, each linked to a COA Bank Account (Asset).
- Record Deposits, Withdrawals, Bank Transfers, Bank Charges, Interest Income.
- **Bank Reconciliation Module**:
  - Import/enter bank statement lines (manual entry or CSV import).
  - Match system-recorded transactions against bank statement lines.
  - Show Unreconciled Items (Outstanding Cheques, Deposits in Transit).
  - Calculate Reconciled Balance = Bank Statement Balance + Deposits in Transit − Outstanding Cheques, and confirm it equals Book Balance.
  - Reconciliation Report (per account, per period) with locked/finalized status once reconciled.

### 4.5 Accounts Receivable (AR) — Client/Customer Side (Services Business)
- Customer/Client Master (Name, Contact, Address, Tax info, Opening Balance, Credit Terms), scoped per company — a customer served by both the Dubai and Pakistan entities is stored as **two separate customer records** (one per company), optionally linked via an internal "Global Customer" reference for group-level reporting.
- Sales/Service Invoice creation (line items = services rendered, tax if applicable, discounts), invoice currency defaults to the company's base currency but can be overridden (e.g., a Dubai company invoicing a client in USD) — with FX conversion per Section 2.2.
- Invoice statuses: Draft, Sent, Partially Paid, Paid, Overdue, Void.
- Customer Payment Receipt against one or multiple invoices (partial payments supported).
- Auto-posts to GL: Dr. Accounts Receivable / Cr. Service Income (on invoice); Dr. Cash-Bank / Cr. Accounts Receivable (on receipt).
- **AR Reports**: Customer Ledger/Statement, AR Aging Report (0-30, 31-60, 61-90, 90+ days), Outstanding Invoices Report, Customer-wise Sales Summary.

### 4.6 Accounts Payable (AP) — Vendor/Supplier Side
- Vendor/Supplier Master (Name, Contact, Tax info, Opening Balance, Payment Terms), scoped per company.
- Vendor Bill entry (expenses/services received from vendors), bill currency defaults to company base currency but can be a foreign currency (e.g., Pakistan company paying a Dubai-based vendor in AED) — with FX conversion and realized/unrealized gain-loss handling per Section 2.2.
- Bill statuses: Draft, Approved, Partially Paid, Paid, Overdue, Void.
- Payment Voucher against one or multiple bills (partial payments supported).
- Auto-posts to GL: Dr. Expense / Cr. Accounts Payable (on bill); Dr. Accounts Payable / Cr. Cash-Bank (on payment).
- **AP Reports**: Vendor Ledger/Statement, AP Aging Report, Outstanding Bills Report, Vendor-wise Expense Summary.

### 4.7 General Ledger
- Auto-populated from every posted transaction across all modules (GJV, AR, AP, Petty Cash, Bank).
- View by account: opening balance, all debit/credit entries, running balance, closing balance.
- Filterable by date range, account, voucher type.
- Drill-down: click any ledger entry to view the originating source voucher/invoice/bill.

### 4.8 Trial Balance
- Auto-generated list of all COA accounts with Debit/Credit balances as of a selected date.
- Must always balance (Total Debit = Total Credit) — acts as a system integrity check.
- Adjusted Trial Balance option (after adjusting entries).

### 4.9 Financial Statements (Auto-Generated from GL/Trial Balance)
- **Income Statement (Profit & Loss)**: Revenue − COGS (if applicable) − Operating Expenses = Net Profit/Loss, for any selected period, per company, in that company's base currency, with comparison to previous period.
- **Balance Sheet**: Assets = Liabilities + Equity, as of any selected date, per company, with drill-down into each line item, comparative (current vs prior period).
- **Statement of Owner's Equity / Retained Earnings** (recommended addition), per company.
- **Cash Flow Statement** (recommended addition — Operating, Investing, Financing activities), per company.
- **Consolidated Group Statements** (optional view): combines UAE + Pakistan + KSA statements into one reporting currency per Section 2.4 — clearly labeled as "management/consolidated view", separate from each entity's statutory statements.
- Year-End Closing process runs **independently per company** (each has its own fiscal year) — system closes Income & Expense accounts into that company's Retained Earnings and locks the period for that company only.

### 4.10 Reports Module (Central Reporting Hub)
All reports must support: date range filter, export to PDF/Excel, print view.

- Chart of Accounts Report
- General Journal Report (all vouchers, chronological)
- General Ledger Report (per account)
- Trial Balance Report
- Balance Sheet
- Income Statement (P&L)
- Cash Flow Statement
- AR Aging Report
- AP Aging Report
- Customer Statement / Vendor Statement
- Petty Cash Register
- Bank Reconciliation Statement
- Day Book (all transactions of a given day)
- Audit Trail Report (who created/edited/posted what, and when)
- Foreign Exchange Gain/Loss Report (realized + unrealized, per company)
- Inter-Company Reconciliation Report (Due To/Due From matching across companies)
- **Consolidated Group Report** (all 3 companies combined, in a chosen reporting currency)

Every report screen must have a **Company selector** (single company, or "All Companies" for the group-level reports where applicable), a **Branch filter** (single branch or "All Branches" within that company), and a **currency display** showing which currency the figures are in.

### 4.11 Dashboard (Home Screen)
- **Per-company Dashboard** (default view, scoped to the currently active company): Total Receivables, Total Payables, Cash & Bank Balance, Net Profit (current period), Top Overdue Invoices, Recent Transactions, Expense breakdown chart, Income vs Expense trend chart — all in that company's base currency, with an optional **Branch breakdown widget** (e.g., a bar chart comparing revenue/expense across Lahore, Karachi, Islamabad branches if the company has multiple).
- **Group Dashboard** (Group Admin only): side-by-side summary cards for Dubai / Pakistan / Saudi Arabia (Revenue, Net Profit, Cash Position, Receivables, Payables), each shown in its own currency plus a converted total in the chosen group reporting currency.

### 4.12 System / Settings Module
- **Company Management**: add/edit companies (Dubai, Pakistan, Saudi Arabia, or any future entity), each with its own Legal Name, Logo, Address, Base Currency, Tax Registration, Fiscal Year, and numbering-sequence prefixes (Section 2.1).
- **Branch Management**: add/edit branches within each company (Section 2.6) — branch name, code, address, active status, default Head Office designation.
- Fiscal Year setup, Accounting Period Lock/Unlock — configured independently per company.
- **Currency & Exchange Rate Management**: list of currencies in use (AED, PKR, SAR, plus any transaction currencies like USD), manual or API-fed exchange rate entries, effective-dated rate history.
- Tax rate configuration per company (UAE VAT 5%, Pakistan Sales Tax/Income Tax rates, KSA VAT/ZATCA e-invoicing settings — each country's rules differ and must be configurable independently).
- Numbering sequence configuration for Invoices, Vouchers, Bills — per company, with company-code prefixes.
- User Management & Role/Permission assignment, including per-company access mapping (Section 3).

---

## 5. How Modules Connect (Data Flow — Mandatory Logic)

Every box below is repeated **independently for each company** (Dubai / Pakistan / Saudi Arabia) — the flow never crosses company boundaries except through the explicit Inter-Company mechanism (Section 2.5):

```
Active Company (Dubai / Pakistan / Saudi Arabia) selected via Company Switcher
        │
        ▼
Chart of Accounts — this company's own (foundation)
        │
        ▼
 ┌────────────────────────────────────────────┐
 │   Source Transactions (all auto-generate    │
 │   entries into General Journal / GL):        │
 │   - General Journal Vouchers (manual)        │
 │   - Petty Cash Vouchers                      │
 │   - Bank Deposits/Withdrawals/Transfers      │
 │   - AR: Invoices & Customer Receipts         │
 │   - AP: Bills & Vendor Payments              │
 └────────────────────────────────────────────┘
        │
        ▼
   General Ledger (every posted line lands here)
        │
        ▼
   Trial Balance (sum of all ledger balances)
        │
        ▼
 ┌───────────────┬────────────────┬──────────────────┐
 │ Income         │ Balance Sheet  │ Cash Flow          │
 │ Statement      │                │ Statement          │
 └───────────────┴────────────────┴──────────────────┘
        │
        ▼
   All Reports (read from GL/Trial Balance/AR-AP subledgers)
        │
        ▼ (optional, Group Admin only)
   Consolidated/Group View — combines Dubai + Pakistan + KSA
   figures via exchange rates into one reporting currency
```

Rule: **No report or statement should store duplicate/hardcoded data** — everything must be computed live (or cached and recalculated) from the GL and subledgers, so the books always tie out, **per company**. The only place data legitimately crosses a company boundary is the Inter-Company mechanism and the optional Group Dashboard/Report.

---

## 6. Database Design Requirements (MySQL)

- **`companies` table** as the root: `id`, `name`, `legal_name`, `country`, `company_code`, `base_currency_code`, `tax_registration_number`, `fiscal_year_start_month`, `logo_path`, `address`, `is_active`.
- **`branches` table**: `id`, `company_id`, `branch_name`, `branch_code`, `address`, `is_head_office`, `is_active` (see Section 2.6). Every company gets one default Head Office branch on setup.
- **`company_id` foreign key on every scoped table**: `chart_of_accounts`, `journal_entries`, `journal_entry_lines`, `invoices`, `invoice_items`, `customers`, `bills`, `bill_items`, `vendors`, `bank_accounts`, `petty_cash_funds`, `payments`, `receipts`, `payment_allocations`. Enforce at the Eloquent level with a **global scope** (e.g., `BelongsToCompany` trait) so a query can never accidentally leak across companies.
- **`branch_id` foreign key (nullable, defaults to Head Office) on all transaction tables**: `journal_entries`, `invoices`, `bills`, `petty_cash_vouchers`, `payments`, `receipts` — for branch-level filtering and reporting, without forcing branch selection where the business doesn't need it.
- **`currencies` table**: `code` (AED, PKR, SAR, USD, etc.), `name`, `symbol`.
- **`exchange_rates` table**: `from_currency`, `to_currency`, `rate`, `effective_date`, `company_id` (nullable — some rates may be shared globally, others company-specific if needed).
- Every transaction table also needs: `currency_code` (transaction currency), `exchange_rate` (rate applied), `base_currency_amount` (converted amount in the company's base currency), alongside `voucher_number` (unique, sequential **per company**), `status` (draft/posted/void), `posted_at`, `reversed_by_id` (for reversal linkage), `created_by`, `approved_by`.
- **`user_company` pivot table**: `user_id`, `company_id`, `role` — drives per-company RBAC (Section 3).
- **`user_branch` pivot table** (optional, for finer-grained access): `user_id`, `branch_id` — restricts a user to specific branch(es) within their assigned company.
- **`intercompany_transactions` table**: links a source company voucher to a mirrored destination company voucher (`from_company_id`, `to_company_id`, `from_journal_entry_id`, `to_journal_entry_id`, `exchange_rate_used`) for the Due To/Due From mechanism (Section 2.5).
- Enforce foreign keys between: `journal_entries` ↔ `journal_entry_lines` ↔ `chart_of_accounts` (same `company_id` on both sides — add a check/validation, not just a raw FK, to prevent cross-company linkage), `invoices` ↔ `invoice_items` ↔ `customers`, `bills` ↔ `bill_items` ↔ `vendors`, `payments`/`receipts` ↔ `payment_allocations` (for partial payment matching).
- Use database transactions (Laravel DB::transaction) when posting any voucher so debit/credit lines are always atomic — and, for inter-company vouchers, atomic across both companies' entries together.
- Index all foreign keys and frequently filtered columns (`company_id` first in most composite indexes, then date, account_id, customer_id, vendor_id, status) since almost every query will filter by `company_id`.

---

## 7. Non-Functional Requirements

- **Validation**: Debit = Credit enforced both frontend (UX) and backend (source of truth).
- **Security**: Sanctum token auth, RBAC on every API endpoint, input validation/sanitization, CSRF protection where applicable.
- **Audit Trail**: Immutable log of all create/update/void actions on financial records.
- **Performance**: Paginate all list/report APIs; use eager loading in Laravel to avoid N+1 queries.
- **Export**: PDF export (e.g., via DomPDF/Snappy) and Excel export (Laravel Excel) for all reports.
- **Responsive UI**: Tailwind-based responsive design, usable on desktop and tablet (accounting is primarily desktop-first, but should not break on smaller screens).
- **Data Integrity**: Locked accounting periods cannot be edited without Admin unlock + audit log entry.

---

## 8. Suggested Development Phases

1. **Phase 1 — Multi-Company Foundation**: Auth, `companies` table + Company Switcher UI, per-company RBAC (`user_company`), Currency & Exchange Rate setup, Chart of Accounts (per company).
2. **Phase 2 — Core Ledger Engine**: General Journal Vouchers (with currency + FX fields), General Ledger, Trial Balance — all company-scoped.
3. **Phase 3 — Subledgers**: Accounts Receivable (Customers, Invoices, Receipts), Accounts Payable (Vendors, Bills, Payments) — per company, with foreign-currency invoice/bill support.
4. **Phase 4 — Cash Modules**: Petty Cash, Bank Accounts, Bank Reconciliation — per company.
5. **Phase 5 — Financial Statements**: Income Statement, Balance Sheet, Cash Flow Statement — per company, in that company's base currency.
6. **Phase 6 — Reports & Dashboard**: All report exports, per-company Dashboard, Audit Trail Report, FX Gain/Loss Report.
7. **Phase 7 — Group Features**: Inter-Company transactions (Due To/Due From), Inter-Company Reconciliation Report, Consolidated Group Dashboard & Report.
8. **Phase 8 — Polish**: Period locking/year-end closing per company, country-specific tax settings (UAE VAT, Pakistan Sales/Income Tax, KSA VAT/ZATCA), notifications/reminders for overdue invoices/bills.

---

## 9. Deliverables Expected

- Laravel API backend with full REST endpoints (documented, e.g., via Postman collection or OpenAPI/Swagger), with `company_id` scoping enforced on every endpoint.
- Next.js frontend consuming those APIs with Tailwind CSS UI, including a persistent **Company Switcher** in the app header/sidebar.
- MySQL schema/migrations reflecting the structure above (companies, currencies, exchange rates, company-scoped COA, etc.), with seeders for 3 sample companies (Dubai/AED, Pakistan/PKR, Saudi Arabia/SAR) and a starter Chart of Accounts for each.
- Role-based login system with per-company access control.
- All modules listed in Section 4, fully interconnected as per Section 5, correctly isolated per company as per Section 2.
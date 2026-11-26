# Professional Multi-Company Accounting System

> **A project by The 5th Dimension Corporate Consultancy**  
> Serving entities across **United Arab Emirates (Dubai)**, **Saudi Arabia (KSA)**, and **Pakistan**.

---

## 1. Project Overview

A production-grade, multi-company double-entry accounting web application designed for services-based business groups operating across multiple jurisdictions. The system strictly adheres to accrual-basis accounting standards where every transaction (Invoices, Bills, Receipts, Payments, Petty Cash Vouchers) automatically posts balanced entries (`Debit == Credit`) into the General Ledger.

Each company operates with complete financial data isolation, its own independent Chart of Accounts, base currency, tax framework, and statutory financial statements, while sharing a unified login and seamless workspace switching.

---

## 2. Multi-Company Architecture & Jurisdictions

The application currently manages 3 legal corporate entities:

| Company Name | Jurisdiction | Functional Currency | Tax System | Numbering Prefix |
|---|---|---|---|---|
| **The 5th Dimension Corporate Consultancy LLC** | Dubai, UAE | **AED** (UAE Dirham) | VAT (TRN) — 5% | `DXB-*` |
| **Ascension Management Consulting Co.** | Riyadh, Saudi Arabia | **SAR** (Saudi Riyal) | VAT (ZATCA) — 15% | `KSA-*` |
| **Brysona Consulting (PVT) Ltd** | Karachi / Lahore, Pakistan | **PKR** (Pakistani Rupee) | Sales Tax / NTN — 18% | `PK-*` |

### Core Workflow:
1. **User Sign In (`/login`)**: Secure token-based authentication.
2. **Select Company Workspace (`/companies`)**: Clean post-login landing screen displaying the corporate entities with jurisdiction, currency, and tax tags.
3. **Workspace Access (`/accounting/*`)**: Enters the selected company's books. All ledger accounts, transactions, balances, and reports are strictly scoped to this company.
4. **Persistent Company Switcher**: A company switcher located in the Topbar and Sidebar enables instant switching between Dubai, Saudi Arabia, and Pakistan entities without requiring re-authentication.

---

## 3. Technology Stack

- **Backend / API**: **Laravel 12 LTS** (PHP 8.2+) — Pure RESTful API
- **Frontend**: **Next.js 16 (App Router)**, React 19, TypeScript
- **Styling**: **Tailwind CSS**, Lucide Icons, Glassmorphism UI tokens
- **Database**: **MySQL 8.0+** (InnoDB engine, strict foreign-key integrity, transactional rollbacks)
- **State & Context**: React `CompanyContext` with local storage persistence and API interceptors passing `X-Company-Id`.

---

## 4. Database Architecture & Key Tables

- `companies`: Root corporate entity profiles, legal names, jurisdictions, tax numbers, and default currency.
- `branches`: Location-based office tagging (`Head Office`, branch offices).
- `currencies` & `exchange_rates`: Multi-currency conversion tables.
- `chart_of_accounts`: 5-group account hierarchy (Assets, Liabilities, Equity, Revenue, Expense) with system control account protection.
- `journal_entries` & `journal_entry_lines`: Core double-entry ledger posting engine.
- `customers`, `invoices`, `invoice_items`: Accounts Receivable (AR) subledger.
- `vendors`, `bills`, `bill_items`: Accounts Payable (AP) subledger.
- `receipts` & `payments`: Customer receipts and vendor disbursements with GL linkage.
- `bank_accounts`: Linked asset accounts, IBANs, and balances.
- `petty_cash_funds` & `petty_cash_vouchers`: Imprest fund custodian records and expense vouchers.
- `personal_accounts`: Owner's isolated personal Chart of Accounts (Personal Banks, Credit Cards, Party/Client Ledgers, Personal Income & Expenses).
- `personal_bank_statements`: Owner's personal bank statement transactions imported from Excel (`bank-statement-format.xlsx`) or entered manually.

---

## 5. Modules Implemented

### 5.1 Financial Dashboard (`/accounting/dashboard`)
- Live KPIs calculated directly from General Ledger accounts:
  - Total Revenue (Revenue accounts current balance)
  - Operating Expenses (Expense accounts current balance)
  - Net Profit (Revenue − Expenses)
  - Accounts Receivable (AR Control balance)
  - Accounts Payable (AP Control balance)
  - Bank & Cash Position (Operating liquidity)
- Recent Invoices and Recent Posted Journal Transactions.
- Formatted in the active company's base currency (`AED`, `SAR`, `PKR`).

### 5.2 Chart of Accounts (`/accounting/chart-of-accounts`)
- Hierarchical view grouped by Assets (1000s), Liabilities (2000s), Equity (3000s), Revenue (4000s), and Expenses (5000s).
- System control accounts (Accounts Receivable, Accounts Payable, Retained Earnings, Tax Accounts).
- **Edit & Rename Accounts**: Click directly on any account name in the table or the dedicated **"Edit"** action button to update the account name, classification/sub-type, and description. System accounts allow safe renaming while protecting control codes and ledger invariants.
- **Account History / Ledger Drill-down**: Immediate modal ledger displaying all historical debit/credit transactions, journal voucher references, and running balances for any account.
- **Active / Inactive Status Toggle**: Deactivate obsolete accounts or re-enable them on demand.
- **Hierarchy & Sub-account Creation**: Create child sub-accounts under any existing parent ledger account.
- **Export to CSV**: Download complete Chart of Accounts structure and live balances into CSV format.

### 5.3 General Journal Vouchers (`/accounting/journal-entries`)
- Manual Journal Voucher engine supporting JV, PV (Payment), RV (Receipt), and CV (Contra).
- Real-time frontend and backend validation: **Total Debit MUST equal Total Credit**.
- Automatic GL posting updating account current balances atomically.
- **Universal Multi-Column Search**: Global search input matching across all table columns and nested line items (Voucher #, Reference, Narration, Voucher Type, Status, Currency, Debit, Credit, line descriptions, and associated Chart of Account names and codes).
- **Date Range Calendar Filter**: Interactive date filter toolbar with quick presets (`All Dates`, `This Month`, `Last Month`, `This Quarter`, `This Year`, `Custom Range`) and explicit `From Date` and `To Date` calendar pickers with real-time filter reset.
- **Server Pagination (20 Records Default)**: Paginated vouchers table displaying 20 entries by default, with selectable page sizes (20, 50, 100), range indicators (`Showing X to Y of Z entries`), and first/prev/numbered/next/last navigation controls.
- **Edit & Update Journal Vouchers**: Full editing capability (`PUT /api/journal-entries/{id}`) with auto-mapped voucher lines, amounts, clean dates, and atomic reversal and re-posting of GL account balances. Accessible via Voucher Number click or dedicated Edit icon.
- **Import Journal Entries**: Bulk CSV import with robust date parser supporting `DD-MM-YYYY`, `DD/MM/YYYY`, `DD-MM-YY` (e.g. `09-08-26`), `YYYY-MM-DD`, and Excel numeric serial formats.
- **Overwrite / Replace Existing Vouchers**: Cleanly update and re-sync previously imported vouchers with matching reference numbers without manual line-by-line deletions.
- **Global & Bulk Delete with Multi-Select**: Checkbox selection for individual vouchers and master "Select All" checkbox in the table header, featuring an interactive batch deletion bar (`POST /api/journal-entries/bulk-delete`) that safely deletes multiple selected vouchers and atomically reverts all corresponding General Ledger balances.
- **Delete Single Journal Entry**: Safe single-click deletion with automatic ledger balance reversal.

### 5.4 Invoicing & Accounts Receivable (`/accounting/invoices`, `/accounting/customers`)
- Customer Master with contact information, tax identification, and running balances.
- Invoicing with line items, auto-calculated subtotal, jurisdiction tax rates (5% UAE, 15% KSA, 18% PK), and total amounts.
- Auto-posts on invoice creation: `Dr. Accounts Receivable` / `Cr. Revenue` (+ `Cr. Tax Payable`).
- "Receive Payment" modal: records payment into chosen Bank/Cash account and auto-posts: `Dr. Bank` / `Cr. Accounts Receivable`.

### 5.5 Purchases & Accounts Payable (`/accounting/expenses`, `/accounting/vendors`)
- Vendor Master with contact information, tax identification, and payable balances.
- Vendor Bill entry with line items linked to expense accounts.
- Auto-posts on bill creation: `Dr. Expense` (+ `Dr. Tax Input`) / `Cr. Accounts Payable`.
- "Disburse Payment" modal: pays bill from Bank/Cash account and auto-posts: `Dr. Accounts Payable` / `Cr. Bank`.

### 5.6 Banking & Cash Operations (`/accounting/banking`)
- Bank Accounts management with account numbers, IBANs, and live balances.
- Petty Cash Fund tracking under the Imprest system with custodian assignment.
- "Record Petty Cash Voucher" modal posting cash disbursements directly to GL expenses.
- "Transfer Funds" modal executing Contra Vouchers between bank accounts.
- **Bank Statement CSV Import**: Import statements with automated transaction parsing and ledger offset matching.

### 5.7 Financial Reports Hub (`/accounting/reports`)
- **Multi-Period Filtering Engine**:
  - **Monthly**: Filter any financial statement by specific calendar month (January to December) and selected year.
  - **Quarterly**: Four-quarter statutory reporting:
    - Q1 (Jan 01 – Mar 31)
    - Q2 (Apr 01 – Jun 30)
    - Q3 (Jul 01 – Sep 30)
    - Q4 (Oct 01 – Dec 31)
  - **Biannually (Semi-Annual)**: Shash-mahi financial closures:
    - H1 (First Half: Jan 01 – Jun 30)
    - H2 (Second Half: Jul 01 – Dec 31)
  - **Annually**: Full fiscal/calendar year reporting (Jan 01 – Dec 31).
  - **Custom Range**: Custom start and end dates with date-picker inputs.
  - **All Time (Cumulative)**: Full ledger inception-to-date reporting.
- **Trial Balance**:
  - Dynamically calculates Opening Balance, Period Debits, Period Credits, and Closing Balances for the active period.
  - Real-time balanced integrity check (`Total Debit == Total Credit`).
- **Profit & Loss (Income Statement)**:
  - Exact period-scoped Operating Revenue vs Operating Expenses yielding Period Net Profit/Loss (Surplus / Deficit).
- **Balance Sheet**:
  - Assets = Liabilities + Equity as-of the selected period's closing date, automatically rolling up the period's net operating profit into equity.
- **General Ledger**:
  - Interactive account ledger with Opening Balance prior to period start date, Period Debits, Period Credits, Closing Balance, and complete transaction rows with running balances.

### 5.8 Company Settings (`/accounting/settings`)
- Corporate profile, tax identifier, fiscal year settings, and quick workspace switcher.

### 5.9 Owner Personal Accounts (`/accounting/personal/*`)
- **Personal Bank Statements (`/accounting/personal/bank-statements`)**:
  - **Official Excel Template Download**: One-click download of `bank-statement-format.xlsx` (`Date`, `Description`, `Debit (money out)`, `Credit (money in)`, `Balance`, `Category (pick)`, `Notes`, `Month`).
  - **Native Excel (.xlsx) & CSV Importer**: Automatically parses `bank-statement-format.xlsx` (including ADCB bank header detection, `Opening` balance rows, flexible dates, and auto-creation/linking of categories).
  - **Manual ADD / EDIT Entry Form**: Full modal form to add or edit any bank statement transaction with Bank Account, Date, Description, Debit, Credit, Balance, Category, Notes, and Month.
  - **Search, Category & Date Range Filters + Pagination**: Universal search across all columns, category dropdown filter, calendar date range presets (`This Month`, `Last Month`, `This Quarter`, `This Year`, `Custom`), multi-select bulk delete, and server-side pagination (20 records per page default).
- **Personal Chart of Accounts (`/accounting/personal/chart-of-accounts`)**:
  - Isolated personal categories, bank accounts, credit cards, income, expenses, and party/friend ledgers with Add, Edit, Active/Inactive toggle, and Delete support.

---

## 6. How to Run Locally

### 6.1 Backend (Laravel API)
```bash
cd backend

# Ensure MySQL is running and accounts_db database exists
# Run migrations and seed the 3 companies
php artisan migrate
php artisan db:seed

# Start Laravel REST API server on port 8005
php artisan serve --host=127.0.0.1 --port=8005
```
*API Base URL*: `http://127.0.0.1:8005/api`

### 6.2 Frontend (Next.js)
```bash
cd frontend

# Install dependencies if not already installed
npm install

# Start Next.js development server
npm run dev
```
*Frontend URL*: `http://localhost:3000`

### 6.3 Default Credentials
- **Email**: `admin@accounts.com`
- **Password**: `password123`
*(Direct access to `/companies` and workspaces is enabled).*

---

## 7. Brand Design System & Visual Identity

The corporate accounts system follows a luxury executive color palette and typography standard:

### 7.1 Core Brand Colors (Primary Theme)
| Color Name | Hex Code | Usage |
|---|---|---|
| **Deep Executive Navy** | `#081428` | Sidebar background, primary action buttons, main headers, dark badges, table tfoot |
| **Luxury Accent Gold** | `#C8A147` | Brand accent, active menu indicators, key icons, badges, and checkmark accents |
| **Gold Hover** | `#B48E35` | Gold button hover states & interactive accents |
| **Gold Light Tint** | `#FAF6EC` | Highlighted rows, active account cards, selected table rows |

### 7.2 Backgrounds & Surface Colors
| Color Name | Hex Code | Usage |
|---|---|---|
| **Warm Ivory / Cream** | `#FAF8F5` | Full application body background |
| **Card Pure White** | `#FFFFFF` | Table cards, drawers, popups, modals, and top navigation bar |
| **Dark Navy Secondary** | `#0D1E3A` | Dark container backgrounds, dropdown panels |
| **Navy Hover / Active** | `#122444` | Sidebar menu items hover and active states |

### 7.3 Borders & Dividers
| Color Name | Hex Code | Usage |
|---|---|---|
| **Warm Border (Light)** | `#E8E2D9` | Cards, tables, inputs, and modal borders |
| **Muted Scrollbar Thumb**| `#D8D2C5` | Table custom scrollbars & subtle dividers |
| **Sidebar Dark Border**  | `#152744` | Sidebar right border and section dividers |

### 7.4 Typography & Text Colors
- **Font Family**: `'Poppins', sans-serif` (Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold via `next/font/google`).
| Color Name | Hex Code | Usage |
|---|---|---|
| **Primary Dark Text** | `#081428` | Main page titles, headings, table cell primary text |
| **Secondary Muted Grey** | `#6E6E6E` | Subtitles, helper text, labels, secondary metadata |
| **Sidebar Text (Light)** | `#B0C0D8` | Sidebar default navigation links |
| **Sidebar Section Header**| `#8A9AB5` | Sidebar category titles (e.g. COMMAND CENTER, ACCOUNTING) |

### 7.5 Status & Temperature Indicators
| Status | Hex Code | Usage |
|---|---|---|
| **Hot / Overdue / Danger (Red)** | `#D93838` | Overdue invoices, alerts, payable balances, delete actions |
| **Warm / Due Soon (Amber)** | `#D97706` | Approaching due dates, partial payments, warning badges |
| **Cold / Info (Blue)** | `#2563EB` | Standard info badges, transfer links |
| **Success / Active (Green)** | `#16A34A` | Paid invoices, balanced trial balance, active connection status |
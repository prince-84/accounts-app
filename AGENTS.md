# AI Agent Guidelines & Project Instructions

This repository is a production multi-company double-entry accounting web application (Laravel 12 LTS API + Next.js 16 App Router).

## Mandatory Rules for AI Agents:

1. **Always Update `README.md`**:
   - Whenever you implement a new feature, modify workflows, add endpoints, create or update UI pages, or adjust application behavior, you **MUST always update `README.md`** to reflect those changes immediately.
   - Keep the modules list, installation instructions, database specifications, and feature breakdowns synchronized with actual code state.

2. **Accrual Double-Entry Integrity**:
   - Every transaction affecting ledger accounts must maintain balanced debits and credits (`Total Debit == Total Credit`).
   - Protect system control account codes and classifications to prevent breaking the general ledger.

3. **Multi-Company Scoping**:
   - All database queries and API operations must respect the active company scope via `X-Company-Id` header and `BelongsToCompany` trait. Never allow data leakage across companies.

4. **Production Verification**:
   - Always verify TypeScript and Next.js builds (`cd frontend && npm run build`) after making frontend changes.


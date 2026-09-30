export interface CompanyData {
  id: string;
  name: string;
  legalName: string;
  country: string;
  city?: string;
  address?: string;
  code: string;
  currency: string;
  currencySymbol: string;
  taxLabel: string;
  taxNumber: string;
  taxRate: number;
  email?: string;
  phone?: string;
  website?: string;
  flag: string;
  description: string;
}

export const COMPANIES_DATA: CompanyData[] = [
  {
    id: "1",
    name: "The 5th Dimension Corporate Consultancy",
    legalName: "The 5th Dimension Corporate Consultancy LLC",
    country: "United Arab Emirates",
    code: "DXB",
    currency: "AED",
    currencySymbol: "AED",
    taxLabel: "TRN (VAT)",
    taxNumber: "100234567800003",
    taxRate: 5,
    flag: "🇦🇪",
    description: "Access financial records, invoices, expenses, and business reports.",
  },
  {
    id: "2",
    name: "Ascension",
    legalName: "Ascension Management Consulting Co.",
    country: "Saudi Arabia",
    code: "KSA",
    currency: "SAR",
    currencySymbol: "SAR",
    taxLabel: "VAT (ZATCA)",
    taxNumber: "310123456700003",
    taxRate: 15,
    flag: "🇸🇦",
    description: "Manage your accounting workspace and keep your finances organized.",
  },
  {
    id: "3",
    name: "Brysona Consulting (PVT) Ltd",
    legalName: "Brysona Consulting (PVT) Ltd",
    country: "Pakistan",
    code: "PK",
    currency: "PKR",
    currencySymbol: "Rs.",
    taxLabel: "NTN / STRN",
    taxNumber: "8472910-4",
    taxRate: 18,
    flag: "🇵🇰",
    description: "Monitor transactions, financial performance, and business activity.",
  },
];

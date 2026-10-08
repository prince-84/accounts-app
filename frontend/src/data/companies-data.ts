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
    id: "2",
    name: "F.S Advisory Real Estate L.L.C",
    legalName: "F.S Advisory Real Estate L.L.C",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Dubai, United Arab Emirates",
    code: "FS",
    currency: "AED",
    currencySymbol: "AED",
    taxLabel: "TRN (VAT)",
    taxNumber: "100489201900003",
    taxRate: 5,
    flag: "🇦🇪",
    description: "Operating entity in United Arab Emirates",
  },
];

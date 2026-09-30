import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats any date string or Date object strictly into dd-mm-yyyy format
 */
export function formatDateDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const str = String(dateInput).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      return str;
    }

    const datePart = str.includes("T") ? str.split("T")[0] : str.split(" ")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-");
      return `${day}-${month}-${year}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return str;
  } catch {
    return String(dateInput);
  }
}


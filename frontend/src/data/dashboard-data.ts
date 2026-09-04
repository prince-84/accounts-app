export const dashboardStats = [
  {
    title: "Total Revenue",
    value: "PKR 2,450,000",
    change: 12.5,
    type: "revenue",
  },
  {
    title: "Total Expenses",
    value: "PKR 850,000",
    change: -4.2,
    type: "expenses",
  },
  {
    title: "Net Profit",
    value: "PKR 1,600,000",
    change: 18.7,
    type: "profit",
  },
  {
    title: "Outstanding Invoices",
    value: "PKR 325,000",
    change: -8.4,
    type: "invoices",
  },
];

export const revenueExpenseData = [
  { month: "Jan", revenue: 1850000, expenses: 720000 },
  { month: "Feb", revenue: 2100000, expenses: 780000 },
  { month: "Mar", revenue: 1950000, expenses: 810000 },
  { month: "Apr", revenue: 2250000, expenses: 850000 },
  { month: "May", revenue: 2400000, expenses: 890000 },
  { month: "Jun", revenue: 2180000, expenses: 830000 },
  { month: "Jul", revenue: 2550000, expenses: 920000 },
  { month: "Aug", revenue: 2700000, expenses: 950000 },
  { month: "Sep", revenue: 2450000, expenses: 850000 },
  { month: "Oct", revenue: 2850000, expenses: 980000 },
  { month: "Nov", revenue: 3100000, expenses: 1100000 },
  { month: "Dec", revenue: 3350000, expenses: 1250000 },
];

export const cashFlowData = [
  { month: "Jan", inflow: 1850000, outflow: 720000 },
  { month: "Feb", inflow: 2100000, outflow: 780000 },
  { month: "Mar", inflow: 1950000, outflow: 810000 },
  { month: "Apr", inflow: 2250000, outflow: 850000 },
  { month: "May", inflow: 2400000, outflow: 890000 },
  { month: "Jun", inflow: 2180000, outflow: 830000 },
];

export const recentInvoices = [
  {
    id: "INV-2026-001",
    customer: "The 5th Dimension Consultancy",
    date: "Sep 1, 2026",
    amount: "PKR 185,000",
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    customer: "Ascension",
    date: "Aug 29, 2026",
    amount: "PKR 245,000",
    status: "Pending",
  },
  {
    id: "INV-2026-003",
    customer: "Brysona Consulting (PVT) Ltd",
    date: "Aug 25, 2026",
    amount: "PKR 320,000",
    status: "Overdue",
  },
  {
    id: "INV-2026-004",
    customer: "Vertex Solutions",
    date: "Aug 20, 2026",
    amount: "PKR 150,000",
    status: "Paid",
  },
];

export const recentTransactions = [
  {
    title: "Payment received",
    description: "The 5th Dimension Consultancy",
    amount: "+ PKR 185,000",
    type: "income",
    date: "Today",
  },
  {
    title: "Office Rent",
    description: "Monthly office expense",
    amount: "- PKR 95,000",
    type: "expense",
    date: "Yesterday",
  },
  {
    title: "Client Payment",
    description: "Ascension",
    amount: "+ PKR 245,000",
    type: "income",
    date: "Aug 30",
  },
  {
    title: "Software Subscription",
    description: "Business tools",
    amount: "- PKR 18,500",
    type: "expense",
    date: "Aug 28",
  },
];

export const expenseCategoryData = [
  {
    name: "Salaries",
    value: 320000,
  },
  {
    name: "Office Rent",
    value: 180000,
  },
  {
    name: "Software",
    value: 95000,
  },
  {
    name: "Marketing",
    value: 140000,
  },
  {
    name: "Utilities",
    value: 65000,
  },
  {
    name: "Other",
    value: 50000,
  },
];

export const upcomingPayments = [
  {
    id: "PAY-001",
    name: "Office Rent",
    dueDate: "Sep 6, 2026",
    amount: "PKR 95,000",
    status: "Due Soon",
    type: "expense",
  },
  {
    id: "PAY-002",
    name: "Software Subscription",
    dueDate: "Sep 8, 2026",
    amount: "PKR 18,500",
    status: "Upcoming",
    type: "expense",
  },
  {
    id: "PAY-003",
    name: "Invoice from Tech Solutions",
    dueDate: "Sep 10, 2026",
    amount: "PKR 75,000",
    status: "Upcoming",
    type: "expense",
  },
  {
    id: "PAY-004",
    name: "Internet & Utilities",
    dueDate: "Sep 12, 2026",
    amount: "PKR 22,000",
    status: "Upcoming",
    type: "expense",
  },
];
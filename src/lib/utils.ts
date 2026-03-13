import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    NGN: '₦',
    RMB: '¥',
  }
  const symbol = symbols[currency] || currency + ' '
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const CURRENCIES = ['USD', 'NGN', 'RMB']

export const INCOME_TYPES = [
  'Design',
  'Sourcing',
  'Consulting',
  'Brokerage',
  'Web Development',
  'E-commerce',
  'Other',
]

export const BILL_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Phone',
  'Internet',
  'Transport',
  'Groceries',
  'Social Security',
  'Tax',
  'Other',
]

export const SAVINGS_TYPES = [
  'Bank Savings',
  'Cash Savings',
  'Emergency Fund',
  'Buffer Fund',
]

export const INVESTMENT_TYPES = ['Stock', 'ETF', 'Crypto', 'Mutual Fund']

export const ASSET_TYPES = [
  'Gold',
  'Land',
  'Laptop',
  'Phone',
  'Equipment',
  'Inventory',
]

export const LIFESTYLE_TYPES = [
  'Travel',
  'Clothing',
  'Eating Out',
  'Entertainment',
  'Personal Care',
]

export const SOFTWARE_CATEGORIES = [
  'Design Tools',
  'AI Tools',
  'Development Tools',
  'Hosting',
  'Domains',
  'Email',
  'Analytics',
  'Marketing',
  'Finance',
  'Productivity',
  'Other',
]

export const BILLING_CYCLES = ['monthly', 'yearly', 'quarterly', 'custom']

export const PRIORITY_LEVELS = ['high', 'medium', 'low']

export const PAYMENT_STAGES = [
  'Upfront',
  'Milestone',
  'On Delivery',
  'Net 30',
  'Net 60',
  'Net 90',
  'Retainer',
  'Installment',
  'Partial',
  'Final',
  'Other',
]

export const PAYMENT_TYPES = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Mobile Money',
  'Crypto',
  'PayPal',
  'Stripe',
  'Other',
]

export function getNextDueDate(lastPaidDate: Date, billingCycle: string): Date {
  const next = new Date(lastPaidDate)
  switch (billingCycle) {
    case 'monthly': next.setDate(next.getDate() + 30); break
    case 'yearly': next.setDate(next.getDate() + 365); break
    case 'quarterly': next.setDate(next.getDate() + 90); break
  }
  return next
}

export function getMonthlyEquivalent(cost: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'yearly': return cost / 12
    case 'quarterly': return cost / 3
    default: return cost
  }
}

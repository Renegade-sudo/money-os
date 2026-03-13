/**
 * Currency conversion utility.
 * All rates are expressed as: how many units of currency X per 1 USD.
 * e.g. { USD: 1, RMB: 7.1, NGN: 1600 }
 */

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  RMB: 7.1,
  NGN: 1600,
}

/**
 * Convert an amount from one currency to another.
 * @param amount       The amount to convert.
 * @param from         Source currency code.
 * @param to           Target currency code.
 * @param ratesFromUSD Map of currency → units per 1 USD (overrides fallback).
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  ratesFromUSD?: Record<string, number>,
): number {
  if (from === to || amount === 0) return amount
  const rates: Record<string, number> = { ...FALLBACK_RATES, ...ratesFromUSD }
  const fromRate = rates[from] ?? 1
  const toRate = rates[to] ?? 1
  const inUSD = amount / fromRate
  return inUSD * toRate
}

/**
 * Sum an array of { amount, currency } items, converting each to the target currency.
 */
export function sumInCurrency<T extends { amount: number; currency: string }>(
  items: T[],
  toCurrency: string,
  ratesFromUSD?: Record<string, number>,
): number {
  return items.reduce(
    (total, item) => total + convertAmount(item.amount, item.currency, toCurrency, ratesFromUSD),
    0,
  )
}

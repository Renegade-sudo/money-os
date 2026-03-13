import { NextResponse } from 'next/server'
import { FALLBACK_RATES } from '@/lib/currency'

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours

let cachedRates: Record<string, number> | null = null
let cacheTimestamp = 0

export async function GET() {
  try {
    const now = Date.now()
    if (cachedRates && now - cacheTimestamp < CACHE_DURATION_MS) {
      return NextResponse.json({ rates: cachedRates, source: 'cache' })
    }

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 21600 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.result === 'success' && data.rates) {
        // We only care about our supported currencies
        const rates: Record<string, number> = {
          USD: 1,
          NGN: data.rates.NGN ?? FALLBACK_RATES.NGN,
          RMB: data.rates.CNY ?? FALLBACK_RATES.RMB,
        }
        cachedRates = rates
        cacheTimestamp = now
        return NextResponse.json({ rates, source: 'live' })
      }
    }
  } catch {
    // fall through to fallback
  }

  return NextResponse.json({ rates: FALLBACK_RATES, source: 'fallback' })
}

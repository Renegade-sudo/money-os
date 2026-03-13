import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const entries = await prisma.investment.findMany({
    where: { userId: user.id, ...(month ? { month } : {}) },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    const { date, investmentType, symbol, platform, currency, amount, holdingType, notes } = body
    if (!date || !investmentType || !amount) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const d = new Date(date)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = await prisma.investment.create({
      data: { userId: user.id, date: d, month, investmentType, symbol, platform, currency: currency || 'USD', amount: parseFloat(amount), holdingType, notes },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch { return serverError() }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const bills = await prisma.billEntry.findMany({
    where: { userId: user.id, ...(month ? { month } : {}) },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(bills)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    const { date, category, description, currency, allocatedAmount, actualSpent, paidFrom, notes } = body
    if (!date || !category || !description) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

    const d = new Date(date)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const allocated = parseFloat(allocatedAmount || 0)
    const spent = parseFloat(actualSpent || 0)

    const bill = await prisma.billEntry.create({
      data: {
        userId: user.id,
        date: d,
        month,
        category,
        description,
        currency: currency || 'USD',
        allocatedAmount: allocated,
        actualSpent: spent,
        balance: allocated - spent,
        paidFrom,
        notes,
      },
    })
    return NextResponse.json(bill, { status: 201 })
  } catch { return serverError() }
}

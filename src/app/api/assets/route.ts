import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const entries = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { dateAcquired: 'desc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    const { dateAcquired, assetType, description, currency, purchaseCost, estimatedValue, location, notes } = body
    if (!dateAcquired || !assetType || !description) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const d = new Date(dateAcquired)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = await prisma.asset.create({
      data: { userId: user.id, dateAcquired: d, month, assetType, description, currency: currency || 'USD', purchaseCost: parseFloat(purchaseCost || 0), estimatedValue: parseFloat(estimatedValue || purchaseCost || 0), location, notes },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch { return serverError() }
}

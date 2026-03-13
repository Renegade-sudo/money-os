import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  const allocations = await prisma.moneyAllocation.findMany({
    where: { userId: user.id, ...(month ? { month } : {}) },
    include: { plan: true },
    orderBy: { month: 'desc' },
  })

  return NextResponse.json(allocations)
}

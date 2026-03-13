import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'
import { getNextDueDate } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await prisma.softwareSubscription.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.autoCalculatedNextDue !== false && body.lastPaidDate && body.billingCycle && body.billingCycle !== 'custom') {
      body.nextDueDate = getNextDueDate(new Date(body.lastPaidDate), body.billingCycle)
    }

    const sub = await prisma.softwareSubscription.update({ where: { id }, data: body })
    return NextResponse.json(sub)
  } catch { return serverError() }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const existing = await prisma.softwareSubscription.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.softwareSubscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return serverError() }
}

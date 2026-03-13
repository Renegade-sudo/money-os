import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await prisma.billEntry.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const allocated = body.allocatedAmount !== undefined ? parseFloat(body.allocatedAmount) : existing.allocatedAmount
    const spent = body.actualSpent !== undefined ? parseFloat(body.actualSpent) : existing.actualSpent
    const bill = await prisma.billEntry.update({
      where: { id },
      data: { ...body, allocatedAmount: allocated, actualSpent: spent, balance: allocated - spent },
    })
    return NextResponse.json(bill)
  } catch { return serverError() }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const existing = await prisma.billEntry.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.billEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return serverError() }
}

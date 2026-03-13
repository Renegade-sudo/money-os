import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await prisma.asset.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const asset = await prisma.asset.update({ where: { id }, data: body })
    return NextResponse.json(asset)
  } catch { return serverError() }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const existing = await prisma.asset.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return serverError() }
}

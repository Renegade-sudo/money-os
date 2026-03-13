import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name: name || '', email, passwordHash },
    })

    // Create default money plan
    await prisma.moneyPlan.create({
      data: {
        userId: user.id,
        planName: 'Debt Season Plan',
        isActive: true,
        tithePercent: 10,
        billsPercent: 50,
        savingsPercent: 10,
        debtPercent: 15,
        investmentPercent: 5,
        assetsPercent: 5,
        lifestylePercent: 5,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

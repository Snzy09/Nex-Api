import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: false, message: 'Primbon feature removed' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ status: false, message: 'Primbon feature removed' }, { status: 410 })
}

export const runtime = 'edge'

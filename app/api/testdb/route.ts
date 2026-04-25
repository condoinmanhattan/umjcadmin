import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT id, phone, status FROM db_leads`;
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

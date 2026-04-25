import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/migrate';

export async function GET() {
  try {
    const result = await runMigrations();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

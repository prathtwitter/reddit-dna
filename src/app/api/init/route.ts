import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Initialize database schema - call this once after setting up Vercel Postgres
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}

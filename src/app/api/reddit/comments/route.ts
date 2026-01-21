import { NextRequest, NextResponse } from 'next/server';
import { fetchPostComments } from '@/lib/reddit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const permalink = searchParams.get('permalink');

    if (!permalink) {
      return NextResponse.json(
        { error: 'Permalink is required' },
        { status: 400 }
      );
    }

    const comments = await fetchPostComments(permalink, 3);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { permalink } = await request.json();

    if (!permalink) {
      return NextResponse.json(
        { error: 'Permalink is required' },
        { status: 400 }
      );
    }

    const comments = await fetchPostComments(permalink, 3);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ message: 'Hello from test route!' }, { headers });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers });
} 
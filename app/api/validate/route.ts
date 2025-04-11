import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

// Add GET handler for direct browser testing
export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      message: 'Frame validation endpoint is working. Please use POST for frame validation.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

// Handle OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    let isValid = false;
    let errorMessage = '';
    
    try {
      // Check if we have the required data
      if (!body.trustedData?.messageBytes) {
        errorMessage = 'Missing frame message data';
      } else {
        // For now, we'll do basic validation
        // In production, you might want to add more robust validation
        isValid = true;
      }
    } catch (validationError) {
      console.error('Frame validation error:', validationError);
      errorMessage = 'Frame validation failed';
    }

    return new Response(
      JSON.stringify({
        valid: isValid,
        message: errorMessage || undefined
      }),
      {
        status: isValid ? 200 : 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        message: error instanceof Error ? error.message : 'Invalid frame request'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
} 
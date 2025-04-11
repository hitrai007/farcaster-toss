import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-toss.vercel.app';

interface ValidationResult {
  url: string;
  status?: number;
  ok: boolean;
  contentType?: string | null;
  error?: string;
}

type FrameMetadataKey = 
  | 'fc:frame'
  | 'fc:frame:image'
  | 'fc:frame:button:1'
  | 'fc:frame:input:text'
  | 'fc:frame:post_url'
  | 'fc:frame:image:aspect_ratio';

type FrameMetadata = {
  [K in FrameMetadataKey]: string;
};

async function validateUrl(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json,image/*',
      },
      cache: 'no-store',
    });
    
    return {
      url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    console.error('Error validating URL:', url, error);
    return {
      url,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      ok: false,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // URLs to validate
    const urlsToCheck = [
      APP_URL,
      `${APP_URL}/api/frame`,
      `${APP_URL}/api/frame?type=image`,
      `${APP_URL}/favicon.ico`,
      `${APP_URL}/coin-toss-frame.png`,
    ];

    // Frame metadata to validate
    const frameMetadata: FrameMetadata = {
      'fc:frame': 'vNext',
      'fc:frame:image': `${APP_URL}/api/frame`,
      'fc:frame:button:1': 'Flip Coin',
      'fc:frame:input:text': 'Place your bet (in ETH)',
      'fc:frame:post_url': `${APP_URL}/api/frame`,
      'fc:frame:image:aspect_ratio': '1.91:1',
    };

    // Check all URLs
    const results = await Promise.all(urlsToCheck.map(validateUrl));

    const requiredFields: FrameMetadataKey[] = [
      'fc:frame',
      'fc:frame:image',
      'fc:frame:button:1',
      'fc:frame:post_url',
    ];

    // Validate frame metadata
    const metadataValidation = {
      hasRequiredFields: true,
      missingFields: [] as FrameMetadataKey[],
      requiredFields,
    };

    // Check for required fields
    for (const field of metadataValidation.requiredFields) {
      if (!frameMetadata[field]) {
        metadataValidation.hasRequiredFields = false;
        metadataValidation.missingFields.push(field);
      }
    }

    return new NextResponse(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        urlValidation: results,
        metadataValidation,
        frameMetadata,
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
  } catch (error) {
    console.error('Validation error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
} 
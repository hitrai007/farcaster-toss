import { NextRequest, NextResponse } from 'next/server';
import { Message, FrameActionBody, validateMessage } from '@farcaster/core';
import { hexToBytes } from 'viem';

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
    
    // Validate the frame message
    let isValid = false;
    let errorMessage = '';
    
    try {
      // Convert the hex string to bytes for message validation
      const messageBytes = Message.decode(hexToBytes(body.trustedData.messageBytes));
      
      // Validate the message
      const result = await validateMessage(messageBytes);
      
      if (result.isOk()) {
        const message = result.value;
        
        // Validate frame action
        const frameActionBody = message.data.frameActionBody as FrameActionBody;
        
        // Additional validation specific to your frame
        // 1. Validate the frame URL matches your app
        const validUrl = frameActionBody.url.startsWith(APP_URL);
        
        // 2. Validate button index is within range (1-4)
        const validButton = frameActionBody.buttonIndex >= 1 && frameActionBody.buttonIndex <= 4;
        
        // 3. Check if input text is present when required
        const hasRequiredInput = frameActionBody.inputText !== undefined;
        
        isValid = validUrl && validButton && hasRequiredInput;
        
        if (!validUrl) errorMessage = 'Invalid frame URL';
        else if (!validButton) errorMessage = 'Invalid button index';
        else if (!hasRequiredInput) errorMessage = 'Missing required input';
      } else {
        errorMessage = 'Invalid message signature';
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
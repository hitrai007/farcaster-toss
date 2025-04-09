import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { untrustedData } = body;
    const { buttonIndex } = untrustedData;

    // Generate a random result (0 for heads, 1 for tails)
    const result = Math.floor(Math.random() * 2);
    const userChoice = buttonIndex === 1 ? 0 : 1; // Button 1 is Heads (0), Button 2 is Tails (1)
    const isWin = result === userChoice;

    // Create the response frame
    const frameResponse = {
      image: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?result=${result}&win=${isWin}`,
      buttons: [
        {
          label: "Play Again",
          action: "post"
        }
      ],
      post_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`
    };

    return NextResponse.json(frameResponse);
  } catch (error) {
    console.error('Frame processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process frame' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return the initial frame state
  return NextResponse.json({
    image: `${process.env.NEXT_PUBLIC_APP_URL}/coin-toss-frame.png`,
    buttons: [
      {
        label: "Heads",
        action: "post"
      },
      {
        label: "Tails",
        action: "post"
      }
    ],
    post_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`
  });
} 
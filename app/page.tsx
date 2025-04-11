export default function Home() {
  return (
    <>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${process.env.NEXT_PUBLIC_APP_URL}/api/frame`} />
        <meta property="fc:frame:button:1" content="Flip Coin" />
        <meta property="fc:frame:input:text" content="Place your bet (in ETH)" />
        <meta property="fc:frame:post_url" content={`${process.env.NEXT_PUBLIC_APP_URL}/api/frame`} />
        <meta property="fc:frame:state" content="initial" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL}/api/frame`} />
        <meta property="og:title" content="Coin Toss Game" />
        <meta property="og:description" content="A simple coin toss betting game on Farcaster" />
      </head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold mb-4">Coin Toss Game</h1>
          <p className="text-xl mb-8">A simple coin toss betting game on Farcaster</p>
          <p className="text-lg">
            Share this URL on Farcaster to play: {process.env.NEXT_PUBLIC_APP_URL}
          </p>
        </div>
      </main>
    </>
  );
} 
export default function FrameImage() {
  return (
    <div
      style={{
        display: 'flex',
        background: '#f6f6f6',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '60px',
            background: 'linear-gradient(to right, #000000, #434343)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem',
          }}
        >
          Coin Toss Game
        </h1>
        <p
          style={{
            fontSize: '30px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          Place your bet and flip the coin!
        </p>
      </div>
    </div>
  );
} 
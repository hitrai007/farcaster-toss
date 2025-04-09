declare module '@vercel/og' {
  export class ImageResponse extends Response {
    constructor(element: JSX.Element, options?: { width?: number; height?: number });
  }
} 
declare module '@coinbase/onchainkit/frame' {
  export interface FrameRequest {
    untrustedData: {
      fid: number;
      buttonIndex: number;
      castId: { fid: number; hash: string };
      inputText?: string;
      timestamp: number;
    };
    trustedData?: {
      messageBytes: string;
    };
  }

  export function getFrameMessage(
    request: FrameRequest,
    options?: { neynarApiKey?: string }
  ): Promise<{ isValid: boolean; message: any }>;

  export function getFrameHtmlResponse(options: {
    buttons?: Array<{ label: string; action?: string }>;
    image: string;
    post_url: string;
  }): string;
} 
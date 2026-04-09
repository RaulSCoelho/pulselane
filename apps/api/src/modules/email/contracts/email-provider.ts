export type EmailProviderSendInput = {
  fromName: string;
  fromAddress: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailProviderSendResult = {
  provider: string;
  providerMessageId?: string | null;
};

export interface EmailProvider {
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
}

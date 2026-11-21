export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * Local development SMS provider that prints the 6-digit OTP
 * in the terminal window running the Next.js server.
 */
export class ConsoleMockSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    const border = "=".repeat(56);
    console.info(
      `\n${border}\n[SHASTHYO SHEBA MOCK SMS]\nTo:   ${phone}\nOTP:  ${code}  (expires in 5 minutes)\n${border}\n`
    );
  }
}

export const smsProvider: SmsProvider = new ConsoleMockSmsProvider();

import { describe, expect, it, vi } from "vitest";
import {
  generateSixDigitOtp,
  OTP_EXPIRY_MS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RATE_LIMIT_WINDOW_MS,
} from "./otp";
import { ConsoleMockSmsProvider } from "@/lib/sms/sms-provider";

describe("OTP business rules", () => {
  it("generates a 6-digit numeric OTP code", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSixDigitOtp();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("enforces 5-minute expiry and max 5 sends per hour constants", () => {
    expect(OTP_EXPIRY_MS).toBe(5 * 60 * 1000);
    expect(OTP_RATE_LIMIT_WINDOW_MS).toBe(60 * 60 * 1000);
    expect(OTP_MAX_SENDS_PER_HOUR).toBe(5);
  });

  it("prints OTP to console via ConsoleMockSmsProvider", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = new ConsoleMockSmsProvider();

    await provider.sendOtp("+8801711111111", "123456");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toContain("+8801711111111");
    expect(spy.mock.calls[0]?.[0]).toContain("123456");
    spy.mockRestore();
  });
});

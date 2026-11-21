import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface PaymentRequest {
  appointmentId: string;
  amountBdt: number;
  method: PaymentMethod;
  patientPhone: string;
}

export interface PaymentResult {
  success: boolean;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt: Date | null;
  gatewayName: string;
}

/**
 * PaymentProvider interface designed so bKash, Nagad, or SSLCommerz adapters
 * can be plugged in later without touching booking or appointment logic.
 */
export interface PaymentProvider {
  processPayment(req: PaymentRequest): Promise<PaymentResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const suffix = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (req.method === "MOCK_ONLINE") {
      const paidAt = new Date();
      const transactionRef = `MOCK-PAY-${suffix}`;
      console.info(
        `[SHASTHYO SHEBA MOCK PAYMENT] Online payment PAID | appt=${req.appointmentId} | amount=৳${req.amountBdt} | ref=${transactionRef}`
      );
      return {
        success: true,
        method: "MOCK_ONLINE",
        status: "PAID",
        transactionRef,
        paidAt,
        gatewayName: "ShasthyoShebaMockGateway (bKash/Nagad/SSLCommerz Ready)",
      };
    }

    const transactionRef = `CASH-CLINIC-${suffix}`;
    console.info(
      `[SHASTHYO SHEBA MOCK PAYMENT] Pay at clinic selected | appt=${req.appointmentId} | amount=৳${req.amountBdt} | ref=${transactionRef}`
    );
    return {
      success: true,
      method: "CASH_AT_CLINIC",
      status: "PENDING",
      transactionRef,
      paidAt: null,
      gatewayName: "PayAtClinic",
    };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();

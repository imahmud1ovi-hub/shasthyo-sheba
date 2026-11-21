import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  paymentProvider,
  PaymentProvider,
} from "@/lib/payments/payment-provider";
import { notificationProvider } from "@/lib/notifications/notification-provider";

export class PaymentError extends Error {
  public readonly code:
    | "APPOINTMENT_NOT_FOUND"
    | "FORBIDDEN"
    | "ALREADY_PAID"
    | "APPOINTMENT_CANCELLED";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: PaymentError["code"],
    statusCode = 400
  ) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const payAppointmentSchema = z.object({
  method: z.enum(["CASH_AT_CLINIC", "MOCK_ONLINE"]).default("MOCK_ONLINE"),
});

export async function payForAppointment(params: {
  actorUserId: string;
  actorRole: "PATIENT" | "DOCTOR" | "ADMIN";
  appointmentId: string;
  rawInput: unknown;
  provider?: PaymentProvider;
}) {
  const {
    actorUserId,
    actorRole,
    appointmentId,
    rawInput,
    provider = paymentProvider,
  } = params;

  const { method } = payAppointmentSchema.parse(rawInput);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: { user: true },
      },
      doctor: true,
      payment: true,
    },
  });

  if (!appointment) {
    throw new PaymentError(
      "Appointment not found.",
      "APPOINTMENT_NOT_FOUND",
      404
    );
  }

  if (actorRole !== "ADMIN" && appointment.patient.userId !== actorUserId) {
    throw new PaymentError(
      "You can only pay for your own appointment.",
      "FORBIDDEN",
      403
    );
  }

  if (appointment.status === "CANCELLED") {
    throw new PaymentError(
      "Cannot pay for a cancelled appointment.",
      "APPOINTMENT_CANCELLED",
      400
    );
  }

  if (appointment.payment?.status === "PAID") {
    throw new PaymentError(
      "This appointment has already been paid.",
      "ALREADY_PAID",
      409
    );
  }

  const paymentResult = await provider.processPayment({
    appointmentId: appointment.id,
    amountBdt: appointment.feeBdt,
    method,
    patientPhone: appointment.patient.user.phone,
  });

  const updatedPayment = await prisma.payment.upsert({
    where: { appointmentId: appointment.id },
    create: {
      appointmentId: appointment.id,
      amountBdt: appointment.feeBdt,
      method: paymentResult.method,
      status: paymentResult.status,
      transactionRef: paymentResult.transactionRef,
      paidAt: paymentResult.paidAt,
    },
    update: {
      method: paymentResult.method,
      status: paymentResult.status,
      transactionRef: paymentResult.transactionRef,
      paidAt: paymentResult.paidAt,
    },
  });

  if (paymentResult.status === "PAID") {
    await notificationProvider.send({
      userId: appointment.patient.userId,
      titleEn: `Payment Received (৳${appointment.feeBdt})`,
      titleBn: `পেমেন্ট সম্পন্ন হয়েছে (৳${appointment.feeBdt})`,
      messageEn: `Mock online payment of ৳${appointment.feeBdt} for Serial #${appointment.serialNumber} with ${appointment.doctor.titleEn} succeeded (Ref: ${paymentResult.transactionRef}).`,
      messageBn: `${appointment.doctor.titleBn}-এর সাথে সিরিয়াল #${appointment.serialNumber}-এর জন্য ৳${appointment.feeBdt} মক অনলাইন পেমেন্ট সফল হয়েছে (রেফারেন্স: ${paymentResult.transactionRef})।`,
    });
  }

  return updatedPayment;
}

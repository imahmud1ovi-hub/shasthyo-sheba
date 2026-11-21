import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export class ReviewError extends Error {
  public readonly code:
    | "APPOINTMENT_NOT_FOUND"
    | "FORBIDDEN"
    | "APPOINTMENT_NOT_COMPLETED"
    | "ALREADY_REVIEWED";
  public readonly statusCode: number;

  constructor(
    message: string,
    code: ReviewError["code"],
    statusCode = 400
  ) {
    super(message);
    this.name = "ReviewError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const submitReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5 stars.")
    .max(5, "Rating must be between 1 and 5 stars."),
  comment: z.string().trim().max(600).optional(),
});

/**
 * Creates a review for a COMPLETED appointment (strictly one review per appointment)
 * and atomically recalculates the doctor's averageRating and reviewCount.
 */
export async function submitAppointmentReview(params: {
  actorUserId: string;
  actorRole: "PATIENT" | "DOCTOR" | "ADMIN";
  appointmentId: string;
  rawInput: unknown;
}) {
  const { actorUserId, actorRole, appointmentId, rawInput } = params;
  const input = submitReviewSchema.parse(rawInput);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      review: true,
    },
  });

  if (!appointment) {
    throw new ReviewError(
      "Appointment not found.",
      "APPOINTMENT_NOT_FOUND",
      404
    );
  }

  if (actorRole !== "ADMIN" && appointment.patient.userId !== actorUserId) {
    throw new ReviewError(
      "You can only review your own completed appointments.",
      "FORBIDDEN",
      403
    );
  }

  if (appointment.status !== "COMPLETED") {
    throw new ReviewError(
      "You can only review a doctor after a COMPLETED appointment.",
      "APPOINTMENT_NOT_COMPLETED",
      400
    );
  }

  if (appointment.review) {
    throw new ReviewError(
      "A review has already been submitted for this appointment.",
      "ALREADY_REVIEWED",
      409
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          rating: input.rating,
          comment: input.comment || null,
        },
      });

      const agg = await tx.review.aggregate({
        where: { doctorId: appointment.doctorId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const reviewCount = agg._count.rating;
      const rawAvg = agg._avg.rating ?? input.rating;
      const averageRating = Math.round(rawAvg * 10) / 10;

      const updatedDoctor = await tx.doctorProfile.update({
        where: { id: appointment.doctorId },
        data: {
          averageRating,
          reviewCount,
        },
      });

      return {
        review,
        doctorStats: {
          averageRating: updatedDoctor.averageRating,
          reviewCount: updatedDoctor.reviewCount,
        },
      };
    });
  } catch (err) {
    if (err instanceof ReviewError) {
      throw err;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ReviewError(
        "A review has already been submitted for this appointment.",
        "ALREADY_REVIEWED",
        409
      );
    }
    throw err;
  }
}

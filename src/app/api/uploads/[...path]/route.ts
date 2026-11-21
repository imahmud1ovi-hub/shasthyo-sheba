import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { apiError, handleApiError } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit/audit-log";
import { resolveSafeUploadPath } from "@/lib/uploads/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("UNAUTHENTICATED", "Authentication required.", 401);
    }

    const relativePath = (context.params.path ?? []).join("/");
    const { fullPath, mimeType } = resolveSafeUploadPath(relativePath);

    if (relativePath.startsWith("bmdc/")) {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { bmdcDocumentPath: relativePath },
      });

      if (!doctor) {
        return apiError("NOT_FOUND", "Document not found.", 404);
      }

      if (session.role !== "ADMIN" && doctor.userId !== session.userId) {
        return apiError("FORBIDDEN", "Access denied.", 403);
      }

      if (session.role === "ADMIN") {
        await recordAuditLog({
          actorUserId: session.userId,
          targetUserId: doctor.userId,
          action: "VIEW_BMDC_DOCUMENT",
          entityType: "DoctorProfile",
          entityId: doctor.id,
          details: `Viewed BM&DC document ${relativePath}`,
        });
      }
    } else if (relativePath.startsWith("prescriptions/")) {
      const appointment = await prisma.appointment.findFirst({
        where: { prescriptionPath: relativePath },
        include: {
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        return apiError("NOT_FOUND", "Prescription not found.", 404);
      }

      const isOwningPatient = appointment.patient.userId === session.userId;
      const isOwningDoctor = appointment.doctor.userId === session.userId;
      const isAdmin = session.role === "ADMIN";

      if (!isOwningPatient && !isOwningDoctor && !isAdmin) {
        return apiError("FORBIDDEN", "Access denied to patient prescription.", 403);
      }

      if (isOwningDoctor || isAdmin) {
        await recordAuditLog({
          actorUserId: session.userId,
          targetUserId: appointment.patient.userId,
          action: "VIEW_PRESCRIPTION",
          entityType: "Appointment",
          entityId: appointment.id,
          details: `Accessed prescription file ${relativePath}`,
        });
      }
    }

    const fileBuffer = await fs.readFile(fullPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

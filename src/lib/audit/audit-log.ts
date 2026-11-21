import { prisma } from "@/lib/db/prisma";

export interface AuditLogInput {
  actorUserId: string;
  targetUserId?: string | null;
  action:
    | "VIEW_PATIENT_APPOINTMENTS"
    | "VIEW_PATIENT_RECORD"
    | "UPDATE_APPOINTMENT_STATUS"
    | "UPDATE_DOCTOR_NOTES"
    | "UPLOAD_PRESCRIPTION"
    | "VIEW_PRESCRIPTION"
    | "APPROVE_DOCTOR"
    | "REJECT_DOCTOR"
    | "VIEW_BMDC_DOCUMENT";
  entityType: "Appointment" | "PatientProfile" | "DoctorProfile";
  entityId: string;
  details?: string;
}

/**
 * Writes an immutable audit log entry whenever a doctor or admin accesses
 * or modifies patient records or doctor verification status.
 */
export async function recordAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details ?? null,
    },
  });
}

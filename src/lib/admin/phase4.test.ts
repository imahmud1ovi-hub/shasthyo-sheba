import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  doctorAttachPrescription,
  doctorUpdateAppointment,
  registerDoctorApplication,
} from "@/lib/doctors/manage";
import { reviewDoctorRegistration } from "@/lib/admin/manage";
import { searchApprovedDoctors } from "@/lib/doctors/search";
import { getOrGenerateSlotsForChamberDate } from "@/lib/booking/slots";
import { bookAppointment } from "@/lib/booking/appointments";
import { resolveSafeUploadPath, UploadValidationError } from "@/lib/uploads/storage";

describe("Upload path security validation", () => {
  it("allows valid bmdc/ and prescriptions/ relative paths and blocks traversal", () => {
    const valid = resolveSafeUploadPath("bmdc/sample-cert.pdf");
    expect(valid.mimeType).toBe("application/pdf");

    expect(() => resolveSafeUploadPath("../.env")).toThrow(
      UploadValidationError
    );
    expect(() => resolveSafeUploadPath("bmdc/../../secret.txt")).toThrow(
      UploadValidationError
    );
  });
});

describe("Phase 4 lifecycle: doctor registration -> admin approval -> public search -> appointment management & AuditLog", () => {
  it("registers a PENDING doctor, hides from search until ADMIN approves, then manages appointment with AuditLog", async () => {
    const testDocPhone = "+8801799990044";
    const testPatPhone = "+8801799990045";
    const testBmdc = "A-99044";
    const testDateStr = "2027-07-20";

    const [adminUser, specialty, clinic] = await Promise.all([
      prisma.user.findUnique({ where: { phone: "+8801700000000" } }),
      prisma.specialty.findFirst(),
      prisma.clinic.findFirst(),
    ]);

    expect(adminUser).not.toBeNull();
    expect(specialty).not.toBeNull();
    expect(clinic).not.toBeNull();

    const [docUser, patUser] = await Promise.all([
      prisma.user.upsert({
        where: { phone: testDocPhone },
        update: {},
        create: {
          phone: testDocPhone,
          role: "PATIENT",
        },
      }),
      prisma.user.upsert({
        where: { phone: testPatPhone },
        update: {},
        create: {
          phone: testPatPhone,
          role: "PATIENT",
          patientProfile: { create: {} },
        },
      }),
    ]);

    try {
      // 1. Register doctor application -> status is PENDING
      const { doctorProfile } = await registerDoctorApplication({
        userId: docUser.id,
        input: {
          bmdcNumber: testBmdc,
          gender: "FEMALE",
          titleEn: "Dr. Samira Karim",
          titleBn: "ডা. সামিরা করিম",
          qualificationsEn: "MBBS (DMC), FCPS",
          qualificationsBn: "এমবিবিএস (ডিএমসি), এফসিপিএস",
          experienceYears: 7,
          specialtyId: specialty!.id,
          clinicId: clinic!.id,
          feeBdt: 750,
          roomNumber: "Room 404",
        },
        bmdcDocumentPath: "bmdc/test-cert-99044.pdf",
      });

      expect(doctorProfile.status).toBe("PENDING");

      // 2. Pending doctor must NOT appear in public search
      const searchBeforeApproval = await searchApprovedDoctors({
        q: testBmdc,
      });
      expect(searchBeforeApproval.pagination.total).toBe(0);

      // 3. Admin approves the doctor
      const approved = await reviewDoctorRegistration({
        adminUserId: adminUser!.id,
        doctorProfileId: doctorProfile.id,
        rawInput: { status: "APPROVED" },
      });
      expect(approved.status).toBe("APPROVED");

      // 4. Approved doctor MUST now appear in public search
      const searchAfterApproval = await searchApprovedDoctors({
        q: testBmdc,
      });
      expect(searchAfterApproval.pagination.total).toBe(1);
      expect(searchAfterApproval.items[0]?.bmdcNumber).toBe(testBmdc);

      // 5. Patient books a slot with the newly approved doctor
      const chamber = await prisma.chamber.findFirst({
        where: { doctorId: doctorProfile.id },
      });
      expect(chamber).not.toBeNull();

      const generated = await getOrGenerateSlotsForChamberDate(
        chamber!.id,
        testDateStr
      );
      expect(generated.slots.length).toBeGreaterThan(0);

      const appointment = await bookAppointment({
        patientUserId: patUser.id,
        slotId: generated.slots[0].id,
        symptoms: "Migraine and dizziness",
      });

      // 6. Doctor marks appointment COMPLETED, saves notes, and attaches prescription
      const updatedAppt = await doctorUpdateAppointment({
        actorUserId: docUser.id,
        actorRole: "DOCTOR",
        appointmentId: appointment.id,
        rawInput: {
          status: "COMPLETED",
          doctorNotes: "BP 120/80, advised rest and hydration.",
        },
      });
      expect(updatedAppt.status).toBe("COMPLETED");
      expect(updatedAppt.doctorNotes).toContain("BP 120/80");

      const withRx = await doctorAttachPrescription({
        actorUserId: docUser.id,
        actorRole: "DOCTOR",
        appointmentId: appointment.id,
        prescriptionPath: "prescriptions/test-rx-99044.pdf",
      });
      expect(withRx.prescriptionPath).toBe("prescriptions/test-rx-99044.pdf");

      // 7. Verify AuditLog entries were written for approval, status update, notes, and prescription
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { entityId: doctorProfile.id },
            { entityId: appointment.id },
          ],
        },
      });
      const actions = logs.map((l) => l.action);
      expect(actions).toContain("APPROVE_DOCTOR");
      expect(actions).toContain("UPDATE_APPOINTMENT_STATUS");
      expect(actions).toContain("UPDATE_DOCTOR_NOTES");
      expect(actions).toContain("UPLOAD_PRESCRIPTION");
    } finally {
      // Clean up temporary test records
      await prisma.auditLog.deleteMany({
        where: {
          actorUserId: { in: [docUser.id, patUser.id] },
        },
      });
      await prisma.auditLog.deleteMany({
        where: {
          targetUserId: { in: [docUser.id, patUser.id] },
        },
      });
      await prisma.user.deleteMany({
        where: {
          phone: { in: [testDocPhone, testPatPhone] },
        },
      });
    }
  });
});

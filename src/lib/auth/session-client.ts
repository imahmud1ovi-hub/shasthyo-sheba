export type AppRole = "PATIENT" | "DOCTOR" | "ADMIN";

export function getDashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "PATIENT":
    default:
      return "/patient/dashboard";
  }
}

export type Lang = "en" | "bn";

export const translations = {
  en: {
    brand: "Shasthyo Sheba",
    brandSub: "স্বাস্থ্য সেবা",
    toggleBtn: "বাংলা",
    navHome: "Home",
    navLogin: "Login",
    navDashboard: "Dashboard",
    navLogout: "Logout",
    roleBadge: {
      PATIENT: "Patient",
      DOCTOR: "Doctor",
      ADMIN: "Admin",
    },
    home: {
      badge: "100% Free • Local Bangladesh Healthcare Platform",
      headline: "Find Verified Doctors & Book Chamber Serials in Bangladesh",
      subheadline:
        "Search BM&DC-verified specialists across Dhaka, Chattogram, and Sylhet and book your chamber serial.",
      ctaLogin: "Login with Mobile OTP",
      ctaDashboard: "Go to My Dashboard",
      cards: [
        {
          title: "For Patients",
          desc: "Search BM&DC-verified specialists by city and fee (৳), and book your chamber serial.",
        },
        {
          title: "For Doctors",
          desc: "Manage chamber schedules, slot duration, blocked dates, and daily patient serials.",
        },
        {
          title: "For Admins",
          desc: "Verify doctor BM&DC registrations, manage clinics & specialties, and audit access logs.",
        },
      ],
      demoAccountsTitle: "Seeded Demo Accounts (OTP prints in server terminal)",
      demoAdmin: "Admin: 01700000000",
      demoPatient: "Patient: 01711111111",
      demoDoctor: "Doctors: 01712000001 to 01712000020",
    },
    login: {
      title: "Mobile OTP Login",
      subtitle:
        "Enter your Bangladesh mobile number. A 6-digit OTP will be printed in the terminal running the app.",
      phoneLabel: "Mobile Number",
      phonePlaceholder: "01711111111 or +8801711111111",
      sendOtpBtn: "Send 6-Digit OTP",
      sendingOtp: "Sending OTP...",
      otpLabel: "6-Digit OTP Code",
      otpPlaceholder: "Enter 6-digit code from terminal",
      verifyOtpBtn: "Verify & Sign In",
      verifyingOtp: "Verifying...",
      changePhoneBtn: "Use a different number",
      otpSentNotice:
        "OTP sent to {phone}. Check the terminal window running Shasthyo Sheba.",
      quickFillTitle: "Quick Fill Demo Numbers:",
    },
    unauthorized: {
      title: "Unauthorized Access (403)",
      message:
        "You do not have permission to view this page with your current account role.",
      backToDashboard: "Go to My Dashboard",
      backHome: "Back to Home",
    },
    dashboards: {
      patientTitle: "Patient Dashboard",
      patientSubtitle:
        "View your upcoming chamber serials, past visits, and profile.",
      doctorTitle: "Doctor Dashboard",
      doctorSubtitle:
        "Manage your chamber schedule, slot availability, and today's patient serials.",
      adminTitle: "Admin Dashboard",
      adminSubtitle:
        "Verify BM&DC doctor registrations, manage clinics & specialties, and inspect audit logs.",
      upcomingAppointments: "Upcoming Chamber Appointments",
      noAppointments: "No appointments found.",
      serialLabel: "Serial #",
      feeLabel: "Fee",
      statusLabel: "Status",
      clinicLabel: "Clinic / Chamber",
      dateTimeLabel: "Date & Time",
      bmdcLabel: "BM&DC Registration",
      specialtyLabel: "Primary Specialty",
      chambersTitle: "Assigned Chambers",
      adminStatsDoctors: "Approved Doctors",
      adminStatsClinics: "Partner Clinics",
      adminStatsSpecialties: "Specialties",
      adminStatsAppointments: "Total Appointments",
      adminQuickLinks: "Admin Role Cross-Access (Permitted by RBAC)",
      viewPatientArea: "Open Patient Dashboard",
      viewDoctorArea: "Open Doctor Dashboard",
    },
  },
  bn: {
    brand: "স্বাস্থ্য সেবা",
    brandSub: "Shasthyo Sheba",
    toggleBtn: "English",
    navHome: "হোম",
    navLogin: "লগইন",
    navDashboard: "ড্যাশবোর্ড",
    navLogout: "লগআউট",
    roleBadge: {
      PATIENT: "রোগী",
      DOCTOR: "ডাক্তার",
      ADMIN: "অ্যাডমিন",
    },
    home: {
      badge: "১০০% ফ্রি • বাংলাদেশ স্বাস্থ্যসেবা ও সিরিয়াল বুকিং প্ল্যাটফর্ম",
      headline: "যাচাইকৃত ডাক্তার খুঁজুন এবং চেম্বার সিরিয়াল বুক করুন",
      subheadline:
        "ঢাকা, চট্টগ্রাম ও সিলেট জুড়ে বিএমএন্ডডিসি যাচাইকৃত বিশেষজ্ঞ ডাক্তারদের চেম্বার অ্যাপয়েন্টমেন্ট বুকিং।",
      ctaLogin: "মোবাইল ওটিপি দিয়ে লগইন করুন",
      ctaDashboard: "আমার ড্যাশবোর্ডে যান",
      cards: [
        {
          title: "রোগীদের জন্য",
          desc: "শহর, বিভাগ ও ফি (৳) অনুযায়ী বিশেষজ্ঞ ডাক্তার খুঁজুন এবং সহজেই চেম্বার সিরিয়াল নিন।",
        },
        {
          title: "ডাক্তারদের জন্য",
          desc: "চেম্বারের সময়সূচি, স্লট ডিউরেশন, ছুটির দিন এবং প্রতিদিনের রোগীর সিরিয়াল পরিচালনা করুন।",
        },
        {
          title: "অ্যাডমিনদের জন্য",
          desc: "ডাক্তারদের বিএমএন্ডডিসি নিবন্ধন যাচাই, ক্লিনিক ও বিভাগ ব্যবস্থাপনা এবং অডিট লগ পর্যবেক্ষণ।",
        },
      ],
      demoAccountsTitle: "ডেমো অ্যাকাউন্ট নম্বর (ওটিপি টার্মিনালে দেখা যাবে)",
      demoAdmin: "অ্যাডমিন: 01700000000",
      demoPatient: "রোগী: 01711111111",
      demoDoctor: "ডাক্তার: 01712000001 থেকে 01712000020",
    },
    login: {
      title: "মোবাইল ওটিপি লগইন",
      subtitle:
        "আপনার বাংলাদেশি মোবাইল নম্বর দিন। অ্যাপটি যে টার্মিনালে চলছে সেখানে ৬ সংখ্যার ওটিপি কোড দেখা যাবে।",
      phoneLabel: "মোবাইল নম্বর",
      phonePlaceholder: "01711111111 অথবা +8801711111111",
      sendOtpBtn: "৬ সংখ্যার ওটিপি পাঠান",
      sendingOtp: "ওটিপি পাঠানো হচ্ছে...",
      otpLabel: "৬ সংখ্যার ওটিপি কোড",
      otpPlaceholder: "টার্মিনাল থেকে ওটিপি কোডটি লিখুন",
      verifyOtpBtn: "যাচাই করুন ও লগইন করুন",
      verifyingOtp: "যাচাই করা হচ্ছে...",
      changePhoneBtn: "অন্য নম্বর ব্যবহার করুন",
      otpSentNotice:
        "{phone} নম্বরে ওটিপি পাঠানো হয়েছে। অ্যাপের টার্মিনাল উইন্ডো দেখুন।",
      quickFillTitle: "দ্রুত ডেমো নম্বর নির্বাচন করুন:",
    },
    unauthorized: {
      title: "অননুমোদিত প্রবেশ (৪০৩)",
      message:
        "আপনার বর্তমান অ্যাকাউন্ট রোলের জন্য এই পেজটি দেখার অনুমতি নেই।",
      backToDashboard: "আমার ড্যাশবোর্ডে ফিরে যান",
      backHome: "হোম পেজে ফিরে যান",
    },
    dashboards: {
      patientTitle: "রোগীর ড্যাশবোর্ড",
      patientSubtitle:
        "আপনার আসন্ন চেম্বার সিরিয়াল, পূর্ববর্তী ভিজিট এবং প্রোফাইল দেখুন।",
      doctorTitle: "ডাক্তার ড্যাশবোর্ড",
      doctorSubtitle:
        "আপনার চেম্বারের সময়সূচি, স্লট এবং আজকের রোগীর সিরিয়াল পরিচালনা করুন।",
      adminTitle: "অ্যাডমিন ড্যাশবোর্ড",
      adminSubtitle:
        "ডাক্তারদের বিএমএন্ডডিসি যাচাই, ক্লিনিক ও বিভাগ ব্যবস্থাপনা এবং অডিট লগ পর্যবেক্ষণ করুন।",
      upcomingAppointments: "আসন্ন চেম্বার অ্যাপয়েন্টমেন্ট",
      noAppointments: "কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।",
      serialLabel: "সিরিয়াল #",
      feeLabel: "ফি",
      statusLabel: "অবস্থা",
      clinicLabel: "ক্লিনিক / চেম্বার",
      dateTimeLabel: "তারিখ ও সময়",
      bmdcLabel: "বিএমএন্ডডিসি নম্বর",
      specialtyLabel: "প্রধান বিশেষজ্ঞ বিভাগ",
      chambersTitle: "নির্ধারিত চেম্বারসমূহ",
      adminStatsDoctors: "অনুমোদিত ডাক্তার",
      adminStatsClinics: "যুক্ত ক্লিনিক",
      adminStatsSpecialties: "বিশেষজ্ঞ বিভাগ",
      adminStatsAppointments: "মোট অ্যাপয়েন্টমেন্ট",
      adminQuickLinks: "অ্যাডমিন ক্রস-অ্যাক্সেস (RBAC দ্বারা অনুমোদিত)",
      viewPatientArea: "রোগীর ড্যাশবোর্ড দেখুন",
      viewDoctorArea: "ডাক্তার ড্যাশবোর্ড দেখুন",
    },
  },
} as const;

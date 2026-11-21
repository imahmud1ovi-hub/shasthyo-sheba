import { PrismaClient, Gender } from "@prisma/client";

const prisma = new PrismaClient();

const SPECIALTIES = [
  {
    slug: "cardiology",
    nameEn: "Cardiology",
    nameBn: "হৃদরোগ বিশেষজ্ঞ (কার্ডিওলজি)",
    descriptionEn: "Heart, blood vessel, and cardiovascular care.",
    descriptionBn: "হৃদযন্ত্র ও রক্তনালীর রোগ নির্ণয় ও চিকিৎসা।",
  },
  {
    slug: "internal-medicine",
    nameEn: "Internal Medicine",
    nameBn: "মেডিসিন বিশেষজ্ঞ (ইন্টারনাল মেডিসিন)",
    descriptionEn: "Comprehensive adult medicine and chronic condition care.",
    descriptionBn: "প্রাপ্তবয়স্কদের সাধারণ ও দীর্ঘমেয়াদী রোগের চিকিৎসা।",
  },
  {
    slug: "gynecology-obstetrics",
    nameEn: "Gynecology & Obstetrics",
    nameBn: "স্ত্রীরোগ ও প্রসূতিবিদ্যা (গাইনি ও অবস)",
    descriptionEn: "Women's reproductive health, pregnancy, and childbirth.",
    descriptionBn: "নারীদের প্রজনন স্বাস্থ্য, গর্ভকালীন ও প্রসূতি সেবা।",
  },
  {
    slug: "pediatrics",
    nameEn: "Pediatrics",
    nameBn: "শিশুরোগ বিশেষজ্ঞ (পেডিয়াট্রিক্স)",
    descriptionEn: "Medical care for infants, children, and adolescents.",
    descriptionBn: "নবজাতক, শিশু ও কিশোরদের স্বাস্থ্যসেবা।",
  },
  {
    slug: "orthopedics",
    nameEn: "Orthopedics",
    nameBn: "হাড় ও জয়েন্ট বিশেষজ্ঞ (অর্থোপেডিক্স)",
    descriptionEn: "Bone, joint, ligament, and spine care.",
    descriptionBn: "হাড়, জয়েন্ট, মেরুদণ্ড ও বাত-ব্যথার চিকিৎসা।",
  },
] as const;

const CLINICS = [
  {
    nameEn: "Square Hospitals Ltd.",
    nameBn: "স্কয়ার হাসপাতাল লিমিটেড",
    cityEn: "Dhaka",
    cityBn: "ঢাকা",
    areaEn: "Panthapath",
    areaBn: "পান্থপথ",
    addressEn: "18/F, Bir Uttam Qazi Nuruzzaman Sarak, Panthapath, Dhaka 1205",
    addressBn: "১৮/এফ, বীর উত্তম কাজী নুরুজ্জামান সড়ক, পান্থপথ, ঢাকা ১২০৫",
    phone: "+8801713000101",
  },
  {
    nameEn: "Popular Diagnostic Centre (Dhanmondi)",
    nameBn: "পপুলার ডায়াগনস্টিক সেন্টার (ধানমন্ডি)",
    cityEn: "Dhaka",
    cityBn: "ঢাকা",
    areaEn: "Dhanmondi",
    areaBn: "ধানমন্ডি",
    addressEn: "House 16, Road 2, Dhanmondi R/A, Dhaka 1205",
    addressBn: "বাড়ি ১৬, রোড ২, ধানমন্ডি আ/এ, ঢাকা ১২০৫",
    phone: "+8801713000102",
  },
  {
    nameEn: "Ibn Sina Diagnostic & Imaging Center",
    nameBn: "ইবনে সিনা ডায়াগনস্টিক অ্যান্ড ইমেজিং সেন্টার",
    cityEn: "Dhaka",
    cityBn: "ঢাকা",
    areaEn: "Dhanmondi",
    areaBn: "ধানমন্ডি",
    addressEn: "House 48, Road 9/A, Satmasjid Road, Dhanmondi, Dhaka 1209",
    addressBn: "বাড়ি ৪৮, রোড ৯/এ, সাতমসজিদ রোড, ধানমন্ডি, ঢাকা ১২০৯",
    phone: "+8801713000103",
  },
  {
    nameEn: "Labaid Specialized Hospital",
    nameBn: "ল্যাবএইড স্পেশালাইজড হাসপাতাল",
    cityEn: "Dhaka",
    cityBn: "ঢাকা",
    areaEn: "Dhanmondi",
    areaBn: "ধানমন্ডি",
    addressEn: "House 06, Road 04, Dhanmondi, Dhaka 1205",
    addressBn: "বাড়ি ০৬, রোড ০৪, ধানমন্ডি, ঢাকা ১২০৫",
    phone: "+8801713000104",
  },
  {
    nameEn: "Chevron Clinical Laboratory (PTE) Ltd.",
    nameBn: "শেভরন ক্লিনিক্যাল ল্যাবরেটরি লিমিটেড",
    cityEn: "Chattogram",
    cityBn: "চট্টগ্রাম",
    areaEn: "Panchlaish",
    areaBn: "পাঁচলাইশ",
    addressEn: "12/12 O.R. Nizam Road, Panchlaish, Chattogram 4203",
    addressBn: "১২/১২ ও.আর. নিজাম রোড, পাঁচলাইশ, চট্টগ্রাম ৪২০৩",
    phone: "+8801713000201",
  },
  {
    nameEn: "Max Hospital & Diagnostic Ltd.",
    nameBn: "ম্যাক্স হাসপাতাল অ্যান্ড ডায়াগনস্টিক লিমিটেড",
    cityEn: "Chattogram",
    cityBn: "চট্টগ্রাম",
    areaEn: "Mehedibag",
    areaBn: "মেহেদীবাগ",
    addressEn: "35/36 Mehedibag Road, Chattogram 4000",
    addressBn: "৩৫/৩৬ মেহেদীবাগ রোড, চট্টগ্রাম ৪০০০",
    phone: "+8801713000202",
  },
  {
    nameEn: "Mount Adora Hospital",
    nameBn: "মাউন্ট এডোরা হাসপাতাল",
    cityEn: "Sylhet",
    cityBn: "সিলেট",
    areaEn: "Akhalia",
    areaBn: "আখালিয়া",
    addressEn: "Sylhet-Sunamganj Highway, Akhalia, Sylhet 3100",
    addressBn: "সিলেট-সুনামগঞ্জ মহাসড়ক, আখালিয়া, সিলেট ৩১০০",
    phone: "+8801713000301",
  },
] as const;

const DOCTOR_SEED: Array<{
  nameEn: string;
  nameBn: string;
  gender: Gender;
  qualEn: string;
  qualBn: string;
  exp: number;
  fee: number;
}> = [
  {
    nameEn: "Prof. Dr. Mahmudul Hasan",
    nameBn: "অধ্যাপক ডা. মাহমুদুল হাসান",
    gender: "MALE",
    qualEn: "MBBS (DMC), FCPS (Medicine), MD (Cardiology)",
    qualBn: "এমবিবিএস (ডিএমসি), এফসিপিএস (মেডিসিন), এমডি (কার্ডিওলজি)",
    exp: 18,
    fee: 1000,
  },
  {
    nameEn: "Dr. Farzana Rahman",
    nameBn: "ডা. ফারজানা রহমান",
    gender: "FEMALE",
    qualEn: "MBBS (SSMC), FCPS (Internal Medicine)",
    qualBn: "এমবিবিএস (এসএসএমসি), এফসিপিএস (ইন্টারনাল মেডিসিন)",
    exp: 11,
    fee: 800,
  },
  {
    nameEn: "Prof. Dr. Nasreen Akter",
    nameBn: "অধ্যাপক ডা. নাসরিন আক্তার",
    gender: "FEMALE",
    qualEn: "MBBS (DMC), FCPS (Obs & Gynae), MS",
    qualBn: "এমবিবিএস (ডিএমসি), এফসিপিএস (গাইনি ও অবস), এমএস",
    exp: 16,
    fee: 900,
  },
  {
    nameEn: "Dr. Tanvir Ahmed Chowdhury",
    nameBn: "ডা. তানভীর আহমেদ চৌধুরী",
    gender: "MALE",
    qualEn: "MBBS (CMC), DCH, MD (Pediatrics)",
    qualBn: "এমবিবিএস (সিএমসি), ডিসিএইচ, এমডি (পেডিয়াট্রিক্স)",
    exp: 9,
    fee: 700,
  },
  {
    nameEn: "Dr. Shafiqul Islam",
    nameBn: "ডা. শফিকুল ইসলাম",
    gender: "MALE",
    qualEn: "MBBS (DMC), MS (Orthopedic Surgery)",
    qualBn: "এমবিবিএস (ডিএমসি), এমএস (অর্থোপেডিক সার্জারি)",
    exp: 14,
    fee: 900,
  },
  {
    nameEn: "Dr. Nusrat Jahan",
    nameBn: "ডা. নুসরাত জাহান",
    gender: "FEMALE",
    qualEn: "MBBS (RMC), MD (Cardiology)",
    qualBn: "এমবিবিএস (আরএমসি), এমডি (কার্ডিওলজি)",
    exp: 8,
    fee: 700,
  },
  {
    nameEn: "Assoc. Prof. Dr. Kamrul Ahsan",
    nameBn: "সহযোগী অধ্যাপক ডা. কামরুল আহসান",
    gender: "MALE",
    qualEn: "MBBS (DMC), FCPS (Medicine), MRCP (UK)",
    qualBn: "এমবিবিএস (ডিএমসি), এফসিপিএস (মেডিসিন), এমআরসিপি (ইউকে)",
    exp: 15,
    fee: 1000,
  },
  {
    nameEn: "Dr. Sabina Yasmin",
    nameBn: "ডা. সাবিনা ইয়াসমিন",
    gender: "FEMALE",
    qualEn: "MBBS (MAG Osmani), FCPS (Gynae & Obs)",
    qualBn: "এমবিবিএস (এমএজি ওসমানী), এফসিপিএস (গাইনি ও অবস)",
    exp: 10,
    fee: 600,
  },
  {
    nameEn: "Dr. Rezaul Karim",
    nameBn: "ডা. রেজাউল করিম",
    gender: "MALE",
    qualEn: "MBBS (SSMC), FCPS (Pediatrics)",
    qualBn: "এমবিবিএস (এসএসএমসি), এফসিপিএস (পেডিয়াট্রিক্স)",
    exp: 12,
    fee: 800,
  },
  {
    nameEn: "Dr. Anisur Rahman Khan",
    nameBn: "ডা. আনিসুর রহমান খান",
    gender: "MALE",
    qualEn: "MBBS (CMC), D-Ortho, MS (Ortho)",
    qualBn: "এমবিবিএস (সিএমসি), ডি-অর্থো, এমএস (অর্থো)",
    exp: 13,
    fee: 800,
  },
  {
    nameEn: "Dr. Tahmina Sultana",
    nameBn: "ডা. তাহমিনা সুলতানা",
    gender: "FEMALE",
    qualEn: "MBBS (DMC), D-Card, MD (Cardiology)",
    qualBn: "এমবিবিএস (ডিএমসি), ডি-কার্ড, এমডি (কার্ডিওলজি)",
    exp: 7,
    fee: 600,
  },
  {
    nameEn: "Dr. Mizanur Rahman",
    nameBn: "ডা. মিজানুর রহমান",
    gender: "MALE",
    qualEn: "MBBS (MMC), FCPS (Internal Medicine)",
    qualBn: "এমবিবিএস (এমএমসি), এফসিপিএস (ইন্টারনাল মেডিসিন)",
    exp: 10,
    fee: 700,
  },
  {
    nameEn: "Dr. Sharmin Sultana",
    nameBn: "ডা. শারমিন সুলতানা",
    gender: "FEMALE",
    qualEn: "MBBS (CMC), DGO, FCPS (Obs & Gynae)",
    qualBn: "এমবিবিএস (সিএমসি), ডিজিও, এফসিপিএস (গাইনি ও অবস)",
    exp: 11,
    fee: 800,
  },
  {
    nameEn: "Dr. Ashraful Alam",
    nameBn: "ডা. আশরাফুল আলম",
    gender: "MALE",
    qualEn: "MBBS (DMC), MD (Neonatology & Pediatrics)",
    qualBn: "এমবিবিএস (ডিএমসি), এমডি (নবজাতক ও শিশুরোগ)",
    exp: 9,
    fee: 700,
  },
  {
    nameEn: "Prof. Dr. Syed Golam Kibria",
    nameBn: "অধ্যাপক ডা. সৈয়দ গোলাম কিবরিয়া",
    gender: "MALE",
    qualEn: "MBBS (DMC), MS (Orthopedics), FACS",
    qualBn: "এমবিবিএস (ডিএমসি), এমএস (অর্থোপেডিক্স), এফএসিএস",
    exp: 20,
    fee: 1200,
  },
  {
    nameEn: "Dr. Rafiqul Bari",
    nameBn: "ডা. রফিকুল বারী",
    gender: "MALE",
    qualEn: "MBBS (MAG Osmani), MD (Cardiology)",
    qualBn: "এমবিবিএস (এমএজি ওসমানী), এমডি (কার্ডিওলজি)",
    exp: 8,
    fee: 600,
  },
  {
    nameEn: "Dr.Taslima Begum",
    nameBn: "ডা. তাসলিমা বেগম",
    gender: "FEMALE",
    qualEn: "MBBS (SBMC), FCPS (Medicine)",
    qualBn: "এমবিবিএস (এসবিএমসি), এফসিপিএস (মেডিসিন)",
    exp: 6,
    fee: 500,
  },
  {
    nameEn: "Dr. Humayra Kabir",
    nameBn: "ডা. হুমায়রা কবির",
    gender: "FEMALE",
    qualEn: "MBBS (DMC), FCPS (Gynae & Obs)",
    qualBn: "এমবিবিএস (ডিএমসি), এফসিপিএস (গাইনি ও অবস)",
    exp: 12,
    fee: 900,
  },
  {
    nameEn: "Dr. Sajjad Hossain",
    nameBn: "ডা. সাজ্জাদ হোসেন",
    gender: "MALE",
    qualEn: "MBBS (CMC), FCPS (Pediatrics)",
    qualBn: "এমবিবিএস (সিএমসি), এফসিপিএস (পেডিয়াট্রিক্স)",
    exp: 7,
    fee: 600,
  },
  {
    nameEn: "Dr. Monirul Haque",
    nameBn: "ডা. মনিরুল হক",
    gender: "MALE",
    qualEn: "MBBS (MAG Osmani), MS (Orthopedics)",
    qualBn: "এমবিবিএস (এমএজি ওসমানী), এমএস (অর্থোপেডিক্স)",
    exp: 10,
    fee: 700,
  },
];

async function main() {
  console.log("Seeding Shasthyo Sheba database...");

  // Clear existing data in dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.chamber.deleteMany();
  await prisma.doctorSpecialty.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.user.deleteMany();

  // 1. Admin account: +8801700000000
  const adminUser = await prisma.user.create({
    data: {
      phone: "+8801700000000",
      nameEn: "System Administrator",
      nameBn: "সিস্টেম অ্যাডমিনিস্ট্রেটর",
      role: "ADMIN",
      preferredLang: "en",
    },
  });

  // 2. Patient account: +8801711111111
  const patientUser = await prisma.user.create({
    data: {
      phone: "+8801711111111",
      nameEn: "Rahim Uddin",
      nameBn: "রহিম উদ্দিন",
      role: "PATIENT",
      preferredLang: "en",
      patientProfile: {
        create: {
          gender: "MALE",
          bloodGroup: "B+",
          addressEn: "Dhanmondi, Dhaka",
          addressBn: "ধানমন্ডি, ঢাকা",
          emergencyContact: "+8801711111112",
        },
      },
    },
    include: {
      patientProfile: true,
    },
  });

  // 3. 5 Specialties
  const createdSpecialties = [];
  for (const spec of SPECIALTIES) {
    const s = await prisma.specialty.create({ data: spec });
    createdSpecialties.push(s);
  }

  // 4. 7 Clinics across Dhaka, Chattogram, Sylhet
  const createdClinics = [];
  for (const clinic of CLINICS) {
    const c = await prisma.clinic.create({ data: clinic });
    createdClinics.push(c);
  }

  // 5. 20 Approved Doctors (+8801712000001 to +8801712000020, BM&DC A-10001 to A-10020)
  const createdDoctors = [];
  const createdChambers = [];

  for (let i = 0; i < 20; i++) {
    const numStr = String(i + 1).padStart(2, "0");
    const phone = `+88017120000${numStr}`;
    const bmdcNumber = `A-${10001 + i}`;
    const docSeed = DOCTOR_SEED[i];
    const specialty = createdSpecialties[i % createdSpecialties.length];
    const primaryClinic = createdClinics[i % createdClinics.length];

    const docUser = await prisma.user.create({
      data: {
        phone,
        nameEn: docSeed.nameEn,
        nameBn: docSeed.nameBn,
        role: "DOCTOR",
        preferredLang: "en",
        doctorProfile: {
          create: {
            bmdcNumber,
            status: "APPROVED",
            gender: docSeed.gender,
            titleEn: docSeed.nameEn,
            titleBn: docSeed.nameBn,
            qualificationsEn: docSeed.qualEn,
            qualificationsBn: docSeed.qualBn,
            bioEn: `${docSeed.nameEn} is a verified ${specialty.nameEn} specialist with ${docSeed.exp} years of clinical experience in Bangladesh.`,
            bioBn: `${docSeed.nameBn} একজন বিএমএন্ডডিসি যাচাইকৃত ${specialty.nameBn}, যার রয়েছে ${docSeed.exp} বছরের চিকিৎসা অভিজ্ঞতা।`,
            experienceYears: docSeed.exp,
            averageRating: 4.8,
            reviewCount: 1,
            specialties: {
              create: {
                specialtyId: specialty.id,
                isPrimary: true,
              },
            },
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    const doctorProfile = docUser.doctorProfile!;
    createdDoctors.push(doctorProfile);

    const chamber = await prisma.chamber.create({
      data: {
        doctorId: doctorProfile.id,
        clinicId: primaryClinic.id,
        roomNumber: `Room ${301 + i}`,
        feeBdt: docSeed.fee,
        followUpFeeBdt: Math.max(400, docSeed.fee - 300),
        slotDurationMin: 15,
        maxPatientsPerSlot: 1,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: "17:00",
        endTime: "21:00",
        blockedDates: [],
        isActive: true,
      },
    });
    createdChambers.push(chamber);
  }

  // 6. One confirmed sample appointment & payment for the sample patient (+8801711111111)
  const firstDoctor = createdDoctors[0];
  const firstChamber = createdChambers[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowStr = `${yyyy}-${mm}-${dd}`;
  const slotDateTime = new Date(`${tomorrowStr}T17:00:00+06:00`);

  const sampleSlot = await prisma.availabilitySlot.create({
    data: {
      chamberId: firstChamber.id,
      doctorId: firstDoctor.id,
      dateStr: tomorrowStr,
      startTime: "17:00",
      endTime: "17:15",
      slotDateTime,
      serialNumber: 1,
      isBooked: true,
      isBlocked: false,
    },
  });

  const sampleAppointment = await prisma.appointment.create({
    data: {
      patientId: patientUser.patientProfile!.id,
      doctorId: firstDoctor.id,
      chamberId: firstChamber.id,
      slotId: sampleSlot.id,
      dateStr: tomorrowStr,
      startTime: "17:00",
      endTime: "17:15",
      appointmentAt: slotDateTime,
      serialNumber: 1,
      feeBdt: firstChamber.feeBdt,
      status: "CONFIRMED",
      symptoms: "Routine blood pressure & cardiac checkup",
      activeSlotKey: sampleSlot.id,
      payment: {
        create: {
          amountBdt: firstChamber.feeBdt,
          method: "CASH_AT_CLINIC",
          status: "PENDING",
          transactionRef: "SEED-TXN-10001",
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      titleEn: "Appointment Confirmed (Serial #1)",
      titleBn: "অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে (সিরিয়াল #১)",
      messageEn: `Your appointment with ${firstDoctor.titleEn} on ${tomorrowStr} at 17:00 is confirmed. Fee: ৳${firstChamber.feeBdt}.`,
      messageBn: `${tomorrowStr} তারিখ বিকাল ১৭:০০ টায় ${firstDoctor.titleBn}-এর সাথে আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে। ফি: ৳${firstChamber.feeBdt}।`,
    },
  });

  console.log("Seed completed successfully:");
  console.log(` - Admin:   ${adminUser.phone}`);
  console.log(` - Patient: ${patientUser.phone} (Appointment ID: ${sampleAppointment.id})`);
  console.log(` - Doctors: ${createdDoctors.length} approved (+8801712000001 to +8801712000020)`);
  console.log(` - Clinics: ${createdClinics.length} across Dhaka, Chattogram, Sylhet`);
  console.log(` - Specialties: ${createdSpecialties.length}`);
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

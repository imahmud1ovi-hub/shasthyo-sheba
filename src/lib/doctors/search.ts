import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const doctorSortSchema = z.enum([
  "rating_desc",
  "fee_asc",
  "fee_desc",
  "experience_desc",
]);

export type DoctorSortOption = z.infer<typeof doctorSortSchema>;

const optionalPositiveInt = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((val) => {
    if (val === undefined || val === "") return undefined;
    const parsed = typeof val === "number" ? val : Number(val);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
  });

export const doctorSearchQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  specialty: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  city: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  area: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  gender: z
    .enum(["MALE", "FEMALE", "OTHER"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  minFee: optionalPositiveInt,
  maxFee: optionalPositiveInt,
  availableToday: z
    .union([z.string(), z.boolean(), z.undefined()])
    .transform((v) => v === true || v === "true" || v === "1"),
  availableDay: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const num = typeof v === "number" ? v : Number(v);
      return Number.isInteger(num) && num >= 0 && num <= 6 ? num : undefined;
    }),
  sort: doctorSortSchema.optional().default("rating_desc"),
  page: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => {
      const num = typeof v === "number" ? v : Number(v);
      return Number.isInteger(num) && num >= 1 ? num : 1;
    }),
  pageSize: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => {
      const num = typeof v === "number" ? v : Number(v);
      return Number.isInteger(num) && num >= 1 && num <= 24 ? num : 6;
    }),
});

export type DoctorSearchParams = z.infer<typeof doctorSearchQuerySchema>;

/**
 * Builds the Prisma `DoctorProfileWhereInput` for public discovery.
 * HARD RULE: `status: "APPROVED"` is unconditionally enforced so pending/rejected
 * doctors can never appear in public search results.
 */
export function buildDoctorWhereClause(
  params: DoctorSearchParams,
  todayDayOfWeek: number = new Date().getDay()
): Prisma.DoctorProfileWhereInput {
  const andConditions: Prisma.DoctorProfileWhereInput[] = [
    { status: "APPROVED" },
  ];

  if (params.q) {
    andConditions.push({
      OR: [
        { titleEn: { contains: params.q, mode: "insensitive" } },
        { titleBn: { contains: params.q, mode: "insensitive" } },
        { qualificationsEn: { contains: params.q, mode: "insensitive" } },
        { qualificationsBn: { contains: params.q, mode: "insensitive" } },
        { bmdcNumber: { contains: params.q, mode: "insensitive" } },
      ],
    });
  }

  if (params.specialty) {
    andConditions.push({
      specialties: {
        some: {
          specialty: {
            slug: params.specialty,
          },
        },
      },
    });
  }

  if (params.gender) {
    andConditions.push({
      gender: params.gender,
    });
  }

  const chamberFilter: Prisma.ChamberWhereInput = {
    isActive: true,
  };
  let hasChamberCondition = false;

  if (params.city || params.area) {
    hasChamberCondition = true;
    chamberFilter.clinic = {
      isActive: true,
      ...(params.city
        ? {
            OR: [
              { cityEn: { equals: params.city, mode: "insensitive" } },
              { cityBn: { equals: params.city } },
            ],
          }
        : {}),
      ...(params.area
        ? {
            AND: [
              {
                OR: [
                  { areaEn: { contains: params.area, mode: "insensitive" } },
                  { areaBn: { contains: params.area } },
                ],
              },
            ],
          }
        : {}),
    };
  }

  if (params.minFee !== undefined || params.maxFee !== undefined) {
    hasChamberCondition = true;
    chamberFilter.feeBdt = {
      ...(params.minFee !== undefined ? { gte: params.minFee } : {}),
      ...(params.maxFee !== undefined ? { lte: params.maxFee } : {}),
    };
  }

  const targetDay =
    params.availableDay !== undefined
      ? params.availableDay
      : params.availableToday
        ? todayDayOfWeek
        : undefined;

  if (targetDay !== undefined) {
    hasChamberCondition = true;
    chamberFilter.daysOfWeek = {
      has: targetDay,
    };
  }

  if (hasChamberCondition) {
    andConditions.push({
      chambers: {
        some: chamberFilter,
      },
    });
  }

  return {
    AND: andConditions,
  };
}

export async function searchApprovedDoctors(
  rawInput: Record<string, string | string[] | undefined>
) {
  const normalized: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(rawInput)) {
    normalized[k] = Array.isArray(v) ? v[0] : v;
  }

  const params = doctorSearchQuerySchema.parse(normalized);
  const where = buildDoctorWhereClause(params);

  const matchingDoctors = await prisma.doctorProfile.findMany({
    where,
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
      chambers: {
        where: { isActive: true },
        include: {
          clinic: true,
        },
        orderBy: {
          feeBdt: "asc",
        },
      },
    },
  });

  const enriched = matchingDoctors.map((doc) => {
    const lowestFee =
      doc.chambers.length > 0
        ? Math.min(...doc.chambers.map((c) => c.feeBdt))
        : 0;
    return {
      ...doc,
      lowestFeeBdt: lowestFee,
    };
  });

  enriched.sort((a, b) => {
    switch (params.sort) {
      case "fee_asc":
        return a.lowestFeeBdt - b.lowestFeeBdt;
      case "fee_desc":
        return b.lowestFeeBdt - a.lowestFeeBdt;
      case "experience_desc":
        return b.experienceYears - a.experienceYears;
      case "rating_desc":
      default:
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.experienceYears - a.experienceYears;
    }
  });

  const total = enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const safePage = Math.min(params.page, totalPages);
  const startIdx = (safePage - 1) * params.pageSize;
  const items = enriched.slice(startIdx, startIdx + params.pageSize);

  return {
    items,
    pagination: {
      total,
      page: safePage,
      pageSize: params.pageSize,
      totalPages,
    },
    filters: params,
  };
}

export async function getApprovedDoctorById(doctorId: string) {
  return prisma.doctorProfile.findFirst({
    where: {
      id: doctorId,
      status: "APPROVED",
    },
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
      chambers: {
        where: { isActive: true },
        include: {
          clinic: true,
        },
        orderBy: {
          feeBdt: "asc",
        },
      },
      reviews: {
        include: {
          patient: {
            include: {
              user: {
                select: {
                  nameEn: true,
                  nameBn: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  });
}

export async function getDiscoveryMetadata() {
  const [specialties, clinics] = await Promise.all([
    prisma.specialty.findMany({
      orderBy: { nameEn: "asc" },
    }),
    prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        cityEn: true,
        cityBn: true,
        areaEn: true,
        areaBn: true,
      },
      orderBy: [{ cityEn: "asc" }, { areaEn: "asc" }],
    }),
  ]);

  const cityMap = new Map<string, { cityEn: string; cityBn: string }>();
  const areaMap = new Map<
    string,
    { cityEn: string; areaEn: string; areaBn: string }
  >();

  for (const c of clinics) {
    if (!cityMap.has(c.cityEn)) {
      cityMap.set(c.cityEn, { cityEn: c.cityEn, cityBn: c.cityBn });
    }
    const areaKey = `${c.cityEn}:${c.areaEn}`;
    if (!areaMap.has(areaKey)) {
      areaMap.set(areaKey, {
        cityEn: c.cityEn,
        areaEn: c.areaEn,
        areaBn: c.areaBn,
      });
    }
  }

  return {
    specialties,
    cities: Array.from(cityMap.values()),
    areas: Array.from(areaMap.values()),
  };
}

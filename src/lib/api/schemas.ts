/**
 * Zod runtime validation schemas for API responses.
 *
 * These schemas replace unsafe `as unknown as T` and `as any` casts in API
 * response handling. Each schema mirrors the TypeScript interface it validates.
 *
 * Usage:
 *   import { LoginResponseSchema, UserSchema } from '@/lib/api/schemas';
 *
 *   // Throws ZodError on mismatch — use inside a try/catch:
 *   const user = UserSchema.parse(response.data);
 *
 *   // Safe variant — returns { success, data } or { success: false, error }:
 *   const result = UserSchema.safeParse(response.data);
 *   if (!result.success) { ... }
 */

import { z } from "zod";

// ─── Primitives ────────────────────────────────────────────────────────────────

const ROLES = [
  "super_admin",
  "admin",
  "manager",
  "owner",
  "tenant",
  "maintenance",
] as const;

/** Accepts API role in any case and normalizes to lowercase enum. */
const UserRoleSchema = z
  .string()
  .transform((s) => s.toLowerCase())
  .pipe(z.enum(ROLES));

// ─── Auth / User schemas ───────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  phone: z.string().nullish().transform((v) => v ?? undefined),
  address: z.string().nullish().transform((v) => v ?? undefined),
  profilePicture: z.string().nullish().transform((v) => v ?? undefined),
});

/** Accepts accessToken or legacy "token" and expiresIn as number or string. */
export const LoginResponseSchema = z
  .object({
    message: z.string(),
    accessToken: z.string().optional(),
    token: z.string().optional(),
    expiresIn: z.union([z.number(), z.string().transform(Number)]).optional(),
    tokenType: z.string().optional(),
    csrfToken: z.string().optional(),
    user: UserSchema,
  })
  .transform((data) => {
    const accessToken = (data.accessToken ?? data.token ?? "").trim();
    const expiresIn =
      typeof data.expiresIn === "number"
        ? data.expiresIn
        : data.expiresIn != null
          ? Number(data.expiresIn)
          : 900;
    if (!accessToken) {
      throw new z.ZodError([
        { code: "custom", path: ["accessToken"], message: "Missing accessToken or token in login response" },
      ]);
    }
    return { ...data, accessToken, expiresIn };
  });

export const UpdateProfileResponseSchema = z.object({
  message: z.string(),
  user: UserSchema,
});

export const PortfolioStatsSchema = z.object({
  propertiesOwned: z.number(),
  activeTenants: z.number(),
  portfolioValue: z.number(),
  formattedPortfolioValue: z.string(),
});

export const ManagerPortfolioStatsSchema = z.object({
  propertiesManaged: z.number(),
  totalUnits: z.number(),
  activeTenants: z.number(),
  monthlyRevenue: z.number(),
  formattedMonthlyRevenue: z.string(),
  occupancyRate: z.number(),
});

export const GetPortfolioStatsResponseSchema = PortfolioStatsSchema;

export const GetInvitedUsersResponseSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      role: z.enum(["owner", "tenant"]),
      createdAt: z.string(),
      invitedBy: z.string(),
      propertyCount: z.number(),
      isActive: z.boolean(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// ─── Property schemas ──────────────────────────────────────────────────────────

const PropertyPhotoSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  url: z.string(),
  caption: z.string().optional(),
  orderIndex: z.number(),
  createdAt: z.string(),
});

const PropertyOwnerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
});

const PropertyManagerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
});

const PropertyTenantSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  createdAt: z.string(),
});

export const PropertySchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  tenantId: z.string().optional(),
  title: z.string(),
  type: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  country: z.string(),
  zipcode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  sqft: z.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  leaseTerms: z.string().optional(),
  fees: z.string().optional(),
  availability: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  valueRanges: z.array(z.string()).optional(),
  status: z.enum(["pending", "approved", "rejected", "occupied", "vacant"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  photos: z.array(PropertyPhotoSchema).optional(),
  owner: PropertyOwnerSchema.optional(),
  manager: PropertyManagerSchema.optional(),
  tenant: PropertyTenantSchema.optional(),
});

export const GetPropertyResponseSchema = z.object({
  property: PropertySchema,
});

export const GetPropertiesResponseSchema = z.object({
  data: z.array(PropertySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().optional(),
  }),
});

// ─── Maintenance schemas ───────────────────────────────────────────────────────

export const MaintenanceRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum([
    "plumbing",
    "electrical",
    "hvac",
    "appliances",
    "flooring",
    "windows",
    "structural",
    "pest_control",
    "cleaning",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "emergency"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  propertyId: z.string(),
  tenantId: z.string(),
  managerNotes: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  dateScheduled: z.string().optional(),
  dateCompleted: z.string().optional(),
  photos: z.array(z.string()).optional(),
  updates: z.array(z.string()).optional(),
  propertyTitle: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  tenantFirstName: z.string().optional(),
  tenantLastName: z.string().optional(),
  tenantEmail: z.string().optional(),
  tenantPhone: z.string().optional(),
});

export const MaintenanceRequestArraySchema = z.array(MaintenanceRequestSchema);

// ─── Stripe / Payment schemas ──────────────────────────────────────────────────

export const StripePaymentMethodSchema = z.object({
  id: z.string(),
  stripePaymentMethodId: z.string(),
  type: z.enum(["card", "us_bank_account"]),
  brand: z.string().optional(),
  last4: z.string(),
  expMonth: z.number().optional(),
  expYear: z.number().optional(),
  bankName: z.string().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});

export const ListPaymentMethodsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(StripePaymentMethodSchema),
});

export const CreatePaymentIntentResponseSchema = z.object({
  success: z.boolean(),
  clientSecret: z.string(),
  paymentId: z.string(),
});

export const CreateSetupIntentResponseSchema = z.object({
  success: z.boolean(),
  clientSecret: z.string(),
});

export const PaymentRecordSchema = z.object({
  id: z.string(),
  stripePaymentIntentId: z.string(),
  amountCents: z.number(),
  currency: z.string(),
  status: z.enum(["pending", "processing", "succeeded", "failed", "refunded"]),
  paymentType: z.enum(["rent", "one_time", "investment", "subscription"]),
  propertyId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PaymentHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PaymentRecordSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

export const SubscriptionRecordSchema = z.object({
  id: z.string(),
  stripeSubscriptionId: z.string(),
  planName: z.enum(["starter", "growth", "portfolio"]),
  status: z.enum(["active", "past_due", "canceled", "trialing", "incomplete"]),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string(),
});

export const GetCurrentSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  data: SubscriptionRecordSchema.nullable(),
});

// ─── Tenant screening schemas ──────────────────────────────────────────────────

export const TenantScreeningSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  propertyId: z.string(),
  status: z.enum(["pending", "approved", "rejected", "review"]),
  creditScore: z.number().optional(),
  backgroundCheckPassed: z.boolean().optional(),
  incomeVerification: z
    .object({
      verified: z.boolean(),
      monthlyIncome: z.number(),
    })
    .optional(),
  rentalHistory: z
    .object({
      yearsAsRenter: z.number(),
      evictions: z.number(),
    })
    .optional(),
  flags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ScreeningReportSchema = z.object({
  screeningId: z.string(),
  summary: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  creditInfo: z
    .object({
      score: z.number(),
      delinquencies: z.number(),
    })
    .optional(),
  backgroundInfo: z
    .object({
      convictions: z.array(z.string()),
      evictions: z.number(),
    })
    .optional(),
  incomeInfo: z
    .object({
      monthly: z.number(),
      source: z.string(),
    })
    .optional(),
  recommendations: z.array(z.string()),
});

// ─── API error field schema ────────────────────────────────────────────────────

export const ApiErrorFieldSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export const ApiErrorFieldArraySchema = z.array(ApiErrorFieldSchema);

// ─── Type inference helpers ────────────────────────────────────────────────────

export type UserSchemaType = z.infer<typeof UserSchema>;
export type LoginResponseSchemaType = z.infer<typeof LoginResponseSchema>;
export type ManagerPortfolioStatsSchemaType = z.infer<typeof ManagerPortfolioStatsSchema>;
export type PropertySchemaType = z.infer<typeof PropertySchema>;
export type MaintenanceRequestSchemaType = z.infer<typeof MaintenanceRequestSchema>;
export type StripePaymentMethodSchemaType = z.infer<typeof StripePaymentMethodSchema>;
export type TenantScreeningSchemaType = z.infer<typeof TenantScreeningSchema>;
export type ScreeningReportSchemaType = z.infer<typeof ScreeningReportSchema>;

import { z } from "zod";
import { CONTENT_STATUSES, ID_TYPES, PURCHASE_STATUSES } from "@/types";

export const PRICE_LIMITS_CENTS = { min: 99, max: 99_999 } as const;
export const VIDEO_LIMITS = {
  maxBytes: 5 * 1024 ** 3,
  mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
} as const;
export const THUMBNAIL_LIMITS = {
  maxSourceBytes: 10 * 1024 ** 2,
  maxDataUrlLength: 400_000,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

const thumbnailUrlSchema = z
  .string()
  .max(THUMBNAIL_LIMITS.maxDataUrlLength, "Thumbnail is too large")
  .refine(
    (value) => value.startsWith("data:image/") || value.startsWith("https://"),
    "Thumbnail must be an uploaded image",
  );

export const videoMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(VIDEO_LIMITS.maxBytes, "Videos can be up to 5 GB"),
});
export type VideoMetadata = z.infer<typeof videoMetadataSchema>;

const contentFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2,000 characters or fewer"),
  priceCents: z
    .number({ error: "Enter a price" })
    .int()
    .min(PRICE_LIMITS_CENTS.min, "Minimum price is $0.99")
    .max(PRICE_LIMITS_CENTS.max, "Maximum price is $999.99"),
  thumbnailUrl: thumbnailUrlSchema.nullable(),
  status: z.enum(CONTENT_STATUSES),
  scheduledAt: z.iso.datetime({ offset: true }).nullable(),
});

function refineSchedule(
  value: { status: string; scheduledAt: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.status !== "SCHEDULED") return;
  if (!value.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Choose a date and time" });
  } else if (new Date(value.scheduledAt).getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Choose a time in the future" });
  }
}

export const createContentSchema = contentFieldsSchema
  .extend({ video: videoMetadataSchema })
  .superRefine(refineSchedule);
export type CreateContentInput = z.infer<typeof createContentSchema>;

export const updateContentSchema = contentFieldsSchema
  .extend({ video: videoMetadataSchema.nullable() })
  .superRefine(refineSchedule);
export type UpdateContentInput = z.infer<typeof updateContentSchema>;

export const PURCHASE_SORT_FIELDS = ["createdAt", "amountCents"] as const;

export const purchaseQuerySchema = z.object({
  status: z.enum(PURCHASE_STATUSES).optional(),
  sort: z.enum(PURCHASE_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
});
export type PurchaseQuery = z.infer<typeof purchaseQuerySchema>;

const MINIMUM_AGE_YEARS = 18;

function isAdult(isoDate: string) {
  const birth = new Date(isoDate);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MINIMUM_AGE_YEARS);
  return birth <= cutoff;
}

export const personalInfoSchema = z.object({
  legalName: z.string().trim().min(2, "Enter your full legal name").max(120),
  dateOfBirth: z.iso
    .date("Enter a valid date")
    .refine(isAdult, `You must be at least ${MINIMUM_AGE_YEARS} to publish paid content`),
  country: z.string().length(2, "Select your country of residence"),
});
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export const requiresBackSide = (idType: (typeof ID_TYPES)[number]) => idType !== "PASSPORT";

export const identityDocumentSchema = z
  .object({
    idType: z.enum(ID_TYPES, { error: "Select a document type" }),
    idFileName: z.string().trim().min(1, "Add a photo of the front of your document").max(255),
    idBackFileName: z.string().trim().max(255).nullable(),
    idQualityWarning: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (requiresBackSide(value.idType) && !value.idBackFileName) {
      ctx.addIssue({ code: "custom", path: ["idBackFileName"], message: "Add a photo of the back of your document" });
    }
  });
export type IdentityDocumentInput = z.infer<typeof identityDocumentSchema>;

export const selfieSchema = z.object({
  selfieCaptured: z.literal(true, { error: "Take a selfie to continue" }),
});
export type SelfieInput = z.infer<typeof selfieSchema>;

export const verificationStepSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal(1), data: personalInfoSchema }),
  z.object({ step: z.literal(2), data: identityDocumentSchema }),
  z.object({ step: z.literal(3), data: selfieSchema }),
  z.object({ step: z.literal(4) }),
]);
export type VerificationStepInput = z.infer<typeof verificationStepSchema>;

const emailSchema = z.email("Enter a valid email address").max(254);

export const PASSWORD_MIN_LENGTH = 10;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(128, "Use 128 characters or fewer")
    .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), "Include at least one letter and one number"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

export function firstFieldErrors(fieldErrors: Record<string, string[] | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, messages] of Object.entries(fieldErrors)) {
    const field = path.split(".")[0];
    if (messages?.[0] && !result[field]) result[field] = messages[0];
  }
  return result;
}

export function validateFields<Schema extends z.ZodType>(
  schema: Schema,
  values: unknown,
): { success: true; data: z.infer<Schema> } | { success: false; errors: Record<string, string> } {
  const parsed = schema.safeParse(values);
  return parsed.success
    ? { success: true, data: parsed.data }
    : { success: false, errors: firstFieldErrors(toFieldErrors(parsed.error)) };
}

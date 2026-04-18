import { z } from "zod";

// ─── City Schemas ─────────────────────────────────────────────────────────────

export const citySchema = z.object({
    name: z.string().min(1, "City name is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().default("India"),
    isActive: z.boolean().default(true),
});

export type CityFormData = z.infer<typeof citySchema>;

// ─── Holding Type Schemas ─────────────────────────────────────────────────────

export const holdingTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

export type HoldingTypeFormData = z.infer<typeof holdingTypeSchema>;

// ─── HSN Code Schemas ─────────────────────────────────────────────────────────

export const hsnCodeSchema = z.object({
    code: z.string().min(1, "HSN code is required"),
    description: z.string().min(1, "Description is required"),
    gstRate: z.coerce.number().min(0).max(100),
    isActive: z.boolean().default(true),
});

export type HsnCodeFormData = z.infer<typeof hsnCodeSchema>;

// ─── Holding Schemas ──────────────────────────────────────────────────────────

export const holdingSchema = z.object({
    code: z.string().min(1, "Holding code is required"),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    latitude: z.coerce.number({ error: "Latitude is required" }).min(-90, "Invalid latitude").max(90, "Invalid latitude"),
    longitude: z.coerce.number({ error: "Longitude is required" }).min(-180, "Invalid longitude").max(180, "Invalid longitude"),
    width: z.coerce.number().positive("Width must be positive"),
    height: z.coerce.number().positive("Height must be positive"),
    totalArea: z.coerce.number().positive("Area must be positive"),
    illumination: z.enum(["LIT", "NON_LIT", "DIGITAL"]),
    facing: z.string().optional(),
    landmark: z.string().optional(),
    status: z.enum(["AVAILABLE", "BOOKED", "UNDER_MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
    assetType: z.enum(["OWNED", "RENTED"]).default("OWNED"),
    vendorId: z.string().optional().nullable(),
    maintenanceCycle: z.coerce.number().int().positive().default(90),
    notes: z.string().optional(),
    images: z.array(z.string()).min(1, "At least one image is required"),
    cityId: z.string().min(1, "City is required"),
    holdingTypeId: z.string().min(1, "Holding type is required"),
    hsnCodeId: z.string().min(1, "HSN code is required"),
}).superRefine((data, ctx) => {
    if (data.assetType === "RENTED" && (!data.vendorId || data.vendorId.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Vendor is required when asset type is rented",
            path: ["vendorId"],
        });
    }
});

export type HoldingFormData = z.infer<typeof holdingSchema>;

// ─── Ownership Contract Schemas ───────────────────────────────────────────────

export const ownershipContractSchema = z.object({
    contractNumber: z.string().min(1, "Contract number is required"),
    vendorId: z.string().min(1, "Vendor is required"),
    rentAmount: z.coerce.number().positive("Rent must be positive"),
    rentCycle: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).default("MONTHLY"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    securityDeposit: z.coerce.number().optional(),
    status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED", "PENDING"]).default("ACTIVE"),
    notes: z.string().optional(),
    agreementUrl: z.string().optional(),
    holdingId: z.string().min(1, "Holding is required"),
    // Backward compatibility during migration phase.
    ownerName: z.string().optional(),
    ownerType: z.enum(["GOVERNMENT", "MUNICIPAL", "VILLAGE_PANCHAYAT", "PRIVATE"]).optional(),
    ownerContact: z.string().optional(),
    ownerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    ownerAddress: z.string().optional(),
    ownerKycUrl: z.string().optional(),
});

export type OwnershipContractFormData = z.infer<typeof ownershipContractSchema>;

// ─── Client Schemas ───────────────────────────────────────────────────────────

export const clientSchema = z.object({
    name: z.string().min(1, "Client name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(1, "Phone is required"),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    isActive: z.boolean().default(true),
    cityId: z.string().optional(),
    kycDocumentUrl: z.string().optional().nullable(),
    agreementDocumentUrl: z.string().optional().nullable(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ─── Booking Schemas ──────────────────────────────────────────────────────────

export const bookingSchema = z.object({
    bookingNumber: z.string().min(1, "Booking number is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    monthlyRate: z.coerce.number().positive("Monthly rate must be positive"),
    totalAmount: z.coerce.number().positive("Total amount must be positive"),
    billingCycle: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).default("MONTHLY"),
    status: z.enum(["CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).default("CONFIRMED"),
    freeMountings: z.coerce.number().int().min(0).default(0),
    notes: z.string().optional(),
    clientId: z.string().min(1, "Client is required"),
    holdingId: z.string().min(1, "Holding is required"),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// ─── Advertisement Schemas ────────────────────────────────────────────────────

export const advertisementSchema = z.object({
    campaignName: z.string().min(1, "Campaign name is required"),
    brandName: z.string().min(1, "Brand name is required"),
    artworkDescription: z.string().optional(),
    artworkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    installationDate: z.coerce.date().optional(),
    removalDate: z.coerce.date().optional(),
    status: z.enum(["PENDING", "INSTALLED", "ACTIVE", "REMOVED", "COMPLETED"]).default("PENDING"),
    notes: z.string().optional(),
    bookingId: z.string().min(1, "Booking is required"),
});

export type AdvertisementFormData = z.infer<typeof advertisementSchema>;

// ─── Task Schemas ─────────────────────────────────────────────────────────────

export const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    taskType: z.enum(["INSTALLATION", "MOUNTING", "MAINTENANCE", "INSPECTION"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
    scheduledDate: z.coerce.date(),
    completedDate: z.coerce.date().optional(),
    assignedTo: z.string().optional(),
    estimatedCost: z.coerce.number().optional(),
    actualCost: z.coerce.number().optional(),
    notes: z.string().optional(),
    bookingId: z.string().optional(),
    holdingId: z.string().optional(),
    advertisementId: z.string().optional(),
}).superRefine((data, ctx) => {
    // INSTALLATION & MOUNTING require a booking
    if ((data.taskType === "INSTALLATION" || data.taskType === "MOUNTING") &&
        (!data.bookingId || data.bookingId.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Booking is required for Installation/Mounting tasks",
            path: ["bookingId"],
        });
    }
    // MAINTENANCE requires a holding
    if (data.taskType === "MAINTENANCE" &&
        (!data.holdingId || data.holdingId.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Holding is required for Maintenance tasks",
            path: ["holdingId"],
        });
    }
    // INSPECTION: holdingId is optional
});

export type TaskFormData = z.infer<typeof taskSchema>;

// ─── Task Execution Schemas ───────────────────────────────────────────────────

export const taskExecutionSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    status: z.enum(["COMPLETED", "CANCELLED", "UNDER_REVIEW"]),
    condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]),
    remarks: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    frontViewUrl: z.string().min(1, "Front view photo is required"),
    leftViewUrl: z.string().min(1, "Left view photo is required"),
    rightViewUrl: z.string().min(1, "Right view photo is required"),
});

export type TaskExecutionFormData = z.infer<typeof taskExecutionSchema>;

// ─── Invoice Schemas ──────────────────────────────────────────────────────────

export const invoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    invoiceDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    subtotal: z.coerce.number().positive(),
    cgstRate: z.coerce.number().min(0).default(9),
    sgstRate: z.coerce.number().min(0).default(9),
    igstRate: z.coerce.number().min(0).default(0),
    cgstAmount: z.coerce.number().min(0),
    sgstAmount: z.coerce.number().min(0),
    igstAmount: z.coerce.number().min(0).default(0),
    totalAmount: z.coerce.number().positive(),
    paidAmount: z.coerce.number().min(0).default(0),
    status: z.enum(["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
    notes: z.string().optional(),
    clientId: z.string().min(1, "Client is required"),
    bookingId: z.string().min(1, "Booking is required"),
    hsnCodeId: z.string().min(1, "HSN code is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

/** Line rows sent from client; amounts on invoice are recomputed server-side when items are present. */
export const invoiceLineItemInputSchema = z.object({
    description: z.string().min(1, "Description is required"),
    hsnCodeId: z.string().min(1, "HSN code is required"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    rate: z.coerce.number().min(0, "Rate cannot be negative"),
    bookingId: z.string().optional(),
});

export const invoiceUpsertPayloadSchema = invoiceSchema.extend({
    items: z.array(invoiceLineItemInputSchema).optional(),
});

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemInputSchema>;
export type InvoiceUpsertPayload = z.infer<typeof invoiceUpsertPayloadSchema>;

// ─── Receipt Schemas ──────────────────────────────────────────────────────────

export const receiptSchema = z.object({
    receiptNumber: z.string().min(1, "Receipt number is required"),
    receiptDate: z.coerce.date(),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentMode: z.enum(["CASH", "CHEQUE", "NEFT", "RTGS", "UPI", "CARD", "OTHER"]),
    referenceNo: z.string().optional(),
    notes: z.string().optional(),
    clientId: z.string().min(1, "Client is required"),
    invoiceId: z.string().min(1, "Invoice is required"),
    cashBankLedgerId: z.string().min(1, "Cash/Bank ledger is required"),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;

// ─── Location Suggestion Schemas ──────────────────────────────────────────────

export const locationSuggestionSchema = z.object({
    address: z.string().min(1, "Address is required"),
    cityId: z.string().min(1, "City is required"),
    latitude: z.coerce.number({ error: "Latitude is required" }).min(-90, "Invalid latitude").max(90, "Invalid latitude"),
    longitude: z.coerce.number({ error: "Longitude is required" }).min(-180, "Invalid longitude").max(180, "Invalid longitude"),
    landmark: z.string().optional(),
    description: z.string().optional(),
    photos: z.array(z.string()).optional().default([]),
    proposedRent: z.number().optional(),
    ownerName: z.string().optional(),
    ownerPhone: z.string().optional(),
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).default("PENDING"),
});

export type LocationSuggestionFormData = z.infer<typeof locationSuggestionSchema>;

// ─── Ledger Schemas ───────────────────────────────────────────────────────────

export const ledgerSchema = z.object({
    name: z.string().min(1, "Ledger name is required"),
    code: z.string().min(1, "Ledger code is required"),
    type: z.enum(["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"]),
    isGroup: z.boolean().default(false),
    parentId: z.string().optional().nullable(),
    isCash: z.boolean().default(false),
    isBank: z.boolean().default(false),
    isReceivable: z.boolean().default(false),
    isPayable: z.boolean().default(false),
    isRevenue: z.boolean().default(false),
    isTaxOutput: z.boolean().default(false),
    isTaxInput: z.boolean().default(false),
});

export type LedgerFormData = z.infer<typeof ledgerSchema>;

// ─── Vendor Schemas ───────────────────────────────────────────────────────────

export const vendorSchema = z.object({
    name: z.string().min(1, "Vendor name is required"),
    contactPerson: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(1, "Phone is required"),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    isActive: z.boolean().default(true),
    cityId: z.string().optional().nullable(),
    ledgerId: z.string().optional(),
    kycDocumentUrl: z.string().optional().nullable(),
    agreementDocumentUrl: z.string().optional().nullable(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

// ─── Payment Schemas ──────────────────────────────────────────────────────────

export const paymentSchema = z.object({
    paymentNumber: z.string().min(1, "Payment number is required"),
    paymentDate: z.coerce.date(),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentMode: z.enum(["CASH", "CHEQUE", "NEFT", "RTGS", "UPI", "CARD", "OTHER"]),
    referenceNo: z.string().optional(),
    notes: z.string().optional(),
    vendorId: z.string().min(1, "Vendor is required"),
    cashBankLedgerId: z.string().min(1, "Cash/Bank ledger is required"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ─── Journal Entry Schemas ────────────────────────────────────────────────────

export const journalLineSchema = z.object({
    ledgerId: z.string().min(1, "Ledger is required"),
    debit: z.coerce.number().min(0).optional().nullable(),
    credit: z.coerce.number().min(0).optional().nullable(),
    description: z.string().optional(),
});

export const journalEntrySchema = z.object({
    entryDate: z.coerce.date(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, "At least 2 lines required"),
});

export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
export type JournalLineFormData = z.infer<typeof journalLineSchema>;

// ─── Invoice Item Schemas ─────────────────────────────────────────────────────

export const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    hsnCodeId: z.string().min(1, "HSN Code is required"),
    quantity: z.coerce.number().positive(),
    rate: z.coerce.number().min(0),
    amount: z.coerce.number().min(0),
    gstRate: z.coerce.number().min(0),
    gstAmount: z.coerce.number().min(0),
    total: z.coerce.number().min(0),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

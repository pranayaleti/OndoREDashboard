import type { DashboardPaymentItem, Notification } from "@/lib/api"
import type { MaintenanceRequest, MessageRecord, MessageThread, PaymentRecord } from "@/lib/api/clients/feature-api"
import type { PnLStatement } from "@/lib/api/clients/reports"

interface UserLike {
  id?: string
  email?: string
  role?: string
}

export interface SeedDocument {
  id: string
  name: string
  type: "pdf" | "image" | "spreadsheet" | "document"
  category: string
  property?: string
  size: string
  uploadedAt: string
  uploadedBy: string
  folder?: string
  tag?: string
  shared?: boolean
}

const APP_REFERRAL_BASE_URL = "https://app.ondorealestate.com/ref"

export const DEMO_ACCOUNT_EMAILS = {
  manager: "admin@ondorealestate.com",
  owner: "owner@ondorealestate.com",
  tenant: "tenant@ondorealestate.com",
  maintenance: "maintenance@ondorealestate.com",
} as const

export const DEMO_PROPERTY_IDENTIFIERS = new Set([
  "101 Oak Street",
  "101 Oak Street, Austin",
  "202 Pine Ave",
  "202 Pine Ave, Austin",
  "303 Elm Blvd",
  "303 Elm Blvd, Austin",
  "404 Maple Rd",
  "404 Maple Rd, Austin",
  "505 Cedar Ln",
  "505 Cedar Ln, Austin",
])

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false
  return Object.values(DEMO_ACCOUNT_EMAILS).includes(email.toLowerCase() as (typeof DEMO_ACCOUNT_EMAILS)[keyof typeof DEMO_ACCOUNT_EMAILS])
}

export function isManagerDemoUser(user?: UserLike | null): boolean {
  return user?.email?.toLowerCase() === DEMO_ACCOUNT_EMAILS.manager
}

export function isOwnerDemoUser(user?: UserLike | null): boolean {
  return user?.email?.toLowerCase() === DEMO_ACCOUNT_EMAILS.owner
}

export function isTenantDemoUser(user?: UserLike | null): boolean {
  return user?.email?.toLowerCase() === DEMO_ACCOUNT_EMAILS.tenant
}

export function isMaintenanceDemoUser(user?: UserLike | null): boolean {
  return user?.email?.toLowerCase() === DEMO_ACCOUNT_EMAILS.maintenance
}

export function isDemoPortfolio(properties: Array<{ title?: string | null; addressLine1?: string | null }> = []): boolean {
  if (properties.length === 0) return true
  return properties.every((property) =>
    DEMO_PROPERTY_IDENTIFIERS.has((property.title ?? "").trim()) ||
    DEMO_PROPERTY_IDENTIFIERS.has((property.addressLine1 ?? "").trim()),
  )
}

export function getDemoReferralLink(userId?: string | null): string {
  if (!userId) return ""
  return `${APP_REFERRAL_BASE_URL}/${userId}`
}

export const DEMO_MANAGER_FINANCIAL_SUMMARY: PnLStatement = {
  startDate: "2026-04-01",
  endDate: "2026-04-30",
  income: {
    rent: 13200,
    lateFees: 450,
    other: 550,
    total: 14200,
  },
  expenses: {
    maintenance: 1450,
    utilities: 620,
    management: 980,
    other: 750,
    total: 3800,
  },
  netIncome: 10400,
  properties: [
    { propertyId: "prop-101-oak", propertyAddress: "101 Oak Street, Austin, TX", income: 2400, expenses: 620, netIncome: 1780 },
    { propertyId: "prop-202-pine", propertyAddress: "202 Pine Ave, Austin, TX", income: 3100, expenses: 980, netIncome: 2120 },
    { propertyId: "prop-303-elm", propertyAddress: "303 Elm Blvd, Austin, TX", income: 1900, expenses: 440, netIncome: 1460 },
    { propertyId: "prop-404-maple", propertyAddress: "404 Maple Rd, Austin, TX", income: 4100, expenses: 1110, netIncome: 2990 },
    { propertyId: "prop-505-cedar", propertyAddress: "505 Cedar Ln, Austin, TX", income: 2700, expenses: 650, netIncome: 2050 },
  ],
}

export const DEMO_OWNER_FINANCIAL_SUMMARY: PnLStatement = {
  startDate: "2026-04-01",
  endDate: "2026-04-30",
  income: {
    rent: 12150,
    lateFees: 250,
    other: 300,
    total: 12700,
  },
  expenses: {
    maintenance: 1230,
    utilities: 410,
    management: 620,
    other: 540,
    total: 2800,
  },
  netIncome: 9900,
  properties: [
    { propertyId: "owner-101-oak", propertyAddress: "101 Oak Street", income: 2400, expenses: 430, netIncome: 1970 },
    { propertyId: "owner-202-pine", propertyAddress: "202 Pine Ave", income: 2500, expenses: 610, netIncome: 1890 },
    { propertyId: "owner-303-elm", propertyAddress: "303 Elm Blvd", income: 1800, expenses: 350, netIncome: 1450 },
    { propertyId: "owner-404-maple", propertyAddress: "404 Maple Rd", income: 3200, expenses: 760, netIncome: 2440 },
    { propertyId: "owner-505-cedar", propertyAddress: "505 Cedar Ln", income: 2800, expenses: 650, netIncome: 2150 },
  ],
}

export const DEMO_DASHBOARD_PAYMENTS: DashboardPaymentItem[] = [
  {
    id: "demo-payment-1",
    amountCents: 240000,
    currency: "usd",
    status: "paid",
    paymentType: "rent",
    propertyId: "prop-101-oak",
    userId: "tenant-megan-carter",
    description: "April rent",
    createdAt: "2026-04-02T09:15:00.000Z",
    propertyTitle: "101 Oak Street, Austin",
    propertyAddress: "101 Oak Street, Austin, TX",
    payerEmail: "megan.carter@email.com",
  },
  {
    id: "demo-payment-2",
    amountCents: 250000,
    currency: "usd",
    status: "paid",
    paymentType: "rent",
    propertyId: "prop-202-pine",
    userId: "tenant-jason-reeves",
    description: "April rent",
    createdAt: "2026-04-03T12:30:00.000Z",
    propertyTitle: "202 Pine Ave, Austin",
    propertyAddress: "202 Pine Ave, Austin, TX",
    payerEmail: "jason.reeves@email.com",
  },
  {
    id: "demo-payment-3",
    amountCents: 180000,
    currency: "usd",
    status: "paid",
    paymentType: "rent",
    propertyId: "prop-303-elm",
    userId: "tenant-ashley-kimball",
    description: "April rent",
    createdAt: "2026-04-04T08:45:00.000Z",
    propertyTitle: "303 Elm Blvd, Austin",
    propertyAddress: "303 Elm Blvd, Austin, TX",
    payerEmail: "ashley.kimball@email.com",
  },
  {
    id: "demo-payment-4",
    amountCents: 320000,
    currency: "usd",
    status: "overdue",
    paymentType: "rent",
    propertyId: "prop-404-maple",
    userId: "tenant-nathan-briggs",
    description: "April rent",
    createdAt: "2026-04-05T10:05:00.000Z",
    propertyTitle: "404 Maple Rd, Austin",
    propertyAddress: "404 Maple Rd, Austin, TX",
    payerEmail: "nathan.briggs@email.com",
  },
  {
    id: "demo-payment-5",
    amountCents: 160000,
    currency: "usd",
    status: "pending",
    paymentType: "rent",
    propertyId: "prop-505-cedar",
    userId: "tenant-sophia-lund",
    description: "April rent",
    createdAt: "2026-04-06T14:20:00.000Z",
    propertyTitle: "505 Cedar Ln, Austin",
    propertyAddress: "505 Cedar Ln, Austin, TX",
    payerEmail: "sophia.lund@email.com",
  },
  {
    id: "demo-payment-6",
    amountCents: 170000,
    currency: "usd",
    status: "paid",
    paymentType: "rent",
    propertyId: "prop-606-birch",
    userId: "tenant-carlos-vega",
    description: "April rent",
    createdAt: "2026-04-07T16:40:00.000Z",
    propertyTitle: "606 Birch Court, Austin",
    propertyAddress: "606 Birch Court, Austin, TX",
    payerEmail: "carlos.vega@email.com",
  },
]

export const DEMO_TENANT_PAYMENT_HISTORY: PaymentRecord[] = [
  {
    id: "tenant-pay-1",
    stripePaymentIntentId: "pi_demo_001",
    amountCents: 185000,
    currency: "usd",
    status: "succeeded",
    paymentType: "rent",
    propertyId: "prop-101-oak",
    description: "April 2026 rent",
    createdAt: "2026-04-01T08:15:00.000Z",
    updatedAt: "2026-04-01T08:16:00.000Z",
  },
  {
    id: "tenant-pay-2",
    stripePaymentIntentId: "pi_demo_002",
    amountCents: 185000,
    currency: "usd",
    status: "succeeded",
    paymentType: "rent",
    propertyId: "prop-101-oak",
    description: "March 2026 rent",
    createdAt: "2026-03-01T08:12:00.000Z",
    updatedAt: "2026-03-01T08:13:00.000Z",
  },
  {
    id: "tenant-pay-3",
    stripePaymentIntentId: "pi_demo_003",
    amountCents: 185000,
    currency: "usd",
    status: "succeeded",
    paymentType: "rent",
    propertyId: "prop-101-oak",
    description: "February 2026 rent",
    createdAt: "2026-02-01T08:10:00.000Z",
    updatedAt: "2026-02-01T08:11:00.000Z",
  },
  {
    id: "tenant-pay-4",
    stripePaymentIntentId: "pi_demo_004",
    amountCents: 185000,
    currency: "usd",
    status: "processing",
    paymentType: "rent",
    propertyId: "prop-101-oak",
    description: "May 2026 rent",
    createdAt: "2026-05-01T08:10:00.000Z",
    updatedAt: "2026-05-01T08:10:30.000Z",
  },
]

export const DEMO_SHARED_DOCUMENTS: SeedDocument[] = [
  {
    id: "demo-doc-lease",
    name: "Lease Agreement - 101 Oak St.pdf",
    type: "pdf",
    category: "lease",
    property: "101 Oak Street",
    size: "1.8 MB",
    uploadedAt: "2026-03-18T10:15:00.000Z",
    uploadedBy: "Ondo Operations",
    folder: "Leases",
    tag: "Lease",
    shared: true,
  },
  {
    id: "demo-doc-inspection",
    name: "Inspection Report Q1 2026.pdf",
    type: "pdf",
    category: "inspection",
    property: "404 Maple Rd",
    size: "2.4 MB",
    uploadedAt: "2026-03-29T15:30:00.000Z",
    uploadedBy: "Ondo Operations",
    folder: "Inspections",
    tag: "Inspection",
    shared: true,
  },
  {
    id: "demo-doc-insurance",
    name: "Insurance Certificate.pdf",
    type: "pdf",
    category: "insurance",
    property: "Portfolio",
    size: "860 KB",
    uploadedAt: "2026-04-03T09:05:00.000Z",
    uploadedBy: "Ondo Operations",
    folder: "Insurance",
    tag: "Insurance",
    shared: true,
  },
]

export const DEMO_OWNER_NOTIFICATIONS: Notification[] = [
  {
    id: "owner-note-1",
    userId: "demo-owner",
    type: "payment",
    title: "Rent payment received",
    message: "Rent payment received from Megan Carter - $2,400",
    read: false,
    actionUrl: "/owner/payments",
    createdAt: "2026-04-08T09:30:00.000Z",
  },
  {
    id: "owner-note-2",
    userId: "demo-owner",
    type: "maintenance",
    title: "Maintenance ticket assigned",
    message: "Maintenance ticket #4 assigned to vendor",
    read: false,
    actionUrl: "/owner/maintenance",
    createdAt: "2026-04-07T14:10:00.000Z",
  },
  {
    id: "owner-note-3",
    userId: "demo-owner",
    type: "lease",
    title: "Lease expiry approaching",
    message: "Lease for 505 Cedar Ln expires in 51 days",
    read: true,
    actionUrl: "/owner/tenants",
    createdAt: "2026-04-06T08:50:00.000Z",
  },
  {
    id: "owner-note-4",
    userId: "demo-owner",
    type: "screening",
    title: "New screening request",
    message: "New tenant screening request submitted",
    read: false,
    actionUrl: "/owner/screening",
    createdAt: "2026-04-05T16:45:00.000Z",
  },
  {
    id: "owner-note-5",
    userId: "demo-owner",
    type: "statement",
    title: "Statement ready",
    message: "Monthly statement for March 2026 is ready.",
    read: true,
    actionUrl: "/owner/finances",
    createdAt: "2026-04-04T10:20:00.000Z",
  },
]

export const DEMO_MAINTENANCE_TICKETS: MaintenanceRequest[] = [
  {
    id: "maint-demo-1",
    title: "Kitchen leak follow-up",
    description: "Inspect remaining moisture under the kitchen sink and confirm vendor repair completion.",
    category: "plumbing",
    priority: "high",
    status: "in_progress",
    propertyId: "prop-101-oak",
    tenantId: "tenant-megan-carter",
    assignedTo: "Jordan Blake",
    createdAt: "2026-04-09T08:00:00.000Z",
    updatedAt: "2026-04-10T09:00:00.000Z",
    dateScheduled: "2026-04-10T14:00:00.000Z",
    propertyTitle: "101 Oak Street, Austin",
    propertyAddress: "101 Oak Street, Austin, TX",
    tenantFirstName: "Megan",
    tenantLastName: "Carter",
    tenantEmail: "megan.carter@email.com",
  },
  {
    id: "maint-demo-2",
    title: "Replace hallway smoke detector",
    description: "Battery warning triggered in the second-floor hallway.",
    category: "electrical",
    priority: "medium",
    status: "pending",
    propertyId: "prop-202-pine",
    tenantId: "tenant-jason-reeves",
    assignedTo: "Jordan Blake",
    createdAt: "2026-04-08T12:20:00.000Z",
    updatedAt: "2026-04-09T10:45:00.000Z",
    dateScheduled: "2026-04-11T09:00:00.000Z",
    propertyTitle: "202 Pine Ave, Austin",
    propertyAddress: "202 Pine Ave, Austin, TX",
    tenantFirstName: "Jason",
    tenantLastName: "Reeves",
    tenantEmail: "jason.reeves@email.com",
  },
  {
    id: "maint-demo-3",
    title: "HVAC tune-up",
    description: "Seasonal maintenance before summer turnover.",
    category: "hvac",
    priority: "medium",
    status: "completed",
    propertyId: "prop-303-elm",
    tenantId: "tenant-ashley-kimball",
    assignedTo: "Jordan Blake",
    createdAt: "2026-04-04T11:00:00.000Z",
    updatedAt: "2026-04-09T16:10:00.000Z",
    dateScheduled: "2026-04-09T13:00:00.000Z",
    dateCompleted: "2026-04-09T16:00:00.000Z",
    propertyTitle: "303 Elm Blvd, Austin",
    propertyAddress: "303 Elm Blvd, Austin, TX",
    tenantFirstName: "Ashley",
    tenantLastName: "Kimball",
    tenantEmail: "ashley.kimball@email.com",
  },
  {
    id: "maint-demo-4",
    title: "Window latch replacement",
    description: "Bedroom window latch is no longer securing properly.",
    category: "windows",
    priority: "low",
    status: "pending",
    propertyId: "prop-404-maple",
    tenantId: "tenant-nathan-briggs",
    assignedTo: "Jordan Blake",
    createdAt: "2026-04-07T15:30:00.000Z",
    updatedAt: "2026-04-08T11:15:00.000Z",
    dateScheduled: "2026-04-12T10:30:00.000Z",
    propertyTitle: "404 Maple Rd, Austin",
    propertyAddress: "404 Maple Rd, Austin, TX",
    tenantFirstName: "Nathan",
    tenantLastName: "Briggs",
    tenantEmail: "nathan.briggs@email.com",
  },
  {
    id: "maint-demo-5",
    title: "Dishwasher diagnostic",
    description: "Dishwasher is stopping midway through the cycle and flashing an error code.",
    category: "appliances",
    priority: "high",
    status: "in_progress",
    propertyId: "prop-505-cedar",
    tenantId: "tenant-sophia-lund",
    assignedTo: "Jordan Blake",
    createdAt: "2026-04-06T09:45:00.000Z",
    updatedAt: "2026-04-10T07:30:00.000Z",
    dateScheduled: "2026-04-10T11:00:00.000Z",
    propertyTitle: "505 Cedar Ln, Austin",
    propertyAddress: "505 Cedar Ln, Austin, TX",
    tenantFirstName: "Sophia",
    tenantLastName: "Lund",
    tenantEmail: "sophia.lund@email.com",
  },
]

export const DEMO_MESSAGE_THREAD: MessageThread = {
  id: "demo-thread-maintenance-follow-up",
  subject: "Maintenance follow-up",
  propertyId: "prop-101-oak",
  createdBy: "tenant-megan-carter",
  createdAt: "2026-04-09T09:00:00.000Z",
  lastMessageAt: "2026-04-09T09:00:00.000Z",
  status: "open",
  priority: "normal",
  category: "maintenance",
  participants: [
    { userId: "tenant-megan-carter", role: "tenant", joinedAt: "2026-04-09T09:00:00.000Z" },
    { userId: "manager-demo", role: "manager", joinedAt: "2026-04-09T09:00:00.000Z" },
  ],
  unreadCount: 1,
}

export const DEMO_MESSAGE_RECORDS: MessageRecord[] = [
  {
    id: "demo-message-1",
    threadId: DEMO_MESSAGE_THREAD.id,
    senderId: "tenant-megan-carter",
    body: "Hi, just wanted to check in on the status of the kitchen leak repair. Has the vendor been scheduled?",
    mentions: [],
    channel: "portal",
    sentAt: "2026-04-09T09:00:00.000Z",
  },
]

export function shouldReplacePlaceholderThread(thread: MessageThread | null | undefined, messages: MessageRecord[] = []): boolean {
  if (!thread) return true
  const subject = thread.subject.trim().toLowerCase()
  const lastMessage = messages[0]?.body?.trim().toLowerCase()
  return subject.length <= 2 || subject === "nj" || lastMessage === "k"
}

export function getDemoNotifications(user?: UserLike | null): Notification[] {
  if (isOwnerDemoUser(user)) {
    return DEMO_OWNER_NOTIFICATIONS.map((notification) => ({
      ...notification,
      userId: user?.id ?? notification.userId,
    }))
  }
  return []
}

export function getDemoDashboardPayments(user?: UserLike | null): DashboardPaymentItem[] {
  if (isManagerDemoUser(user) || isOwnerDemoUser(user)) {
    return DEMO_DASHBOARD_PAYMENTS
  }
  return []
}

export function getDemoPaymentHistory(user?: UserLike | null): PaymentRecord[] {
  return isTenantDemoUser(user) ? DEMO_TENANT_PAYMENT_HISTORY : []
}

export function getDemoDocuments(user?: UserLike | null): SeedDocument[] {
  if (isManagerDemoUser(user) || isOwnerDemoUser(user) || isTenantDemoUser(user)) {
    return DEMO_SHARED_DOCUMENTS
  }
  return []
}

export function getDemoMaintenanceTickets(user?: UserLike | null): MaintenanceRequest[] {
  return isManagerDemoUser(user) || isMaintenanceDemoUser(user) ? DEMO_MAINTENANCE_TICKETS : []
}

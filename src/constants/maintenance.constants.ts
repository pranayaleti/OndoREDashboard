// Maintenance Status Options
export const MAINTENANCE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const MAINTENANCE_STATUSES_API = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

// Maintenance Priority Options
export const MAINTENANCE_PRIORITIES = [
  { value: "low", label: "Low", description: "Can wait a few days" },
  { value: "medium", label: "Medium", description: "Should be addressed soon" },
  { value: "high", label: "High", description: "Urgent, affects daily life" },
  { value: "emergency", label: "Emergency", description: "Immediate attention required" },
] as const

// Maintenance Category Options
export const MAINTENANCE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing", description: "Faucets, pipes, toilets, water heaters" },
  { value: "electrical", label: "Electrical", description: "Wiring, outlets, lighting, panels" },
  { value: "hvac", label: "HVAC", description: "Heating, cooling, ventilation systems" },
  { value: "appliances", label: "Appliances", description: "Dishwasher, refrigerator, washer/dryer" },
  { value: "structural", label: "Structural", description: "Walls, ceilings, foundation issues" },
  { value: "flooring", label: "Flooring", description: "Carpet, tile, hardwood, laminate" },
  { value: "windows", label: "Windows/Doors", description: "Window repair, door adjustments, locks" },
  { value: "pest_control", label: "Pest Control", description: "Rodents, insects, wildlife removal" },
  { value: "other", label: "Other", description: "General maintenance or other issues" },
] as const

const MAINTENANCE_PRIORITY_ALIASES: Record<string, string> = {
  normal: "medium",
  urgent: "high",
}

const MAINTENANCE_CATEGORY_ALIASES: Record<string, string> = {
  appliance: "appliances",
  pest: "pest_control",
  doors: "windows",
}

// Helper functions to get labels
export const getStatusLabel = (status: string): string => {
  const statusOption = [...MAINTENANCE_STATUSES, ...MAINTENANCE_STATUSES_API].find(
    (s) => s.value === status || s.value === status.replace("-", "_")
  )
  return statusOption?.label || status
}

export const getPriorityLabel = (priority: string): string => {
  const normalizedPriority = MAINTENANCE_PRIORITY_ALIASES[priority] || priority
  const priorityOption = MAINTENANCE_PRIORITIES.find((p) => p.value === normalizedPriority)
  return priorityOption?.label || normalizedPriority
}

export const getCategoryLabel = (category: string): string => {
  const normalizedCategory = MAINTENANCE_CATEGORY_ALIASES[category] || category
  const categoryOption = MAINTENANCE_CATEGORIES.find((c) => c.value === normalizedCategory)
  return categoryOption?.label || normalizedCategory.replace(/_/g, " ")
}

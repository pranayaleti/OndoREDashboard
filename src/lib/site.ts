// Site configuration constants - Imported from companyInfo for single source of truth
import { companyInfo } from "@/constants/companyInfo"

// Social media links array
export const SITE_SOCIALS = [
  companyInfo.urls.facebook,
  companyInfo.urls.instagram,
  companyInfo.urls.linkedin,
  companyInfo.urls.youtube,
  companyInfo.urls.linktree,
].filter(Boolean) // Remove any undefined/null values

// Address components
export const SITE_ADDRESS = `${companyInfo.address.streetAddress}, ${companyInfo.address.addressLocality}, ${companyInfo.address.addressRegion} ${companyInfo.address.postalCode}`
export const SITE_ADDRESS_STREET = companyInfo.address.streetAddress
export const SITE_ADDRESS_CITY = companyInfo.address.addressLocality
export const SITE_ADDRESS_REGION = companyInfo.address.addressRegion
export const SITE_ADDRESS_POSTAL_CODE = companyInfo.address.postalCode

// Phone
export const SITE_PHONE = companyInfo.phoneDisplay

// Emails
export const SITE_EMAILS = {
  primary: companyInfo.email,
  support: companyInfo.email, // Can be updated if separate support email exists
  sales: companyInfo.salesEmail,
}

// Hours label - formatted from companyInfo hours
export const SITE_HOURS_LABEL = (() => {
  const weekday = companyInfo.hours.find(h => h.day === "Mon-Fri")
  if (weekday) {
    // Convert 24-hour format to 12-hour format
    const [opensHour, opensMin] = (weekday.opens ?? "09:00").split(":").map(Number)
    const [closesHour, closesMin] = (weekday.closes ?? "17:00").split(":").map(Number)
    
    const opens12 = new Date(2000, 0, 1, opensHour, opensMin).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
    const closes12 = new Date(2000, 0, 1, closesHour, closesMin).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
    return `Monday - Friday: ${opens12} - ${closes12}`
  }
  return "Monday - Friday: 9am - 5pm"
})()


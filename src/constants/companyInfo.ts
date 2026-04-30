import { getCurrentLocale } from "@/lib/locale-format";

export const companyInfo = {
  name: "Ondo Real Estate",
  email: "pranay1917@gmail.com",
  calendlyUrl: "https://calendly.com/scheduleondo/30min",
  timezoneAbbr: "MST",
  timezoneIANA: "America/Denver",

  // Optional: if set, submissions will be POSTed here in addition to localStorage capture
  leadWebhookUrl: "",

  // E.164 formatted phone for links and structured data
  phoneE164: "+14085380420",

  // Human-friendly phone for display
  phoneDisplay: "+1 (408) 538-0420",

  address: {
    streetAddress: "2701 N Thanksgiving Way",
    addressLocality: "Lehi",
    addressRegion: "Utah",
    postalCode: "84043",
    addressCountry: "US",
  },

  hours: [
    { day: "Mon-Fri", opens: "09:00", closes: "18:00", timeZone: "America/Denver" },
    { day: "Sat", opens: "10:00", closes: "14:00", timeZone: "America/Denver" },
    { day: "Sun", closed: true },
  ],

  urls: {
    website: "https://ondorealestate.com",
    github: "https://github.com/ondorealestate",
    linkedin: "https://linkedin.com/company/ondorealestate",
    facebook: "https://facebook.com/ondorealestate",
    twitter: "https://twitter.com/ondorealestate",
    instagram: "https://instagram.com/ondorealestate",
    youtube: "https://youtube.com/@ondorealestate",
    linktree: "https://linktr.ee/ondorealestate",
  },

  foundingDate: "2020", // Year only for schema markup
  foundingDateDisplay: "2020", // Human-readable format

  // Geographic coordinates
  coordinates: {
    latitude: "40.3916",
    longitude: "-111.8508",
  },

  // Geographic center of service area (US center for nationwide coverage)
  serviceAreaCenter: {
    latitude: "39.8283",
    longitude: "-98.5795",
    radius: "2000000", // 2000km radius for nationwide coverage
  },

  // Social media handles
  social: {
    twitter: "@ondorealestate",
    twitterDomain: "ondorealestate.com",
    github: "ondorealestate",
    linkedin: "ondorealestate",
    facebook: "ondorealestate",
    instagram: "ondorealestate",
    youtube: "@ondorealestate",
    linktree: "ondorealestate",
  },

  // Location display strings
  location: {
    full: "Lehi, Utah, United States",
    short: "Lehi, Utah, USA",
    geoRegion: "US-UT",
    country: "United States",
    countryShort: "USA",
  },

  // Logo path and dimensions
  logo: {
    path: "favicon.svg", // Use with import.meta.env.BASE_URL when needed
    width: 64,
    height: 64,
  },

  // OG image dimensions
  ogImage: {
    width: 1200,
    height: 630,
  },

  // Ratings and reviews
  ratings: {
    value: "4.9",
    reviewCount: "127", // Primary review count
    reviewCountAlt: "500", // Alternative count for some schema
    bestRating: "5",
    worstRating: "1",
    display: "4.9/5",
  },

  // Sales email (separate from contact email)
  salesEmail: "pranay1917@gmail.com",

  // Form placeholders
  placeholders: {
    email: "your@email.com",
    url: "https://example.com",
  },

  // Company size options
  companySizes: [
    { value: "1", label: "only 1 employee" },
    { value: "1-3", label: "1-3 employees" },
    { value: "4-10", label: "4-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
  ],

  // Invoice/payment terms
  invoiceTerms: {
    days: "15-30",
    description: "15-30 days",
  },
};

export interface DetectedTimezone {
  iana: string;
  abbreviation: string;
  display: string;
  isFallback: boolean;
}

export const companyTimezone: DetectedTimezone = {
  iana: companyInfo.timezoneIANA,
  abbreviation: companyInfo.timezoneAbbr,
  display: `${companyInfo.timezoneAbbr} (${companyInfo.timezoneIANA})`,
  isFallback: true,
};

// Helper function to generate canonical URL
export function getCanonicalUrl(path = '') {
  const baseUrl = companyInfo.urls.website;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return path ? `${baseUrl}${cleanPath}` : baseUrl;
}

export function getPostalAddressSchema() {
  return {
    "@type": "PostalAddress",
    streetAddress: companyInfo.address.streetAddress,
    addressLocality: companyInfo.address.addressLocality,
    addressRegion: companyInfo.address.addressRegion,
    postalCode: companyInfo.address.postalCode,
    addressCountry: companyInfo.address.addressCountry,
  };
}

export function getContactPointSchema(contactType = "customer service") {
  return {
    "@type": "ContactPoint",
    telephone: companyInfo.phoneE164,
    contactType,
    email: companyInfo.email,
  };
}

// Helper function to format opening hours for schema markup
export function getOpeningHoursSchema() {
  return companyInfo.hours
    .filter(schedule => !schedule.closed)
    .map(schedule => {
      const dayMap: Record<string, string> = {
        "Mon-Fri": "Mo-Fr",
        "Sat": "Sa",
        "Sun": "Su"
      };
      const day = dayMap[schedule.day] || schedule.day;
      return `${day} ${schedule.opens}-${schedule.closes}`;
    });
}

// Helper function to get weekday hours (Mon-Fri)
export function getWeekdayHours() {
  const weekday = companyInfo.hours.find(h => h.day === "Mon-Fri");
  return weekday ? { opens: weekday.opens, closes: weekday.closes } : null;
}

// Helper function to get user's timezone in a user-friendly format
export function getUserTimezone(): DetectedTimezone {
  if (typeof window === "undefined" || typeof Intl === "undefined") {
    return companyTimezone;
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get timezone abbreviation (e.g., "PST", "EST", "GMT")
    const date = new Date();
    const formatter = new Intl.DateTimeFormat(getCurrentLocale(), {
      timeZone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzAbbr = parts.find((part) => part.type === "timeZoneName")?.value || "";
    const friendlyName = tzAbbr || timeZone.split("/").pop()?.replace(/_/g, " ") || companyInfo.timezoneAbbr;

    // Return both IANA timezone and abbreviation for convenience
    return {
      iana: timeZone,
      abbreviation: tzAbbr || friendlyName,
      display: tzAbbr || friendlyName,
      isFallback: false,
    };
  } catch (error) {
    console.warn("Failed to detect timezone:", error);
    return {
      iana: companyInfo.timezoneIANA,
      abbreviation: companyInfo.timezoneAbbr,
      display: companyInfo.timezoneAbbr,
      isFallback: true,
    };
  }
}

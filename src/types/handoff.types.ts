export interface Contact {
  name: string
  phone: string
  email?: string
  emergencyLine?: string
  notes?: string
}

export interface UtilityInfo {
  provider: string
  accountNumber?: string
  customerServicePhone?: string
  setupInstructions?: string
  averageMonthlyCost?: number
  paymentDueDate?: string
  onlinePortalLink?: string
  includedInRent: boolean
}

export interface ServiceInfo {
  provider: string
  accountNumber?: string
  phone?: string
  website?: string
  notes?: string
}

export interface TrashInfo {
  collectionDays: {
    trash: string[]
    recycling: string[]
    bulk: string[]
  }
  binLocation: string
  specialInstructions?: string
  bulkPickupSchedule?: string
  hazardousWasteDisposal?: string
}

export interface KeyInfo {
  label: string
  location?: string
  notes?: string
  photoUrl?: string
}

export interface AccessCode {
  type: string
  code: string
  location?: string
  instructions?: string
  photoUrl?: string
}

export interface GarageDoorOpener {
  label: string
  code?: string
  remoteLocation?: string
  photoUrl?: string
  duplicateInfo?: string
}

export interface AlarmInfo {
  provider?: string
  code?: string
  contact?: string
  monitoringInfo?: string
  instructions?: string
}

export interface MailboxInfo {
  number: string
  location: string
  keyDetails?: string
  packageDeliveryArea?: string
  parcelLockerInstructions?: string
  mailHoldProcedure?: string
}

export interface Appliance {
  name: string
  model?: string
  location?: string
  manualLink?: string
  instructions?: string
  type: 'refrigerator' | 'stove' | 'oven' | 'dishwasher' | 'washer' | 'dryer' | 'microwave' | 'garbage_disposal' | 'hvac' | 'water_heater' | 'other'
  details?: Record<string, string>
}

export interface HouseRules {
  smoking: string
  pets?: string
  quietHours?: string
  guests?: string
  subletting?: string
  modifications?: string
  grilling?: string
  poolRules?: string
  other?: string
}

export interface Place {
  name: string
  address?: string
  phone?: string
  distance?: string
  notes?: string
}

export interface School {
  name: string
  type: 'elementary' | 'middle' | 'high' | 'district'
  address?: string
  phone?: string
  website?: string
  busStop?: string
}

export interface TransportInfo {
  publicTransit?: string
  busStops?: string[]
  trainStations?: string[]
  rideShareSpots?: string[]
  bikeLanes?: string
  airportDistance?: string
  airportDirections?: string
}

export interface LocalService {
  name: string
  schedule?: string
  contact?: string
  notes?: string
  type: 'trash' | 'street_cleaning' | 'snow_removal' | 'lawn_care' | 'pest_control' | 'hoa' | 'other'
}

export interface SafetyInfo {
  fireExtinguisherLocations?: string[]
  smokeDetectorLocations?: string[]
  carbonMonoxideDetectorLocations?: string[]
  emergencyExits?: string[]
  evacuationRoutes?: string[]
  severeWeatherProcedures?: string
  waterMainShutOff?: string
  electricalPanelLocation?: string
  gasShutOffLocation?: string
  safetyEquipmentLocation?: string
}

export interface ParkingInfo {
  assignedSpots?: string[]
  guestParking?: string
  parkingPermits?: string
  streetParkingRegulations?: string
  storageUnitDetails?: string
  bikeStorageArea?: string
}

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  category: string
}

export interface Document {
  id: string
  name: string
  type: string
  url?: string
  uploadDate?: Date
  notes?: string
  size?: string
}

export interface SeasonalTip {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  tips: string[]
}

export interface FAQ {
  question: string
  answer: string
}

export interface PropertyHandoff {
  id: string
  propertyId: string
  propertyAddress: string
  unitNumber?: string
  createdDate: Date
  lastUpdated: Date
  
  propertyBasics: {
    propertyType: string
    squareFootage: number
    bedrooms: number
    bathrooms: number
    parking: string
    moveInDate: Date
    leaseTerm: string
    securityDeposit: number
    securityDepositReturnTerms?: string
  }
  
  emergencyContacts: Contact[]
  
  utilities: {
    electric: UtilityInfo
    gas?: UtilityInfo
    water: UtilityInfo
    internet: ServiceInfo[]
    trash: TrashInfo
  }
  
  access: {
    keys: KeyInfo[]
    codes: AccessCode[]
    alarm?: AlarmInfo
    garageDoorOpeners?: GarageDoorOpener[]
    keyDuplicationInfo?: string
  }
  
  mailbox: MailboxInfo
  
  appliances: Appliance[]
  
  maintenance: {
    requestMethod: string
    contacts: Contact[]
    responseTimes: string
    responsibilities: string
    preferredContractors?: Contact[]
    preventiveMaintenanceSchedule?: string
    filterChangeInfo?: string
  }
  
  policies: HouseRules
  
  neighborhood: {
    grocery: Place[]
    dining: Place[]
    services: Place[]
    healthcare: Place[]
    recreation: Place[]
    schools: School[]
    transportation: TransportInfo
  }
  
  localServices: LocalService[]
  
  safety: SafetyInfo
  
  parking: ParkingInfo
  
  moveInChecklist: ChecklistItem[]
  
  documents: Document[]
  
  seasonalInfo: SeasonalTip[]
  
  faqs: FAQ[]
  
  ownerNotes?: string
}


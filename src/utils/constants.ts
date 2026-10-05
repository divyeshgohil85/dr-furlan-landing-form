// API Configuration
export const API_BASE_URL = "https://services.leadconnectorhq.com";
export const BOOKING_API_BASE_URL = "https://backend.leadconnectorhq.com";
export const BOOKING_API_VERSION = "2021-04-15";

// North Shore Smiles Configuration
export const DENTIQUE_CONFIG = {
  GHL_API_KEY: import.meta.env.VITE_DENTIQUE_GHL_API_KEY,
  LOCATION_ID: import.meta.env.VITE_DENTIQUE_LOCATION_ID,
  BOOKING_LOCATION_ID: import.meta.env.VITE_DENTIQUE_BOOKING_LOCATION_ID,
  TIMEZONE: import.meta.env.VITE_DENTIQUE_TIMEZONE,
  COMPANY_NAME: import.meta.env.VITE_DENTIQUE_COMPANY_NAME,
  WEBSITE_URL: import.meta.env.VITE_DENTIQUE_WEBSITE_URL,
  PIPELINE_ID: import.meta.env.VITE_DENTIQUE_PIPELINE_ID,
  PIPELINE_STAGE_ID: import.meta.env.VITE_DENTIQUE_PIPELINE_STAGE_ID,
};

// Export AUTH_TOKEN for ghlApi.ts compatibility
export const AUTH_TOKEN = DENTIQUE_CONFIG.GHL_API_KEY;
export const LOCATION_ID = DENTIQUE_CONFIG.LOCATION_ID;
export const CALENDAR_ID = DENTIQUE_CONFIG.LOCATION_ID;
export const BOOKING_TIMEZONE = DENTIQUE_CONFIG.TIMEZONE;
export const BOOKING_LOCATION_ID = DENTIQUE_CONFIG.BOOKING_LOCATION_ID;
export const PIPELINE_ID = DENTIQUE_CONFIG.PIPELINE_ID;
export const PIPELINE_STAGE_ID = DENTIQUE_CONFIG.PIPELINE_STAGE_ID;
export const FORM_ID = "6ctKBR5jt0EeMl1fPicg";

// Smile Deals service IDs for deal-specific appointment types
export const SMILE_DEALS_SERVICE_IDS = [
  "69d428abaad381fb3766bab5", // Invisalign Consultation
  "69d4294d07d70d2fdaa251af", // ZOOM Whitening Exam
  "69d429bb4226b7564e8604cd", // Exam & Clean (new patient)
  "69d42a41e9e57949b3fc5552", // Exam & Clean (current patient)
  "69d42b5ceb881b437f7777cc", // General Dental Visit
  "69d4255d098a7a7a16a55482", // Dental Implant Consultation
  "69d42aa2597a0152c5f5370d", // Emergency Visit
  "69d42bce597a01e388f58f60", // Options for Treatment (instead of Sedation)
];

// Smile Deals service mapping for API calls (uses API service names)
export const SMILE_DEALS_SERVICE_MAP: Record<string, string> = {
  "Cosmetic Consultation": "69d42510d2fce46f38f19e91",
  "Crowns / Veneers Consultation": "69d428595a0720ef9943ea2c",
  "Invisalign Consultation": "69d428abaad381fb3766bab5",
  "Dental Implant Consultation": "69d4255d098a7a7a16a55482",
  "Exam & Clean (new patient)": "69d429bb4226b7564e8604cd",
  "Exam & Clean (current patient)": "69d42a41e9e57949b3fc5552",
  "General Dental Visit": "69d42b5ceb881b437f7777cc",
  "Emergency Visit": "69d42aa2597a0152c5f5370d",
  "ZOOM Whitening Exam": "69d4294d07d70d2fdaa251af",
  "Options for Treatment": "69d42bce597a01e388f58f60",
};

// Legacy calendar and user ID exports for compatibility
export const CALENDAR_ID_KEVIN = "";
export const CALENDAR_ID_BECKY = "";
export const USER_ID_KEVIN = "";
export const USER_ID_BECKY = "";

// Service display label to API name mapping
export const SERVICE_LABEL_TO_API_NAME: Record<string, string> = {
  "Cosmetics (brighten, shape or enhance teeth)": "Cosmetic Consultation",
  "General (fillings, dentures, gum issues, other)": "General Dental Visit",
  "Crowns/Veneers (restore teeth in one visit)": "Crowns / Veneers Consultation",
  "Invisalign (adults, teens or kids)": "Invisalign Consultation",
  "Dental Implants (single, multiple or all-on-4)": "Dental Implant Consultation",
  "Exam & Clean (new patient)": "Exam & Clean (new patient)",
  "Exam & Clean (existing patient)": "Exam & Clean (current patient)",
  "Tooth Whitening (in office or home)": "ZOOM Whitening Exam",
  "Options for Treatment / Other": "Options for Treatment",
  "Emergency (toothache, trauma, other)": "Emergency Visit",
  // Appointment Book services
  "New Patient Visit": "New Patient Visit",
  "Existing Patient Visit": "Existing Patient Visit",
};

// Reverse mapping: API name to display label
export const SERVICE_API_NAME_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_LABEL_TO_API_NAME).map(([label, apiName]) => [apiName, label])
);

// Services — display names for the dropdown (Appointment Book category only)
export const APPOINTMENT_BOOK_CATEGORY_ID = "6aadcd4896ad86951c72abe1";

export const APPOINTMENT_BOOK_SERVICES = [
  "New Patient Visit",
  "Existing Patient Visit",
];

// Services — display names for the dropdown (filtered to Appointment Book category)
export const APPLECROSS_SERVICES = APPOINTMENT_BOOK_SERVICES;

// Providers — master list with real API staff IDs and photos
export const APPLECROSS_PROVIDERS = [
  {
    id: "TuBfz07nKmhXGMP6BVS0",
    name: "Dr. Camelia Furlan",
    profilePhoto: "https://msgsndr-private.storage.googleapis.com/user/TuBfz07nKmhXGMP6BVS0/profile/94dd3af7-8169-4d23-98cf-84d2f4f0a8af.png",
  },
];

// Service of Interest mapping - maps reason for visit to service of interest values
export const SERVICE_OF_INTEREST_MAP: Record<string, string> = {
  "Invisalign (adults, teens or kids)": "Invisalign (Clear Aligners)",
  "Tooth Whitening (in office or home)": "ZOOM Tooth Whitening",
  "Exam & Clean (new patient)": "Check Up & Clean",
  "Exam & Clean (existing patient)": "Check Up & Clean",
  "General (fillings, dentures, gum issues, other)": "General Dental Concern",
  "Dental Implants (single, multiple or all-on-4)": "Dental Implants (single or multiple)",
  "Emergency (toothache, trauma, other)": "Dental Emergency",
  "Options for Treatment / Other": "Options for Treatment",
  "Cosmetics (brighten, shape or enhance teeth)": "Cosmetics",
  "Crowns/Veneers (restore teeth in one visit)": "Same Day Crowns & Veneers",
  // Appointment Book services
  "New Patient Visit": "New Patient Visit",
  "Existing Patient Visit": "Existing Patient Visit",
};

// Visit Type picklist mapping - maps display names to API picklist values (Dr. Furlan specific)
export const VISIT_TYPE_PICKLIST_MAPPING: Record<string, string> = {
  "Cosmetics (brighten, shape or enhance teeth)": "Cosmetics",
  "General (fillings, dentures, gum issues, other)": "General Dental Visit",
  "Crowns/Veneers (restore teeth in one visit)": "Veneers Consultation",
  "Invisalign (adults, teens or kids)": "Invisalign Consultation",
  "Dental Implants (single, multiple or all-on-4)": "Implant Consultation",
  "Exam & Clean (new patient)": "Exam & Clean (new patient)",
  "Exam & Clean (existing patient)": "Exam & Clean (current patient)",
  "Tooth Whitening (in office or home)": "ZOOM Whitening",
  "Options for Treatment / Other": "Other Service",
  "Emergency (toothache, trauma, other)": "Emergency Visit",
  // Appointment Book services
  "New Patient Visit": "New Patient Visit",
  "Existing Patient Visit": "Existing Patient Visit",
};

// Legacy exports for compatibility
export const visitTypes = APPLECROSS_SERVICES;
export const providers = APPLECROSS_PROVIDERS;

// Location configuration
export const LOCATIONS = {
  NORTHSHORE: {
    name: "North Shore Smiles",
    url: "https://downing.smiledocsnetwork.com/",
    providers: ["BCKrqfKxn1rhe6658jkW"],
  },
};

export const locations = [
  "North Shore Smiles",
];

// Brand color palette
export const BRAND_COLORS: Record<string, string> = {
  northshore: "#2E495C",
  smileDocs: "#2E495C",
  smileDocsNetwork: "#2E495C",
};

export const patientType = [
  "New Patient",
  "Current Patient",
  "Returning Patient",
];

export const patientTypeMap: Record<string, string> = {
  "New Patient": "NP",
  "Current Patient": "CP",
  "Returning Patient": "RP",
  "New Patient Visit": "NP",
  "Existing Patient Visit": "CP",
};

// Service ID mapping - maps display names to API service IDs
const SERVICE_ID_MAP: Record<string, string> = {
  "Invisalign Consultation": "69d428abaad381fb3766bab5",
  "ZOOM Whitening Exam": "69d4294d07d70d2fdaa251af",
  "Exam & Clean (new patient)": "69d429bb4226b7564e8604cd",
  "Exam & Clean (current patient)": "69d42a41e9e57949b3fc5552",
  "General Dental Visit": "69d42b5ceb881b437f7777cc",
  "Dental Implant Consultation": "69d4255d098a7a7a16a55482",
  "Emergency Visit": "69d42aa2597a0152c5f5370d",
  "Options for Treatment": "69d42bce597a01e388f58f60",
  // Appointment Book services
  "New Patient Visit": "6aadcb418ec53b135e10a2e1",
  "Existing Patient Visit": "6aadd70a8a9fcc8441cafc58",
};

export const APPLECROSS_SERVICE_IDS: Record<string, string> = SERVICE_ID_MAP;

// Display label to service ID mapping - maps dropdown display names to API service IDs
export const DISPLAY_LABEL_TO_SERVICE_ID: Record<string, string> = {
  "Cosmetics (brighten, shape or enhance teeth)": "69d42510d2fce46f38f19e91",
  "General (fillings, dentures, gum issues, other)": "69d42b5ceb881b437f7777cc",
  "Crowns/Veneers (restore teeth in one visit)": "69d428595a0720ef9943ea2c",
  "Invisalign (adults, teens or kids)": "69d428abaad381fb3766bab5",
  "Dental Implants (single, multiple or all-on-4)": "69d4255d098a7a7a16a55482",
  "Exam & Clean (new patient)": "69d429bb4226b7564e8604cd",
  "Exam & Clean (existing patient)": "69d42a41e9e57949b3fc5552",
  "Tooth Whitening (in office or home)": "69d4294d07d70d2fdaa251af",
  "Options for Treatment / Other": "69d42bce597a01e388f58f60",
  "Emergency (toothache, trauma, other)": "69d42aa2597a0152c5f5370d",
  // Appointment Book services
  "New Patient Visit": "6aadcb418ec53b135e10a2e1",
  "Existing Patient Visit": "6aadd70a8a9fcc8441cafc58",
};

// Service to Provider mapping - maps service names to available provider IDs
export const SERVICE_TO_PROVIDER_MAP: Record<string, string[]> = {
  "Invisalign Consultation": ["TuBfz07nKmhXGMP6BVS0"],
  "ZOOM Whitening Exam": ["TuBfz07nKmhXGMP6BVS0"],
  "Exam & Clean (new patient)": ["TuBfz07nKmhXGMP6BVS0"],
  "Exam & Clean (current patient)": ["TuBfz07nKmhXGMP6BVS0"],
  "General Dental Visit": ["TuBfz07nKmhXGMP6BVS0"],
  "Dental Implant Consultation": ["TuBfz07nKmhXGMP6BVS0"],
  "Emergency Visit": ["TuBfz07nKmhXGMP6BVS0"],
  "Options for Treatment": ["TuBfz07nKmhXGMP6BVS0"],
};

// Custom Field IDs for GHL API - North Shore Smiles Account (from curl & JSON)
export const CUSTOM_FIELD_IDS = {
  // Visit & Provider Fields
  VISIT_TYPE: "rs3HlSvoJjKxFAtSfe0M",
  PROVIDER: "yWjdyXtUTY3rUDUydRUB",
  LOCATION_SD: "c8vZFUNSmII6EOlxEG7a",
  REASON_FOR_VISIT: "71C56X17dTWMOQgcOX7T", // contact.reason_for_visit

  // Service & Patient Type Fields
  SERVICE_OF_INTEREST: "XNvUQqt3nGZZXV96iYyo", // service_of_interest
  PATIENT_TYPE: "UeMXw4u7UCqNLrU052Pv",

  // Date & Time Fields
  APPOINTMENT_DATE: "vmvs7qlBRHS97AGNLtFr",
  APPOINTMENT_TIME: "m5MAr1XiByHytXMwOgof",
  CONTACT_DATE: "aEvU7fo0UOKz45K02Sl4",
  DATE_SUBMITTED: "Vtb4i4ly0ZRw6BrJcQBI",
  APPOINTMENT_CREATED_DATE: "vmvs7qlBRHS97AGNLtFr",
  LAST_INTERACTION_DATE: "FlyNufbUa5NlosCpEpgv",
  LAST_CONVERSION_DATE: "n6iZpOY8lMssJeuFmAD9",
  LAST_VISIT_DATE: "jKtNV2FI1ULvXEnXxVtl",
  LAST_VISIT: "emkIq85EPO0vq0OZbTUs",
  LAST_APPOINTMENT_DATE: "jNpnqad3nmhHgLJu8xT3",
  LAST_FORM_SUBMISSION_DATE: "a9W4nwftMcgq5ZMLTXww",
  FIRST_VISIT_DATE_LOCKED: "Qj2pj8fC4IPqEWAosJAc",
  FIRST_OPPORTUNITY_DATE_LOCKED: "lyqcRUB4faAXFiVkuXFv",
  ORIGINAL_START_DATE: "0GvYymhuKIlxGB1Pqiac",
  DATE_ENTERED: "3XYYy9iEkvpo3la10Yuy",

  // Booking & Source Fields
  BOOKING_SOURCE: "hPr3fsEHLtWWLenMgSpk",
  BOOKING_PAGE: "kGzTM5vXFoIZhTJx5o1K",
  BOOKING_MEDIUM: "6kQAQD9Vq1Wk8GNbklcv",
  LEAD_SOURCE: "Bx1mSeKPXDU7FR8OMDyn",
  LEAD_MEDIUM: "Kyv9n7SaB9IoErNV3oMk",
  MEDIUM: "mL3VCeXzhrGuCo6xA1LX",
  REFERRAL_SOURCE: "SFTeiS6O27c4wswgkKpO",
  WHICH_PAGE: "unNuvbTVluhClwanH4Lz",
  ENTRY_SERVICE: "vdW0DRvA1Thu3BkI36GJ",

  // Locked Fields (Program, Origin, Channel, Action, Acquisition)
  PRIMARY_MARKETING_PROGRAM_LOCKED: "hyq89RoWZZZHZLtovhmv",
  PROGRAM: "8wSALCDNjPzZlSvjitBN",
  ORIGIN_LOCKED: "AyWTnOkJrcIsiYyw1K2z",
  CHANNEL_LOCKED: "7umQoJAhdfbjctPeFdkx",
  ACTION_LOCKED: "tN5yJXcAZTiyGF5BtHyg",
  AQUISITION_SOURCE_LOCKED: "DMfImIVqFE6vtdPq5b3D",
  OPTIN_DATE_LOCKED: "CSohlLb2jMmLoGaVg5Sp",
  DATABASE_IMPORT_DATE_LOCKED: "pIH0mJPCdlnxeDBUtdV4",
  STATUS: "VYYrprxut3rQk2oSPUuw",
  MEDIUM_LOCKED: "mL3VCeXzhrGuCo6xA1LX",

  // Notes & Info Fields
  APPOINTMENT_NOTES: "KkQF5jDsZwdYIWVY7AYf",
  APPOINTMENT_NOTES_FIELD: "KkQF5jDsZwdYIWVY7AYf",
  MESSAGE: "cduGFCziUuq8sbWLvH6M",
  MESSAGE_EVENT: "G7aXwxqpytl7IVmiHckW",
  MESSAGE_SD: "KmFvX7qVkL25nc7ykzgw",
  MESSAGE_FORM: "cduGFCziUuq8sbWLvH6M",
  DENTAL_CONCERNS: "JEYXlKTQQWjoYqJH6YOj",
  HOW_DID_YOU_FIND_US: "fkfj7vuLYWIBsAIfIxGk",
  HOW_DID_YOU_HEAR_ABOUT_US: "fkfj7vuLYWIBsAIfIxGk",
  ADDITIONAL_INFORMATION: "ut3NXKecuIBDiuYlctE4",

  // Voucher Fields
  VOUCHER_INVISALIGN: "BRwU0qtxGaNKQCrJNABi",
  VOUCHER_ZOOM: "Mo6MYLsUvJspwj4Wq75T",
  VOUCHER_FSA: "8tOQn1evNgfFTPWwPVkl",
  VOUCHER_EXAM: "uY766efSmMTy45PchGER",
  SMILE_DEALS_VOUCHERS: "QGWCJCMC7V0gBZEKLhJx",
  SMILE_DEALS_VOUCHERS_ADDON: "HDE2jmOJIM7WNNNivO14",
  SMILE_DEALS_SINGLE_LINE: "RG8gSPsBdsiqivsKciks",
  SMILE_DEALS_OPTIN_DATE: "9eSiO1rVS99pBucZDvhv",
  BIRTHDAY_SMILE_DEALS_OPTIN_DATE: "ZO2kouNkj1gSqVyoLZf1",
  SMILE_DEALS_EVENT_DISCOUNT: "mib9eJBOfZvYdi9YlNRv",
  SMILE_DEALS_OFFERS: "mzmuKy3YRCZcsbK6Vahe",

  // Additional Fields
  OFFER_OPTED_INTO: "UfYPv119KAJT5Dm1us6z",
  FREE_GIFT: "8CGu9WsAYpsUI5cOABq0",
  FREE_GIFT_CHOICE: "8CGu9WsAYpsUI5cOABq0",
  OPERATOR: "fBsVkywDlUrKVhv7VPoT",
  STAGE: "uI9f6N3zSVrJdIs6am5U",
  STATUS_OLD: "VYYrprxut3rQk2oSPUuw",
  SERVICE_OLD: "VIPvTmkP2KI7qGkbCPgQ",
  REENGAGEMENT_SOURCE: "umTuv7lFQqEkZMVsGeV4",
  REENGAGEMENT_DATE: "sHEjFTEgAXNFQSZLHBew",
  VISIT_TIME: "w73jkDIeno4MON51szwn",
  VISIT_DATE: "RsxKeNXSI3Dcd2GfJoRh",
  NEW_OR_CURRENT_PATIENT: "L5fdhirQJH2usNrKdsSu",
  REASON_FOR_APPOINTMENT: "JEYXlKTQQWjoYqJH6YOj",
  OFFICE: "c8vZFUNSmII6EOlxEG7a",
  WHICH_FORM: "xgPgetNFl6vICgTdpcjg",
  WHICH_WEBFORM: "ncUofBBezvrYiKK7hsiX",
  PRIMARY_SOURCE: "hyq89RoWZZZHZLtovhmv",
  CONTACT_DATE_FIELD: "aEvU7fo0UOKz45K02Sl4",
  PATIENT_TYPE_NEW: "L5fdhirQJH2usNrKdsSu",
  LATEST_APPOINTMENT_DATETIME: "kWUWAGSNY4q71iVTCRyo",
};

// Additional utility functions
export const createDynamicServiceProviders = (staffData?: any[]) => staffData || APPLECROSS_PROVIDERS;
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const getPageSlug = (): string => {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname || "";
  const normalized = path.replace(/(^\/+|\/+$)/g, "");
  return normalized || "/";
};

// Default field values for Dr. Furlan booking system
export const DEFAULT_FIELD_VALUES = {
  PROGRAM: "Doctorpreneur",
  STAGE: "Prospect",
  MEDIUM_LOCKED: "Organic",
  BOOKING_MEDIUM: "Booking Widget",
  ACTION_LOCKED: "Appointment Booking",
  ORIGIN_LOCKED: "Doctorpreneur Program",
  PRIMARY_MARKETING_PROGRAM_LOCKED: "Doctorpreneur Program",
  CHANNEL_LOCKED: "Website",
  AQUISITION_SOURCE_LOCKED: "Website - Booking",
};

// Brand-specific field values
export const BRAND_FIELD_VALUES: Record<string, {
  PROGRAM: string;
  ORIGIN_LOCKED: string;
  PRIMARY_MARKETING_PROGRAM_LOCKED: string;
  AQUISITION_SOURCE_LOCKED: string;
}> = {
  "dentique": {
    PROGRAM: "Doctorpreneur",
    ORIGIN_LOCKED: "Dentique Dental Spa",
    PRIMARY_MARKETING_PROGRAM_LOCKED: "Dentique Dental Spa",
    AQUISITION_SOURCE_LOCKED: "Dentique Dental Spa - Booking",
  },
  "smile-docs": {
    PROGRAM: "Doctorpreneur",
    ORIGIN_LOCKED: "Smile Docs®",
    PRIMARY_MARKETING_PROGRAM_LOCKED: "Smile Docs®",
    AQUISITION_SOURCE_LOCKED: "Smile Docs® - Booking",
  },
  "dr-furlan": {
    PROGRAM: "Doctorpreneur",
    ORIGIN_LOCKED: "Smile Docs®",
    PRIMARY_MARKETING_PROGRAM_LOCKED: "Smile Docs®",
    AQUISITION_SOURCE_LOCKED: "Smile Docs® - Booking",
  },
  "SDL": {
    PROGRAM: "Doctorpreneur",
    ORIGIN_LOCKED: "Smile Docs®",
    PRIMARY_MARKETING_PROGRAM_LOCKED: "Smile Docs®",
    AQUISITION_SOURCE_LOCKED: "Smile Docs® - Booking",
  },
  "smile-deals": {
    PROGRAM: "Doctorpreneur",
    ORIGIN_LOCKED: "Smile Deals®",
    PRIMARY_MARKETING_PROGRAM_LOCKED: "Smile Deals®",
    AQUISITION_SOURCE_LOCKED: "Smile Deals® - Booking",
  },
};

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to get current datetime for Latest Appointment date/time
export const getCurrentDateTime = (): string => {
  const now = new Date();
  return now.toISOString();
};

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GHL_API_KEY: string
  readonly VITE_GHL_LOCATION_ID: string
  readonly VITE_GHL_CALENDAR_ID: string
  readonly VITE_KEVIN_GHL_CALENDAR_ID: string
  readonly VITE_BECKY_GHL_CALENDAR_ID: string
  readonly VITE_MEETING_LOCATION_ID_FLORENCE: string
  readonly VITE_MEETING_LOCATION_ID_MURRELLS_INLET: string
  readonly VITE_MEETING_LOCATION_ID_NORTH_MYRLE_BEACH: string
  readonly VITE_GHL_USER_ID: string
  readonly VITE_KEVIN_GHL_USER_ID: string
  readonly VITE_BECKY_GHL_USER_ID: string
  readonly VITE_GHL_PIPELINE_ID: string
  readonly VITE_GHL_PIPELINE_SCHEDULE_STAGE_ID: string
  readonly VITE_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

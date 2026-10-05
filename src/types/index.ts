export interface Service {
  id: string;
  name: string;
  duration?: number;
  staff?: Staff[];
}

export interface Staff {
  id: string;
  name: string;
  image?: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  name: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export interface SlotObject {
  raw: Slot;
  iso: string;
  label: string;
  dateKey: string;
  period: string;
}

export interface FormValues {
  reasonForVisit: string; // Type of Visit (service selection)
  reasonForVisitDetail: string; // Reason for Visit (custom field detail)
  provider: string;
  date: string;
  time: string;
  patientType: string; // Auto-set based on reason for visit, not shown in UI
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  howDidYouHear: string;
  whichPage: string;
  appointmentNotes: string;
  termsAccepted: boolean;
}

export interface LoadingState {
  services: boolean;
  availability: boolean;
  submission: boolean;
}

export interface FormData {
  serviceId: string;
  staffId: string;
  locationId: string;
}

export interface DropdownProps {
  name: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  color?: string;
  disabled?: boolean;
  disabledText?: string;
}

export interface BookingPayload {
  appointmentTitle: string;
  locationId: string;
  formData: Record<string, any>;
  formId: string;
  source: string;
  selectedSlotInfo: {
    services: Array<{
      id: string;
      position: number;
      staffId: string;
    }>;
    serviceLocationId: string;
    subAccountId: string;
    timezone: string;
    skipSchedulingNotice: boolean;
    startDate: string;
    endDate: string;
  };
}

export interface BookingResponse {
  success: boolean;
  message: string;
  contact?: {
    id: string;
    dateAdded: string;
    dateUpdated: string;
    deleted: boolean;
    tags: string[];
    type: string;
    customFields: Record<string, any>;
    locationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    timezone: string;
  };
  contactId?: string; // For backward compatibility
  dateAdded?: string;
  deleted?: boolean;
  status?: string;
  subAccountId?: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  serviceLocationId?: string;
  industryType?: string;

  createdBy?: {
    userId: string | null;
    source: string;
    channel: string;
    timestamp: string;
    traceId: string;
  };

  lastUpdatedBy?: {
    userId: string | null;
    source: string;
    channel: string;
    timestamp: string;
    traceId: string;
  };

  bookingMeta?: {
    slotType: string;
    formSubmissionId: string;
    termsAndConditions: string;
    ip: string;
    meetingLocation: string;
  };

  services?: {
    id: string;
    staffId: string;
    price: number;
  }[];

  dateUpdated?: string;
  appointmentTitle?: string;

  paymentMeta?: {
    currency: string;
    paymentStatus: string;
    paymentMode: string;
    totalAmount: number;
    subTotalAmount: number;
  };

  id?: string;

  events?: {
    title: string;
    startTime: string;
    endTime: string;
    assignedUserId: string;
    status: string;
    service: string;
    serviceBookingId: string;
    serviceId: string;
    id: string;
    serviceCategoryId: string;
    assignedResources: any[];
    address: string;
  }[];

  serviceBookingId: string;
  traceId: string;
  orderDetails?: any;
  formSubmissionResponse?: any;
}
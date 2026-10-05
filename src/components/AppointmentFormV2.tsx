import React, { useState, useEffect, useRef } from "react";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DatePicker, {
  ReactDatePickerCustomHeaderProps,
} from "react-datepicker";
import moment from "moment";
import "moment-timezone";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentFormV2.css";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  fetchBookingOptions,
  fetchBookingAvailability,
  confirmBooking,
  fetchBookingStaff,
  initiateBooking,
} from "../utils/bookingApi";
import { ErrorText } from "./ErrorText";
import {
  patientTypeMap,
  LOCATION_ID, FORM_ID, BOOKING_LOCATION_ID,
  getPageSlug,
  CUSTOM_FIELD_IDS,
  createDynamicServiceProviders,
  BOOKING_TIMEZONE,
  SERVICE_OF_INTEREST_MAP,
  VISIT_TYPE_PICKLIST_MAPPING, SERVICE_LABEL_TO_API_NAME,
  DEFAULT_FIELD_VALUES,
  BRAND_FIELD_VALUES,
  APPOINTMENT_BOOK_CATEGORY_ID
} from "../utils/constants";
import {
  getCustomFields,
} from "../utils/ghlApi";
import {
  addContactNote,
  getContactById,
  removeContactTags,
  updateContact,
} from "../utils/ghlApi";
import {
  FormValues,
  LoadingState,
  FormData,
  SlotObject,
  DropdownProps,
} from "../types";

const AppointmentFormV2: React.FC = () => {
  // State for API data
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);


  // Function to get providers dynamically based on selected service
  const getProvidersForService = (serviceName: string): string[] => {
    // Try to find service by exact name match first (using actual API service names)
    let service = services.find((s) => s.name === serviceName);

    // If not found, try by display name mapping
    if (!service) {
      const apiServiceName = SERVICE_LABEL_TO_API_NAME[serviceName] || serviceName;
      service = services.find((s) => s.name === apiServiceName);
    }

    // If still not found, try by visit type mapping
    if (!service) {
      const visitTypeValue = VISIT_TYPE_PICKLIST_MAPPING[serviceName] || serviceName;
      service = services.find((s) => s.name === visitTypeValue);
    }

    // If still not found, try partial match
    if (!service) {
      service = services.find(
        (s) =>
          s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
          serviceName.toLowerCase().includes(s.name.toLowerCase()),
      );
    }

    if (!service || !service.staff) {
      console.log("Service not found or no staff:", {
        serviceName,
        services: services.map((s) => s.name),
      });
      return [];
    }

    console.log("Found service:", {
      serviceName,
      foundService: service.name,
      staff: service.staff,
    });
    return service.staff.map((staff: any) => staff.id);
  };
  const [loading, setLoading] = useState<LoadingState>({
    services: false,
    availability: false,
    submission: false,
  });
  const [, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotObject[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    serviceId: "",
    staffId: "",
    locationId: "",
  });
  const [reasonForVisitOptions, setReasonForVisitOptions] = useState<string[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [availableDates, setAvailableDates] = useState(new Set<string>());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState<Record<string, any>>({});
  const [currentPageSlug, setCurrentPageSlug] = useState("");

  const PRIMARY_SOURCE_FIELD_ID = CUSTOM_FIELD_IDS.PRIMARY_MARKETING_PROGRAM_LOCKED;
  const PRIMARY_SOURCE_FIELD_KEY = "contact.primary_source";
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [, setIsMobileScreen] = useState(false);
  const [isSmileDocWebsite, setIsSmileDocWebsite] = useState(true);

  // Detect screen size (sm breakpoint is 640px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const detectWebsiteType = (): "smile-docs" | "dentique" | "smile-deals" | "SDL" => {
    const hostname = window.location.hostname.toLowerCase();
    const SD_DOMAINS = ["www.smiledocs.com.au", "smiledocs.com.au"];
    const DR_FURLAN_DOMAINS = ["drfurlan.smiledocs.com.au"];
    const DENTIQUE_DOMAINS = ["dentiquedentalspa.com.au"];
    const DEALS_DOMAINS = ["smiledeals.com.au"];

    if (DENTIQUE_DOMAINS.some((domain) => hostname.includes(domain))) {
      return "dentique";
    }
    if (DEALS_DOMAINS.some((domain) => hostname.includes(domain))) {
      return "smile-deals";
    }
    if (DR_FURLAN_DOMAINS.some((domain) => hostname.includes(domain))) {
      return "SDL";
    }
    if (SD_DOMAINS.some((domain) => hostname.includes(domain))) {
      return "smile-docs";
    }
    return "smile-docs"; // Default
  };

  // Brand detection state
  const [detectedBrand, setDetectedBrand] = useState<
    "smile-docs" | "dentique" | "smile-deals" | "SDL" | null
  >(null);

  useEffect(() => {
    const brand = detectWebsiteType();
    setDetectedBrand(brand);
    setIsSmileDocWebsite(brand === "smile-docs");
    // Simple usage to avoid TypeScript error
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--primary-color",
      "#1EBDB9",
    );
    document.documentElement.style.setProperty(
      "--darker-primary-color",
      "#355A71",
    );
  }, [isSmileDocWebsite]);


  // Listen for reset event from WordPress when offcanvas opens
  useEffect(() => {
    const handleResetForm = () => {
      // Reset Formik form
      formik.resetForm({
        values: {
          ...initialValues,
        },
      });

      // Reload custom fields after reset
      loadCustomFields();

      // Reset all state variables
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setSelectedDate(null);
      setActiveSlotId(null);
      setAvailableSlots([]);
      setOpenDropdown(null);
      setAvailableDates(new Set());
      setFormData({
        serviceId: "",
        staffId: "",
        locationId: "",
      });
      setCalendarMonth(normalizeMonth(new Date()));
      setCalendarKey((k) => k + 1);
      setDateOfBirth(null);
      setError(null);
      setReasonForVisitOptions([]);
    };

    // Listen for custom event from WordPress
    window.addEventListener("remountReactApp", handleResetForm);

    // Also listen for jQuery event (in case WordPress uses jQuery)
    if (typeof window !== "undefined" && (window as any).jQuery) {
      (window as any).jQuery(window).on("remountReactApp", handleResetForm);
    }

    return () => {
      window.removeEventListener("remountReactApp", handleResetForm);
      if (typeof window !== "undefined" && (window as any).jQuery) {
        (window as any).jQuery(window).off("remountReactApp", handleResetForm);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperRefs = useRef<Record<string, HTMLElement>>({});
  const setWrapperRef = (name: string) => (el: HTMLElement | null) => {
    if (el) {
      wrapperRefs.current[name] = el;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const ref = wrapperRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const normalizeMonth = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth(), 1);
  const handleCalendarMonthChange = (date: Date) => {
    if (!date) return;
    setCalendarMonth(normalizeMonth(date));
  };

  // Helper to render a dropdown
  const renderDropdown = ({
    name,
    value,
    options,
    placeholder,
    onChange,
    error,
    touched,
    disabledText = "",
  }: DropdownProps & { formik: any }) => {

    const shouldHideOption = (opt: string): boolean => {
      if (!opt) return false;
      const upper = String(opt).toUpperCase();
      return (
        (upper.includes("OPTIONS") &&
          !upper.includes("OPTIONS FOR TREATMENT"))
      );
    };
    const isDisabledOption = (opt: string): boolean => {
      if (!opt) return false;
      const upper = String(opt).toUpperCase();
      return (
        upper.includes("POPULAR REASONS") ||
        upper.includes("COMMON REASONS") ||
        /^\s*-{2,}\s*.*\s*-{2,}\s*$/.test(opt)
      );
    };
    const displayOptions = (options || []).filter(
      (option) => !shouldHideOption(option),
    );
    const hasOptions = displayOptions.length > 0;
    return (
      <div className="!w-full" ref={setWrapperRef(name)}>
        <div className="!relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === name ? null : name)}
            className={`!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[12px] sm:!text-[14px] !border !rounded-[5px] md:!rounded-[7px]
                !focus:outline-none !focus:ring-1 !flex !items-center !justify-between
                !font-inter !transition-colors
              ${touched && error
                ? "!bg-white !border-red-500 !focus:ring-red-500 !focus:border-red-500 !cursor-pointer"
                : "!bg-white !border-[#E5EDEF] !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF] !cursor-pointer"
              }`}
          >
            <span
              className={`!text-[14px] sm:!text-[14px] md:!text-[18px] text-font flex-1 min-w-0 truncate !text-left ${!value ? "!text-[#2E495C]" : "!text-[#2E495C]"}`}
            >
              {value || placeholder}
            </span>
            <ChevronDown
              className={`!h-[14px] !w-[14px] md:!h-[18px] md:!w-[18px] ${openDropdown === name ? "!rotate-180" : ""} ${!value ? "!text-[#2E495C]" : "!text-[#2E495C]"}`}
            />
          </button>
          {openDropdown === name && (
            <div
              className="!absolute !z-30 !w-full !mt-[0px] !bg-white !border !border-gray-200 !rounded-[5px] !shadow-2xl card-dropdown !transition-all !select-none !font-inter !max-h-[324px] !overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ minWidth: "100%", top: "calc(100% + 4px)" }}
            >
              {!hasOptions ? (
                <div className="!px-[12px] sm:!px-[14px] !py-[5px] md:!py-[7px] !text-[15px] md:!text-[16px] !text-red-500 !text-center">
                  {disabledText || "No options available"}
                </div>
              ) : (
                displayOptions.map((option, index) => {
                  const disabled = isDisabledOption(option);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (disabled) return;
                        onChange(option);
                        formik.setFieldTouched(name, true, true);
                        setOpenDropdown(null);
                        if (error) formik.setFieldError(name, "");
                      }}
                      className={`!w-full !px-[12px] sm:!px-[14px] !py-[5px] md:!py-[7px] !flex !items-center 
                        !text-[14px] sm:!text-[14px]  text-font  !transition-colors !text-left !font-inter 
                        ${disabled
                          ? "!text-gray-500 !bg-gray-50 !cursor-default"
                          : "!text-[#2E495C] !hover:bg-[#f5f7fa] !focus:bg-[#f0f4f8] !cursor-pointer"
                        }
                        ${value === option && !disabled
                          ? "!bg-[#2E495C]/10 !border-l-2 !border-l-[#808080] !font-semibold"
                          : ""
                        }`}
                      style={{
                        cursor: disabled ? "default" : "pointer",
                      }}
                    >
                      {option}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        {touched && error && <ErrorText text={error} />}
      </div>
    );
  };

  // Validation schema
  const validationSchema = Yup.object({
    reasonForVisit: Yup.string().required("Please select a type of visit"),
    reasonForVisitDetail: Yup.string().required("Please select a reason for visit"),
    provider: Yup.string().required("Please select a provider"),
    date: Yup.string().required("Please select a date"),
    time: Yup.string().required("Please select a time"),
    firstName: Yup.string()
      .matches(/^[a-zA-Z\s'-]+$/, "First name may only contain letters and - '")
      .max(30, "First name may be at most 30 characters")
      .required("First name is required"),
    lastName: Yup.string()
      .matches(/^[a-zA-Z\s'-]+$/, "Last name may only contain letters and - '")
      .max(30, "Last name may be at most 30 characters")
      .required("Last name is required"),
    mobile: Yup.string()
      .required("Phone number is required")
      .test("is-valid", "Enter a valid phone number", (value) => {
        if (!value) return false;
        try {
          return isValidPhoneNumber(value);
        } catch {
          return false;
        }
      }),
    email: Yup.string()
      .email("Please enter a valid email")
      .test("is-valid", "Please enter a valid email", (value) => {
        if (!value) return false;
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
      })
      .required("Email is required"),
    dateOfBirth: Yup.string()
      .required("Date of Birth is required")
      .test("is-valid-date", "Date of Birth is invalid", (value) => {
        if (!value) return false;
        const date = moment(value, "MM/DD/YYYY", true);
        return date.isValid();
      })
      .test(
        "not-in-future",
        "Date of Birth cannot be in the future",
        (value) => {
          if (!value) return true;
          const date = moment(value, "MM/DD/YYYY", true);
          if (!date.isValid()) return true;
          return !date.isAfter(moment(), "day");
        },
      ),
    howDidYouHear: Yup.string(),
    appointmentNotes: Yup.string(),
    whichPage: Yup.string(),
    termsAccepted: Yup.boolean().oneOf(
      [true],
      "You must accept the terms and conditions",
    ),
  });

  const initialValues: FormValues = {
    reasonForVisit: "",
    reasonForVisitDetail: "",
    provider: "",
    date: "",
    time: "",
    patientType: "", // Auto-set based on reason for visit
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    dateOfBirth: "",
    termsAccepted: false,
    whichPage: "",
    howDidYouHear: "",
    appointmentNotes: "",
  };

  const scrollToAllErrors = (errors: Record<string, string>) => {
    const fieldOrder = [
      "firstName",
      "lastName",
      "email",
      "mobile",
      "dateOfBirth",
      "reasonForVisit",
      "reasonForVisitDetail",
      "provider",
      "date",
      "time",
      "termsAccepted",
    ];

    let firstErrorElement: HTMLElement | null = null;

    for (const fieldName of fieldOrder) {
      if (errors[fieldName]) {
        let element: Element | null = null;

        if (fieldName === "reasonForVisit" || fieldName === "reasonForVisitDetail") {
          const wrapper = wrapperRefs.current[fieldName];
          if (wrapper) {
            element = wrapper.querySelector('button[type="button"]');
          }
          if (!element) {
            const buttons = document.querySelectorAll('button[type="button"]');
            for (const btn of buttons) {
              const span = btn.querySelector("span");
              if (span && (
                span.textContent?.includes("Type of Visit") ||
                span.textContent?.includes("Reason for Visit")
              )) {
                element = btn;
                break;
              }
            }
          }
        } else if (fieldName === "provider") {
          const wrapper = wrapperRefs.current["provider"];
          if (wrapper) {
            element = wrapper.querySelector('button[type="button"]');
          }
          if (!element) {
            const buttons = document.querySelectorAll('button[type="button"]');
            for (const btn of buttons) {
              const span = btn.querySelector("span");
              if (span && span.textContent?.includes("Choose a Provider")) {
                element = btn;
                break;
              }
            }
          }
        } else if (fieldName === "mobile") {
          element =
            document.querySelector("#mobile") ||
            document.querySelector(".PhoneInput input");
        } else if (fieldName === "dateOfBirth") {
          element = document.querySelector("#dateOfBirth");
        } else {
          element = document.querySelector(`[name="${fieldName}"]`);
        }

        if (element) {
          if (!firstErrorElement) {
            firstErrorElement = element as HTMLElement;
          }
          (element as HTMLElement).style.transition = "box-shadow 0.3s ease";
          (element as HTMLElement).style.boxShadow =
            "0 0 0 3px rgba(239, 68, 68, 0.3)";
          setTimeout(() => {
            (element as HTMLElement).style.boxShadow = "";
          }, 3000);
        }
      }
    }

    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values: FormValues, { setSubmitting, resetForm }) => {
      try {
        if (!formData.serviceId || !formData.staffId || !formData.locationId) {
          throw new Error("Missing service, location, or provider selection");
        }

        if (!selectedSlot || !selectedSlot.startTime) {
          throw new Error("Please select a time slot");
        }

        // ========== ADD THIS BLOCK ==========
        const verifySlotStillAvailable = async (
          slot: any,
        ): Promise<boolean> => {
          try {
            const startWindow = moment(slot.startTime)
              .subtract(1, "hour")
              .toISOString();
            const endWindow = moment(slot.startTime)
              .add(1, "hour")
              .toISOString();
            const data = await fetchBookingAvailability({
              services: [
                {
                  id: formData.serviceId,
                  position: 0,
                  staffId: formData.staffId,
                },
              ],
              serviceLocationId: formData.locationId,
              subAccountId: LOCATION_ID,
              timezone: BOOKING_TIMEZONE,
              skipSchedulingNotice: false,
              startDate: startWindow,
              endDate: endWindow,
            });
            return (data.slots || []).some(
              (s) =>
                s.startTime === slot.startTime && s.endTime === slot.endTime,
            );
          } catch {
            return false;
          }
        };

        const stillAvailable = await verifySlotStillAvailable(selectedSlot);
        if (!stillAvailable) {
          toast.error(
            "The selected time slot is no longer available. Please choose another.",
            {
              position: "top-center",
              style: {
                fontSize: "14px",
                padding: "7px 12px",
                borderRadius: "7px",
              },
            },
          );
          await loadAvailability(); // refresh slots
          return;
        }
        // const slotStart = selectedSlot.startTime;
        // const duration = getSelectedService()?.duration || 15;
        // const slotEnd = moment(slotStart).add(duration, 'minutes').toISOString();

        const slotStart = selectedSlot.startTime;
        // Use the slot's own endTime from the availability API
        const slotEnd =
          selectedSlot.endTime ||
          moment(slotStart).add(60, "minutes").toISOString();

        const appointmentMoment = moment(slotStart).tz(BOOKING_TIMEZONE);
        console.log(
          "🚀 ~ AppointmentFormV2 ~ appointmentMoment:",
          appointmentMoment,
        );
        const visitDateUS = appointmentMoment.format("MM-DD-YYYY");
        const visitTimeUS = appointmentMoment.format("hh:mm A");
        const appointmentDateTimeUS =
          appointmentMoment.format("MM-DD-YYYY hh:mm A");
        const formSubmissionUS = moment()
          .tz(BOOKING_TIMEZONE)
          .format("MM-DD-YYYY hh:mm A");

        const pageSlug = getPageSlug()?.trim();
        // Use detected brand for lead source and referral
        const brandName =
          detectedBrand === "dentique"
            ? " "
            : detectedBrand === "smile-docs"
              ? "SD"
              : detectedBrand === "SDL"
                ? "SDL"
                : "Smile Deals";
        const leadSource = `${brandName} Website Booking`; // From curl example
        // const leadMedum = `${brandName} Website Booking`; // From curl example
        const medium = "Organic";
        const referralSource = `${brandName} online Appointment`;
        // const bookingWidget = "NSS Booking Widget";
        const formattedAppointmentDateTime = appointmentDateTimeUS
          ? moment(appointmentDateTimeUS).format("MMMM, DD, YYYY hh:mm A")
          : appointmentDateTimeUS;
        // Use detected brand for labels
        const pageNamePrefix = brandName;
        const rawPage =
          values.whichPage?.trim() && values.whichPage !== "/"
            ? values.whichPage.trim()
            : pageSlug && pageSlug !== "/"
              ? pageSlug
              : "home";

        // For smiledocs.com.au URLs, strip the base path before extracting page segment
        let cleaned = rawPage.replace(/^\/|\/$/g, "");
        if (detectedBrand === "smile-docs") {
          const basePath = "/cosmetic-dentists/neutral-bay/dr-caroline-downing";
          if (cleaned.startsWith(basePath.replace(/^\//, ""))) {
            cleaned = cleaned.replace(basePath.replace(/^\//, ""), "").replace(/^\//, "");
          }
        }
        if (detectedBrand === "SDL") {
          const basePath = "/cosmetic-dentists/neutral-bay/dr-camelia-furlan";
          if (cleaned.startsWith(basePath.replace(/^\//, ""))) {
            cleaned = cleaned.replace(basePath.replace(/^\//, ""), "").replace(/^\//, "");
          }
        }

        const segments = cleaned.split("/").filter(Boolean);

        let pageSegment = "home";
        if (segments.length === 0 || (segments.length === 1 && segments[0] === "")) {
          pageSegment = "home";
        } else {
          pageSegment = segments[segments.length - 1];
        }

        const formattedPageName =
          pageSegment === "home"
            ? "Home"
            : pageSegment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
        const pageName = `${pageNamePrefix} ${formattedPageName} Page`;
        const brandValues = BRAND_FIELD_VALUES[detectedBrand as keyof typeof BRAND_FIELD_VALUES] || BRAND_FIELD_VALUES["smile-docs"];
        const primarySourceValue = brandValues.PRIMARY_MARKETING_PROGRAM_LOCKED;

        const patientTypeShort =
          patientTypeMap[values.patientType] || values.patientType || "NP";
        const brandLabel = brandName;
        const appointmentTitle = `${values.firstName} ${values.lastName} - ${brandLabel} ${patientTypeShort}`;

        const sessionId = "0fc060c8-8a01-4955-b4e5-d48c222a3e5d";
        const bookingPayload = {
          appointmentTitle,
          "locationId": LOCATION_ID,
          "formData": {
            "source": leadSource,
            "SFTeiS6O27c4wswgkKpO": leadSource,
            "first_name": values.firstName,
            "last_name": values.lastName,
            "phone": values.mobile,
            // "date_of_birth": values.dateOfBirth,
            "fkfj7vuLYWIBsAIfIxGk": values.howDidYouHear && values.howDidYouHear.trim() !== ""
              ? values.howDidYouHear.trim()
              : "Google",
            "KkQF5jDsZwdYIWVY7AYf": values.appointmentNotes,
            "terms_and_conditions": "I agree to my personal data being collected and confirm I want to receive SMS/Email messages from Dr Furlan and Dentique Dental Spa using the details provided (frequency varies / data rates may apply).",
            "email": values.email,
            [CUSTOM_FIELD_IDS.REASON_FOR_VISIT]: values.reasonForVisitDetail,
            [CUSTOM_FIELD_IDS.CONTACT_DATE]: formSubmissionUS,
            [CUSTOM_FIELD_IDS.ORIGINAL_START_DATE]: formSubmissionUS,
            [CUSTOM_FIELD_IDS.LAST_APPOINTMENT_DATE]: appointmentDateTimeUS,
            [CUSTOM_FIELD_IDS.LAST_VISIT]: appointmentDateTimeUS,
            [CUSTOM_FIELD_IDS.REFERRAL_SOURCE]: referralSource,
            [CUSTOM_FIELD_IDS.DATE_SUBMITTED]: formSubmissionUS,
            [CUSTOM_FIELD_IDS.PATIENT_TYPE]: values.patientType,
            [CUSTOM_FIELD_IDS.VISIT_TYPE]: VISIT_TYPE_PICKLIST_MAPPING[values.reasonForVisit] || values.reasonForVisit,
            [CUSTOM_FIELD_IDS.PROVIDER]: values.provider,
            [CUSTOM_FIELD_IDS.APPOINTMENT_DATE]: visitDateUS,
            [CUSTOM_FIELD_IDS.MEDIUM]: medium,
            [CUSTOM_FIELD_IDS.LAST_FORM_SUBMISSION_DATE]: formSubmissionUS,
            [CUSTOM_FIELD_IDS.PROGRAM]: DEFAULT_FIELD_VALUES.PROGRAM,
            [CUSTOM_FIELD_IDS.STAGE]: DEFAULT_FIELD_VALUES.STAGE,
            [CUSTOM_FIELD_IDS.MEDIUM_LOCKED]: DEFAULT_FIELD_VALUES.MEDIUM_LOCKED,
            [CUSTOM_FIELD_IDS.DATE_ENTERED]: formSubmissionUS,
            [CUSTOM_FIELD_IDS.BOOKING_MEDIUM]: DEFAULT_FIELD_VALUES.BOOKING_MEDIUM,
            [CUSTOM_FIELD_IDS.LATEST_APPOINTMENT_DATETIME]: formattedAppointmentDateTime,
            [CUSTOM_FIELD_IDS.ACTION_LOCKED]: DEFAULT_FIELD_VALUES.ACTION_LOCKED,
            [CUSTOM_FIELD_IDS.ORIGIN_LOCKED]: DEFAULT_FIELD_VALUES.ORIGIN_LOCKED,
            [CUSTOM_FIELD_IDS.PRIMARY_MARKETING_PROGRAM_LOCKED]: DEFAULT_FIELD_VALUES.PRIMARY_MARKETING_PROGRAM_LOCKED,
            [CUSTOM_FIELD_IDS.CHANNEL_LOCKED]: DEFAULT_FIELD_VALUES.CHANNEL_LOCKED,
            [CUSTOM_FIELD_IDS.AQUISITION_SOURCE_LOCKED]: DEFAULT_FIELD_VALUES.AQUISITION_SOURCE_LOCKED,
            "formId": FORM_ID,
            "location_id": LOCATION_ID,
            "sessionId": sessionId,
            "eventData": {
              "source": "direct",
              "referrer": "",
              "keyword": "",
              "adSource": "",
              "url_params": {},
              "page": {
                "url": "https://links.ezmarketer.com/booking/dentique-dental-spa",
                "title": "Dentique Dental Spa"
              },
              "timestamp": 1790771629618,
              "campaign": "",
              "contactSessionIds": {
                "ids": [
                  "2cb681a9-055c-4650-b982-9891f79fb09a",
                  "eea2c7d8-d5d0-4311-9334-36b9ff8ce1f2",
                  "d64f6379-fea7-4945-8b03-27b4275871a1",
                  "57d49da0-fa46-4fb5-a61d-c4f6e3d9560d",
                  "3d09ee7b-e19b-4a57-8c9b-32217cf76e07",
                  "a7077052-df05-49f0-9884-d6bea0c607c2",
                  "84c9b240-82ec-4e1f-bb5b-e0b9ad1db9a0",
                  "a72888c6-2399-4566-95a5-221ccd6f5018",
                  "0e49e379-1692-4e86-987a-f780195f8fae",
                  "46a1eabb-9431-460e-acac-3eddce9f549c",
                  "4aa569d8-f63e-4482-a054-617d67d269a5",
                  "fa27655a-ea27-4c08-82fa-737ce6001ee4",
                  "610e9222-c72e-425c-b326-6d5c36c6459b",
                  "d4c7c67f-67ad-469c-9abf-2d9e3cd71851",
                  "cbb61df3-d4d3-41de-a212-712770184970",
                  "8b4b9cb5-88a3-4285-8668-648d6b981e80",
                  "df2407db-6154-4e5b-8b32-4a51ea5cfa42",
                  "1364b406-3f15-4de9-b212-54d0936a586c",
                  "09bd0d1d-9574-4ae1-810a-5261fcbcb809",
                  "06f565dc-f5e8-4e12-a462-8c3ad387333f",
                  "3bfa9550-0f58-47d6-936e-58df20243443",
                  "0fc060c8-8a01-4955-b4e5-d48c222a3e5d"
                ]
              },
              "fbp": "",
              "fbc": "",
              "type": "page-visit",
              "parentId": LOCATION_ID,
              "pageVisitType": "calendar",
              "domain": "links.ezmarketer.com",
              "version": "v3",
              "parentName": "Dentique Dental Spa",
              "fingerprint": null,
              "documentURL": "https://links.ezmarketer.com/booking/dentique-dental-spa",
              "gaClientId": "GA1.2.11429352.1775667637",
              "fbEventId": "b2c2f124-a9c5-4fed-bee6-ed512b964ef1",
              "medium": "calendar",
              "mediumId": LOCATION_ID
            },
            "Timezone": BOOKING_TIMEZONE,
            "paymentContactId": {},
            "timeSpent": 27.487,
            "internalSource": {
              "type": "calendar",
              "id": LOCATION_ID
            },
            "formAction": {
              "actionType": "1",
              "redirectUrl": "https://drfurlan.smiledocs.com.au/thank-you",
              "thankyouText": "<p><strong>Thank you for registering for our Bridal Show promotional offers and Tooth Whitening raffle!</strong></p><p></p><p>If you also registered for the Smile Deals® offers on Invisalign, Check Up &amp; Clean or Zoom Whitening, check your inbox for a separate email containing your voucher(s) along with instructions on how to redeem them. My staff will call to schedule your appointment or you may <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://links.ezmarketer.com/widget/bookings/bridal-expo-fsa\">book your appointment online</a> now.</p><p></p><p>If you have any questions, feel free to call our office.</p><p></p><p>We look forward to seeing you soon,</p><p></p><p>Dr. Camelia Furlan</p><p>Dental Surgeon</p><p></p><p>P.S. Raffle winner will be notified by SMS or phone. If you would like o schedule a FEE Smile Assessment appointment with Dr. Furlan where you can sit down with her to discuss your Smile Makeover goals, <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://links.ezmarketer.com/widget/bookings/bridal-expo-fsa\">click here</a> now.</p>"

            }
          },
          "formId": FORM_ID,
          "source": "booking_widget",
          "selectedSlotInfo": {
            "services": [
              {
                "id": formData.serviceId,
                "position": 0,
                "staffId": formData.staffId
              }
            ],
            "serviceLocationId": BOOKING_LOCATION_ID,
            "subAccountId": LOCATION_ID,
            "timezone": BOOKING_TIMEZONE,
            "skipSchedulingNotice": false,
            "startDate": slotStart,
            "endDate": slotEnd
          },
          "analyticsSessionId": "8024d868-3f2d-4320-b35f-512b1a0ce294"
        }
        const res = await initiateBooking(bookingPayload, BOOKING_TIMEZONE);
        const serviceBookingId = res?.serviceBookingId;
        if (!serviceBookingId) {
          throw new Error("Failed to initiate booking.");
        }

        let existingPrimarySourceValue = null;
        if (res?.contact?.id) {
          try {
            const contactResponse = await getContactById(res?.contact?.id);
            existingPrimarySourceValue =
              contactResponse?.contact?.customFields?.find(
                (field: any) => field.id === PRIMARY_SOURCE_FIELD_ID,
              )?.value || null;
          } catch (fetchContactError) {
            console.error(
              "Failed to fetch contact details:",
              fetchContactError,
            );
          }
        }

        const shouldSetPrimarySource =
          !existingPrimarySourceValue ||
          existingPrimarySourceValue.trim() === "";
        const resolvedPrimarySourceValue = shouldSetPrimarySource
          ? primarySourceValue
          : existingPrimarySourceValue?.trim();

        if (res?.contact?.id) {
          try {
            await removeContactTags(res?.contact?.id, [leadSource]);
          } catch (e) {
            console.warn(
              "Tag removal skipped/failed:",
              (e as any)?.response?.data || (e as any)?.message,
            );
          }

          // Determine booking source based on website type
          const bookingSourceValue = "Website Booking";
          const brandValues = (detectedBrand && BRAND_FIELD_VALUES[detectedBrand]) || BRAND_FIELD_VALUES["smile-docs"];
          // const primaryMarketingProgramValue = brandValues.PRIMARY_MARKETING_PROGRAM_LOCKED;
          const acquisitionSourceValue = brandValues.AQUISITION_SOURCE_LOCKED;

          const customFields = [
            {
              id: CUSTOM_FIELD_IDS.PROVIDER,
              key: "contact.provider",
              field_value: values.provider,
            },
            {
              id: CUSTOM_FIELD_IDS.APPOINTMENT_NOTES,
              key: "contact.appointment_notes",
              field_value: values.appointmentNotes,
            },
            {
              id: CUSTOM_FIELD_IDS.DATE_SUBMITTED,
              key: "contact.date_submitted",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.CONTACT_DATE,
              key: "contact.contact_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.APPOINTMENT_CREATED_DATE,
              key: "contact.appointment_created_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.BOOKING_SOURCE,
              key: "contact.booking_source",
              field_value: bookingSourceValue,
            },
            {
              id: CUSTOM_FIELD_IDS.BOOKING_PAGE,
              key: "contact.booking_page",
              field_value: pageName,
            },
            {
              id: CUSTOM_FIELD_IDS.BOOKING_MEDIUM,
              key: "contact.booking_medium",
              field_value: DEFAULT_FIELD_VALUES.BOOKING_MEDIUM,
            },
            {
              id: CUSTOM_FIELD_IDS.VISIT_TIME,
              key: "contact.visit_time",
              field_value: visitTimeUS,
            },
            {
              id: CUSTOM_FIELD_IDS.VISIT_DATE,
              key: "contact.visit_date",
              field_value: visitDateUS,
            },
            {
              id: CUSTOM_FIELD_IDS.PRIMARY_MARKETING_PROGRAM_LOCKED,
              key: "contact.primary_marketing_program",
              field_value: brandValues.PRIMARY_MARKETING_PROGRAM_LOCKED,
            },
            {
              id: CUSTOM_FIELD_IDS.PROGRAM,
              key: "contact.program",
              field_value: DEFAULT_FIELD_VALUES.PROGRAM,
            },
            {
              id: CUSTOM_FIELD_IDS.STAGE,
              key: "contact.stage",
              field_value: DEFAULT_FIELD_VALUES.STAGE,
            },
            {
              id: CUSTOM_FIELD_IDS.STATUS,
              key: "contact.status",
              field_value: "Appointment Made",
            },
            {
              id: CUSTOM_FIELD_IDS.STATUS_OLD,
              key: "contact.status",
              field_value: "Appointment Made",
            },
            {
              id: CUSTOM_FIELD_IDS.SERVICE_OF_INTEREST,
              key: "contact.service_of_interest",
              field_value:
                SERVICE_OF_INTEREST_MAP[values.reasonForVisit] || "N/A",
            },
            {
              id: CUSTOM_FIELD_IDS.LAST_INTERACTION_DATE,
              key: "contact.last_interaction_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.OPTIN_DATE_LOCKED,
              key: "contact.optin_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.ORIGINAL_START_DATE,
              key: "contact.original_start_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.DATE_ENTERED,
              key: "contact.date_entered",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.ORIGIN_LOCKED,
              key: "contact.origin",
              field_value: brandValues.ORIGIN_LOCKED,
            },
            {
              id: CUSTOM_FIELD_IDS.CHANNEL_LOCKED,
              key: "contact.channel",
              field_value: "Website",
            },
            {
              id: CUSTOM_FIELD_IDS.ACTION_LOCKED,
              key: "contact.action",
              field_value: "Appointment Booking",
            },
            {
              id: CUSTOM_FIELD_IDS.AQUISITION_SOURCE_LOCKED,
              key: "contact.acquisition_source",
              field_value: acquisitionSourceValue,
            },
            {
              id: CUSTOM_FIELD_IDS.VISIT_TYPE,
              key: "contact.visit_type",
              field_value:
                VISIT_TYPE_PICKLIST_MAPPING[values.reasonForVisit] ||
                "Other Service",
            },
            // { id: CUSTOM_FIELD_IDS.LOCATION, key: "contact.location", field_value: "" },
            {
              id: CUSTOM_FIELD_IDS.PATIENT_TYPE,
              key: "contact.patient_type",
              field_value: values.patientType,
            },
            {
              id: CUSTOM_FIELD_IDS.APPOINTMENT_DATE,
              key: "contact.appointment_date",
              field_value: visitDateUS,
            },
            {
              id: CUSTOM_FIELD_IDS.APPOINTMENT_TIME,
              key: "contact.appointment_time_events",
              field_value: values.time,
            },
            {
              id: CUSTOM_FIELD_IDS.LEAD_SOURCE,
              key: "contact.contactlead_source",
              field_value: leadSource,
            },
            {
              id: CUSTOM_FIELD_IDS.REFERRAL_SOURCE,
              key: "contact.referral_source",
              field_value: referralSource,
            },
            {
              id: CUSTOM_FIELD_IDS.MEDIUM,
              key: "contact.medium",
              field_value: medium,
            },
            {
              id: CUSTOM_FIELD_IDS.LAST_VISIT_DATE,
              key: "contact.last_appointment_date",
              field_value: visitDateUS,
            },
            {
              id: CUSTOM_FIELD_IDS.LEAD_MEDIUM,
              key: "contact.lead_medium",
              field_value: medium,
            },
            {
              id: CUSTOM_FIELD_IDS.ENTRY_SERVICE,
              key: "contact.entry_service",
              field_value:
                SERVICE_OF_INTEREST_MAP[values.reasonForVisit] || "N/A",
            },
            // { id: CUSTOM_FIELD_IDS.LOCATION_SD, key: "contact.location_sd", field_value: values.location },
            {
              id: CUSTOM_FIELD_IDS.LAST_CONVERSION_DATE,
              key: "contact.last_conversion_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.SERVICE_OLD,
              key: "contact.service",
              field_value:
                SERVICE_OF_INTEREST_MAP[values.reasonForVisit] || "N/A",
            },
            {
              id: CUSTOM_FIELD_IDS.HOW_DID_YOU_FIND_US,
              key: "contact.how_did_you_find_us",
              field_value: values.howDidYouHear || "Google",
            },
            {
              id: CUSTOM_FIELD_IDS.WHICH_FORM,
              key: "contact.which_form",
              field_value: "Appointment Booking Form",
            },
            {
              id: CUSTOM_FIELD_IDS.WHICH_PAGE,
              key: "contact.which_page",
              field_value: pageName,
            },
            {
              id: CUSTOM_FIELD_IDS.FIRST_OPPORTUNITY_DATE_LOCKED,
              key: "contact.first_opportunity_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.LAST_FORM_SUBMISSION_DATE,
              key: "contact.last_form_submission_date",
              field_value: formSubmissionUS,
            },
            {
              id: CUSTOM_FIELD_IDS.FIRST_VISIT_DATE_LOCKED,
              key: "contact.first_visit_date",
              field_value: visitDateUS,
            },
            {
              id: CUSTOM_FIELD_IDS.OFFER_OPTED_INTO,
              key: "contact.offer_opted_into",
              field_value: "Website Booking",
            },
            {
              id: CUSTOM_FIELD_IDS.DATABASE_IMPORT_DATE_LOCKED,
              key: "contact.database_import_date",
              field_value: "",
            },
            {
              id: CUSTOM_FIELD_IDS.REENGAGEMENT_DATE,
              key: "contact.reengagement_date",
              field_value: "",
            },
            {
              id: CUSTOM_FIELD_IDS.REENGAGEMENT_SOURCE,
              key: "contact.reengagement_source",
              field_value: "",
            },
            {
              id: CUSTOM_FIELD_IDS.NEW_OR_CURRENT_PATIENT,
              key: "contact.new_or_current_patient",
              field_value: values.patientType,
            },
            // { id: CUSTOM_FIELD_IDS.OFFICE, key: "contact.office", field_value: values.location },
            {
              id: CUSTOM_FIELD_IDS.OPERATOR,
              key: "contact.operator",
              field_value: "",
            },
            {
              id: CUSTOM_FIELD_IDS.LAST_VISIT,
              key: "contact.last_visit",
              field_value: visitDateUS,
            },
            {
              id: CUSTOM_FIELD_IDS.HOW_DID_YOU_HEAR_ABOUT_US,
              key: "contact.how_did_you_hear_about_us",
              field_value: values.howDidYouHear || "Google",
            },
            {
              id: CUSTOM_FIELD_IDS.REASON_FOR_APPOINTMENT,
              key: "contact.reason_for_appointment",
              field_value: values.reasonForVisit || "",
            },
          ];

          if (shouldSetPrimarySource) {
            customFields.push({
              id: PRIMARY_SOURCE_FIELD_ID,
              key: PRIMARY_SOURCE_FIELD_KEY,
              field_value: resolvedPrimarySourceValue,
            });
          }

          const contactData = {
            customFields,
            tags: [
              detectedBrand === "dentique"
                ? "Dentique Dental Spa website booking"
                : detectedBrand === "smile-docs"
                  ? "Smile Docs website booking" : detectedBrand === "SDL" ? "Smile Docs Landing website booking"
                    : "Smile Deals website booking",
              brandName
            ],
            source: leadSource,
            type: values.patientType,
          };

          // Add reason for visit detail to custom fields
          if (values.reasonForVisitDetail) {
            contactData.customFields.push({
              id: CUSTOM_FIELD_IDS.REASON_FOR_VISIT,
              key: "contact.reason_for_visit",
              field_value: values.reasonForVisitDetail,
            });
          }

          await updateContact(contactData, res?.contact?.id);

          const howDidYouHear =
            values.howDidYouHear && values.howDidYouHear.trim() !== ""
              ? values.howDidYouHear.trim()
              : "Google";

          // Create a formatted note string instead of sending an object
          // Format dates consistently
          const formattedDateOfBirth = values.dateOfBirth
            ? moment(values.dateOfBirth, "MM/DD/YYYY").format("MMMM, DD, YYYY")
            : values.dateOfBirth;
          const formattedFormSubmissionDate = formSubmissionUS
            ? moment(formSubmissionUS).format("MMMM, DD, YYYY hh:mm A")
            : formSubmissionUS;

          const noteBody = `Appointment Details:
  - Type of Visit: ${values.reasonForVisit}
  - Reason for Visit: ${values.reasonForVisitDetail || "N/A"}
  - Provider: ${values.provider}
  - Date: ${appointmentMoment.format("MMMM, DD, YYYY")}
  - Time: ${appointmentMoment.format("hh:mm A")}
  - Patient Type: ${values.patientType}
  - Name: ${values.firstName} ${values.lastName}
  - Email: ${values.email}
  - Phone: ${values.mobile}
  - Date of Birth: ${formattedDateOfBirth}
  - How did you hear: ${howDidYouHear}
  - Appointment Notes: ${values.appointmentNotes || "None"}
  - Time Zone: ${BOOKING_TIMEZONE}
  - Booking Page: ${pageName}
  - Latest appointment date/time: ${formattedAppointmentDateTime}
  - Form Submitted On: ${formattedFormSubmissionDate}`;

          await addContactNote(res?.contact?.id, noteBody);
        }

        await confirmBooking(
          serviceBookingId,
          { paymentStatus: "completed" },
          BOOKING_TIMEZONE,
        );

        toast.success("Appointment booked successfully!", {
          position: "top-center",
          style: { fontSize: "14px", padding: "7px 12px", borderRadius: "7px" },
        });

        resetForm();
        resetFormState();
        loadServices();
        loadCustomFields();

        return { success: true };
      } catch (err) {
        console.error("Submission failed", err);
        toast.error(
          "Something went wrong while submitting. Please try again.",
          {
            position: "top-center",
            style: {
              fontSize: "14px",
              padding: "7px 12px",
              borderRadius: "7px",
            },
          },
        );
        setError((err as Error).message || "Submission failed.");
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });
  console.log("🚀 ~ AppointmentFormV2 ~ formik:", formik)

  // Sync dateOfBirth state with formik values
  useEffect(() => {
    if (formik.values.dateOfBirth) {
      const date = moment(formik.values.dateOfBirth, "MM/DD/YYYY", true);
      if (date.isValid()) {
        const dateObj = date.toDate();
        if (!dateOfBirth || dateOfBirth.getTime() !== dateObj.getTime()) {
          setDateOfBirth(dateObj);
        }
      }
    } else {
      if (dateOfBirth !== null) {
        setDateOfBirth(null);
      }
    }
  }, [formik.values.dateOfBirth]);

  useEffect(() => {
    const slug = getPageSlug();
    setCurrentPageSlug(slug);
    if (slug && slug !== formik.values.whichPage) {
      formik.setFieldValue("whichPage", slug, false);
    }
  }, [formik.values.whichPage]);

  const formatDate = (date: Date): string => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getSelectedService = () =>
    services.find((s) => s.id === formData.serviceId) || null;
  const getSelectedStaff = () => {
    const service = getSelectedService();
    return (
      service?.staff?.find((staff: any) => staff.id === formData.staffId) ||
      null
    );
  };

  const handleProviderSelect = async (staff: any) => {
    setFormData((prev) => ({ ...prev, staffId: staff?.id || "" }));
    await formik.setFieldValue("provider", getStaffName(staff) || "", true);
    clearDateTimeSelection();
    setCalendarMonth(normalizeMonth(new Date()));
    setCalendarKey((k) => k + 1);
  };

  const clearDateTimeSelection = () => {
    setSelectedSlot(null);
    setSelectedTimeSlot(null);
    setSelectedDate(null);
    setActiveSlotId(null);
    formik.setFieldValue("date", "");
    formik.setFieldValue("time", "");
  };

  const resetFormState = () => {
    // Reset all state variables
    setSelectedSlot(null);
    setSelectedTimeSlot(null);
    setSelectedDate(null);
    setActiveSlotId(null);
    setAvailableSlots([]);
    setAvailableDates(new Set());
    setFormData({
      serviceId: "",
      staffId: "",
      locationId: "",
    });
    setCalendarMonth(normalizeMonth(new Date()));
    setCalendarKey((prev) => prev + 1);

    // Reset error state
    setError(null);
    setReasonForVisitOptions([]);
  };

  const loadServices = async () => {
    try {
      setLoading((prev) => ({ ...prev, services: true }));
      const data = await fetchBookingOptions(LOCATION_ID);

      // Filter services to only include Appointment Book category
      const appointmentBookServices = data.services.filter(
        (service: any) => service.serviceCategoryId === APPOINTMENT_BOOK_CATEGORY_ID
      );

      setServices(appointmentBookServices);

      // Extract unique staff IDs from filtered services
      const staffIds = Array.from(
        new Set(
          appointmentBookServices.flatMap((service: any) =>
            (service.staff || []).map((staff: any) => staff.id),
          ),
        ),
      );

      // Fetch staff data for those specific IDs
      if (staffIds.length > 0) {
        const staffData = await fetchBookingStaff(staffIds);
        setStaff(staffData.users || []);
      } else {
        setStaff([]);

      }
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Failed to load services. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, services: false }));
    }
  };

  useEffect(() => {
    loadServices();
    loadCustomFields();
    window.addEventListener("remountReactApp", loadServices);
    if (typeof window !== "undefined" && (window as any).jQuery) {
      (window as any).jQuery(window).on("remountReactApp", loadServices);
    }
    return () => {
      window.removeEventListener("remountReactApp", loadServices);
      if (typeof window !== "undefined" && (window as any).jQuery) {
        (window as any).jQuery(window).off("remountReactApp", loadServices);
      }
    };
  }, []);

  // Load custom field options from GHL
  const loadCustomFields = async () => {
    try {
      const customFieldsData = await getCustomFields(LOCATION_ID);
      const reasonForVisitField = customFieldsData.find(
        (field: any) => field.fieldKey === "contact.reason_for_visit"
      );
      if (reasonForVisitField?.picklistOptions) {
        setReasonForVisitOptions(reasonForVisitField.picklistOptions);
      }
    } catch (error) {
      console.error("Failed to load custom fields:", error);
      // Set default options if API call fails
      setReasonForVisitOptions([
        "------- POPULAR REASONS -------",
        "Dental Emergency (pain, trauma, other)",
        "General Dental Concern (fillings, gum issues, other)",
        "Dental Check Up & Cleaning",
        "Cosmetics / Smile Makeover Consultation",
        "Dental Implants Consultation",
        "Invisalign Consultation",
        "Teeth Whitening (in office or home)",
        "Porcelain Veneers / Crowns",
        "Options for Treatment",
        "------- COMMON REASONS --------",
        "Treatment Follow-Up",
        "Tooth Extraction / Wisdom Teeth",
        "Gum / Periodontal Treatment",
        "Snoring / Sleep Apnea",
        "TMJ / Jaw Pain",
        "Bad Breath (Halitosis) Treatment"
      ]);
    }
  };

  const getStaffName = (staff: any): string => {
    if (!staff) return "";
    return staff.name || "";
  };

  useEffect(() => {
    if (!services.length) return;
    const staffIds = Array.from(
      new Set(
        services.flatMap((service: any) =>
          (service.staff || []).map((staff: any) => staff.id),
        ),
      ),
    );
    if (!staffIds.length) return;
    const loadStaff = async () => {
      try {
        const response = await fetchBookingStaff(staffIds);
        const directory: Record<string, any> = {};
        (response.users || []).forEach((user) => {
          directory[user.id] = user;
        });
        setStaffDirectory(directory);
      } catch (err) {
        console.error("Failed to load staff metadata:", err);
      }
    };
    loadStaff();
  }, [services]);

  useEffect(() => {
    const staff = getSelectedStaff();
    const staffName = getStaffName(staff);
    if (staff && staffName && formik.values.provider !== staffName) {
      formik.setFieldValue("provider", staffName);
    }
  }, [staffDirectory, formData.staffId]);

  const pickFirstAvailableDateKey = (dateKeys: string[]) => {
    if (!dateKeys.length) return null;
    const todayKey = formatDate(new Date());
    return dateKeys.find((key) => key >= todayKey) || dateKeys[0];
  };

  const loadAvailability = async () => {
    if (!formData.serviceId || !formData.staffId || !formData.locationId) {

      return;
    }
    setLoading((prev) => ({ ...prev, availability: true }));
    setAvailableSlots([]);
    setAvailableDates(new Set());
    setSelectedSlot(null);
    setSelectedTimeSlot(null);
    setActiveSlotId(null);
    formik.setFieldValue("time", "");
    try {
      setLoadingAvailability(true);
      // Fetch only the current calendar month (re-fetches when user navigates months)
      const startOfRange = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        1,
      );
      startOfRange.setHours(0, 0, 0, 0);
      const endOfRange = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const data = await fetchBookingAvailability({
        services: [
          { id: formData.serviceId, position: 0, staffId: formData.staffId },
        ],
        serviceLocationId: formData.locationId,
        subAccountId: LOCATION_ID,
        timezone: BOOKING_TIMEZONE,
        skipSchedulingNotice: false,
        startDate: startOfRange.toISOString(),
        endDate: endOfRange.toISOString(),
      });
      const slotObjects = (data.slots || [])
        .map((slot) => {
          const startMoment = moment(slot.startTime).tz(BOOKING_TIMEZONE);
          return {
            raw: slot,
            iso: slot.startTime,
            label: startMoment.format("h:mm A"),
            dateKey: startMoment.format("YYYY-MM-DD"),
            period: startMoment.format("A"),
          };
        })
        .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
      setAvailableSlots(slotObjects);
      const dateKeys = Array.from(
        new Set(slotObjects.map((slot) => slot.dateKey)),
      );
      setAvailableDates(new Set(dateKeys));
      const currentDateKey = selectedDate ? formatDate(selectedDate) : null;
      let nextDateKey =
        currentDateKey && dateKeys.includes(currentDateKey)
          ? currentDateKey
          : pickFirstAvailableDateKey(dateKeys);
      if (nextDateKey) {
        const [yy, mm, dd] = nextDateKey.split("-").map(Number);
        const nextDate = new Date(yy, mm - 1, dd);
        setSelectedDate(nextDate);
        await formik.setFieldValue("date", nextDateKey, true);
        await formik.setFieldTouched("date", true, true);
        formik.setFieldError("date", "");
      } else {
        setSelectedDate(null);
        formik.setFieldValue("date", "");
      }
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setActiveSlotId(null);
      formik.setFieldValue("time", "", false);
    } catch (err) {
      console.error("Failed to load availability:", err);
      setError("Failed to load available time slots. Please try again.");
      setSelectedDate(null);
      formik.setFieldValue("date", "");
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setActiveSlotId(null);
      formik.setFieldValue("time", "");
    } finally {
      setLoading((prev) => ({ ...prev, availability: false }));
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [
    formData.serviceId,
    formData.staffId,
    formData.locationId,
    calendarMonth,
  ]);

  const handleDateChange = async (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = formatDate(date);
    await formik.setFieldValue("date", dateStr, true);
    if (formik.errors.date) {
      formik.setFieldError("date", "");
    }
    setSelectedSlot(null);
    setSelectedTimeSlot(null);
    setActiveSlotId(null);
    await formik.setFieldValue("time", "", false);
  };

  const toggleTimeSlotPreview = (slot: SlotObject) => {
    if (!slot?.iso) return;
    setActiveSlotId((prev) => (prev === slot.iso ? null : slot.iso));
  };

  const handleTimeSlotClick = (slot: SlotObject) => {
    if (!slot) {
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setActiveSlotId(null);
      formik.setFieldValue("time", "");
      return;
    }
    setSelectedSlot(slot.raw);
    setSelectedTimeSlot(slot.label);
    setActiveSlotId(slot.iso);
    formik.setFieldValue("time", slot.label);
    if (formik.errors.time) {
      formik.setFieldError("time", "");
    }
  };

  const handleFullReset = async () => {
    let found = false;
    let tryMonth = new Date();
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(
        tryMonth.getFullYear(),
        tryMonth.getMonth() + i,
        1,
      );
      const startOfRange = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
      );
      startOfRange.setHours(0, 0, 0, 0);
      const endOfRange = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      let slotObjects: SlotObject[] = [];
      try {
        const data = await fetchBookingAvailability({
          services: [
            { id: formData.serviceId, position: 0, staffId: formData.staffId },
          ],
          serviceLocationId: formData.locationId,
          subAccountId: LOCATION_ID,
          timezone: BOOKING_TIMEZONE,
          skipSchedulingNotice: false,
          startDate: startOfRange.toISOString(),
          endDate: endOfRange.toISOString(),
        });
        slotObjects = (data.slots || [])
          .map((slot) => {
            const startMoment = moment(slot.startTime).tz(BOOKING_TIMEZONE);
            return {
              raw: slot,
              iso: slot.startTime,
              label: startMoment.format("h:mm A"),
              dateKey: startMoment.format("YYYY-MM-DD"),
              period: startMoment.format("A"),
            };
          })
          .sort(
            (a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime(),
          );
        if (slotObjects.length > 0) {
          const earliestSlot = slotObjects[0];
          const [yy, mm, dd] = earliestSlot.dateKey.split("-").map(Number);
          const nextDate = new Date(yy, mm - 1, dd);
          setSelectedDate(nextDate);
          setCalendarMonth(
            new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
          );
          setCalendarKey((k) => k + 1);
          formik.setFieldValue("date", earliestSlot.dateKey, true);
          setSelectedSlot(null);
          setSelectedTimeSlot(null);
          setActiveSlotId(null);
          formik.setFieldValue("time", "", false);
          found = true;
          break;
        }
      } catch (err) { }
    }
    if (!found) {
      const today = new Date();
      setSelectedDate(null);
      setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      setCalendarKey((k) => k + 1);
      formik.setFieldValue("date", "", true);
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setActiveSlotId(null);
      formik.setFieldValue("time", "", false);
    }
  };

  const getSlotsForSelectedDate = () => {
    if (!selectedDate) return [];
    const key = formatDate(selectedDate);
    return availableSlots.filter((slot) => slot.dateKey === key);
  };

  const getTimeSlots = (slotsForDate: SlotObject[] = []) => {
    const morningSlots: SlotObject[] = [];
    const afternoonSlots: SlotObject[] = [];
    slotsForDate.forEach((slot) => {
      if ((slot.period || "").toUpperCase().includes("AM")) {
        morningSlots.push(slot);
      } else {
        afternoonSlots.push(slot);
      }
    });
    return { morning: morningSlots, afternoon: afternoonSlots };
  };

  const slotsForSelectedDate = getSlotsForSelectedDate();
  const timeSlotGroups = getTimeSlots(slotsForSelectedDate);
  const isDateTimeEnabled = !!(
    formik.values.reasonForVisit && formik.values.provider
  );

  const formatInputDate = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    return formatted;
  };

  const handleOnchangeDropDown = async (name: string, value: string) => {
    await formik.setFieldValue(name, value || "", true);
    formik.setFieldTouched(name, true, true);



    // Also update formData for availability API
    if (name === "reasonForVisit" && value) {
      // Auto-set patient type based on reason for visit
      let autoPatientType = "";
      if (value === "New Patient Visit") {
        autoPatientType = "New Patient";
      } else if (value === "Existing Patient Visit") {
        autoPatientType = "Current Patient";
      }
      if (autoPatientType) {
        await formik.setFieldValue("patientType", autoPatientType, false);
      }

      // Find the service from the loaded services
      const selectedService = services.find((s: any) => s.name === value);
      const serviceId = selectedService?.id || "";

      if (serviceId) {
        // Auto-set location since only one exists and reset provider selection
        const bookingLocationId = BOOKING_LOCATION_ID;
        setFormData((prev) => ({
          ...prev,
          serviceId,
          locationId: bookingLocationId || "",
          staffId: "", // Reset staffId when reason for visit changes
        }));
        await formik.setFieldValue("provider", "", true);
        await formik.setFieldValue("location", "Dentique Dental Spa", true);
        clearDateTimeSelection();
        setCalendarMonth(normalizeMonth(new Date()));
        setCalendarKey((k) => k + 1);
      }
    } else if (name === "provider" && value) {
      // Find the provider by name from dynamic staff data
      const provider = staff.find((p) => p.name === value);


      // Validate that provider is available for selected service
      const selectedService = formik.values.reasonForVisit;
      if (selectedService && provider) {
        const allowedProviderIds = getProvidersForService(selectedService);
        if (!allowedProviderIds.includes(provider.id)) {
          console.error(
            `Provider ${provider.name} is not available for service ${selectedService}`,
          );
          toast.error(`Selected provider is not available for this service`);
          return;
        }
      }

      if (provider) {
        setFormData((prev) => ({ ...prev, staffId: provider.id }));
        clearDateTimeSelection();
        setCalendarMonth(normalizeMonth(new Date()));
        setCalendarKey((k) => k + 1);
      }
    }
  };

  const brandColor = "#1EBDB9"

  return (
    <div
      className="booking-form-wrapper"
      data-brand={detectedBrand || ""}
      style={{ ["--brand-primary" as any]: brandColor }}
    >
      <div className="!flex !items-center !justify-center !min-h-screen">
        <div className="!w-full !max-w-[900px] !rounded-[7px]">
          <form
            onSubmit={formik.handleSubmit}
            id="booking-form"
            className="!font-inter"
          >
            <input
              type="hidden"
              name="whichPage"
              value={formik.values.whichPage || currentPageSlug}
              readOnly
            />

            {/* Header */}
            {/* <div className="!pb-[18px] !mb-[18px] !border-b-2 !flex !flex-col !justify-center !items-center !border-b-gray-300">
              <h2 className="!text-[#2E495C] !text-center header-text !m-[0px] !font-poppins !font-bold !text-[18px] md:!text-[20px]">
                Request an Appointment
              </h2>
              <p className="headerSub-text !m-[0px] !text-[#6B8492] !text-[12px] md:!text-[14px]">
                All fields required. We'll confirm by phone or email.
              </p>
            </div> */}

            {/* Form Fields: Patient Information & Appointment Details */}
            <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-y-[12px] md:!gap-x-[18px]">
              <h3
                className="md:!col-span-2 !m-0 !block !text-[14px] md:!text-[16px] !mt-[10px] !font-inter !transform-none field-header !text-[#2E495C] !font-medium"
                style={{ order: 0 }}
              >
                Patient Information
              </h3>
              {/* Type of Visit */}
              <div className="md:!col-span-1" style={{ order: 8 }}>
                {loading.services ? (
                  <div className="!text-[14px] !text-gray-500 !text-center !w-full !px-[12px] !py-[5px] md:!py-[7px] !border !rounded-[7px] !bg-white !font-inter !border-gray-300">
                    Loading services...
                  </div>
                ) : (
                  renderDropdown({
                    name: "reasonForVisit",
                    value: formik.values.reasonForVisit,
                    options: services
                      .map((s: any) => s.name)
                      .sort((a, b) => {
                        // Priority order: New Patient Visit first, Existing Patient Visit second, then alphabetical
                        const priority = { "New Patient Visit": 0, "Existing Patient Visit": 1 };
                        const priorityA = priority[a as keyof typeof priority] ?? 2;
                        const priorityB = priority[b as keyof typeof priority] ?? 2;
                        if (priorityA !== priorityB) {
                          return priorityA - priorityB;
                        }
                        return a.localeCompare(b);
                      }),
                    placeholder: "Type of Visit*",
                    onChange: (val) =>
                      handleOnchangeDropDown("reasonForVisit", val),
                    error: formik.errors.reasonForVisit,
                    touched: formik.touched.reasonForVisit,
                    formik,
                  })
                )}
              </div>

              {/* Date of Birth */}
              <div className="date-of-birth-wrapper !relative md:!col-span-1" style={{ order: 7 }}>
                <DatePicker
                  id="dateOfBirth"
                  name="dateOfBirth"
                  selected={dateOfBirth}
                  onChange={(date: Date | null) => {
                    setDateOfBirth(date);
                    const dateStr = date
                      ? `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`
                      : "";
                    formik.setFieldValue("dateOfBirth", dateStr);
                    if (formik.errors.dateOfBirth)
                      formik.setFieldError("dateOfBirth", "");
                  }}
                  onChangeRaw={(
                    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
                  ) => {
                    if (!event) return;
                    const input = event.target as HTMLInputElement;
                    if (!input) return;
                    if (
                      event.nativeEvent instanceof MouseEvent &&
                      event.target instanceof HTMLElement &&
                      event.target.tagName !== "INPUT"
                    )
                      return;
                    const formatted = formatInputDate(input.value.trim());
                    input.value = formatted;
                    formik.setFieldValue("dateOfBirth", formatted);
                  }}
                  onBlur={() => formik.setFieldTouched("dateOfBirth", true)}
                  onFocus={(e: React.FocusEvent<HTMLElement>) => {
                    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                      (e.target as HTMLInputElement).readOnly = true;
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  maxDate={new Date()}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Date of Birth*"
                  wrapperClassName="!w-full"
                  className={`!w-full !px-[12px] !pr-[54px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px] text-font  !border !rounded-[5px] !bg-white !text-[#2E495C] !placeholder-[#2E495C] !focus:outline-none !focus:ring-1 !transition-colors ${formik.touched.dateOfBirth && formik.errors.dateOfBirth
                    ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500"
                    : "!border-[#E5EDEF]  !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF] !hover:border-[#2E495C]/50"
                    }`}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  popperClassName="date-of-birth-calendar-popper"
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }: ReactDatePickerCustomHeaderProps) => (
                    <div className="!flex !items-center !justify-between !px-[12px] !py-[8px] !bg-gray-50">
                      <button
                        type="button"
                        onClick={() => decreaseMonth()}
                        disabled={prevMonthButtonDisabled}
                        className={`!cursor-pointer !flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[18px] md:!h-[18px] !rounded-full !transition !disabled:opacity-40 ${prevMonthButtonDisabled
                          ? "!bg-gray-100"
                          : "!bg-[#f0f4f8] !hover:bg-gray-200"
                          }`}
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="!text-[#2E495C]" />
                      </button>
                      <div className="!flex !items-center !space-x-2">
                        <select
                          value={date.getMonth()}
                          onChange={(e) => changeMonth(Number(e.target.value))}
                          className="!p-1 !outline-none! !rounded !text-[#2E495C] !font-semibold"
                        >
                          {[
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                          ].map((month, i) => (
                            <option key={i} value={i}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={date.getFullYear()}
                          onChange={(e) => changeYear(Number(e.target.value))}
                          className="!p-1 !outline-none !rounded !text-[#808080] !font-semibold"
                        >
                          {Array.from(
                            { length: 100 },
                            (_, i) => new Date().getFullYear() - i,
                          ).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => increaseMonth()}
                        disabled={nextMonthButtonDisabled}
                        className={`!cursor-pointer !flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[18px] md:!h-[18px] !rounded-full !transition !disabled:opacity-40 ${nextMonthButtonDisabled
                          ? "!bg-gray-100"
                          : "!bg-[#f0f4f8] !hover:bg-gray-200"
                          }`}
                        aria-label="Next month"
                      >
                        <ChevronRight className="!text-[#999999]" />
                      </button>
                    </div>
                  )}
                />
                <CalendarIcon
                  className="!pointer-events-none !absolute !right-[12px] !top-[16px] sm:!top-[15px] md:!top-[20px] !-translate-y-1/2 !h-[14px] !w-[14px] md:!h-[18px] md:!w-[18px] !text-[#808080]"
                  strokeWidth={1.75}
                />
                {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                  <ErrorText text={formik.errors.dateOfBirth} />
                )}
              </div>

              {/* First Name */}
              <div className="md:!col-span-1" style={{ order: 1 }}>
                <input
                  type="text"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="First Name*"
                  className={`!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px]  !border !rounded-[5px] !bg-white !text-[#2E495C] !placeholder-[#2E495C] !focus:outline-none !focus:ring-1 !transition-colors  text-font  ${formik.touched.firstName && formik.errors.firstName ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500" : "!border-[#E5EDEF] !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF]"}`}
                  maxLength={30}
                  onInput={(e) =>
                  ((e.target as HTMLInputElement).value = (
                    e.target as HTMLInputElement
                  ).value.replace(/[^a-zA-Z\s'-]/g, ""))
                  }
                />
                {formik.touched.firstName && formik.errors.firstName && (
                  <ErrorText text={formik.errors.firstName} />
                )}
              </div>

              {/* Last Name */}
              <div className="md:!col-span-1" style={{ order: 2 }}>
                <input
                  type="text"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Last Name*"
                  className={`!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px]  !border !rounded-[5px] !bg-white !text-[#2E495C]  !placeholder-[#2E495C] !focus:outline-none !focus:ring-1 !transition-colors  text-font  ${formik.touched.lastName && formik.errors.lastName ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500" : "!border-[#E5EDEF] !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF]"}`}
                  maxLength={30}
                  onInput={(e) =>
                  ((e.target as HTMLInputElement).value = (
                    e.target as HTMLInputElement
                  ).value.replace(/[^a-zA-Z\s'-]/g, ""))
                  }
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <ErrorText text={formik.errors.lastName} />
                )}
              </div>

              {/* Email */}
              <div className="md:!col-span-1" style={{ order: 3 }}>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Email*"
                  className={`!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px]  !border !rounded-[5px] !bg-white !text-[#2E495C] !placeholder-[#2E495C] !outline-none !focus:!outline-none !focus:ring-1  !transition-colors  text-font  ${formik.touched.email && formik.errors.email ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500" : "!border-[#E5EDEF] !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF]"}`}
                />
                {formik.touched.email && formik.errors.email && (
                  <ErrorText text={formik.errors.email} />
                )}
              </div>

              {/* Mobile */}
              <div className="phone-input-wrapper md:!col-span-1" id="mobile" style={{ order: 4 }}>
                <PhoneInput
                  defaultCountry="US"
                  country={"us"}
                  value={formik.values.mobile}
                  onChange={(value) => formik.setFieldValue("mobile", value)}
                  onBlur={() => formik.setFieldTouched("mobile", true)}
                  placeholder="(201) 555-0123 *"
                  className={`PhoneInput ${formik.touched.mobile && formik.errors.mobile ? "error" : ""
                    } !w-full !border !rounded-[5px] !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px] !text-[#2E495C] !placeholder-[#2E495C]
                  ${formik.touched.mobile && formik.errors.mobile
                      ? "!border-red-500"
                      : "!border-[#E5EDEF]"
                    }
                  !focus:outline-none !focus:ring-2 !placeholder-text-color !focus:border-none !focus:ring-[#E5EDEF]  text-font !focus:border-[#E5EDEF]`}
                  limitMaxLength={true}
                  international={false}
                />
                {formik.touched.mobile && formik.errors.mobile && (
                  <ErrorText text={formik.errors.mobile} />
                )}
              </div>

              <h3
                className="md:!col-span-2 !m-0 !block !text-[14px] md:!text-[16px] !mt-[10px] !font-inter !transform-none field-header !text-[#2E495C] !font-medium"
                style={{ order: 5 }}
              >
                Appointment Details
              </h3>

              {/* Reason for Visit Detail */}
              <div className="md:!col-span-1" style={{ order: 6 }}>
                {renderDropdown({
                  name: "reasonForVisitDetail",
                  value: formik.values.reasonForVisitDetail,
                  options: reasonForVisitOptions,
                  placeholder: "Reason for Visit*",
                  onChange: (val) =>
                    handleOnchangeDropDown("reasonForVisitDetail", val),
                  error: formik.errors.reasonForVisitDetail,
                  touched: formik.touched.reasonForVisitDetail,
                  formik,
                })}
              </div>

              {/* Provider */}
              <div className="!relative md:!col-span-1" ref={setWrapperRef("provider")} style={{ order: 9 }}>
                {loading.services ? (
                  <div className="!text-[14px] !text-gray-500 !text-center !w-full !px-[12px] !py-[5px] md:!py-[7px] !border !rounded-[7px] !bg-white !font-inter !border-gray-300">
                    Loading providers...
                  </div>
                ) : (
                  <div className="!relative">
                    {(() => {
                      // Filter providers based on selected service using dynamic service data
                      const dynamicServiceProviders =
                        createDynamicServiceProviders(staff);
                      const selectedService = formik.values.reasonForVisit;
                      const allowedProviderIds =
                        getProvidersForService(selectedService);
                      const availableProviders = dynamicServiceProviders.filter(
                        (provider: any) =>
                          allowedProviderIds.includes(provider.id),
                      );
                      // --- ADD CUSTOM SORTING HERE ---
                      const PROVIDER_PRIORITY = [
                        "Dr. Camelia Furlan",
                        "Dr Tashmita Dhiman",
                        "Dr Andre Paceli"
                      ];

                      availableProviders.sort((a, b) => {
                        const indexA = PROVIDER_PRIORITY.indexOf(a.name || "");
                        const indexB = PROVIDER_PRIORITY.indexOf(b.name || "");
                        // If both are in the priority list, sort by priority index
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        // If only A is in the list, it comes first
                        if (indexA !== -1) return -1;
                        // If only B is in the list, it comes first
                        if (indexB !== -1) return 1;
                        // Fallback: sort alphabetically by name
                        return (a.name || "").localeCompare(b.name || "");
                      });
                      // --------------------------------

                      const selectedProvider = formData.staffId
                        ? availableProviders.find(
                          (staff: any) => staff.id === formData.staffId,
                        )
                        : null;
                      const selectedProviderAvatar =
                        selectedProvider?.profilePhoto;
                      const selectedProviderName = selectedProvider?.name;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === "provider" ? null : "provider",
                            )
                          }
                          className={`!w-full !max-h-[36px]  md:!max-h-[41px] !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] !border !rounded-[5px] md:!rounded-[7px] !focus:outline-none !focus:ring-1 !flex !items-center !justify-between !font-inter !transition-colors
                              ${formik.touched.provider && formik.errors.provider
                              ? "!bg-white !border-red-500 !focus:ring-red-500 !focus:border-red-500 !cursor-pointer"
                              : "!bg-white !border-[#E5EDEF] !focus:ring-[#E5EDEF] !focus:border-[#E5EDEF] !cursor-pointer"
                            }`}
                          title={
                            !formik.values.reasonForVisit
                              ? 'Please choose "Type of Visit" first'
                              : ""
                          }
                        >
                          <div className="!flex !items-center !gap-[12px] flex-1 min-w-0">
                            {selectedProviderAvatar && (
                              <img
                                src={selectedProviderAvatar}
                                alt={selectedProviderName || "Selected provider"}
                                className="!w-[26px] md:!w-[32px] !rounded-full !object-cover !border !border-gray-200 !shadow !group-hover:border-[#253E69] flex-shrink-0"
                              />
                            )}
                            <span
                              className={`!text-[14px] md:!text-[18px] text-font truncate !text-left flex-1 min-w-0 ${formik.values.provider || selectedProviderName
                                ? "!text-[#2E495C]" : "!text-[#2E495C]"
                                }`}
                            >
                              {formik.values.provider ||
                                selectedProviderName ||
                                "Choose a Provider*"}
                            </span>
                          </div>
                          <ChevronDown
                            className={`!h-[14px] !w-[14px] md:!h-[18px] md:!w-[18px] flex-shrink-0 ${openDropdown === "provider" ? "!rotate-180" : ""} ${formik.values.provider || selectedProviderName
                              ? "!text-[#2E495C]" : "!text-[#2E495C]"
                              }`}
                          />
                        </button>
                      );
                    })()}
                    {openDropdown === "provider" && (
                      <div
                        className="!absolute !z-30 !w-full !mt-[0px] !bg-white !border !border-gray-200 !rounded-[5px] !shadow-2xl card-dropdown !transition-all !select-none !font-inter !max-h-[324px] !overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                        style={{ minWidth: "100%", top: "calc(100% + 4px)" }}
                      >
                        {(() => {
                          const missingReasonForVisit =
                            !formik.values.reasonForVisit;

                          const dynamicServiceProviders =
                            createDynamicServiceProviders(staff);
                          const selectedService = formik.values.reasonForVisit;

                          const allowedProviderIds =
                            getProvidersForService(selectedService);

                          const availableProviders =
                            dynamicServiceProviders.filter((provider: any) =>
                              allowedProviderIds.includes(provider.id),
                            );

                          // --- ADD CUSTOM SORTING HERE (FOR THE DROPDOWN LIST) ---
                          const PROVIDER_PRIORITY = [
                            "Dr. Camelia Furlan",
                            "Dr Tashmita Dhiman",
                            "Dr Andre Paceli"
                          ];

                          availableProviders.sort((a, b) => {
                            const indexA = PROVIDER_PRIORITY.indexOf(a.name || "");
                            const indexB = PROVIDER_PRIORITY.indexOf(b.name || "");
                            // If both are in the priority list, sort by priority index
                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            // If only A is in the list, it comes first
                            if (indexA !== -1) return -1;
                            // If only B is in the list, it comes first
                            if (indexB !== -1) return 1;
                            // Fallback: sort alphabetically by name
                            return (a.name || "").localeCompare(b.name || "");
                          });
                          // ---------------------------------------------------------


                          if (missingReasonForVisit) {
                            return (
                              <div className="!px-[12px] sm:!px-[14px] !py-[5px] md:!py-[7px] !text-[15px] md:!text-[16px] !text-red-500 !text-center">
                                Please choose "Type of Visit" first
                              </div>
                            );
                          }

                          if (availableProviders.length === 0) {
                            return (
                              <div className="!px-[12px] sm:!px-[14px] !py-[5px] md:!py-[7px] !text-[15px] md:!text-[16px] !text-red-500 !text-center">
                                No providers available for this service
                              </div>
                            );
                          }

                          return availableProviders.map((staff: any) => {
                            const avatar = staff.profilePhoto;
                            const staffDisplayName = staff.name || "Provider";

                            return (
                              <button
                                key={staff.id}
                                type="button"
                                onClick={() => {
                                  handleProviderSelect(staff);
                                  setOpenDropdown(null);
                                }}
                                className={`!w-full !max-h-[32px] md:!max-h-[48px] !px-[7px] md:!px-[14px] !py-[5px] md:!py-[10px] !flex !items-center !gap-[12px] !text-left  text-font  !transition-colors ${staffDisplayName === formik.values.provider
                                  ? "!bg-[#253E69]/10 !border-l-2 !border-l-[#253E69]"
                                  : "!hover:bg-[#f5f7fa]"
                                  }`}
                                style={{ cursor: "pointer" }}
                              >
                                <img
                                  src={avatar}
                                  alt={staffDisplayName}
                                  className="!w-[28px] md:!w-[40px] !h-[28px] md:!h-[40px] !rounded-full !object-cover !border !border-gray-200 !shadow !group-hover:border-[#253E69]"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.visibility = "hidden";
                                  }}
                                />

                                <span className="!text-[14px] !text-[#2E495C] !font-medium !font-inter  text-font ">
                                  {staffDisplayName}
                                </span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
                {formik.touched.provider && formik.errors.provider && (
                  <ErrorText text={formik.errors.provider} />
                )}
              </div>
            </div>

            {/* Date/Time */}
            <div className="!mt-[12px] md:!mt-[16px]">
              <h3 className="md:!col-span-2 !m-0 !block !mb-[8px] !text-[14px] md:!text-[16px] !mt-[10px] !font-inter !transform-none field-header !text-[#2E495C] !font-medium">
                Preferred Date &amp; Time
              </h3>
              <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-[12px] md:!gap-[16px] !items-stretch">
                {/* Calendar */}
                <div className="w-full !h-full">
                  <div
                    className={`!border !rounded-[5px]  !p-[5px] md:!p-[10px] md:!pt-[5px] !bg-white !relative !transition-colors !overflow-visible !h-full ${formik.touched.date && formik.errors.date
                      ? "!border-red-500"
                      : "!border-gray-300"
                      }`}
                  >
                    <DatePicker
                      key={calendarKey}
                      selected={selectedDate}
                      onChange={handleDateChange}
                      onBlur={() => formik.setFieldTouched("date", true)}
                      inline
                      minDate={new Date()}
                      openToDate={selectedDate || calendarMonth}
                      onMonthChange={handleCalendarMonthChange}
                      filterDate={(d: Date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const cmp = new Date(d);
                        cmp.setHours(0, 0, 0, 0);
                        const isFutureOrToday =
                          cmp.getTime() >= today.getTime();
                        return (
                          isFutureOrToday && availableDates.has(formatDate(d))
                        );
                      }}
                      dayClassName={(d: Date) => {
                        const key = formatDate(d);
                        const isAvailable = availableDates.has(key);
                        return isAvailable
                          ? "available-day"
                          : "rdp-day-disabled";
                      }}
                      calendarClassName={`custom-calendar ${!isDateTimeEnabled ? "calendar-locked" : ""}`}
                      className="!w-full"
                      formatWeekDay={(nameOfDay: string) => nameOfDay.slice(0, 3)}
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }: ReactDatePickerCustomHeaderProps) => (
                        <div className="!flex !items-center !justify-center !gap-[12px] !px-[12px] !py-[4px] md:!py-[7px]">
                          <button
                            type="button"
                            onClick={() => decreaseMonth()}
                            disabled={prevMonthButtonDisabled}
                            className={`!cursor-pointer !flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[20px] md:!h-[20px] !rounded-full !transition !disabled:opacity-40 ${prevMonthButtonDisabled
                              ? "!bg-[#F3F4F6]"
                              : "!bg-[#F3F4F6] !hover:bg-gray-200"
                              }`}
                            aria-label="Previous month"
                          >
                            <ChevronLeft className="!text-[#999999]" />
                          </button>
                          <div className="!text-[14px] md:!text-[18px] !text-[#999999] !font-semibold">
                            {date.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => increaseMonth()}
                            disabled={nextMonthButtonDisabled}
                            className={`!cursor-pointer !flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[20px] md:!h-[20px] !rounded-full !transition !disabled:opacity-40 ${nextMonthButtonDisabled
                              ? "!bg-[#F3F4F6]"
                              : "!bg-[#F3F4F6] !hover:bg-gray-200"
                              }`}
                            aria-label="Next month"
                          >
                            <ChevronRight className="!text-[#999999]" />
                          </button>
                        </div>
                      )}
                    />
                    {loading.availability && (
                      <div className="!absolute !inset-0 !bg-white/60 !backdrop-blur-[1px] !flex !items-center !justify-center !rounded-[5px] !z-10">
                        <div
                          className="!h-[32px] !w-[32px] !border-2 !border-[#253E69] !border-t-transparent !rounded-full !animate-spin"
                          aria-label="Loading calendar availability"
                        />
                      </div>
                    )}

                    {!isDateTimeEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[5px] z-20 pointer-events-none px-[14px]">
                        <div className="bg-[#F3F4F6] text-[#999999] text-center text-[12px] md:text-[16px] !px-[12px] !py-[7px] md:!px-[24px] md:!py-[10px] rounded-[5px]">
                          Select all fields above to unlock the calendar.
                        </div>
                      </div>
                    )}
                  </div>
                  {formik.touched.date && formik.errors.date && (
                    <ErrorText text={formik.errors.date} />
                  )}
                </div>

                {/* Time Slots */}
                <div className={`!flex-1 !min-w-0 !h-full ${!selectedDate ? "hidden md:block" : ""}`}>
                  <div
                    className={`!rounded-[5px] !p-[4px] md:!p-[7px] lg:!h-full md:!border ${isDateTimeEnabled && selectedDate ? "!border" : ""
                      } ${formik.touched.time && formik.errors.time
                        ? "!border-red-500"
                        : "!border-gray-200"
                      }`}
                  >
                    {!selectedDate && (
                      <div className="text-[#999999] text-center text-[12px] md:text-[16px] hidden md:flex w-full h-full justify-center items-center py-[20px] md:py-0">
                        <p className="bg-[#F3F4F6] !px-[12px] !py-[7px] md:!px-[24px] md:!py-[10px] rounded-[5px]">
                          Select a date first to view available time slots
                        </p>
                      </div>
                    )}
                    {isDateTimeEnabled && selectedDate && (
                      <>
                        <div className="!flex !justify-center !items-center !px-[12px] !gap-[7px] !py-[4px] md:!py-[6px] !bg-gray-50 !rounded-[5px]">
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedDate) return;
                              const prevDate = new Date(selectedDate.getTime());
                              prevDate.setDate(prevDate.getDate() - 1);
                              handleDateChange(prevDate);
                            }}
                            className="!group !p-[0px] !focus:outline-none"
                          >
                            <span className="!flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[31.5px] md:!h-[31.5px] !bg-[#f0f4f8] !rounded-full !group-hover:bg-[#253E69]/10 !transition-colors">
                              <ChevronLeft className="!h-[14px] !w-[14px] !text-[#999999]" />
                            </span>
                          </button>
                          <span
                            className="!text-[12px] !font-medium !text-[#999999] !mx-[7px] !whitespace-nowrap"
                            style={{ fontWeight: "bold" }}
                          >
                            {selectedDate?.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedDate) return;
                              const nextDate = new Date(selectedDate.getTime());
                              nextDate.setDate(nextDate.getDate() + 1);
                              handleDateChange(nextDate);
                            }}
                            className="!group !p-[0px] !focus:outline-none"
                          >
                            <span className="!flex !items-center !justify-center !w-[15px] !h-[15px] md:!w-[31.5px] md:!h-[31.5px] !bg-[#f0f4f8] !rounded-full !group-hover:bg-[#253E69]/10 !transition-colors">
                              <ChevronRight className="!h-[14px] !w-[14px] !text-[#999999]" />
                            </span>
                          </button>
                        </div>
                        <div className="!grid !grid-cols-2 !bg-white !border-b !border-gray-200">
                          <div className="!px-[14px] !py-[4px] !text-center !border-r !border-gray-200">
                            <span className="!text-[12px] !font-medium !text-[#999999] !uppercase !tracking-wide">
                              Morning
                            </span>
                          </div>
                          <div className="!px-[14px] !py-[4px] !text-center">
                            <span className="!text-[12px] !font-medium !text-[#999999] !uppercase !tracking-wide">
                              Afternoon
                            </span>
                          </div>
                        </div>
                        <div
                          className={`!max-h-[160px] md:!max-h-[172px] !overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 !p-[12px] ${!selectedDate ? "!bg-gray-50 !cursor-not-allowed" : ""}`}
                        >
                          {!selectedDate ? (
                            <div className="!text-[12px] !text-gray-400 !text-center">
                              Select a date first to view available time slots
                            </div>
                          ) : loadingAvailability ? (
                            <div className="!text-[12px] !text-gray-500 !text-center">
                              Loading available time slots...
                            </div>
                          ) : slotsForSelectedDate.length === 0 ? (
                            <div className="!text-[12px] !text-gray-500">
                              No slots available for this date.
                            </div>
                          ) : (
                            <div className="!grid !grid-cols-2 !gap-[12px]">
                              <div className="!space-y-[7px]">
                                {timeSlotGroups.morning.map((slot) => {
                                  const slotId = slot.iso;
                                  const isSelected =
                                    selectedSlot?.startTime ===
                                    slot.raw.startTime;
                                  const isActive = activeSlotId === slotId;
                                  return (
                                    <div
                                      key={slotId}
                                      className="!flex !items-center !gap-[7px] !w-full"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          !isSelected
                                            ? toggleTimeSlotPreview(slot)
                                            : undefined
                                        }
                                        className={`!flex-1 !px-[7px] !py-[5px] md:!py-[7px] !text-[12px] !rounded-[5px] !border !text-center !whitespace-nowrap !transition-all !duration-200 ${isSelected ? "!bg-[var(--primary-color)] !text-[#ffffff] !border-[var(--primary-color)] !shadow-sm animate-selectPulse" : isActive ? "!bg-white !text-[#2E495C] !border-[#2E495C]" : "!bg-white !text-[#2E495C] !border-gray-300 !hover:border-gray-400"}`}
                                        aria-label={`Time ${slot.label}`}
                                        aria-pressed={isActive}
                                        disabled={isSelected}
                                      >
                                        {slot.label}
                                      </button>
                                      {isActive && !isSelected && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleTimeSlotClick(slot)
                                          }
                                          className="!flex-1 !min-w-0 !px-[14px] !py-[5px] md:!py-[7px] !text-[12px] !font-semibold !rounded-[5px] !border !transition !bg-[var(--primary-color)] !text-[#ffffff] !border-[var(--primary-color)] !hover:bg-[var(--darker-primary-color)] !text-center"
                                          aria-label={`Select ${slot.label}`}
                                        >
                                          Select
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="!space-y-[7px]">
                                {timeSlotGroups.afternoon.map((slot) => {
                                  const slotId = slot.iso;
                                  const isSelected =
                                    selectedSlot?.startTime ===
                                    slot.raw.startTime;
                                  const isActive = activeSlotId === slotId;
                                  return (
                                    <div
                                      key={slotId}
                                      className="!flex !items-center !gap-[7px] !w-full"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          !isSelected
                                            ? toggleTimeSlotPreview(slot)
                                            : undefined
                                        }
                                        className={`!flex-1 !px-[7px] !py-[5px] md:!py-[7px] !text-[12px] !font-medium !rounded-[5px] !border !text-center !whitespace-nowrap !transition-all !duration-200 !ease-in-out !hover:scale-105 ${isSelected ? "!bg-[var(--primary-color)] !text-[#ffffff] !border-[var(--primary-color)] !shadow-sm animate-selectPulse" : isActive ? "!bg-white !text-[#2E495C] !border-[#2E495C]" : "!bg-white !text-[#2E495C] !border-gray-300 !hover:border-gray-400"}`}
                                        aria-label={`Time ${slot.label}`}
                                        aria-pressed={isActive}
                                        disabled={isSelected}
                                      >
                                        {slot.label}
                                      </button>
                                      {isActive && !isSelected && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleTimeSlotClick(slot)
                                          }
                                          className="!flex-1 !min-w-0 !px-[14px] !py-[5px] md:!py-[7px] !text-[12px] !font-semibold !rounded-[5px] !border !transition !bg-[var(--primary-color)] !text-[#ffffff] !border-[var(--primary-color)] !hover:bg-[var(--darker-primary-color)] !text-center"
                                          aria-label={`Select ${slot.label}`}
                                        >
                                          Select
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {formik.touched.time && formik.errors.time && (
                    <ErrorText text={formik.errors.time} />
                  )}
                </div>
              </div>
              {/* Selected Time Display */}
              {selectedTimeSlot && selectedDate && (
                <div className="!mt-[12px] md:!mt-[16px] border-2 rounded-[7px] p-[7px] bg-[#2E495C] text-white w-full">
                  <div className="!flex !items-center !justify-between">
                    <div className="!flex !items-center !space-x-[12px]">
                      {/* Calendar Image */}
                      <div className="!border-r !border-r-white !p-[7px] !pe-[12px] !flex !items-center !justify-center">
                        <img
                          src="/icon-calendar.png" // 🖼️ replace with your image path
                          alt="Calendar Icon"
                          className="!w-[15px] !h-[15px] !object-contain"
                        />
                      </div>
                      <div>
                        <p className="!m-[0px] !text-[12px] !text-[#ffffff] !font-medium">
                          Selected Time: {selectedTimeSlot}
                        </p>
                        <p className="!m-[0px] !text-[12px] !text-[#ECEEEF] !text-left">
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFullReset}
                      className="!bg-white !text-[#2E495C] !px-[14px] !py-[5px] !rounded-[5px] !text-[12px]  !font-medium !hover:bg-gray-100 !transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}


              {/* optional fields, Consent Checkbox, and Submit Button grouped together */}
              <div className="!mt-[12px] md:!mt-[16px] !flex !flex-col !gap-[12px] md:!gap-[16px]">
                {/* Appointment Notes */}
                <div>
                  <textarea
                    name="appointmentNotes"
                    value={formik.values.appointmentNotes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Appointment Notes"
                    rows={3}
                    className="!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px] text-font !border !border-gray-300 !rounded-[5px] !bg-white !text-[#2E495C] !placeholder-[#2E495C] !focus:outline-none !focus:ring-1 !focus:ring-gray-300 !focus:border-gray-300 !hover:border-[#2E495C]/50 !resize-none !transition-colors"
                  />
                </div>

                {/* How did you hear about us? */}
                <div>
                  <input
                    type="text"
                    name="howDidYouHear"
                    value={formik.values.howDidYouHear}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="How did you hear about us?"
                    className={`!w-full !px-[12px] !py-[5px] md:!py-[7px] !text-[14px] md:!text-[18px] !border !rounded-[5px] !bg-white !text-[#2E495C] !placeholder-[#2E495C] !focus:outline-none !focus:ring-1 !transition-colors text-font ${formik.touched.howDidYouHear && formik.errors.howDidYouHear
                      ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500"
                      : "!border-gray-300 !focus:ring-gray-300 !focus:border-gray-300"
                      }`}
                  />
                  {formik.touched.howDidYouHear && formik.errors.howDidYouHear && (
                    <ErrorText text={formik.errors.howDidYouHear} />
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="!flex !items-start !mt-[4px]">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formik.values.termsAccepted}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="circle-consent"
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="!leading-snug !text-left !text-[10px] md:!text-[14px] !cursor-pointer !select-none !text-[#2E495C]"
                  >
                    I agree that my personal data is collected and kept so that Dr.
                    Furlan can send me reminders, offers and other communications by
                    Email and SMS (frequency varies / data rates may apply).
                  </label>
                </div>
                {formik.touched.termsAccepted && formik.errors.termsAccepted && (
                  <ErrorText text={formik.errors.termsAccepted} />
                )}

                {/* Submit Button */}
                <div className="!flex !justify-center !mt-[12px]">
                  <button
                    type="submit"
                    disabled={isSubmitting || formik.isSubmitting}
                    onClick={async (e) => {
                      const errors = await formik.validateForm();
                      Object.keys(formik.values).forEach((fieldName) => {
                        formik.setFieldTouched(fieldName, true);
                      });
                      if (Object.keys(errors).length > 0) {
                        e.preventDefault();
                        scrollToAllErrors(errors);
                        return;
                      }
                    }}
                    className={`!text-center !cursor-pointer !w-fit !text-white text-font !py-[7px] md:!py-[10px] !px-[40px] md:!px-[48px] !rounded-[5px] !transition !duration-200 !shadow-md md:!mb-[14px] !mb-[10px] ${isSubmitting
                      ? "!bg-gray-500 !cursor-not-allowed"
                      : "!bg-[#2E495C] !text-[#FFFFFF] !hover:bg-[#17A8A4] !active:bg-[#14938F]"
                      }`}
                  >
                    {isSubmitting || formik.isSubmitting ? "Booking..." : "Book Now"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="!m-[0px] !p-[0px] !text-center !text-[12px] !font-normal">
            <p className="!p-[0px] !m-[0px]  !text-[#2E495C] !text-[12px]">
              <span className="!text-[12px]">Powered by EZMarketer</span>
              <sup className="!text-[7px]">TM</sup>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFormV2;

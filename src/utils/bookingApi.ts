import axios from 'axios';
import { BookingResponse, Service } from '../types';
import { BOOKING_TIMEZONE } from './constants';

// For /options fetch (all services, locations - robust!)
export const fetchBookingOptions = async (locationId: string, headers = {}): Promise<{ services: Service[] }> => {
  const response = await fetch(
    `https://backend.leadconnectorhq.com/calendars/bookings/options?locationId=${locationId}`,
    {
      headers: {
        'accept': '*/*',
        'channel': 'APP',
        'source': 'WEB_USER',
        'timezone': BOOKING_TIMEZONE,
        ...(headers || {})
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch booking options');
  return await response.json();
};

// Robust staff fetch (by IDs array)
export const fetchBookingStaff = async (userIds: string[], headers = {}): Promise<{ users: any[] }> => {
  const response = await fetch(
    `https://backend.leadconnectorhq.com/calendars/bookings/staff`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'channel': 'APP',
        'origin': 'https://links.ezmarketer.com',
        ...(headers || {})
      },
      body: JSON.stringify({ userIds })
    }
  );
  if (!response.ok) throw new Error('Failed to fetch booking staff');
  return await response.json();
};

// Unified availability fetch (same as reference)
export const fetchBookingAvailability = async (body: any, headers = {}): Promise<{ slots: any[] }> => {
  const response = await fetch(
    `https://backend.leadconnectorhq.com/calendars/bookings/availability`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'channel': 'APP',
        'origin': 'https://links.ezmarketer.com',
        ...(headers || {})
      },
      body: JSON.stringify(body)
    }
  );
  if (!response.ok) throw new Error('Failed to fetch booking availability');
  return await response.json();
};
// Initiate booking
export const initiateBooking = async (
  payload: any,
  timezone: string
): Promise<BookingResponse> => {
  const formData = new FormData();
  // The payload must be a JSON string inside the "formData" field
  formData.append('formData', JSON.stringify(payload));
  // Add turnstile token if available (optional field)
  if (payload.turnstileNonInteractiveToken) {
    formData.append('turnstileNonInteractiveToken', payload.turnstileNonInteractiveToken);
  }
  try {
    const response = await axios.post<BookingResponse>(
      'https://backend.leadconnectorhq.com/calendars/bookings/initiate',
      formData,
      {
       headers: {
        accept: '*/*',
        channel: 'APP',
        origin: 'https://links.ezmarketer.com',
        source: 'WEB_USER',
        timezone,
        internalsource: 'booking_widget',
        // Do NOT set Content-Type – axios will set it to multipart/form-data with the correct boundary
      },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to initiate booking:', error);
    throw error;
  }
};

// Confirm booking
export const confirmBooking = async (serviceBookingId: string, paymentData: any, timezone: string): Promise<any> => {
  const response = await fetch(
    `https://backend.leadconnectorhq.com/calendars/bookings/confirm/${serviceBookingId}/`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'channel': 'APP',
        'origin': 'https://links.ezmarketer.com',
        'timezone': timezone
      },
      body: JSON.stringify(paymentData)
    }
  );
  if (!response.ok) throw new Error('Failed to confirm booking');
  return await response.json();
};

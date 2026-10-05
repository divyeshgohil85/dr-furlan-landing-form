import axios from 'axios';
import moment from 'moment-timezone';
import { DENTIQUE_CONFIG } from './constants';

// Get custom fields from GHL
export const getCustomFields = async (locationId: string): Promise<any[]> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/locations/${locationId}/customFields`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_DENTIQUE_GHL_API_KEY}`,
        'Version': '2021-04-15'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch custom fields');
  return await response.json();
};

// Add contact note
export const addContactNote = async (contactId: string, noteBody: string): Promise<any> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        body: noteBody
      })
    }
  );
  if (!response.ok) throw new Error('Failed to add contact note');
  return await response.json();
};

// Get contact by ID
export const getContactById = async (contactId: string): Promise<{ contact: any }> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    {
      headers: {
        'Authorization': `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
        'Version': '2021-04-15'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch contact');
  return await response.json();
};

// Remove contact tags
export const removeContactTags = async (contactId: string, tags: string[]): Promise<any> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({ tags })
    }
  );
  if (!response.ok) throw new Error('Failed to remove contact tags');
  return await response.json();
};

// Update contact
export const updateContact = async (contactData: any, contactId: string): Promise<any> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify(contactData)
    }
  );
  if (!response.ok) throw new Error('Failed to update contact');
  return await response.json();
};

// Create opportunity
export const createOpportunity = async (contactId: string, opportunityData: any): Promise<any> => {
  const response = await fetch(
    `https://services.leadconnectorhq.com/opportunities`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        contactId,
        ...opportunityData
      })
    }
  );
  if (!response.ok) throw new Error('Failed to create opportunity');
  return await response.json();
};

// Smile Deals API functions
export const smileDealCustomObjectId = "69f0c3efa7f6734f6eccb95f";

// Get Smile Deals from custom object
export const getSmileDealsFromCustomObject = async (
  locationId?: string
): Promise<any[]> => {
  const allRecords: any[] = [];
  let searchAfter: string | undefined = undefined;

  try {
    while (true) {
      const response = await axios.post(
        `https://services.leadconnectorhq.com/objects/${smileDealCustomObjectId}/records/search`,
        {
          locationId:
            locationId || import.meta.env.VITE_NSS_LOCATION_ID,
          page: 1,
          pageLimit: 50,
          ...(searchAfter ? { searchAfter } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${DENTIQUE_CONFIG?.GHL_API_KEY}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
          },
        }
      );

      const records: any[] = response.data?.records ?? [];

      if (records.length === 0) break;

      allRecords.push(...records);

      searchAfter =
        records[records.length - 1]?.searchAfter;
    }

    // Australia timezone
    const australiaNow = moment.tz("Australia/Sydney");

    const currentMonth = australiaNow.month() + 1;
    const currentYear = australiaNow.year();

    const filteredDeals = allRecords.filter((record: any) => {
      const properties = record.properties || {};

      // Active deals only
      const isActive =
        properties.isdealactive?.[0] === "true";

      if (!isActive) return false;

      // Usage month validation
      const usageMonthStr = properties.usage_month;

      if (usageMonthStr) {
        const usageDate = moment.tz(
          usageMonthStr,
          "Australia/Sydney"
        );

        const usageMonth = usageDate.month() + 1;
        const usageYear = usageDate.year();

        // Past month/year check
        if (
          usageYear < currentYear ||
          (usageYear === currentYear &&
            usageMonth < currentMonth)
        ) {
          return false;
        }

        // Max 2 months ahead
        const monthsDiff =
          (usageYear - currentYear) * 12 +
          (usageMonth - currentMonth);

        if (monthsDiff > 2) {
          return false;
        }
      }

      // Expiry date validation
      const expiryDate =
        properties.deal_expiry_date;

      if (expiryDate) {
        const todayStart = moment
          .tz("Australia/Sydney")
          .startOf("day");

        const expiryEnd = moment
          .tz(expiryDate, "Australia/Sydney")
          .endOf("day");

        if (expiryEnd.isBefore(todayStart)) {
          return false;
        }
      }

      return true;
    });

    // Sort by display order
    const sortedDeals = filteredDeals.sort(
      (a: any, b: any) => {
        const aOrder = parseInt(
          a.properties?.deal_display_order || "999"
        );

        const bOrder = parseInt(
          b.properties?.deal_display_order || "999"
        );

        return aOrder - bOrder;
      }
    );

    console.log(
      "🎯 Smile Deals API response:",
      sortedDeals
    );

    return sortedDeals;
  } catch (error) {
    console.error(
      "❌ Error fetching Smile Deals:",
      error
    );

    throw error;
  }
};

/**
 * Google Calendar API Service
 * Handles listing, creating, and deleting itinerary events on the user's primary Google Calendar.
 */

import { TripPlan, DayItinerary, DailyScheduleSlot } from '../types';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  extendedProperties?: {
    private?: {
      tripId?: string;
      day?: string;
      slot?: string;
      source?: string;
    };
  };
}

export interface SyncProgressCallback {
  (completed: number, total: number, currentItem: string): void;
}

export interface SyncResult {
  totalCreated: number;
  events: GoogleCalendarEvent[];
  calendarUrl: string;
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/**
 * Fetch events from the user's primary calendar within an optional time range
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(CALENDAR_API_BASE);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '100');

  if (timeMin) url.searchParams.append('timeMin', timeMin);
  if (timeMax) url.searchParams.append('timeMax', timeMax);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return (data.items || []) as GoogleCalendarEvent[];
}

/**
 * Create a single event on the user's primary calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: {
    summary: string;
    description: string;
    location?: string;
    startIso: string;
    endIso: string;
    tripId?: string;
    dayNumber?: number;
    timeOfDay?: string;
  }
): Promise<GoogleCalendarEvent> {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const payload = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location || '',
    start: {
      dateTime: eventData.startIso,
      timeZone: userTimeZone,
    },
    end: {
      dateTime: eventData.endIso,
      timeZone: userTimeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'notification', minutes: 60 },
      ],
    },
    extendedProperties: {
      private: {
        source: 'TripPlannerAI',
        tripId: eventData.tripId || '',
        day: String(eventData.dayNumber || 1),
        slot: eventData.timeOfDay || '',
      },
    },
  };

  const response = await fetch(CALENDAR_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to create calendar event (${response.status}): ${errBody}`);
  }

  return (await response.json()) as GoogleCalendarEvent;
}

/**
 * Delete an event from user's primary calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(`${CALENDAR_API_BASE}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errBody = await response.text();
    throw new Error(`Failed to delete calendar event (${response.status}): ${errBody}`);
  }
}

/**
 * Calculate ISO start & end times for an itinerary slot based on trip starting date and day offset
 */
export function calculateSlotIsoTimes(
  startDateStr: string,
  dayNumber: number,
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening'
): { startIso: string; endIso: string; dateFormatted: string } {
  // Parse or fallback to tomorrow
  let baseDate = new Date();
  if (startDateStr && !isNaN(Date.parse(startDateStr))) {
    baseDate = new Date(startDateStr);
  } else {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  // Offset by dayNumber - 1
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + (dayNumber - 1));

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateFormatted = `${year}-${month}-${day}`;

  let startHours = 9;
  let endHours = 12;

  if (timeOfDay === 'Morning') {
    startHours = 9;
    endHours = 12;
  } else if (timeOfDay === 'Afternoon') {
    startHours = 13;
    endHours = 17;
  } else {
    startHours = 18;
    endHours = 21;
  }

  const startIso = `${dateFormatted}T${String(startHours).padStart(2, '0')}:00:00`;
  const endIso = `${dateFormatted}T${String(endHours).padStart(2, '0')}:00:00`;

  return { startIso, endIso, dateFormatted };
}

/**
 * Batch sync all itinerary slots for a trip to Google Calendar
 */
export async function syncEntireTripToCalendar(
  accessToken: string,
  trip: TripPlan,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  const createdEvents: GoogleCalendarEvent[] = [];

  // Flatten all slots
  const allSlots: {
    dayPlan: DayItinerary;
    slot: DailyScheduleSlot;
  }[] = [];

  trip.itinerary.forEach((dayPlan) => {
    dayPlan.slots.forEach((slot) => {
      allSlots.push({ dayPlan, slot });
    });
  });

  const total = allSlots.length;
  let completed = 0;

  for (const { dayPlan, slot } of allSlots) {
    const { startIso, endIso, dateFormatted } = calculateSlotIsoTimes(
      trip.startDate,
      dayPlan.day,
      slot.timeOfDay
    );

    const summary = `Day ${dayPlan.day} (${slot.timeOfDay}): ${slot.title} - ${trip.destination}`;
    const description = [
      `Trip: ${trip.title}`,
      `Destination: ${trip.destination}`,
      `Day ${dayPlan.day}: ${dayPlan.theme}`,
      `Slot: ${slot.timeOfDay}`,
      `Activity: ${slot.title}`,
      `Place: ${slot.place}`,
      `Details: ${slot.description}`,
      slot.estimatedCost ? `Estimated Cost: ${slot.estimatedCost}` : null,
      slot.transitTip ? `Transit Note: ${slot.transitTip}` : null,
      dayPlan.mealSuggestion ? `Meal Idea: ${dayPlan.mealSuggestion}` : null,
      `\nPlanned with AI Trip Planner`,
    ]
      .filter(Boolean)
      .join('\n');

    if (onProgress) {
      onProgress(completed, total, `${dayPlan.theme} (${slot.timeOfDay})`);
    }

    try {
      const event = await createGoogleCalendarEvent(accessToken, {
        summary,
        description,
        location: slot.place ? `${slot.place}, ${trip.destination}` : trip.destination,
        startIso,
        endIso,
        tripId: trip.id,
        dayNumber: dayPlan.day,
        timeOfDay: slot.timeOfDay,
      });
      createdEvents.push(event);
    } catch (err) {
      console.warn(`Could not sync slot "${slot.title}" to Google Calendar:`, err);
    }

    completed++;
    if (onProgress) {
      onProgress(completed, total, `${dayPlan.theme} (${slot.timeOfDay})`);
    }
  }

  return {
    totalCreated: createdEvents.length,
    events: createdEvents,
    calendarUrl: 'https://calendar.google.com/calendar/u/0/r',
  };
}

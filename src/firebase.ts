import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from './lib/firestoreErrors';
import { User, TripPlan, ContactFormData, ContactMessageRecord } from './types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore (uses explicit firestoreDatabaseId if configured, or default database)
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Standard Google Auth Provider for regular login (Email & Profile only - works universally)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Dedicated Google Calendar OAuth scopes - used strictly on-demand when the user clicks Calendar Sync
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getCalendarProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));
  return provider;
}

// Support & Administrator Configuration
// The ONLY Super Admin account is hemanthkuamr17@gmail.com
export const SUPER_ADMIN_EMAIL = 'hemanthkuamr17@gmail.com';
export const ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
export const SUPER_ADMIN_PHONE = '9177021832';

/**
 * Exact email comparison to verify Super Admin status.
 * Never use display name, first name, phone number, or partial matching.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

// In-memory access token cache (mandatory per security specification)
let cachedAccessToken: string | null = null;

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Test connection on boot as required by specification
async function testFirestoreConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    // Firestore operates in offline mode when network backend is warming up
    console.debug('Firestore client initialized; offline support active.');
  }
}
testFirestoreConnection();

/**
 * Save or update user profile document in /users/{userId}
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  if (!user || !user.id) return;
  const userPath = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    const existingSnap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        id: user.id,
        email: user.email || '',
        displayName: user.name || 'Traveler',
        photoURL: user.avatar || '',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const existingData = existingSnap.data();
      await setDoc(
        userRef,
        {
          id: user.id,
          email: user.email || existingData?.email || '',
          displayName: user.name || existingData?.displayName || 'Traveler',
          photoURL: user.avatar || existingData?.photoURL || '',
          createdAt: existingData?.createdAt || now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Save a generated trip itinerary to Firestore subcollection: /users/{userId}/trips/{tripId}
 */
export async function saveTripToFirestore(userId: string, trip: TripPlan): Promise<void> {
  const tripPath = `users/${userId}/trips/${trip.id}`;
  try {
    const tripRef = doc(db, 'users', userId, 'trips', trip.id);
    const existingSnap = await getDoc(tripRef);
    const now = new Date().toISOString();

    const tripData = {
      ...trip,
      userId,
      updatedAt: now,
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : (trip.createdAt || now),
    };

    await setDoc(tripRef, tripData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, tripPath);
  }
}

/**
 * Retrieve all saved trips for a user
 */
export async function getUserTripsFromFirestore(userId: string): Promise<TripPlan[]> {
  const collectionPath = `users/${userId}/trips`;
  try {
    const tripsCol = collection(db, 'users', userId, 'trips');
    const snapshot = await getDocs(tripsCol);
    const trips: TripPlan[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      trips.push({
        id: data.id || docSnap.id,
        createdAt: data.createdAt,
        title: data.title || 'Untitled Trip',
        destination: data.destination || '',
        startingLocation: data.startingLocation || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        durationDays: data.durationDays || 1,
        travelers: data.travelers || 1,
        pacing: data.pacing || 'balanced',
        budgetTier: data.budgetTier || 'moderate',
        summary: data.summary || '',
        budget: data.budget || {
          totalEstimated: 0,
          dailyAverage: 0,
          currency: 'USD',
          categories: {
            accommodation: 0,
            foodAndDining: 0,
            activitiesAndSights: 0,
            localTransit: 0,
            miscellaneous: 0,
          },
        },
        suggestedPlaces: data.suggestedPlaces || [],
        suggestedActivities: data.suggestedActivities || [],
        itinerary: data.itinerary || [],
        travelTips: data.travelTips || [],
        futureModules: data.futureModules || {
          stays: [],
          rentals: [],
        },
      });
    });

    // Sort newest first
    trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return trips;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Delete a trip from /users/{userId}/trips/{tripId}
 */
export async function deleteTripFromFirestore(userId: string, tripId: string): Promise<void> {
  const tripPath = `users/${userId}/trips/${tripId}`;
  try {
    const tripRef = doc(db, 'users', userId, 'trips', tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, tripPath);
  }
}

/**
 * Save contact inquiry to /contactMessages/{messageId}
 * Routing internally to administrator and support mailbox
 */
export async function saveContactMessageToFirestore(contact: ContactFormData): Promise<void> {
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const path = `contactMessages/${messageId}`;
  try {
    const msgRef = doc(db, 'contactMessages', messageId);
    await setDoc(msgRef, {
      id: messageId,
      name: contact.name,
      email: contact.email,
      subject: contact.subject || 'General Inquiry',
      message: contact.message,
      status: 'new',
      recipient: ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Retrieve all support inquiries for the administrator
 */
export async function getContactMessagesForAdmin(): Promise<ContactMessageRecord[]> {
  const path = 'contactMessages';
  try {
    const colRef = collection(db, 'contactMessages');
    const snap = await getDocs(colRef);
    const messages: ContactMessageRecord[] = [];

    snap.forEach((d) => {
      const data = d.data();
      messages.push({
        id: data.id || d.id,
        name: data.name || 'Anonymous Traveler',
        email: data.email || 'No email provided',
        subject: data.subject || 'General Support',
        message: data.message || '',
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'new',
        recipient: data.recipient || ADMIN_EMAIL,
      });
    });

    // Sort newest first
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Update the status of a support ticket (e.g. marked as resolved)
 */
export async function updateContactMessageStatus(
  messageId: string,
  status: 'new' | 'resolved' | 'in_progress'
): Promise<void> {
  const path = `contactMessages/${messageId}`;
  try {
    const msgRef = doc(db, 'contactMessages', messageId);
    await updateDoc(msgRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a support message (admin only)
 */
export async function deleteContactMessage(messageId: string): Promise<void> {
  const path = `contactMessages/${messageId}`;
  try {
    const msgRef = doc(db, 'contactMessages', messageId);
    await deleteDoc(msgRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

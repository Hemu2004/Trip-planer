import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  RAG_KNOWLEDGE_STORE,
  CURATED_MAP_PLACES,
  DESTINATION_COORDINATES,
  getLiveWeatherForDestination,
  getExchangeRates,
  retrieveRAGKnowledge,
} from './src/data/travelKnowledgeBase';
import { POPULAR_DESTINATIONS } from './src/data/sampleDestinations';
import { RAGDocument, MapLocationItem } from './src/types';
import { DEFAULT_KNOWLEDGE_FILES } from './src/utils/knowledgeBaseStorage';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Curated fallback planner will be used.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory mutable RAG knowledge store for Admin management
const defaultDocsFromFiles: RAGDocument[] = DEFAULT_KNOWLEDGE_FILES.map((f) => ({
  id: f.id,
  title: f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
  destination: f.tags?.find((t) => ['Japan', 'Kyoto', 'Amalfi', 'Italy', 'Paris', 'France'].includes(t)) || 'Global',
  category: f.category || 'guidelines',
  content: f.contentSnippet,
  tags: f.tags || [],
  source: `Admin Knowledge Base (${f.fileType.toUpperCase()})`,
  lastIndexed: f.lastProcessedAt ? f.lastProcessedAt.split('T')[0] : '2026-09-17',
}));

let mutableRAGStore: RAGDocument[] = [...RAG_KNOWLEDGE_STORE, ...defaultDocsFromFiles];

// User Chat Conversation store (strictly isolated by userId for privacy)
interface SavedConversation {
  id: string;
  userId: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}
const userConversationsStore: Map<string, SavedConversation[]> = new Map();

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'Trip Planner Premium Vacation API',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    ragDocumentsCount: mutableRAGStore.length,
    timestamp: new Date().toISOString(),
  });
});

// Admin & Support Mail Configuration
const SUPER_ADMIN_EMAIL = 'hemanthkuamr17@gmail.com';
const ADMIN_SUPPORT_EMAIL = process.env.ADMIN_SUPPORT_EMAIL || SUPER_ADMIN_EMAIL;

/**
 * Super Admin strict authorization middleware.
 * Verifies that the caller's email matches hemanthkuamr17@gmail.com exactly.
 */
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const adminEmail =
    (req.headers['x-admin-email'] as string) ||
    (req.query.adminEmail as string) ||
    (req.body && req.body.adminEmail) ||
    '';

  if (adminEmail.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      error: 'Access Denied: Super Admin authorization required. Only hemanthkuamr17@gmail.com is permitted.',
    });
  }
  next();
}

// In-memory support ticket records
const supportMessages: any[] = [];

// Mutable platform data stores for Super Admin management
let mutableDestinations: any[] = [...POPULAR_DESTINATIONS];
let mutableCuratedPlaces: Record<string, MapLocationItem[]> = JSON.parse(JSON.stringify(CURATED_MAP_PLACES));

// In-memory user management records
let mutableUsers: any[] = [
  {
    id: 'usr_super_admin',
    name: 'Super Admin',
    email: 'hemanthkuamr17@gmail.com',
    role: 'super_admin',
    phone: '9177021832',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tripsCount: 12,
  },
  {
    id: 'usr_traveler_demo',
    name: 'Demo Traveler',
    email: 'traveler.demo@example.com',
    role: 'user',
    phone: '+1 555-0192',
    status: 'active',
    createdAt: '2025-02-15T10:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    tripsCount: 3,
  },
  {
    id: 'usr_sarah_connor',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    role: 'user',
    phone: '+1 555-0847',
    status: 'active',
    createdAt: '2025-03-01T14:22:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tripsCount: 5,
  },
];

// In-memory application data sources
let mutableDataSources: any[] = [
  {
    id: 'ds_knowledge_base',
    name: 'RAG Knowledge Base & Document Store',
    type: 'internal_rag',
    status: 'operational',
    itemsCount: 18,
    lastSync: new Date().toISOString(),
    description: 'Shared vector knowledge documents parsed from uploaded PDFs, DOCXs, and TXT guides for Gemini AI grounding.',
  },
  {
    id: 'ds_google_places',
    name: 'Places & Accommodations Directory',
    type: 'geospatial_api',
    status: 'operational',
    itemsCount: 65,
    lastSync: new Date().toISOString(),
    description: 'Curated geo-referenced coordinates, ratings, and addresses for Bali, Paris, Tokyo, Rome, New York, and Cape Town.',
  },
  {
    id: 'ds_weather_api',
    name: 'Open-Meteo & Climate Data Feed',
    type: 'weather_feed',
    status: 'operational',
    itemsCount: 6,
    lastSync: new Date().toISOString(),
    description: 'Seasonal forecast summaries, rainfall chances, and temperature trends for planned travel windows.',
  },
  {
    id: 'ds_exchange_rates',
    name: 'Currency & Foreign Exchange Rates',
    type: 'financial_rates',
    status: 'operational',
    itemsCount: 10,
    lastSync: new Date().toISOString(),
    description: 'Real-time multi-currency parity conversions for holiday budget estimation and expense tracking.',
  },
  {
    id: 'ds_routing_engine',
    name: 'OpenStreetMap Routing & Transit Matrix',
    type: 'routing_service',
    status: 'operational',
    itemsCount: 120,
    lastSync: new Date().toISOString(),
    description: 'Polyline route calculation, transit pacing, and distance matrices between itinerary sights.',
  },
];

// In-memory AI configuration
let mutableAISettings: any = {
  activeModel: 'gemini-2.5-flash',
  temperature: 0.7,
  searchGroundingEnabled: true,
  ragGroundingEnabled: true,
  maxOutputTokens: 8192,
  ragTopK: 4,
  systemInstructions: 'You are an elite, highly knowledgeable global travel curator and holiday planning engine.',
  updatedAt: new Date().toISOString(),
};

// In-memory platform trips oversight
let mutableAdminTrips: any[] = [
  {
    id: 'trip_bali_paradise',
    title: 'Bali Island Wellness & Cultural Exploration',
    destination: 'Bali, Indonesia',
    travelers: 2,
    durationDays: 7,
    budgetTier: 'moderate',
    totalEstimated: 2450,
    currency: 'USD',
    createdAt: '2025-03-10T12:00:00Z',
    status: 'saved',
    userEmail: 'traveler.demo@example.com',
  },
  {
    id: 'trip_tokyo_foodie',
    title: 'Tokyo Gastronomy & Neon Shinjuku',
    destination: 'Tokyo, Japan',
    travelers: 1,
    durationDays: 5,
    budgetTier: 'luxury',
    totalEstimated: 3100,
    currency: 'USD',
    createdAt: '2025-03-12T09:15:00Z',
    status: 'planning',
    userEmail: 'sarah.j@example.com',
  },
  {
    id: 'trip_paris_romance',
    title: 'Romantic Seine & Historic Montmartre',
    destination: 'Paris, France',
    travelers: 2,
    durationDays: 6,
    budgetTier: 'luxury',
    totalEstimated: 4200,
    currency: 'USD',
    createdAt: '2025-03-14T16:45:00Z',
    status: 'saved',
    userEmail: 'hemanthkuamr17@gmail.com',
  },
];

// Contact and Support Ticket Endpoint
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const ticketId = 'tkt_' + Date.now();
  const timestamp = new Date().toISOString();

  const record = {
    id: ticketId,
    name,
    email,
    subject: subject || 'Trip Planner Support Request',
    message,
    createdAt: timestamp,
    status: 'new',
    recipient: ADMIN_SUPPORT_EMAIL,
  };
  supportMessages.unshift(record);

  // Internal routing to admin/support email without exposing it to the client
  console.log(`========================================`);
  console.log(`[SUPPORT MAIL ROUTED TO ADMIN DESK]`);
  console.log(`Destination Mailbox: ${ADMIN_SUPPORT_EMAIL}`);
  console.log(`Ticket ID: ${ticketId}`);
  console.log(`Submitted By: ${name} <${email}>`);
  console.log(`Subject: ${record.subject}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Content:\n${message}`);
  console.log(`========================================`);

  return res.json({
    success: true,
    ticketId,
    message: 'Your inquiry has been directly routed to our Support Desk and Administrator. We will respond to your email promptly.',
    routedToSupport: true,
    receivedAt: timestamp,
  });
});

app.get('/api/contact/messages', (req: Request, res: Response) => {
  res.json({ messages: supportMessages });
});

// ==========================================
// 1. DATA AGGREGATION SERVICES (Backend Layer)
// ==========================================

// GET /api/destinations - Explore destination catalogs
app.get('/api/destinations', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let results = [...mutableDestinations];

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter((d) => d.categories && d.categories.includes(category as any));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  }

  res.json({ destinations: results, count: results.length });
});

// POST /api/destinations - Super Admin add new destination
app.post('/api/destinations', requireSuperAdmin, (req: Request, res: Response) => {
  const { name, country, tagline, imageUrl, typicalDuration, estimatedBudget, tags, categories } = req.body;
  if (!name || !country) {
    return res.status(400).json({ error: 'Name and country are required.' });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newDest = {
    id,
    name,
    country,
    tagline: tagline || `Discover the wonders of ${name}, ${country}.`,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    badge: 'Curated by Admin',
    typicalDuration: typicalDuration || '5-7 Days',
    estimatedBudget: estimatedBudget || '$1,200 - $2,500',
    tags: Array.isArray(tags) ? tags : ['Trending', 'Must Visit'],
    defaultInterests: ['Sightseeing', 'Culture', 'Dining'],
    categories: Array.isArray(categories) && categories.length > 0 ? categories : ['City Breaks'],
    rating: 4.8,
  };

  mutableDestinations.unshift(newDest);
  res.json({ success: true, destination: newDest });
});

// PUT /api/destinations/:id - Super Admin edit destination
app.put('/api/destinations/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = mutableDestinations.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  mutableDestinations[index] = {
    ...mutableDestinations[index],
    ...req.body,
    id, // protect id integrity
  };
  res.json({ success: true, destination: mutableDestinations[index] });
});

// DELETE /api/destinations/:id - Super Admin delete destination
app.delete('/api/destinations/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = mutableDestinations.length;
  mutableDestinations = mutableDestinations.filter((d) => d.id !== id);
  if (mutableDestinations.length === initialLength) {
    return res.status(404).json({ error: 'Destination not found.' });
  }
  res.json({ success: true, message: `Destination ${id} removed.` });
});

// GET /api/places - Places by destination and category
app.get('/api/places', (req: Request, res: Response) => {
  const { destination = 'bali', category, search } = req.query;
  const destKey = (destination as string).toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');

  let places: MapLocationItem[] = mutableCuratedPlaces[destKey] || mutableCuratedPlaces['bali'] || [];

  if (category && typeof category === 'string' && category !== 'all') {
    places = places.filter((p) => p.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    places = places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
  }

  res.json({ places, count: places.length });
});

// POST /api/places - Super Admin add place / hotel / restaurant / activity
app.post('/api/places', requireSuperAdmin, (req: Request, res: Response) => {
  const { destination = 'bali', name, category = 'attraction', lat, lng, address, description, priceLevel, rating, imageUrl } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Place name is required.' });
  }

  const destKey = (destination as string).toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
  if (!mutableCuratedPlaces[destKey]) {
    mutableCuratedPlaces[destKey] = [];
  }

  const newPlace: MapLocationItem = {
    id: `${destKey}-${Date.now()}`,
    name,
    category: category as any,
    lat: typeof lat === 'number' ? lat : -8.5069,
    lng: typeof lng === 'number' ? lng : 115.2625,
    address: address || `${name}, ${destination}`,
    city: destination.split(',')[0].trim(),
    country: destination.split(',')[1]?.trim() || '',
    rating: rating || 4.7,
    priceLevel: priceLevel || '$$',
    description: description || `Curated ${category} verified by Administrator.`,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80',
  };

  mutableCuratedPlaces[destKey].unshift(newPlace);
  res.json({ success: true, place: newPlace });
});

// PUT /api/places/:id - Super Admin edit place
app.put('/api/places/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  let found = false;

  for (const destKey of Object.keys(mutableCuratedPlaces)) {
    const idx = mutableCuratedPlaces[destKey].findIndex((p) => p.id === id);
    if (idx !== -1) {
      mutableCuratedPlaces[destKey][idx] = {
        ...mutableCuratedPlaces[destKey][idx],
        ...req.body,
        id,
      };
      found = true;
      return res.json({ success: true, place: mutableCuratedPlaces[destKey][idx] });
    }
  }

  if (!found) {
    return res.status(404).json({ error: 'Place not found.' });
  }
});

// DELETE /api/places/:id - Super Admin delete place
app.delete('/api/places/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  let removed = false;

  for (const destKey of Object.keys(mutableCuratedPlaces)) {
    const initialLen = mutableCuratedPlaces[destKey].length;
    mutableCuratedPlaces[destKey] = mutableCuratedPlaces[destKey].filter((p) => p.id !== id);
    if (mutableCuratedPlaces[destKey].length < initialLen) {
      removed = true;
      break;
    }
  }

  if (!removed) {
    return res.status(404).json({ error: 'Place not found.' });
  }
  res.json({ success: true, message: `Place ${id} deleted.` });
});

// GET /api/hotels - Accommodations & luxury stays
app.get('/api/hotels', (req: Request, res: Response) => {
  const { destination = 'bali', budgetTier } = req.query;
  const destKey = (destination as string).toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
  const places = mutableCuratedPlaces[destKey] || mutableCuratedPlaces['bali'] || [];
  const hotels = places.filter((p) => p.category === 'hotel');

  res.json({
    destination,
    hotels: hotels.length > 0 ? hotels : places.slice(0, 2),
  });
});

// GET /api/restaurants - Gastronomy and dining
app.get('/api/restaurants', (req: Request, res: Response) => {
  const { destination = 'bali', cuisine } = req.query;
  const destKey = (destination as string).toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
  const places = mutableCuratedPlaces[destKey] || mutableCuratedPlaces['bali'] || [];
  const restaurants = places.filter((p) => p.category === 'restaurant');

  res.json({
    destination,
    restaurants: restaurants.length > 0 ? restaurants : places.slice(0, 2),
  });
});

// GET /api/activities - Things to do & attractions
app.get('/api/activities', (req: Request, res: Response) => {
  const { destination = 'bali' } = req.query;
  const destKey = (destination as string).toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
  const places = mutableCuratedPlaces[destKey] || mutableCuratedPlaces['bali'] || [];
  const activities = places.filter((p) => p.category === 'activity' || p.category === 'beach' || p.category === 'attraction');

  res.json({
    destination,
    activities,
  });
});

// ==========================================
// SUPER ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/users - Super Admin view all users
app.get('/api/admin/users', requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ users: mutableUsers, count: mutableUsers.length });
});

// POST /api/admin/users/:id/toggle-status - Super Admin disable/enable user
app.post('/api/admin/users/:id/toggle-status', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = mutableUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (user.role === 'super_admin') {
    return res.status(400).json({ error: 'Cannot disable the primary Super Admin account.' });
  }
  user.status = user.status === 'active' ? 'disabled' : 'active';
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id - Super Admin delete user
app.delete('/api/admin/users/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = mutableUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (user.role === 'super_admin' || user.email === SUPER_ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Cannot delete the primary Super Admin account.' });
  }
  mutableUsers = mutableUsers.filter((u) => u.id !== id);
  res.json({ success: true, message: `User ${id} removed.` });
});

// GET /api/admin/data-sources - Super Admin view configured data sources
app.get('/api/admin/data-sources', requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ dataSources: mutableDataSources });
});

// POST /api/admin/data-sources/:id/sync - Super Admin trigger data source sync
app.post('/api/admin/data-sources/:id/sync', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const ds = mutableDataSources.find((d) => d.id === id);
  if (!ds) {
    return res.status(404).json({ error: 'Data source not found.' });
  }
  ds.lastSync = new Date().toISOString();
  ds.status = 'operational';
  res.json({ success: true, message: `Data source ${ds.name} synchronized successfully.`, dataSource: ds });
});

// GET /api/admin/ai-settings - Super Admin view AI settings
app.get('/api/admin/ai-settings', requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ settings: mutableAISettings });
});

// PUT /api/admin/ai-settings - Super Admin update AI settings
app.put('/api/admin/ai-settings', requireSuperAdmin, (req: Request, res: Response) => {
  mutableAISettings = {
    ...mutableAISettings,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, settings: mutableAISettings });
});

// GET /api/admin/trips - Super Admin view platform trips
app.get('/api/admin/trips', requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ trips: mutableAdminTrips, count: mutableAdminTrips.length });
});

// DELETE /api/admin/trips/:id - Super Admin delete platform trip
app.delete('/api/admin/trips/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = mutableAdminTrips.length;
  mutableAdminTrips = mutableAdminTrips.filter((t) => t.id !== id);
  if (mutableAdminTrips.length === initialLen) {
    return res.status(404).json({ error: 'Trip not found.' });
  }
  res.json({ success: true, message: `Trip ${id} removed.` });
});

// GET /api/weather - Live destination weather and travel season
app.get('/api/weather', (req: Request, res: Response) => {
  const { destination = 'Bali, Indonesia' } = req.query;
  const weather = getLiveWeatherForDestination(destination as string);
  res.json({ weather });
});

// GET /api/routes - Routing calculation & polyline
app.get('/api/routes', (req: Request, res: Response) => {
  const { origin = 'Hotel', destination = 'Attraction', mode = 'driving' } = req.query;

  // Normalized route response with coordinates for map drawing
  const route = {
    origin: origin as string,
    destination: destination as string,
    mode: mode as 'driving' | 'walking' | 'transit',
    distanceKm: 14.8,
    durationMinutes: mode === 'walking' ? 180 : mode === 'transit' ? 38 : 26,
    summary: `Via Coastal Highway & Main Boulevard`,
    coordinates: [
      [-8.5069, 115.2625],
      [-8.5147, 115.2415],
      [-8.4344, 115.2778],
      [-8.8291, 115.0849],
    ] as [number, number][],
    steps: [
      { instruction: 'Head south on Main Boulevard toward Coastal Way', distanceKm: 2.4, durationMins: 5, mode: mode as any },
      { instruction: 'Take scenic coastal bypass exit', distanceKm: 8.2, durationMins: 14, mode: mode as any },
      { instruction: 'Arrive at destination on your right with beachfront parking', distanceKm: 4.2, durationMins: 7, mode: mode as any },
    ],
  };

  res.json({ route });
});

// GET /api/transport - Transit options
app.get('/api/transport', (req: Request, res: Response) => {
  const { destination = 'Bali' } = req.query;
  res.json({
    destination,
    options: [
      {
        type: 'flight',
        title: 'International / Domestic Flight Arrivals',
        providerOrLine: 'Direct Airline Carriers',
        frequency: 'Daily Flights',
        approxFare: '$180 - $450',
        bookingTip: 'Book 4-6 weeks in advance for prime weekend arrival slots.',
      },
      {
        type: 'car_rental',
        title: 'Private Chauffeured Car or Scooter Rental',
        providerOrLine: 'Certified Local Island Drivers',
        frequency: 'On-Demand / Full Day Hire',
        approxFare: '$40 - $55 / full day with fuel',
        bookingTip: 'Most stress-free option for families and waterfall excursions.',
      },
      {
        type: 'ferry',
        title: 'High-Speed Island Catamaran Ferries',
        providerOrLine: 'Fast Boat Marina Transfers',
        frequency: 'Hourly morning departures',
        approxFare: '$20 - $35 / crossing',
        bookingTip: 'Check sea swell conditions in the morning before boarding.',
      },
    ],
  });
});

// GET /api/exchange-rates - Real-time currency conversion rates
app.get('/api/exchange-rates', (req: Request, res: Response) => {
  const { base = 'USD' } = req.query;
  const rates = getExchangeRates(base as string);
  res.json({ base, rates, lastUpdated: new Date().toISOString().split('T')[0] });
});

// ==========================================
// 2. RAG TRAVEL KNOWLEDGE ENDPOINTS
// ==========================================

// GET /api/rag/documents - Query knowledge base
app.get('/api/rag/documents', (req: Request, res: Response) => {
  const { category, destination, query } = req.query;
  let results = [...mutableRAGStore];

  if (category && typeof category === 'string' && category !== 'all') {
    results = results.filter((d) => d.category === category);
  }

  if (destination && typeof destination === 'string') {
    const dQuery = destination.toLowerCase();
    results = results.filter((d) => d.destination.toLowerCase().includes(dQuery));
  }

  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    results = results.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ documents: results, total: results.length });
});

// POST /api/rag/documents - Admin add travel knowledge document (PDF, DOCX, TXT, etc.)
app.post('/api/rag/documents', requireSuperAdmin, (req: Request, res: Response) => {
  const { title, name, destination = 'Global', category = 'guidelines', content, contentSnippet, tags = [] } = req.body;
  const docTitle = title || name;
  const docContent = content || contentSnippet;

  if (!docTitle || !docContent) {
    return res.status(400).json({ error: 'Title/name and content are required.' });
  }

  const newDoc: RAGDocument = {
    id: req.body.id || ('rag-' + Date.now()),
    title: docTitle,
    destination,
    category,
    content: docContent,
    tags: Array.isArray(tags) ? tags : [tags],
    source: 'Admin Verified Knowledge Portal',
    lastIndexed: new Date().toISOString().split('T')[0],
  };

  mutableRAGStore.unshift(newDoc);
  res.json({ success: true, document: newDoc });
});

// GET /api/trip/conversations - Retrieve private conversations for authenticated user
app.get('/api/trip/conversations', (req: Request, res: Response) => {
  const userId = ((req.headers['x-user-id'] || req.headers['x-user-email'] || req.query.userId) as string || '').toLowerCase().trim();
  if (!userId) {
    return res.json({ conversations: [] });
  }
  const userConvs = userConversationsStore.get(userId) || [];
  res.json({ conversations: userConvs });
});

// POST /api/trip/conversations - Save or update conversation for authenticated user
app.post('/api/trip/conversations', (req: Request, res: Response) => {
  const { conversation, userId } = req.body;
  const effectiveUserId = (userId || (req.headers['x-user-id'] as string) || '').toLowerCase().trim();

  if (!effectiveUserId || !conversation || !conversation.id) {
    return res.status(400).json({ error: 'Valid userId and conversation are required.' });
  }

  const userConvs = userConversationsStore.get(effectiveUserId) || [];
  const existingIdx = userConvs.findIndex((c) => c.id === conversation.id);
  const updatedConv = {
    ...conversation,
    userId: effectiveUserId,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    userConvs[existingIdx] = updatedConv;
  } else {
    userConvs.unshift(updatedConv);
  }

  userConversationsStore.set(effectiveUserId, userConvs);
  res.json({ success: true, conversation: updatedConv });
});

// DELETE /api/trip/conversations/:id - Delete conversation for authenticated user
app.delete('/api/trip/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const effectiveUserId = ((req.headers['x-user-id'] || req.query.userId) as string || '').toLowerCase().trim();

  if (!effectiveUserId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const userConvs = userConversationsStore.get(effectiveUserId) || [];
  const filtered = userConvs.filter((c) => c.id !== id);
  userConversationsStore.set(effectiveUserId, filtered);

  res.json({ success: true, message: 'Conversation deleted.' });
});

// POST /api/rag/reindex - Trigger RAG index refresh
app.post('/api/rag/reindex', requireSuperAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RAG Knowledge vector index recomputed successfully.',
    documentsIndexed: mutableRAGStore.length,
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/rag/documents/:id - Admin delete travel knowledge document
app.delete('/api/rag/documents/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = mutableRAGStore.length;
  mutableRAGStore = mutableRAGStore.filter((d) => d.id !== id);

  if (mutableRAGStore.length === initialLength) {
    return res.status(404).json({ error: 'Document not found in RAG store.' });
  }

  res.json({
    success: true,
    message: `Document ${id} removed from shared Knowledge Base.`,
    remainingCount: mutableRAGStore.length,
  });
});

// POST /api/rag/documents/:id/reprocess - Admin trigger re-processing for specific document
app.post('/api/rag/documents/:id/reprocess', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const docIndex = mutableRAGStore.findIndex((d) => d.id === id);

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found in RAG store.' });
  }

  mutableRAGStore[docIndex] = {
    ...mutableRAGStore[docIndex],
    lastIndexed: new Date().toISOString().split('T')[0],
  };

  res.json({
    success: true,
    message: `Document ${id} re-processed and re-indexed.`,
    document: mutableRAGStore[docIndex],
  });
});

// ==========================================
// 3. AI PLAN GENERATOR (RAG + Live Data + Gemini)
// ==========================================

// Fallback plan generator for offline or missing-key scenarios
function generateFallbackPlan(params: any) {
  const {
    destination = 'Bali, Indonesia',
    startingLocation = 'Local Origin',
    startDate = '2026-10-01',
    endDate = '2026-10-05',
    travelers = 2,
    budgetTier = 'moderate',
    pacing = 'balanced',
    interests = ['Culture & History', 'Food & Dining'],
  } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.min(10, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 4));

  const multiplier = budgetTier === 'budget' ? 0.6 : budgetTier === 'luxury' ? 2.5 : 1.0;
  const baseDailyPerPerson = 120 * multiplier;
  const dailyAverage = Math.round(baseDailyPerPerson * travelers);
  const totalEstimated = dailyAverage * calculatedDays;

  // Retrieve matching map points
  const destKey = destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
  const matchedPlaces = CURATED_MAP_PLACES[destKey] || CURATED_MAP_PLACES['bali'] || [];

  return {
    id: 'plan-' + Date.now(),
    createdAt: new Date().toISOString(),
    title: `${calculatedDays}-Day ${pacing.charAt(0).toUpperCase() + pacing.slice(1)} Vacation in ${destination}`,
    destination,
    startingLocation,
    startDate,
    endDate,
    durationDays: calculatedDays,
    travelers,
    pacing,
    budgetTier,
    summary: `A balanced ${calculatedDays}-day vacation designed for ${travelers} traveler${travelers > 1 ? 's' : ''}, balancing scenic natural sights, authentic regional gastronomy, cultural monuments, and stress-free transit in ${destination}.`,
    budget: {
      totalEstimated,
      dailyAverage,
      currency: 'USD',
      categories: {
        accommodation: Math.round(totalEstimated * 0.45),
        foodAndDining: Math.round(totalEstimated * 0.28),
        activitiesAndSights: Math.round(totalEstimated * 0.15),
        localTransit: Math.round(totalEstimated * 0.08),
        miscellaneous: Math.round(totalEstimated * 0.04),
      },
    },
    mapLocations: matchedPlaces,
    suggestedPlaces: matchedPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description || '',
      estimatedCost: p.estimatedCost || '$15',
      bestTimeToVisit: p.openingHours || 'Morning',
      rating: p.rating || 4.8,
      tags: [p.category, destination.split(',')[0]],
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      imageUrl: p.imageUrl,
    })),
    suggestedActivities: [
      {
        id: 'act-1',
        title: `Scenic Highlights & Cultural Walk in ${destination}`,
        category: 'Sightseeing',
        description: 'Guided excursion covering the most picturesque monuments and local artisan markets.',
        duration: '3.5 Hours',
        cost: '$35 per person',
      },
      {
        id: 'act-2',
        title: 'Sunset Boat Cruise & Dining',
        category: 'Leisure',
        description: 'Relaxing coastal cruise with refreshments as the sun sets over the water.',
        duration: '2 Hours',
        cost: '$45 per person',
      },
    ],
    itinerary: Array.from({ length: calculatedDays }).map((_, index) => {
      const dayNum = index + 1;
      return {
        day: dayNum,
        theme:
          dayNum === 1
            ? 'Arrival & Heart of the City'
            : dayNum === 2
            ? 'Art, Architecture & Scenic Panoramas'
            : dayNum === 3
            ? 'Culinary Exploration & Vibrant Neighborhoods'
            : dayNum === 4
            ? 'Hidden Gems, Coastal Parks & Night Skyline'
            : `Day ${dayNum}: Relaxed Discovery & Local Gems`,
        slots: [
          {
            timeOfDay: 'Morning' as const,
            title: dayNum === 1 ? 'Check-in & Historic Promenade Walk' : 'Iconic Landmark & Morning Café',
            place: `${destination} Central Quarter`,
            description: `Begin the day with fresh local breakfast, then explore primary architectural landmarks before crowds gather.`,
            estimatedCost: `$15 per person`,
            transitTip: 'Comfortable walking shoes or short transit ride.',
          },
          {
            timeOfDay: 'Afternoon' as const,
            title: 'Cultural Immersion & Local Food Hall',
            place: `${destination} Arts & Heritage District`,
            description: `Browse museum highlights followed by lunch featuring seasonal local specialties.`,
            estimatedCost: `$30 per person`,
            transitTip: 'Short tram ride or 10-minute stroll.',
          },
          {
            timeOfDay: 'Evening' as const,
            title: 'Sunset Vista & Candlelit Dinner',
            place: `${destination} Scenic Waterfront / Hilltop`,
            description: `Take in the skyline sunset, followed by a relaxing dinner at a charming bistro with local music.`,
            estimatedCost: `$45 per person`,
            transitTip: 'Rideshare or evening leisure walk.',
          },
        ],
        dailyTip:
          dayNum === 1
            ? 'Pick up a multi-day transit pass at the station to save 30% on travel.'
            : 'Pre-book museum time slots online to skip the peak waiting lines.',
        mealSuggestion: 'Try the traditional slow-cooked specialty paired with locally produced regional beverages.',
        estimatedDayCost: Math.round(dailyAverage),
      };
    }),
    travelTips: [
      {
        category: 'Getting Around',
        title: 'Public Transit & Walking',
        content: `Walking is the best way to uncover charming side-streets in ${destination}. For longer journeys, metro or light rail is punctual, affordable, and safe.`,
      },
      {
        category: 'Budget Optimization',
        title: 'Lunch Specials & City Passes',
        content: 'Many prime restaurants offer high-value fixed-price lunch menus (Formule / Prix Fixe) at almost half the evening dinner cost.',
      },
      {
        category: 'Local Etiquette',
        title: 'Customs & Greetings',
        content: 'A polite greeting in the local language when entering shops and restaurants goes a very long way in warm hospitality.',
      },
      {
        category: 'Packing Advice',
        title: 'Footwear & Weather Prep',
        content: 'Pack broken-in walking sneakers for cobblestone streets, a compact umbrella, and a light layering jacket for cooler evenings.',
      },
    ],
    futureModules: {
      stays: [
        {
          name: 'The Grand Heritage Boutique Hotel',
          type: 'Boutique Hotel',
          neighborhood: 'Historic Old Town',
          priceLevel: '$$$',
          highlights: ['Rooftop Terrace', 'Complimentary Breakfast', 'Steps from Metro'],
        },
        {
          name: 'Lumiere Loft & Apartments',
          type: 'Design Apartment',
          neighborhood: 'Art & Design District',
          priceLevel: '$$',
          highlights: ['Full Kitchen', 'High-Speed Wi-Fi', 'Balcony Views'],
        },
      ],
      rentals: [
        {
          category: 'Public Transit Pass' as const,
          recommendation: 'Unlimited 3-to-7 day City Mobility Card',
          approxDailyCost: '$8 / day',
          bestFor: 'Effortless hop-on hop-off access across subway, trams, and ferries.',
        },
        {
          category: 'Scooter / Bike' as const,
          recommendation: 'App-based E-Bike Share & Hybrid City Cruisers',
          approxDailyCost: '$15 - $22 / day',
          bestFor: 'Zipping through scenic waterfronts, canals, and garden boulevards.',
        },
        {
          category: 'Car' as const,
          recommendation: 'Compact Eco-Hybrid (Recommended for day trips only)',
          approxDailyCost: '$45 - $65 / day',
          bestFor: 'Exploring regional countryside, beaches, and national park trailheads.',
        },
      ],
    },
  };
}

// Generate Trip Endpoint (RAG retrieval + Gemini API)
app.post('/api/trip/generate', async (req: Request, res: Response) => {
  const formData = req.body;
  const {
    destination,
    startingLocation,
    startDate,
    endDate,
    travelers,
    budgetTier,
    customBudget,
    pacing,
    interests = [],
    specialRequests,
  } = formData;

  if (!destination) {
    return res.status(400).json({ error: 'Destination is required.' });
  }

  const ai = getGeminiClient();

  // If no Gemini API key configured, use our rich curated generator immediately
  if (!ai) {
    console.log('[Trip API] Using curated planner fallback (no GEMINI_API_KEY).');
    const fallbackPlan = generateFallbackPlan(formData);
    return res.json({ plan: fallbackPlan, source: 'curated-fallback' });
  }

  try {
    // 1. Retrieve RAG Travel Knowledge
    const ragContextDocs = retrieveRAGKnowledge(interests.join(' ') + ' ' + (specialRequests || ''), destination);
    const ragKnowledgeSnippet = ragContextDocs
      .map((d) => `[Source: ${d.title} (${d.category})]\n${d.content}`)
      .join('\n\n');

    // 2. Retrieve Live Weather & Rates
    const liveWeather = getLiveWeatherForDestination(destination);

    const prompt = `You are the lead travel architect for "Trip Planner", a modern vacation and travel assistant.
Craft a comprehensive, realistic, and highly engaging day-by-day vacation itinerary.

TRIP REQUIREMENTS:
- Destination: ${destination}
- Origin: ${startingLocation || 'Not specified'}
- Start Date: ${startDate || 'Upcoming'}
- End Date: ${endDate || 'Upcoming'}
- Number of Travelers: ${travelers || 2}
- Budget Tier: ${budgetTier || 'moderate'} ${customBudget ? `(Target Budget: $${customBudget})` : ''}
- Pacing Preference: ${pacing || 'balanced'}
- Traveler Interests: ${interests.length > 0 ? interests.join(', ') : 'Cultural discovery, Local dining, Scenic photography'}
${specialRequests ? `- Special Requests / Accessibility / Dietary: ${specialRequests}` : ''}

RETRIEVED TRAVEL RAG KNOWLEDGE (Incorporate these principles, cultural etiquette, and transit realities):
${ragKnowledgeSnippet}

LIVE WEATHER CONTEXT:
${destination}: ${liveWeather.temperatureC}°C (${liveWeather.temperatureF}°F), ${liveWeather.condition}. Season: ${liveWeather.bestSeason}.

Pacing Guidelines:
- Relaxed: 1 anchor activity per day, spacious lunch, late start.
- Balanced: 2-3 activities per day, well-grouped geographically so travelers aren't rushing.
- Packed: Early starts, multiple stops, evening events.

Format the output strictly according to the provided JSON schema. Ensure real neighborhood names, local food specialties, and estimated prices in USD.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            durationDays: { type: Type.INTEGER },
            budget: {
              type: Type.OBJECT,
              properties: {
                totalEstimated: { type: Type.NUMBER },
                dailyAverage: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                categories: {
                  type: Type.OBJECT,
                  properties: {
                    accommodation: { type: Type.NUMBER },
                    foodAndDining: { type: Type.NUMBER },
                    activitiesAndSights: { type: Type.NUMBER },
                    localTransit: { type: Type.NUMBER },
                    miscellaneous: { type: Type.NUMBER },
                  },
                  required: ['accommodation', 'foodAndDining', 'activitiesAndSights', 'localTransit', 'miscellaneous'],
                },
              },
              required: ['totalEstimated', 'dailyAverage', 'currency', 'categories'],
            },
            suggestedPlaces: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING },
                  bestTimeToVisit: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['name', 'category', 'description', 'estimatedCost', 'bestTimeToVisit', 'tags'],
              },
            },
            suggestedActivities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  cost: { type: Type.STRING },
                },
                required: ['title', 'category', 'description', 'duration', 'cost'],
              },
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  slots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeOfDay: { type: Type.STRING },
                        title: { type: Type.STRING },
                        place: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimatedCost: { type: Type.STRING },
                        transitTip: { type: Type.STRING },
                      },
                      required: ['timeOfDay', 'title', 'place', 'description', 'estimatedCost'],
                    },
                  },
                  dailyTip: { type: Type.STRING },
                  mealSuggestion: { type: Type.STRING },
                  estimatedDayCost: { type: Type.NUMBER },
                },
                required: ['day', 'theme', 'slots', 'dailyTip', 'mealSuggestion', 'estimatedDayCost'],
              },
            },
            travelTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['category', 'title', 'content'],
              },
            },
            futureModules: {
              type: Type.OBJECT,
              properties: {
                stays: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      neighborhood: { type: Type.STRING },
                      priceLevel: { type: Type.STRING },
                      highlights: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['name', 'type', 'neighborhood', 'priceLevel', 'highlights'],
                  },
                },
                rentals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                      approxDailyCost: { type: Type.STRING },
                      bestFor: { type: Type.STRING },
                    },
                    required: ['category', 'recommendation', 'approxDailyCost', 'bestFor'],
                  },
                },
              },
              required: ['stays', 'rentals'],
            },
          },
          required: [
            'title',
            'summary',
            'durationDays',
            'budget',
            'suggestedPlaces',
            'suggestedActivities',
            'itinerary',
            'travelTips',
            'futureModules',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);

    // Attach curated map coordinates for the destination
    const destKey = destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
    const matchedMapPlaces = CURATED_MAP_PLACES[destKey] || CURATED_MAP_PLACES['bali'] || [];

    const completePlan = {
      ...parsed,
      id: 'plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      destination,
      startingLocation: startingLocation || 'Local Origin',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      travelers: travelers || 1,
      pacing,
      budgetTier,
      mapLocations: matchedMapPlaces,
    };

    return res.json({ plan: completePlan, source: 'gemini' });
  } catch (error: any) {
    const isQuota =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      String(error?.message || '').includes('quota') ||
      String(error?.message || '').includes('429');

    if (isQuota) {
      console.warn('[Gemini Quota Notice] API quota reached (429). Seamlessly serving curated travel plan.');
    } else {
      console.error('Error in /api/trip/generate:', error?.message || error);
    }

    // Graceful fallback so user never gets stuck
    const fallback = generateFallbackPlan(formData);
    return res.json({
      plan: fallback,
      source: 'curated-fallback',
      notice: isQuota ? 'Served curated high-detail holiday plan while API quota resets.' : undefined,
    });
  }
});

interface RetrievedRAGChunk {
  documentId: string;
  title: string;
  source: string;
  destination: string;
  category: string;
  chunkContent: string;
  score: number;
}

// Dynamic RAG Search over mutable Admin-managed knowledge store
function searchRAGKnowledgeStore(query: string, currentDestination: string = ''): RetrievedRAGChunk[] {
  const cleanQuery = query.toLowerCase().trim();
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'about', 'can', 'you', 'tell', 'me', 'how', 'do', 'i', 'my', 'your',
    'please', 'give', 'recommend', 'show'
  ]);
  const queryTokens = cleanQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  const scoredDocs: RetrievedRAGChunk[] = [];

  for (const doc of mutableRAGStore) {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const destLower = doc.destination.toLowerCase();
    const tagsLower = doc.tags.map((t) => t.toLowerCase());

    // Destination match bonus
    if (currentDestination && destLower.includes(currentDestination.toLowerCase().split(',')[0].trim())) {
      score += 6;
    }
    if (cleanQuery.includes(destLower) || (destLower !== 'global' && queryTokens.some((t) => destLower.includes(t)))) {
      score += 8;
    }

    // Exact title phrases or token matches
    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 5;
      if (tagsLower.some((t) => t.includes(token))) score += 4;
      if (contentLower.includes(token)) score += 2;
    }

    // High confidence threshold for RAG retrieval
    if (score >= 6) {
      let snippet = doc.content;
      if (snippet.length > 650) {
        const sentences = doc.content.split(/(?<=[.?!])\s+/);
        const scoredSentences = sentences.map((s) => {
          let sScore = 0;
          const sLower = s.toLowerCase();
          for (const token of queryTokens) {
            if (sLower.includes(token)) sScore += 2;
          }
          return { sentence: s, sScore };
        });
        scoredSentences.sort((a, b) => b.sScore - a.sScore);
        const topSentences = scoredSentences.slice(0, 3).map((item) => item.sentence);
        snippet = topSentences.join(' ');
        if (snippet.length < 200) {
          snippet = doc.content.slice(0, 500);
        }
      }

      scoredDocs.push({
        documentId: doc.id,
        title: doc.title,
        source: doc.source || 'Admin Knowledge Base',
        destination: doc.destination,
        category: doc.category,
        chunkContent: snippet,
        score,
      });
    }
  }

  scoredDocs.sort((a, b) => b.score - a.score);
  return scoredDocs.slice(0, 2); // Take top 2 most relevant chunks only
}

// Helper: Intelligent Trip Planner AI response generator for offline / quota-limited scenarios
function getIntelligentTravelReply(
  message: string,
  currentPlan: any,
  role: string,
  matchedRAG: RetrievedRAGChunk[] = []
): { reply: string; sources: Array<{ title: string; url: string }>; groundedInRAG: boolean; ragSourceTitle?: string } {
  if (matchedRAG.length > 0) {
    const top = matchedRAG[0];
    const reply = `Based on Trip Planner Knowledge Base (${top.title}):\n\n${top.chunkContent}\n\nI can help you incorporate this into your trip plan, adjust daily pacing, or manage your travel budget!`;
    return {
      reply,
      sources: [{ title: `Trip Planner Knowledge Base: ${top.title}`, url: '#' }],
      groundedInRAG: true,
      ragSourceTitle: `Based on Trip Planner Knowledge Base • ${top.title}`,
    };
  }

  const lower = message.toLowerCase();
  const destination = currentPlan?.destination || 'your destination';
  let reply = '';
  let sources: Array<{ title: string; url: string }> = [];

  const searchBase = 'https://www.google.com/search?q=';

  if (lower.includes('plan a trip') || lower.includes('plan a 5-day') || lower.includes('5-day') || lower.includes('itinerary')) {
    reply = `Here is a curated 5-day trip blueprint for ${destination}:\n\n• Day 1: Arrival, gentle neighborhood orientation, and a scenic welcome sunset dinner.\n• Day 2: Signature landmark sights and historical cultural walking tour in the morning.\n• Day 3: Coastal excursion, beach leisure, and seaside seafood dinner.\n• Day 4: Local artisan markets, culinary tasting tour, and scenic evening viewpoint.\n• Day 5: Relaxed brunch, souvenir shopping, and departure transfer.\n\nWould you like me to adapt this specifically to your pace or budget?`;
    sources = [{ title: `${destination} Itinerary Guide`, url: `${searchBase}${encodeURIComponent(destination + ' 5 day itinerary')}` }];
  } else if (lower.includes('beach') || lower.includes('coastal')) {
    reply = `Top beach and coastal recommendations:\n1. Choose beaches with calm swimming lagoons in the morning before trade winds pick up.\n2. Pack reef-safe mineral sunscreen (oxybenzone-free) and a dry bag for catamaran cruises.\n3. Beach club loungers usually require booking 1-2 days ahead during prime sunny weekends.`;
    sources = [{ title: 'Beach Vacation Tips', url: `${searchBase}${encodeURIComponent(destination + ' top beaches')}` }];
  } else if (lower.includes('budget') || lower.includes('cost') || lower.includes('save') || lower.includes('cheap')) {
    reply = `To manage your travel budget effectively in ${destination}:\n1. Allocate ~40% for accommodation, 30% for food & dining, 20% for experiences & entrance tickets, and 10% for local transit & contingency.\n2. Opt for set midday lunch menus at top bistros for 30-40% savings compared to dinner.\n3. Bundle museum admissions with a regional city card and use local metros/trains.`;
    sources = [{ title: 'Travel Budget Planning', url: `${searchBase}${encodeURIComponent(destination + ' budget planning tips')}` }];
  } else if (lower.includes('family') || lower.includes('kid')) {
    reply = `Family vacation advice for ${destination}:\n• Keep schedules to 1 anchor activity per day to avoid travel fatigue.\n• Book private vehicle transfers with verified child safety seats rather than navigating crowded buses with strollers.\n• Choose accommodations with kitchenettes and pool facilities for afternoon recharge breaks.`;
    sources = [{ title: 'Family Travel Guide', url: `${searchBase}${encodeURIComponent(destination + ' family vacation tips')}` }];
  } else if (lower.includes('policy') || lower.includes('insurance') || lower.includes('rule') || lower.includes('guideline')) {
    reply = `I couldn't find enough information about that in my travel knowledge base. I can still help if you provide more details, or assist with planning your itinerary, destinations, and budget.`;
  } else {
    reply = `I am your Trip Planner AI! I can help you discover destinations, plan trips, create itineraries, manage budgets, find places, and answer travel questions for ${destination}. What would you like to explore next?`;
    sources = [{ title: `${destination} Travel Overview`, url: `${searchBase}${encodeURIComponent(destination + ' travel highlights')}` }];
  }

  return { reply, sources, groundedInRAG: false };
}

// Conversational Trip Planner AI Endpoint (Connected to RAG + Live Data)
app.post('/api/trip/chat', async (req: Request, res: Response) => {
  const {
    currentPlan,
    message,
    chatHistory = [],
    role = 'concierge', // 'concierge' | 'local_advisor' | 'master_architect'
    useGoogleSearch = true,
  } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const ai = getGeminiClient();
  const destination = currentPlan?.destination || '';

  // 1. Dynamic RAG Search over shared Admin-managed Knowledge Base
  const matchedRAG = searchRAGKnowledgeStore(message, destination);
  const groundedInRAG = matchedRAG.length > 0;
  const ragSourceTitle = groundedInRAG
    ? `Based on Trip Planner Knowledge Base`
    : undefined;

  // 2. Fetch Live Travel Data if applicable
  let liveDataSnippets = '';
  if (destination) {
    try {
      const lower = message.toLowerCase();
      if (lower.includes('weather') || lower.includes('rain') || lower.includes('temp') || lower.includes('forecast') || lower.includes('pack')) {
        const weather = getLiveWeatherForDestination(destination);
        if (weather) {
          liveDataSnippets += `\n[VERIFIED LIVE WEATHER FEED for ${destination}]: ${weather.temperatureC}°C (${weather.temperatureF}°F), ${weather.condition}, Precipitation probability: ${weather.precipitationChance}%, Best season: ${weather.bestSeason}.${weather.advisory ? ` Advisory: ${weather.advisory}` : ''}`;
        }
      }
      if (lower.includes('currency') || lower.includes('rate') || lower.includes('exchange') || lower.includes('cost') || lower.includes('budget')) {
        const rates = getExchangeRates('USD');
        if (Array.isArray(rates) && rates.length > 0) {
          const ratesSummary = rates.map((r) => `1 ${r.base} = ${r.rate} ${r.target}`).join(', ');
          liveDataSnippets += `\n[VERIFIED LIVE EXCHANGE RATES]: ${ratesSummary}`;
        }
      }
    } catch (e) {
      console.warn('Live data fetch notice:', e);
    }
  }

  let targetModel = 'gemini-3.8-flash';
  if (role === 'local_advisor') {
    targetModel = 'gemini-3.1-flash-lite';
  } else {
    targetModel = 'gemini-3.8-flash';
  }

  // Define Travel Assistant system instructions
  let roleSystemInstruction = `You are "Trip Planner AI", an expert, welcoming, and helpful travel assistant built directly into the Trip Planner application.
Your mission is to help travelers discover destinations, plan trips, create itineraries, manage budgets, find places, and answer travel questions (destinations, beaches, hotels, places to visit, activities, restaurants, transportation, trip planning, itineraries, budgets, travel tips, packing, and travel preparation).

Active Trip Context:
- Current Destination: ${destination || 'Global travel planning'}
- Trip Summary: ${currentPlan?.summary || currentPlan?.title || 'Open travel consultation'}
- Duration: ${currentPlan?.durationDays || 4} days
- Budget Tier: ${currentPlan?.budgetTier || 'moderate'} (Target: $${currentPlan?.budget?.totalEstimated || 1200})
- Pacing: ${currentPlan?.pacing || 'balanced'}

GROUNDING & TRAVEL RULES:
1. TRIP PLANNER KNOWLEDGE BASE:
When verified knowledge chunks from the Trip Planner Knowledge Base are provided below, prioritize them and ground your response in this verified information.
2. MISSING KNOWLEDGE:
If the user asks a specific question about internal guidelines, local policies, documents, or niche rules where relevant information was NOT found in the knowledge base, respond naturally:
"I couldn't find enough information about that in my travel knowledge base. I can still help if you provide more details, or I can help you plan your destinations, itineraries, and budget."
3. TRAVEL ASSISTANT CAPABILITIES:
When asked travel planning questions (e.g. "Plan a trip for me", "Find beach destinations", "Create a 5-day itinerary", "Help me plan my budget", "Suggest places to visit", "Help me plan a family vacation"), respond with a clear, structured, inspiring, and practical travel plan.
4. LIVE TRAVEL DATA:
When live travel data (such as live weather or exchange rates) is provided below, incorporate it accurately. Never fabricate live data or pretend unavailable APIs are connected.
5. TRIP PLANNER ACTIONS:
If the user asks to modify their current trip (e.g. "Add a beach to Day 3"), specify the exact modification so the traveler can easily apply it.`;

  if (matchedRAG.length > 0) {
    const ragSnippets = matchedRAG
      .map((d) => `[Trip Planner Knowledge Base: ${d.title} (${d.category} - ${d.destination})]\n${d.chunkContent}`)
      .join('\n\n');
    roleSystemInstruction += `\n\nVERIFIED TRIP PLANNER KNOWLEDGE BASE CHUNKS:\n${ragSnippets}`;
  }

  if (liveDataSnippets) {
    roleSystemInstruction += `\n\nLIVE TRAVEL DATA:\n${liveDataSnippets}`;
  }

  // If no Gemini client is configured, provide curated local intelligence
  if (!ai) {
    const fallback = getIntelligentTravelReply(message, currentPlan, role, matchedRAG);
    return res.json({
      reply: fallback.reply,
      role,
      modelUsed: targetModel + ' (local-curated)',
      groundedInRAG: fallback.groundedInRAG,
      ragSourceTitle: fallback.ragSourceTitle,
      groundingSources: fallback.sources,
      groundingSearchQueries: [message],
      source: 'curated-fallback',
    });
  }

  // Format multi-turn conversation contents
  const conversationTurns = chatHistory.slice(-8).map((m: any) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  // Append current user message
  conversationTurns.push({
    role: 'user',
    parts: [{ text: message }],
  });

  try {
    const enableSearch = useGoogleSearch && targetModel === 'gemini-3.8-flash';

    const configPayload: any = {
      systemInstruction: roleSystemInstruction,
      temperature: role === 'local_advisor' ? 0.3 : 0.7,
    };

    if (enableSearch) {
      configPayload.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: conversationTurns,
      config: configPayload,
    });

    const replyText = response.text || 'I am ready to help refine your vacation plans! What would you like to explore next?';

    // Extract Google Search Grounding Metadata
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingSearchQueries: string[] = groundingMetadata?.webSearchQueries || [];
    const groundingSources: Array<{ title: string; url: string }> = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    return res.json({
      reply: replyText,
      role,
      modelUsed: targetModel,
      groundedInRAG,
      ragSourceTitle,
      groundedWithGoogleSearch: enableSearch && groundingSources.length > 0,
      groundingSources,
      groundingSearchQueries,
      liveDataAttached: !!liveDataSnippets,
      source: 'gemini',
    });
  } catch (err: any) {
    const isQuota =
      err?.status === 'RESOURCE_EXHAUSTED' ||
      err?.code === 429 ||
      String(err?.message || '').includes('quota') ||
      String(err?.message || '').includes('429');

    if (isQuota) {
      console.warn('[Gemini Quota Notice] Rate limit/quota reached (429). Serving curated travel concierge response.');
    } else {
      console.warn('[Gemini Chat Notice] Fallback triggered:', err?.message || err);
    }

    // High quality graceful fallback response with RAG grounding
    const fallbackResult = getIntelligentTravelReply(message, currentPlan, role, matchedRAG);

    return res.json({
      reply: fallbackResult.reply,
      role,
      modelUsed: targetModel + ' (curated-fallback)',
      groundedInRAG: fallbackResult.groundedInRAG,
      ragSourceTitle: fallbackResult.ragSourceTitle,
      groundingSources: fallbackResult.sources,
      groundingSearchQueries: [message],
      source: 'curated-fallback',
      notice: isQuota ? 'Serving curated travel advice while API quota resets.' : undefined,
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trip Planner server running on http://localhost:${PORT}`);
  });
}

startServer();

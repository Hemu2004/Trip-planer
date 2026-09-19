export type NavigationPage =
  | 'home'
  | 'explore'
  | 'planner'
  | 'my-trips'
  | 'about'
  | 'contact'
  | 'auth'
  | 'admin'
  | 'knowledge-base';

export type KnowledgeFileStatus = 'Uploading' | 'Processing' | 'Ready' | 'Failed';

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'csv' | 'json' | 'other';
  sizeBytes: number;
  uploadedAt: string;
  status: KnowledgeFileStatus;
  statusMessage?: string;
  contentSnippet?: string;
  category?: 'destinations' | 'guidelines' | 'tips' | 'policies' | 'general';
  tags?: string[];
  uploadedBy?: string;
  tokenEstimate?: number;
  lastProcessedAt?: string;
}

export type ExperienceCategory =
  | 'Beaches'
  | 'Mountains'
  | 'Adventure'
  | 'Luxury'
  | 'Family'
  | 'Romantic'
  | 'Backpacking'
  | 'Nature'
  | 'City Breaks';

export type PlaceCategory =
  | 'hotel'
  | 'attraction'
  | 'restaurant'
  | 'beach'
  | 'activity'
  | 'rental'
  | 'airport'
  | 'station';

export type UserRole = 'super_admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'email' | 'demo';
  role: UserRole;
  isAdmin: boolean;
  phone?: string;
  status?: 'active' | 'disabled';
  createdAt?: string;
}

export type BudgetTier = 'budget' | 'moderate' | 'luxury' | 'custom';
export type TripPacing = 'relaxed' | 'balanced' | 'packed';

export interface TripFormData {
  destination: string;
  startingLocation: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetTier: BudgetTier;
  customBudget?: number;
  currency: string;
  pacing: TripPacing;
  interests: string[];
  specialRequests?: string;
  accommodationPreference?: string;
  transportationPreference?: string;
  foodPreferences?: string[];
}

export interface MapLocationItem {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewsCount?: number;
  priceLevel?: string;
  estimatedCost?: string;
  description?: string;
  imageUrl?: string;
  openingHours?: string;
  dayNumber?: number;
  phone?: string;
  website?: string;
}

export interface SuggestedPlace {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedCost: string;
  bestTimeToVisit: string;
  rating: number;
  tags: string[];
  lat?: number;
  lng?: number;
  address?: string;
  imageUrl?: string;
}

export interface SuggestedActivity {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  cost: string;
  location?: string;
  lat?: number;
  lng?: number;
  bookingRequired?: boolean;
}

export interface RestaurantItem {
  id: string;
  name: string;
  cuisine: string;
  priceLevel: '$$' | '$$$' | '$$$$' | '$';
  rating: number;
  address: string;
  description: string;
  mustTryDish: string;
  neighborhood: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface DailyScheduleSlot {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  place: string;
  description: string;
  estimatedCost: string;
  transitTip?: string;
  lat?: number;
  lng?: number;
  category?: PlaceCategory;
}

export interface DayItinerary {
  day: number;
  theme: string;
  slots: DailyScheduleSlot[];
  dailyTip: string;
  mealSuggestion: string;
  estimatedDayCost: number;
}

export interface BudgetBreakdown {
  totalEstimated: number;
  dailyAverage: number;
  currency: string;
  categories: {
    accommodation: number;
    foodAndDining: number;
    activitiesAndSights: number;
    localTransit: number;
    miscellaneous: number;
  };
}

export interface TravelTip {
  category: string;
  title: string;
  content: string;
}

export interface StayPreview {
  name: string;
  type: string;
  neighborhood: string;
  priceLevel: string;
  highlights: string[];
  lat?: number;
  lng?: number;
  rating?: number;
  imageUrl?: string;
  approxPerNight?: number;
}

export interface RentalPreview {
  category: 'Car' | 'Scooter / Bike' | 'Public Transit Pass';
  recommendation: string;
  approxDailyCost: string;
  bestFor: string;
}

export interface TripPreferences {
  pacing: TripPacing;
  budgetTier: BudgetTier;
  interests: string[];
  accommodationType?: string;
  transportationType?: string;
  foodPreferences?: string[];
  specialRequests?: string;
}

// Unified Trip Data Model
export interface TripPlan {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  title: string;
  destination: string;
  origin?: string;
  startingLocation: string; // backwards compatibility alias for origin
  dates?: {
    startDate: string;
    endDate: string;
  };
  startDate: string;
  endDate: string;
  durationDays: number;
  travelers: number;
  pacing: TripPacing;
  budgetTier: BudgetTier;
  summary: string;
  budget: BudgetBreakdown;
  suggestedPlaces: SuggestedPlace[];
  suggestedActivities: SuggestedActivity[];
  restaurants?: RestaurantItem[];
  itinerary: DayItinerary[];
  travelTips: TravelTip[];
  mapLocations?: MapLocationItem[];
  preferences?: TripPreferences;
  status?: 'draft' | 'planning' | 'saved' | 'completed' | 'archived';
  futureModules: {
    stays: StayPreview[];
    rentals: RentalPreview[];
  };
}

// RAG Travel Knowledge Model
export interface RAGDocument {
  id: string;
  title: string;
  destination: string;
  category:
    | 'destination_guide'
    | 'planning_knowledge'
    | 'packing_guidance'
    | 'transport_concepts'
    | 'cultural_info'
    | 'itinerary_principles'
    | 'general_tips'
    | 'destinations'
    | 'guidelines'
    | 'tips'
    | 'policies'
    | 'general'
    | string;
  content: string;
  tags: string[];
  source: string;
  lastIndexed: string;
}

// Live External Data Aggregation Interfaces
export interface WeatherForecast {
  destination: string;
  temperatureC: number;
  temperatureF: number;
  condition: string;
  icon: string;
  precipitationChance: number;
  bestSeason: string;
  advisory?: string;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMins: number;
  mode: 'driving' | 'walking' | 'transit';
}

export interface RouteInfo {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  mode: 'driving' | 'walking' | 'transit';
  summary: string;
  coordinates: [number, number][]; // [lat, lng] pairs for Leaflet polyline
  steps: RouteStep[];
}

export interface TransportOption {
  type: 'flight' | 'train' | 'metro' | 'bus' | 'ferry' | 'car_rental' | 'taxi';
  title: string;
  providerOrLine: string;
  frequency: string;
  approxFare: string;
  bookingTip: string;
}

export interface ExchangeRateInfo {
  base: string;
  target: string;
  rate: number;
  lastUpdated: string;
}

export type ChatbotRole = 'concierge' | 'local_advisor' | 'master_architect';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  role?: ChatbotRole;
  modelUsed?: string;
  groundedInRAG?: boolean;
  ragSourceTitle?: string;
  groundingSources?: GroundingSource[];
  groundingSearchQueries?: string[];
  suggestedAction?: {
    type: 'apply_plan_update' | 'view_map' | 'recalculate_budget' | 'quick_plan';
    label: string;
    payload?: any;
  };
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status?: 'new' | 'resolved' | 'in_progress';
  recipient?: string;
}


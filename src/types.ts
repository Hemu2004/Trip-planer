export type NavigationPage = 'home' | 'about' | 'planner' | 'contact' | 'auth';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'email';
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
}

export interface SuggestedActivity {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  cost: string;
}

export interface DailyScheduleSlot {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  place: string;
  description: string;
  estimatedCost: string;
  transitTip?: string;
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
}

export interface RentalPreview {
  category: 'Car' | 'Scooter / Bike' | 'Public Transit Pass';
  recommendation: string;
  approxDailyCost: string;
  bestFor: string;
}

export interface TripPlan {
  id: string;
  createdAt: string;
  title: string;
  destination: string;
  startingLocation: string;
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
  itinerary: DayItinerary[];
  travelTips: TravelTip[];
  futureModules: {
    stays: StayPreview[];
    rentals: RentalPreview[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

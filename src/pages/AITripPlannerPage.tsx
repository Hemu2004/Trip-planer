import React, { useState, useEffect, useRef } from 'react';
import {
  TripFormData,
  TripPlan,
  BudgetTier,
  TripPacing,
  ChatMessage,
  NavigationPage,
  MapLocationItem,
  RouteInfo,
} from '../types';
import { TRAVEL_INTEREST_OPTIONS, POPULAR_DESTINATIONS } from '../data/sampleDestinations';
import { CURATED_MAP_PLACES, DESTINATION_COORDINATES } from '../data/travelKnowledgeBase';
import { InteractiveMap } from '../components/InteractiveMap';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Compass,
  Clock,
  CheckCircle2,
  Share2,
  Printer,
  RotateCcw,
  MessageSquare,
  Send,
  Building2,
  Car,
  DollarSign,
  ChevronRight,
  Info,
  SlidersHorizontal,
  BookmarkCheck,
  Zap,
  ArrowRight,
  FolderHeart,
  Trash2,
  Loader2,
  X,
  Cloud,
} from 'lucide-react';
import {
  saveTripToFirestore,
  getUserTripsFromFirestore,
  deleteTripFromFirestore,
} from '../firebase';
import { GoogleCalendarSyncModal } from '../components/GoogleCalendarSyncModal';
import { GeminiChatbot } from '../components/GeminiChatbot';

interface AITripPlannerPageProps {
  initialDestination?: string;
  openSavedTrips?: boolean;
  onNavigate: (page: NavigationPage) => void;
}

export const AITripPlannerPage: React.FC<AITripPlannerPageProps> = ({
  initialDestination,
  openSavedTrips,
  onNavigate,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Form State
  const [destination, setDestination] = useState(initialDestination || '');
  const [startingLocation, setStartingLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState<number>(2);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('moderate');
  const [customBudget, setCustomBudget] = useState<string>('');
  const [pacing, setPacing] = useState<TripPacing>('balanced');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Culture & History',
    'Food & Dining',
  ]);
  const [specialRequests, setSpecialRequests] = useState('');

  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState<TripPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'map' | 'places' | 'budget' | 'tips' | 'upcoming' | 'chat'>('itinerary');
  const [mapDayFilter, setMapDayFilter] = useState<number | undefined>(undefined);
  const [selectedMapLocationId, setSelectedMapLocationId] = useState<string | undefined>(undefined);
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSavedTripsModal, setShowSavedTripsModal] = useState(false);
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  const [isLoadingSavedTrips, setIsLoadingSavedTrips] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Chat refinement state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync initialDestination if passed from Home
  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination]);

  // Open saved trips modal if routed to My Trips
  useEffect(() => {
    if (openSavedTrips) {
      setShowSavedTripsModal(true);
      loadSavedTrips();
    }
  }, [openSavedTrips]);

  // Fetch weather and default route calculation when plan is generated
  useEffect(() => {
    if (generatedPlan?.destination) {
      fetch(`/api/weather?destination=${encodeURIComponent(generatedPlan.destination)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.weather) setWeatherData(d.weather);
        })
        .catch((err) => console.warn('Weather fetch error:', err));

      fetch(`/api/routes?destination=${encodeURIComponent(generatedPlan.destination)}&origin=Hotel&mode=driving`)
        .then((r) => r.json())
        .then((d) => {
          if (d.route) setActiveRoute(d.route);
        })
        .catch((err) => console.warn('Route fetch error:', err));
    }
  }, [generatedPlan?.destination]);

  const getPlanLocations = (): MapLocationItem[] => {
    if (!generatedPlan) return [];
    if (generatedPlan.mapLocations && generatedPlan.mapLocations.length > 0) {
      return generatedPlan.mapLocations;
    }
    const destKey = generatedPlan.destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
    return CURATED_MAP_PLACES[destKey] || CURATED_MAP_PLACES['bali'] || [];
  };

  const getPlanMapCenter = (): [number, number] => {
    if (!generatedPlan) return [-8.5069, 115.2625];
    const destKey = generatedPlan.destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, '-');
    const coord = DESTINATION_COORDINATES[destKey];
    if (coord) {
      return [coord.lat, coord.lng];
    }
    return [-8.5069, 115.2625];
  };

  // Handle interest pill toggle
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Quick preset loader
  const loadPreset = (destName: string, interests: string[], days: number = 4) => {
    setDestination(destName);
    setSelectedInterests(interests);
    const today = new Date();
    const futureStart = new Date(today.getTime() + 14 * 86400000);
    const futureEnd = new Date(futureStart.getTime() + days * 86400000);
    setStartDate(futureStart.toISOString().split('T')[0]);
    setEndDate(futureEnd.toISOString().split('T')[0]);
  };

  // Generation simulated steps
  const generationStepsText = [
    'Analyzing destination layout & geography...',
    'Scouting local dining spots and monuments...',
    'Optimizing day-by-day pacing & route times...',
    'Calculating category budgets and local transit advice...',
    'Finalizing your customized holiday itinerary...',
  ];

  const handleGenerateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsGenerating(true);
    setGenerationStep(0);
    setGeneratedPlan(null);
    setSavedSuccess(false);

    // Step ticker for visual feedback
    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1100);

    const payload: TripFormData = {
      destination: destination.trim(),
      startingLocation: startingLocation.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      travelers,
      budgetTier,
      customBudget: customBudget ? parseFloat(customBudget) : undefined,
      currency: 'USD',
      pacing,
      interests: selectedInterests,
      specialRequests: specialRequests.trim(),
    };

    try {
      const response = await fetch('/api/trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.plan) {
        setGeneratedPlan(data.plan);
        // Initialize welcome message in chat assistant
        setChatMessages([
          {
            id: 'init-msg',
            sender: 'assistant',
            content: `I've prepared your holiday plan for ${data.plan.destination}! You can ask me to swap activities, recommend authentic restaurants, add family adjustments, or tweak any day's timing.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to generate trip:', err);
      clearInterval(interval);
    } finally {
      setIsGenerating(false);
    }
  };

  // Conversational chat submit
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput('');

    const newMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setIsChatSending(true);

    try {
      const res = await fetch('/api/trip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan: generatedPlan,
          message: userText,
          chatHistory: chatMessages,
        }),
      });
      const data = await res.json();
      const aiReply: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        content: data.reply || "I've updated your preferences for this holiday!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const errorReply: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        content: "I'm right here! Feel free to ask about local sights, transit, or dining recommendations.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsChatSending(false);
    }
  };

  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const loadSavedTrips = async () => {
    if (!user) return;
    setIsLoadingSavedTrips(true);
    try {
      const trips = await getUserTripsFromFirestore(user.id);
      setSavedTrips(trips);
    } catch (err) {
      console.error('Error loading trips from Firestore:', err);
    } finally {
      setIsLoadingSavedTrips(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    if (!user) {
      setSaveStatusMessage('Please sign in to save your trip to your cloud account.');
      setTimeout(() => setSaveStatusMessage(null), 4000);
      return;
    }

    setIsSavingToFirestore(true);
    try {
      await saveTripToFirestore(user.id, generatedPlan);
      setSavedSuccess(true);
      setSaveStatusMessage('Itinerary saved to your Firebase cloud account!');
      setTimeout(() => {
        setSavedSuccess(false);
        setSaveStatusMessage(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      setSaveStatusMessage('Failed to save trip to Firestore. Check connection.');
      setTimeout(() => setSaveStatusMessage(null), 4000);
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  const handleDeleteSavedTrip = async (tripId: string) => {
    if (!user) return;
    try {
      await deleteTripFromFirestore(user.id, tripId);
      setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error('Failed to delete trip from Firestore:', err);
    }
  };

  const handleSelectSavedTrip = (trip: TripPlan) => {
    setGeneratedPlan(trip);
    setDestination(trip.destination);
    setStartingLocation(trip.startingLocation || '');
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTravelers(trip.travelers);
    setPacing(trip.pacing);
    setBudgetTier(trip.budgetTier);
    setShowSavedTripsModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Top Banner & Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>AI Trip Planner Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Design your personalized holiday itinerary
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Tell our AI travel assistant where you want to go and what you love doing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Always visible Saved Trips button */}
            <button
              id="open-saved-trips-btn"
              onClick={() => {
                setShowSavedTripsModal(true);
                if (user) loadSavedTrips();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              title="View your saved itineraries stored in Firebase"
            >
              <FolderHeart className="w-4 h-4 text-rose-500" />
              <span>Saved Trips</span>
              {user && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <Cloud className="w-3 h-3" />
                  Cloud
                </span>
              )}
            </button>

            {generatedPlan && (
              <>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                    chatOpen
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{chatOpen ? 'Hide AI Chat' : 'Refine with AI Chat'}</span>
                </button>

                <button
                  onClick={() => {
                    setGeneratedPlan(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Plan</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form / Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Configuration Form */}
        <div className={`${generatedPlan ? 'lg:col-span-4' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} transition-all`}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Trip Preferences</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Step 1 of 2</span>
            </div>

            {/* Quick Inspiration Presets */}
            {!generatedPlan && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadPreset('Tokyo, Japan', ['Food & Dining', 'Culture & History', 'Shopping'], 5)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 transition-colors cursor-pointer"
                  >
                    🍣 Tokyo 5-Day Foodie
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Paris, France', ['Art & Museums', 'Food & Dining', 'Culture & History'], 4)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 transition-colors cursor-pointer"
                  >
                    🥐 Paris 4-Day Romance
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Bali, Indonesia', ['Nature & Adventure', 'Beaches & Relaxation', 'Wellness & Spa'], 6)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 transition-colors cursor-pointer"
                  >
                    🌴 Bali 6-Day Serenity
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Rome, Italy', ['Culture & History', 'Food & Dining', 'Photography'], 4)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 transition-colors cursor-pointer"
                  >
                    🏛️ Rome 4-Day Heritage
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerateTrip} className="space-y-5">
              {/* Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Destination <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-sky-600 absolute left-3.5 top-3" />
                  <input
                    id="planner-destination-input"
                    type="text"
                    required
                    placeholder="e.g., Kyoto, Japan or Barcelona, Spain"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Starting Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Starting Location (Origin)</label>
                <input
                  id="planner-origin-input"
                  type="text"
                  placeholder="e.g., London, UK or New York, USA (optional)"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Dates & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date</label>
                  <input
                    id="planner-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date</label>
                  <input
                    id="planner-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Travelers & Pacing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Travelers</label>
                  <select
                    id="planner-travelers-select"
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                  >
                    <option value={1}>1 Traveler (Solo)</option>
                    <option value={2}>2 Travelers (Couple/Duo)</option>
                    <option value={3}>3 Travelers (Small Group)</option>
                    <option value={4}>4 Travelers (Family / Friends)</option>
                    <option value={6}>6+ Travelers (Large Group)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Pacing</label>
                  <select
                    id="planner-pacing-select"
                    value={pacing}
                    onChange={(e) => setPacing(e.target.value as TripPacing)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                  >
                    <option value="relaxed">Relaxed & Leisurely</option>
                    <option value="balanced">Balanced Exploration</option>
                    <option value="packed">Action-Packed Sights</option>
                  </select>
                </div>
              </div>

              {/* Budget Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Budget Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetTier('budget')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      budgetTier === 'budget'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Backpacker / $
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetTier('moderate')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      budgetTier === 'moderate'
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Moderate / $$
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetTier('luxury')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      budgetTier === 'luxury'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Luxury / $$$
                  </button>
                </div>
              </div>

              {/* Interests (Pills) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Interests & Travel Vibes</label>
                  <span className="text-[11px] text-slate-400">{selectedInterests.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRAVEL_INTEREST_OPTIONS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Special Notes or Dietary Preferences (Optional)
                </label>
                <textarea
                  id="planner-special-requests"
                  rows={2}
                  placeholder="e.g. Vegetarian food, avoid steep stairs, traveling with a toddler, interested in rooftop bars"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Submit Button */}
              <button
                id="planner-generate-submit-btn"
                type="submit"
                disabled={isGenerating || !destination.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isGenerating ? 'AI is Curating Your Plan...' : 'Generate AI Travel Plan'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Loading Screen OR Generated Trip Results */}
        <div className={`${generatedPlan ? 'lg:col-span-8' : 'hidden'} space-y-6`}>
          {generatedPlan && (
            <>
              {/* Trip Plan Header Hero Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-sky-100/60 to-transparent -z-10 rounded-bl-full"></div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                        {generatedPlan.durationDays} Days / {generatedPlan.travelers} Traveler(s)
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Est. ${generatedPlan.budget.dailyAverage}/day
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                        {generatedPlan.pacing} Pacing
                      </span>
                      {weatherData && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1.5 shadow-2xs">
                          <span>☀️ {weatherData.temperatureC}°C ({weatherData.temperatureF}°F)</span>
                          <span>•</span>
                          <span>{weatherData.condition}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {generatedPlan.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {generatedPlan.summary}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="save-trip-plan-btn"
                      onClick={handleSavePlan}
                      disabled={isSavingToFirestore}
                      className={`p-2.5 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                        savedSuccess
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Save Itinerary to Firebase Firestore"
                    >
                      {isSavingToFirestore ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      ) : (
                        <BookmarkCheck className={`w-4 h-4 ${savedSuccess ? 'text-emerald-600' : 'text-slate-500'}`} />
                      )}
                      <span>
                        {isSavingToFirestore ? 'Saving...' : savedSuccess ? 'Saved to Cloud!' : 'Save Itinerary'}
                      </span>
                    </button>

                    <button
                      id="google-calendar-sync-btn"
                      onClick={() => setShowCalendarModal(true)}
                      className="p-2.5 px-3.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                      title="Sync Itinerary to Google Calendar"
                    >
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>Google Calendar</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Print or Export PDF"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {saveStatusMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      savedSuccess
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <Cloud className="w-4 h-4 shrink-0" />
                    <span>{saveStatusMessage}</span>
                  </div>
                )}

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 pb-2">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'itinerary'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Day-by-Day Itinerary ({generatedPlan.itinerary.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('map')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'map'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Interactive Map & Routes ({getPlanLocations().length})
                  </button>

                  <button
                    onClick={() => setActiveTab('places')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'places'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Suggested Places & Sights
                  </button>

                  <button
                    onClick={() => setActiveTab('budget')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'budget'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Daily Budget Breakdown
                  </button>

                  <button
                    onClick={() => setActiveTab('tips')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'tips'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Travel Tips & Transit
                  </button>

                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'upcoming'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Stays & Rentals Preview
                  </button>

                  <button
                    id="tab-gemini-concierge-btn"
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'chat'
                        ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-amber-500 text-white shadow-xs'
                        : 'text-sky-700 bg-sky-50/70 hover:bg-sky-100 hover:text-sky-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Gemini AI Concierge & Search Grounding
                  </button>
                </div>
              </div>

              {/* TAB CONTENT 1: DAY-BY-DAY ITINERARY */}
              {activeTab === 'itinerary' && (
                <div className="space-y-6">
                  {/* Google Calendar Quick Sync Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border border-sky-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Google Calendar Integration</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Export all daily morning, afternoon, and evening slots directly to your personal Google Calendar.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCalendarModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Sync Schedule</span>
                    </button>
                  </div>
                  {generatedPlan.itinerary.map((dayPlan) => (
                    <div
                      key={dayPlan.day}
                      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-extrabold text-sm flex items-center justify-center">
                            D{dayPlan.day}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">{dayPlan.theme}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setMapDayFilter(dayPlan.day);
                              setActiveTab('map');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-sky-600" />
                            <span>Map Day {dayPlan.day}</span>
                          </button>
                          <span className="text-xs font-bold text-slate-500">
                            Est. Day Budget: ~${dayPlan.estimatedDayCost}
                          </span>
                        </div>
                      </div>

                      {/* Time Slots: Morning, Afternoon, Evening */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dayPlan.slots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    slot.timeOfDay === 'Morning'
                                      ? 'bg-amber-100 text-amber-800'
                                      : slot.timeOfDay === 'Afternoon'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {slot.timeOfDay}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">{slot.estimatedCost}</span>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900 leading-snug">{slot.title}</h4>
                              <p className="text-xs text-sky-700 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {slot.place}
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">{slot.description}</p>
                            </div>

                            {slot.transitTip && (
                              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1">
                                <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{slot.transitTip}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Day Pro Tips & Meal suggestion */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Daily Local Tip: </span>
                            {dayPlan.dailyTip}
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Culinary Recommendation: </span>
                            {dayPlan.mealSuggestion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: INTERACTIVE MAP & ROUTE OVERVIEW */}
              {activeTab === 'map' && (
                <div className="space-y-6">
                  {/* Map Header & Controls Bar */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-sky-600" />
                          <span>Interactive Vacation & Route Map</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Explore beaches, luxury stays, cultural monuments, and calculate turn-by-turn routes in {generatedPlan.destination}.
                        </p>
                      </div>

                      {/* Day Filter Pill Bar */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setMapDayFilter(undefined)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mapDayFilter === undefined
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          All Days
                        </button>
                        {generatedPlan.itinerary.map((d) => (
                          <button
                            key={d.day}
                            onClick={() => setMapDayFilter(d.day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              mapDayFilter === d.day
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Day {d.day}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Route Details Card if available */}
                    {activeRoute && (
                      <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              Scenic Route: {activeRoute.origin} → {activeRoute.destination}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {activeRoute.distanceKm} km • ~{activeRoute.durationMinutes} mins driving • {activeRoute.summary}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                          🚗 Optimized Route
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Map Component */}
                  <InteractiveMap
                    locations={getPlanLocations()}
                    center={getPlanMapCenter()}
                    zoom={12}
                    selectedLocationId={selectedMapLocationId}
                    onSelectLocation={(loc) => setSelectedMapLocationId(loc.id)}
                    activeRoute={activeRoute}
                    dayNumberFilter={mapDayFilter}
                    heightClass="h-[620px]"
                    showCategoryFilters={true}
                  />
                </div>
              )}

              {/* TAB CONTENT 2: SUGGESTED PLACES & SIGHTS */}
              {activeTab === 'places' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedPlan.suggestedPlaces.map((place) => (
                      <div
                        key={place.id || place.name}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                              {place.category}
                            </span>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              ⭐ {place.rating || 4.8}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900">{place.name}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{place.description}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Cost: {place.estimatedCost}</span>
                            <span>Best: {place.bestTimeToVisit}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {place.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Curated activities row */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Recommended Experiential Activities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedPlan.suggestedActivities.map((act) => (
                        <div key={act.id || act.title} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {act.category}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900">{act.title}</h5>
                          <p className="text-xs text-slate-600">{act.description}</p>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                            <span>{act.duration}</span>
                            <span className="text-indigo-600">{act.cost}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: DAILY BUDGET BREAKDOWN */}
              {activeTab === 'budget' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Financial Clarity
                      </span>
                      <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Estimated Holiday Expenses</h3>
                      <p className="text-xs text-slate-500">
                        Based on {generatedPlan.travelers} traveler(s) for {generatedPlan.durationDays} days in{' '}
                        {generatedPlan.destination}.
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-right sm:text-right">
                      <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                        Total Estimated
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        ${generatedPlan.budget.totalEstimated}{' '}
                        <span className="text-xs font-bold text-emerald-900">{generatedPlan.budget.currency}</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">
                        ~${generatedPlan.budget.dailyAverage} / day average
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Hotels & Accommodation</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${generatedPlan.budget.categories.accommodation}
                      </div>
                      <div className="text-[11px] text-slate-400">Approx 40% of total allocation</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Food, Cafes & Dining</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${generatedPlan.budget.categories.foodAndDining}
                      </div>
                      <div className="text-[11px] text-slate-400">Breakfasts, lunches, chalkboard dinners</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Activities & Sight Entry</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${generatedPlan.budget.categories.activitiesAndSights}
                      </div>
                      <div className="text-[11px] text-slate-400">Museum entries, boat rides, guide tours</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Local Transit & Mobility</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${generatedPlan.budget.categories.localTransit}
                      </div>
                      <div className="text-[11px] text-slate-400">Metro day passes, trams, short cabs</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Emergency & Souvenirs</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${generatedPlan.budget.categories.miscellaneous}
                      </div>
                      <div className="text-[11px] text-slate-400">Artisanal gifts, snacks, contingency</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 flex items-start gap-3">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Budgeting Insight: </span>
                      These values are calibrated against current average local hospitality rates in {generatedPlan.destination}.
                      You can adjust dining costs downwards by eating at local markets or using lunch sets.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 4: TRAVEL TIPS & TRANSIT */}
              {activeTab === 'tips' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Local Wisdom</span>
                    <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Travel Tips for {generatedPlan.destination}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedPlan.travelTips.map((tip, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                          {tip.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{tip.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{tip.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 5: STAYS & RENTALS PREVIEW (V2 Roadmap Anchor) */}
              {activeTab === 'upcoming' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 mb-1">
                          Future Module Preview
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Recommended Neighborhood Stays</h3>
                        <p className="text-xs text-slate-500">
                          Curated boutique stays perfectly situated for this itinerary's daily routes. Direct booking unlocks in Version 2.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedPlan.futureModules.stays.map((stay, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {stay.type}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{stay.priceLevel}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{stay.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {stay.neighborhood}
                          </p>
                          <div className="space-y-1 pt-2 border-t border-slate-200/60">
                            {stay.highlights.map((h) => (
                              <div key={h} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                <span className="text-emerald-500">✓</span>
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rentals & Transit Preview */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 mb-1">
                        Mobility Advice
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Vehicle Rentals & Transit Recommendations</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedPlan.futureModules.rentals.map((rental, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                              {rental.category}
                            </span>
                            <span className="text-xs font-bold text-teal-800">{rental.approxDailyCost}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{rental.recommendation}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{rental.bestFor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 7: GEMINI AI CONCIERGE & SEARCH GROUNDING */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <GeminiChatbot
                      currentPlan={generatedPlan}
                      destinationName={destination}
                      isFloating={false}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* GENERATION IN PROGRESS ANIMATION SCREEN */}
          {isGenerating && (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-6 max-w-xl mx-auto my-12 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-600/30 animate-spin">
                <Compass className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">Crafting Your Dream Holiday</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Our AI travel engine is analyzing local sights, daily routes, and pricing for {destination}...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${((generationStep + 1) / 5) * 100}%` }}
                ></div>
              </div>

              {/* Current Step Text */}
              <div className="text-xs font-semibold text-sky-700 bg-sky-50 px-4 py-2 rounded-xl inline-block">
                {generationStepsText[generationStep] || generationStepsText[0]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING GEMINI CONCIERGE CHATBOT */}
      {generatedPlan && chatOpen && (
        <GeminiChatbot
          currentPlan={generatedPlan}
          destinationName={destination}
          isFloating={true}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* SAVED TRIPS MODAL (FIRESTORE INTEGRATION) */}
      {showSavedTripsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                  <FolderHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>My Saved Trips</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Firestore Cloud
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your holiday itineraries synchronized with Firebase
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSavedTripsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {!user ? (
                <div className="text-center py-10 px-4 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-slate-900">Sign in to view your saved trips</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Connect your account with Google authentication to save your custom holiday plans and access
                      them anytime from any device.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSavedTripsModal(false);
                      onNavigate('auth');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Go to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isLoadingSavedTrips ? (
                <div className="text-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Retrieving itineraries from Firestore...</p>
                </div>
              ) : savedTrips.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderHeart className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No saved trips yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Generate an itinerary using the AI planner above and click "Save Itinerary" to persist it directly
                    into your Firebase cloud database.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{trip.title}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 capitalize">
                            {trip.pacing}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {trip.destination}
                          </span>
                          <span>•</span>
                          <span>
                            {trip.durationDays} Days / {trip.travelers} Guest(s)
                          </span>
                          {trip.budget?.dailyAverage > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">
                                ~${trip.budget.dailyAverage}/day
                              </span>
                            </>
                          )}
                        </div>
                        {trip.createdAt && (
                          <p className="text-[10px] text-slate-400">
                            Saved on {new Date(trip.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleSelectSavedTrip(trip)}
                          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Load Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSavedTrip(trip.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {user && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[280px]">Signed in as: {user.email}</span>
                <span className="font-semibold">{savedTrips.length} saved trip(s)</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Google Calendar Sync Modal */}
      {generatedPlan && (
        <GoogleCalendarSyncModal
          trip={generatedPlan}
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
        />
      )}
    </div>
  );
};

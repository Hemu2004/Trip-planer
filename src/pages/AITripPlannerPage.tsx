import React, { useState, useEffect, useRef } from 'react';
import {
  TripFormData,
  TripPlan,
  BudgetTier,
  TripPacing,
  ChatMessage,
  NavigationPage,
} from '../types';
import { TRAVEL_INTEREST_OPTIONS, POPULAR_DESTINATIONS } from '../data/sampleDestinations';
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
} from 'lucide-react';

interface AITripPlannerPageProps {
  initialDestination?: string;
  onNavigate: (page: NavigationPage) => void;
}

export const AITripPlannerPage: React.FC<AITripPlannerPageProps> = ({
  initialDestination,
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
  const [activeTab, setActiveTab] = useState<'itinerary' | 'places' | 'budget' | 'tips' | 'upcoming'>('itinerary');
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleSavePlan = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

          {generatedPlan && (
            <div className="flex items-center gap-2">
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
            </div>
          )}
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
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      title="Save Itinerary"
                    >
                      <BookmarkCheck className={`w-4 h-4 ${savedSuccess ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
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
                    onClick={() => setActiveTab('places')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'places'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
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
                </div>
              </div>

              {/* TAB CONTENT 1: DAY-BY-DAY ITINERARY */}
              {activeTab === 'itinerary' && (
                <div className="space-y-6">
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
                        <span className="text-xs font-bold text-slate-500">
                          Est. Day Budget: ~${dayPlan.estimatedDayCost}
                        </span>
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

      {/* CONVERSATIONAL AI CHAT DRAWER / FLOATING ASSISTANT */}
      {generatedPlan && chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[520px] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Trip Planner Concierge</h4>
                <p className="text-[10px] text-sky-100">Live AI Assistant for {generatedPlan.destination}</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => {
                setChatInput('Recommend 3 authentic local dinner spots with outdoor seating.');
              }}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 whitespace-nowrap cursor-pointer shrink-0"
            >
              🍽️ Local dinners
            </button>
            <button
              onClick={() => {
                setChatInput('What should I do if it rains on day 2?');
              }}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 whitespace-nowrap cursor-pointer shrink-0"
            >
              🌧️ Rainy day options
            </button>
            <button
              onClick={() => {
                setChatInput('How do I easily get from the airport to the city center?');
              }}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 whitespace-nowrap cursor-pointer shrink-0"
            >
              ✈️ Airport transit
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isChatSending && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:0.4s]"></span>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask to adjust plans, sights, or meals..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isChatSending || !chatInput.trim()}
              className="p-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

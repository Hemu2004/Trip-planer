import React, { useState } from 'react';
import { NavigationPage, MapLocationItem, ExperienceCategory } from '../types';
import {
  POPULAR_DESTINATIONS,
  EXPERIENCE_CATEGORIES,
  SAMPLE_USER_TRIPS,
  DestinationCard,
} from '../data/sampleDestinations';
import { CURATED_MAP_PLACES } from '../data/travelKnowledgeBase';
import { InteractiveMap } from '../components/InteractiveMap';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Wallet,
  MapPin,
  Building2,
  Car,
  Calendar,
  Users,
  CheckCircle2,
  Search,
  Star,
  ShieldCheck,
  Zap,
  Waves,
  Mountain,
  Heart,
  Luggage,
  Sun,
  Eye,
  Camera,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: NavigationPage) => void;
  onSelectDestinationForPlanner: (destination: string) => void;
  initialSection?: 'all' | 'explore';
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectDestinationForPlanner,
  initialSection,
}) => {
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExperienceCategory | 'All'>('All');
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(5);

  React.useEffect(() => {
    if (initialSection === 'explore') {
      const timer = setTimeout(() => {
        const el = document.getElementById('explore-destinations-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  // Collect all world map places for the interactive vacation preview
  const allWorldMapPlaces: MapLocationItem[] = React.useMemo(() => {
    return Object.values(CURATED_MAP_PLACES).flat();
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onSelectDestinationForPlanner(quickSearch.trim());
      onNavigate('planner');
    } else {
      onNavigate('planner');
    }
  };

  const handleQuickDestinationClick = (dest: DestinationCard) => {
    onSelectDestinationForPlanner(`${dest.name}, ${dest.country}`);
    onNavigate('planner');
  };

  const handleSampleTripSelect = (destName: string) => {
    onSelectDestinationForPlanner(destName);
    onNavigate('planner');
  };

  const scrollToExplore = () => {
    const el = document.getElementById('explore-destinations-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMap = () => {
    const el = document.getElementById('vacation-map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter destinations by category
  const filteredDestinations = React.useMemo(() => {
    if (selectedCategory === 'All') return POPULAR_DESTINATIONS;
    return POPULAR_DESTINATIONS.filter((d) => d.categories.includes(selectedCategory));
  }, [selectedCategory]);

  return (
    <div className="space-y-24 pb-24">
      {/* 1. HERO SECTION - TROPICAL / RESORT VACATION ATMOSPHERE */}
      <section className="relative overflow-hidden pt-8 pb-20 md:pt-16 md:pb-28">
        {/* Ambient atmospheric gradients & sunset glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/40 via-sky-50/60 to-slate-50"></div>
        <div className="absolute top-10 right-1/4 -z-10 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-32 left-10 -z-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Holiday Concierge Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-amber-200/60 text-slate-800 text-xs font-bold tracking-wide shadow-2xs">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Modern Vacation & Holiday Platform</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700 font-semibold">AI Powered</span>
              </div>

              {/* Headings */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Plan unforgettable vacations. <br />
                  <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Effortless itineraries,
                  </span>{' '}
                  <br />
                  curated for you.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
                  Discover beachfront villas, alpine chalet routes, hidden city bistros, and paced daily schedules.
                  Trip Planner transforms your holiday dreams into bespoke, budget-verified travel plans.
                </p>
              </div>

              {/* Comprehensive Vacation Search Widget */}
              <div className="space-y-4 max-w-xl">
                <form
                  onSubmit={handleHeroSearchSubmit}
                  className="p-3 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/90 space-y-3"
                >
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100">
                    <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                    <input
                      id="hero-destination-input"
                      type="text"
                      placeholder="Where is your dream holiday? (e.g. Bali, Paris, Swiss Alps, Amalfi)"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-1 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="bg-transparent text-slate-800 font-semibold focus:outline-none w-full cursor-pointer"
                      >
                        <option value={3}>3 Days (Weekend)</option>
                        <option value={5}>5 Days (Popular)</option>
                        <option value={7}>7 Days (1 Week)</option>
                        <option value={10}>10 Days (Grand)</option>
                        <option value={14}>14 Days (Full Tour)</option>
                      </select>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={travelersCount}
                        onChange={(e) => setTravelersCount(Number(e.target.value))}
                        className="bg-transparent text-slate-800 font-semibold focus:outline-none w-full cursor-pointer"
                      >
                        <option value={1}>Solo Traveler</option>
                        <option value={2}>Couple / 2 People</option>
                        <option value={4}>Small Group (4)</option>
                        <option value={6}>Family (6+)</option>
                      </select>
                    </div>

                    <button
                      id="hero-cta-plan-btn"
                      type="submit"
                      className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Start Planning</span>
                    </button>
                  </div>
                </form>

                {/* Quick Inspiration Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400 font-medium">Trending Ideas:</span>
                  {[
                    { name: 'Bali, Indonesia', icon: '🏝️' },
                    { name: 'Amalfi Coast, Italy', icon: '🌅' },
                    { name: 'Swiss Alps, Switzerland', icon: '🏔️' },
                    { name: 'Kyoto, Japan', icon: '🏯' },
                    { name: 'Paris, France', icon: '✨' },
                  ].map((chip) => (
                    <button
                      key={chip.name}
                      onClick={() => {
                        onSelectDestinationForPlanner(chip.name);
                        onNavigate('planner');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-200/80 text-slate-700 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.name.split(',')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Secondary CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    id="hero-cta-explore-btn"
                    onClick={scrollToExplore}
                    className="px-5 py-2.5 rounded-2xl border border-slate-300/90 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                  >
                    <Compass className="w-4 h-4 text-sky-600" />
                    Explore Holiday Destinations
                  </button>
                  <button
                    onClick={scrollToMap}
                    className="px-5 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-sky-200/60"
                  >
                    <MapPin className="w-4 h-4 text-sky-600" />
                    Interactive Vacation Map
                  </button>
                </div>
              </div>

              {/* Micro Trust Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">5-10s</div>
                  <div className="text-xs text-slate-500 font-medium">Bespoke Holiday Plan</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Verified Local Pacing</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">Free</div>
                  <div className="text-xs text-slate-500 font-medium">Universal Traveler Access</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase - Stacking Tropical and Luxury Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Main Luxury Resort Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white group">
                  <img
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80"
                    alt="Tropical Luxury Resort and Ocean Infinity Pool"
                    className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>

                  {/* Top Floating Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-sm flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Tropical Island Retreat
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-md">
                      ⭐ 4.9 Rating
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Bali & Ubud, Indonesia</span>
                      <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                        $85 / day average
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">6-Day Tropical Wellness & Beach Club Escape</h3>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                      Sunrise cliff temples, infinity pool day clubs, sunset seafood in Jimbaran Bay, and scenic jungle rice terraces.
                    </p>

                    <button
                      onClick={() => {
                        onSelectDestinationForPlanner('Bali, Indonesia');
                        onNavigate('planner');
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>Customize this Bali Vacation</span>
                    </button>
                  </div>
                </div>

                {/* Floating Micro Card 1: Budget Transparency */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Transparent Budget</div>
                    <div className="text-xs font-bold text-slate-800">Clear Daily Breakdown</div>
                  </div>
                </div>

                {/* Floating Micro Card 2: AI Concierge */}
                <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">AI Holiday Concierge</div>
                    <div className="text-xs font-bold text-slate-800">Paced for Rest & Thrills</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VACATION EXPERIENCES CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Choose Your Holiday Style</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Curated by Vacation Vibe & Theme
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Click any vibe to filter recommended vacation spots below
          </div>
        </div>

        {/* Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            All Vibes ({POPULAR_DESTINATIONS.length})
          </button>
          {EXPERIENCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{cat.id === 'Beaches' ? '🏖️' : cat.id === 'Mountains' ? '🏔️' : cat.id === 'Luxury' ? '✨' : cat.id === 'Adventure' ? '🏄' : cat.id === 'Nature' ? '🌲' : cat.id === 'Romantic' ? '💖' : '🏛️'}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. EXPLORE CURATED VACATION DESTINATIONS */}
      <section id="explore-destinations-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Top Holiday Destinations</div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Ready for Instant Vacation Planning
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Select any trending destination to launch the AI planner pre-configured with top sights, stays, and budget estimates.
            </p>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="self-start md:self-auto px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <span>Custom Destination</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-60 overflow-hidden">
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-sm">
                    {dest.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold">{dest.name}</h3>
                    <p className="text-xs text-slate-300">{dest.country}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-sky-200 font-medium">Est. Budget</span>
                    <p className="text-sm font-bold text-white">{dest.estimatedBudget}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">{dest.tagline}</p>

                {dest.highlightReason && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{dest.highlightReason}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {dest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    {dest.typicalDuration}
                  </span>

                  <button
                    onClick={() => handleQuickDestinationClick(dest)}
                    className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Plan {dest.name}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE VACATION & MAP EXPLORATION SECTION */}
      <section id="vacation-map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Global Vacation Coordinates</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Interactive Vacation Map Explorer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore curated beaches, cliffside resorts, monuments, and culinary hotspots. Filter by vibe or click any pin to start planning!
              </p>
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="self-start md:self-auto px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Open Full AI Planner
            </button>
          </div>

          {/* Embedded Interactive Map */}
          <InteractiveMap
            locations={allWorldMapPlaces}
            center={[-8.4095, 115.1889]}
            zoom={10}
            onSelectLocation={(loc) => {
              onSelectDestinationForPlanner(`${loc.city}, ${loc.country}`);
              onNavigate('planner');
            }}
            onAddToTrip={(loc) => {
              onSelectDestinationForPlanner(`${loc.city}, ${loc.country}`);
              onNavigate('planner');
            }}
            heightClass="h-[520px]"
            showCategoryFilters={true}
          />
        </div>
      </section>

      {/* 5. CURATED SAMPLE VACATION BLUEPRINTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Pre-Crafted Blueprints</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Curated Sample Vacation Itineraries
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Ready-made, day-by-day vacation schedules with verified daily budgets and meal recommendations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
          >
            Create Your Own <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_USER_TRIPS.map((sampleTrip) => (
            <div
              key={sampleTrip.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700">
                    {sampleTrip.durationDays} Days • {sampleTrip.pacing}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Est. ${sampleTrip.budget.dailyAverage}/day
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{sampleTrip.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{sampleTrip.summary}</p>

                {/* Day-by-Day Teaser */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itinerary Highlights</div>
                  {sampleTrip.itinerary.slice(0, 2).map((d) => (
                    <div key={d.day} className="text-xs flex items-center gap-2 text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        D{d.day}
                      </span>
                      <span className="truncate">{d.theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSampleTripSelect(sampleTrip.destination)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Clone & Customize This Trip</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FIVE CORE VACATION PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>Complete Vacation Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything for an effortless, stress-free holiday
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Say goodbye to 40 open browser tabs and messy spreadsheets. Trip Planner unites every phase of your
            vacation into one intelligent, interactive experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Pillar 1: AI Trip Planning */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-full">
                Active in V1
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Trip Planning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate personalized day-by-day itineraries in seconds. Tailored to your pace, travel style, traveler
                group, and unique interests without feeling rushed.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Morning, Noon & Night</span>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
              >
                Try Planner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2: Budget Planning */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                Active in V1
              </div>
              <h3 className="text-xl font-bold text-slate-900">Budget Planning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transparent daily budget estimations categorized into accommodation, food & dining, sights, and local
                transit so you travel with zero financial surprises.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Backpacker to Luxury</span>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                Estimate Budget <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 3: Places & Activities */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full">
                Active in V1
              </div>
              <h3 className="text-xl font-bold text-slate-900">Places & Activities</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Curated points of interest, optimal visiting hours, historical backgrounds, and authentic local food
                recommendations right next to top sights.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verified Sights & Gems</span>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                Explore Sights <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 4: Hotels & Stays */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                Curated Neighborhoods
              </div>
              <h3 className="text-xl font-bold text-slate-900">Resorts & Stays</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive curated recommendations for beachfront villas, boutique hotels, and mountain lodges situated in prime,
                safe areas near your planned daily activities.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Boutique & Luxury Stays</span>
              <span className="text-xs font-bold text-indigo-600">Active Guidance</span>
            </div>
          </div>

          {/* Pillar 5: Rentals & Mobility */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full">
                Routes & Transit
              </div>
              <h3 className="text-xl font-bold text-slate-900">Rentals & Transit</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clear guidance on getting around: whether you need a convertible car for scenic cliff drives, e-bikes
                for coastal paths, or unlimited public rail passes.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Turn-by-Turn Advice</span>
              <span className="text-xs font-bold text-teal-600">Active Guidance</span>
            </div>
          </div>

          {/* Pillar 6: Conversational Refinement */}
          <div className="group bg-gradient-to-br from-sky-600 to-indigo-700 text-white rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
                <Zap className="w-7 h-7 text-amber-300" />
              </div>
              <div className="inline-block text-[11px] font-bold text-white uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                Conversational Concierge
              </div>
              <h3 className="text-xl font-bold text-white">Ask & Refine Anytime</h3>
              <p className="text-sm text-sky-100 leading-relaxed">
                Need more beach club sunset spots? Rain on day 3? Ask the AI Travel Assistant directly to tweak any day
                without starting your plan from scratch.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/20 flex items-center justify-between">
              <span className="text-xs font-medium text-sky-200">Interactive Chat Concierge</span>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg backdrop-blur-md cursor-pointer flex items-center gap-1"
              >
                Try It Out <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SUPPORT & CONCIERGE TRUST BANNER */}
      <section className="bg-slate-900 text-white py-16 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dedicated Traveler Care & Admin Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Questions, custom requests, or need holiday tips?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Our 24/7 Concierge Support desk is directly monitored by our administration team. Send your questions or
              feedback anytime and receive a prompt, dedicated response.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Contact Concierge Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-white/15"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Create Your Holiday</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { NavigationPage } from '../types';
import { POPULAR_DESTINATIONS, DestinationCard } from '../data/sampleDestinations';
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
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: NavigationPage) => void;
  onSelectDestinationForPlanner: (destination: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectDestinationForPlanner }) => {
  const [quickSearch, setQuickSearch] = useState('');

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

  const scrollToExplore = () => {
    const el = document.getElementById('explore-destinations-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.sky.100),theme(colors.slate.50))] opacity-70"></div>
        <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-10 -z-10 w-72 h-72 bg-sky-200/40 rounded-full blur-2xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 text-sky-800 text-xs font-bold tracking-wide uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Next-Gen Travel Assistant</span>
              </div>

              {/* Headings */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Plan your trip. <br />
                  <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                    Explore more.
                  </span>{' '}
                  <br />
                  Enjoy your journey.
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
                  Trip Planner uses intelligent AI to organize your day-by-day itineraries, estimate true daily budgets,
                  and hand-pick hidden gems—all in one effortless holiday plan.
                </p>
              </div>

              {/* Quick Search & CTAs */}
              <div className="space-y-4 max-w-xl">
                <form
                  onSubmit={handleHeroSearchSubmit}
                  className="p-2 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex items-center gap-3 px-3 py-2 w-full">
                    <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                    <input
                      id="hero-destination-input"
                      type="text"
                      placeholder="Where do you want to explore? (e.g., Tokyo, Paris, Bali)"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    id="hero-cta-plan-btn"
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-sky-600/20 whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Plan My Trip
                  </button>
                </form>

                {/* Secondary CTA & Highlights */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    id="hero-cta-explore-btn"
                    onClick={scrollToExplore}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-slate-600" />
                    Explore Destinations
                  </button>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1 inline" /> Free V1 Access
                    </span>
                    <span>•</span>
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>

              {/* Micro stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">5-10s</div>
                  <div className="text-xs text-slate-500 font-medium">Instant AI Plan</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Personalized Schedule</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">$0 USD</div>
                  <div className="text-xs text-slate-500 font-medium">Version 1 Core</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Main Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/40 bg-white group">
                  <img
                    src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80"
                    alt="Travel destination overview"
                    className="w-full h-84 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-md shadow-sm">
                      ✨ AI Curated Itinerary
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-300">Kyoto & Tokyo, Japan</span>
                      <span className="text-xs font-bold bg-emerald-500/90 px-2 py-0.5 rounded-md">$145 / day</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">5-Day Cultural & Culinary Discovery</h3>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                      Morning shrine strolls, artisanal noodle tastings, and bamboo grove tea houses with custom daily
                      pacing.
                    </p>
                  </div>
                </div>

                {/* Floating Micro Card 1: Budget pill */}
                <div className="absolute -bottom-6 -left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Smart Budget</div>
                    <div className="text-xs font-bold text-slate-800">Clear Daily Breakdown</div>
                  </div>
                </div>

                {/* Floating Micro Card 2: AI Recommendation */}
                <div className="absolute -top-4 -right-4 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">AI Concierge</div>
                    <div className="text-xs font-bold text-slate-800">Paced for You</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FIVE CORE PILLARS SECTION (AI Trip Planning, Budget Planning, Places & Activities, Hotels, Rentals) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>The Complete Travel Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need for an unforgettable holiday
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Say goodbye to endless browser bookmarks and chaotic spreadsheets. Trip Planner unites every phase of your
            journey into a unified, intelligent experience.
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
                V1 Preview • Booking V2
              </div>
              <h3 className="text-xl font-bold text-slate-900">Hotels & Stays</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive curated recommendations for boutique hotels, serviced flats, and eco-lodges situated in prime,
                safe neighborhoods near your daily activities.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Neighborhood Curation</span>
              <span className="text-xs font-bold text-indigo-600">Integrations Planned</span>
            </div>
          </div>

          {/* Pillar 5: Rentals & Mobility */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7" />
              </div>
              <div className="inline-block text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full">
                V1 Preview • Booking V2
              </div>
              <h3 className="text-xl font-bold text-slate-900">Rentals & Transit</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clear guidance on getting around: whether you need a compact rental car for countryside day trips, e-bikes
                for coastal paths, or unlimited public transit cards.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cars, Bikes & Transit</span>
              <span className="text-xs font-bold text-teal-600">Integrations Planned</span>
            </div>
          </div>

          {/* Pillar 6: Conversational Refinement */}
          <div className="group bg-gradient-to-br from-sky-600 to-indigo-700 text-white rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
                <Zap className="w-7 h-7 text-amber-300" />
              </div>
              <div className="inline-block text-[11px] font-bold text-white uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                Conversational AI
              </div>
              <h3 className="text-xl font-bold text-white">Ask & Refine Anytime</h3>
              <p className="text-sm text-sky-100 leading-relaxed">
                Need more vegetarian dinner ideas? Rain on day 3? Ask the AI Travel Assistant directly to tweak any day
                without starting your plan from scratch.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/20 flex items-center justify-between">
              <span className="text-xs font-medium text-sky-200">Interactive Chat Helper</span>
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

      {/* 3. EXPLORE CURATED DESTINATIONS (Secondary CTA Target) */}
      <section id="explore-destinations-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Explore & Get Inspired</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Top destinations ready for instant planning
            </h2>
            <p className="text-slate-600 text-base mt-2">
              Select any trending destination to launch the AI planner pre-configured with top sights and recommendations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            Custom Destination <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {POPULAR_DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
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

      {/* 4. HOW IT WORKS IN 3 SIMPLE STEPS */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>

        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Simple & Effortless</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How Trip Planner Works</h2>
          <p className="text-sm text-slate-400">From idea to an actionable holiday plan in less than 30 seconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="bg-slate-800/80 border border-slate-700/70 p-7 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 font-extrabold text-xl flex items-center justify-center border border-sky-400/30">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Share Your Style & Dates</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your dream destination, travel dates, who you are traveling with, and whether you prefer a relaxed or
              adventure-packed pace.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-7 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold text-xl flex items-center justify-center border border-indigo-400/30">
              2
            </div>
            <h3 className="text-lg font-bold text-white">AI Crafts Your Blueprint</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our travel model schedules sensible routes, groups close sights together, accounts for morning and evening
              hours, and calculates real expenses.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-7 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-xl flex items-center justify-center border border-emerald-400/30">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Refine & Pack Your Bags</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chat with the assistant to swap activities, export your itinerary to notes or PDF, and embark on a stress-free
              adventure.
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate('planner')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Build My Personalized Plan Now
          </button>
        </div>
      </section>
    </div>
  );
};

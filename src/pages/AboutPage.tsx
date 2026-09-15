import React from 'react';
import { NavigationPage } from '../types';
import { Compass, Sparkles, AlertCircle, CheckCircle2, Shield, Heart, Zap, Layers, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Our Mission & Vision</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Reinventing how the world plans holidays
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Trip Planner is built to eliminate holiday planning stress so you can spend less time juggling spreadsheets
          and more time enjoying memorable travel moments.
        </p>
      </div>

      {/* Hero Image / Brand Vignette */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80"
          alt="Scenic travel road trip"
          className="w-full h-80 sm:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8 text-white max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-300">The Problem We Solve</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">Travel planning shouldn't feel like a second job.</h2>
          <p className="text-sm text-slate-200 mt-2">
            The average traveler opens over 35 browser tabs, consults conflicting reviews, and still ends up with an
            unrealistic, exhausted schedule.
          </p>
        </div>
      </div>

      {/* The Problem vs Solution Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* The Problem */}
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">The Traditional Travel Friction</h3>
              <p className="text-xs text-slate-500">Why planning today is broken</p>
            </div>
          </div>

          <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
              <span>
                <strong>Fragmented tools:</strong> One app for flights, another for stays, scattered notes, and bookmarks
                lost across devices.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
              <span>
                <strong>Overloaded itineraries:</strong> Sights booked on opposite sides of town causing burnout, missed
                reservations, and frustration.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
              <span>
                <strong>Hidden budget shocks:</strong> No clear upfront idea of daily dining, transit, and sight costs until
                the credit card statement arrives.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
              <span>
                <strong>Generic cookie-cutter lists:</strong> "Top 10" blog lists that don't match whether you're a foodie,
                traveling with toddlers, or on a budget.
              </span>
            </li>
          </ul>
        </div>

        {/* The AI Solution */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">The Trip Planner Way</h3>
              <p className="text-xs text-slate-500">How modern AI simplifies your holiday</p>
            </div>
          </div>

          <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-sky-600 font-bold shrink-0 mt-0.5">✓</span>
              <span>
                <strong>One cohesive plan:</strong> Sights, pacing, morning-afternoon-evening timings, and tips organized in
                a single clean view.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-sky-600 font-bold shrink-0 mt-0.5">✓</span>
              <span>
                <strong>Sensible geographical grouping:</strong> Attractions clustered smartly so you spend time taking in
                views, not sitting in traffic.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-sky-600 font-bold shrink-0 mt-0.5">✓</span>
              <span>
                <strong>Transparent budget breakdowns:</strong> Clear daily estimates for food, hotels, transit, and entry
                fees based on your travel tier.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-sky-600 font-bold shrink-0 mt-0.5">✓</span>
              <span>
                <strong>Conversational flexibility:</strong> Want to switch museum day for a beach morning? Just ask the AI
                concierge to adjust.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* How AI Helps You Plan Better */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">The Technology</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            How Artificial Intelligence Powers Your Journey
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Trip Planner combines cutting-edge generative intelligence with deep travel logic to craft itineraries that
            feel handcrafted by a local concierge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Personalized Preference Modeling</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We process your specific budget tier, group size, and favorite activities to filter out irrelevant noise and
              focus on what brings you joy.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dynamic Schedule Pacing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike static templates, our AI accounts for real-world fatigue, giving you space for slow morning coffees,
              sunset strolls, and spontaneous detours.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Real-Time Conversational Refinement</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chat naturally with the itinerary engine. Add dietary requirements, adjust for unexpected weather, or find
              quaint bookshops in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Version 1 & Roadmap */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Strategic Roadmap</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">From Version 1 to an All-In-One Platform</h2>
          <p className="text-slate-300 text-sm mt-2">
            We are deliberately releasing a stable, fast, and high-utility Version 1 focusing on itinerary generation,
            budget intelligence, and Google authentication before layering commercial booking modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Now (Version 1)
            </div>
            <h4 className="text-base font-bold text-white">Core Application Experience</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>AI Day-by-Day schedule generation with morning, afternoon, evening slots</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Transparent daily budget calculator by category</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Google Sign In & session persistence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Conversational AI refinement chat drawer</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Coming in Version 2
            </div>
            <h4 className="text-base font-bold text-white">Full Commercial Booking Suite</h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400/60 flex items-center justify-center text-[9px] text-sky-300">
                  ○
                </span>
                <span>Direct hotel and boutique stay reservations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400/60 flex items-center justify-center text-[9px] text-sky-300">
                  ○
                </span>
                <span>Rental car, bike, and scooter reservations with live pricing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400/60 flex items-center justify-center text-[9px] text-sky-300">
                  ○
                </span>
                <span>Group holiday collaboration & shared expenses split</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400/60 flex items-center justify-center text-[9px] text-sky-300">
                  ○
                </span>
                <span>Offline mobile sync & live gate/weather notifications</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">Ready to design your next vacation in seconds?</p>
          <button
            onClick={() => onNavigate('planner')}
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Launch AI Trip Planner
          </button>
        </div>
      </div>
    </div>
  );
};

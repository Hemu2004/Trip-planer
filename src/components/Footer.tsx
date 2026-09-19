import React from 'react';
import { NavigationPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, Heart, Shield, Globe, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: NavigationPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuth();
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Trip Planner</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plan your trip. Explore more. Enjoy your journey. Smart, personalized holiday itineraries crafted in
              seconds by AI.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Version 1.0 Active • Google Cloud Run Ready</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Home Page
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  About Trip Planner
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('planner')}
                  className="hover:text-sky-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Trip Planner
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    onClick={() => onNavigate('knowledge-base')}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Knowledge Base (RAG)
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('auth')}
                  className="hover:text-sky-400 transition-colors cursor-pointer"
                >
                  Google Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Long-term Platform Vision */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform Vision</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">✓</span>
                <span>AI Day-by-Day Itineraries (V1)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">✓</span>
                <span>Dynamic Budget Breakdown (V1)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">✓</span>
                <span>Conversational Trip Refinement (V1)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span className="text-sky-400 font-semibold">○</span>
                <span>Hotel & Villa Bookings (Upcoming)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span className="text-sky-400 font-semibold">○</span>
                <span>Car & Bike Rentals (Upcoming)</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Guarantee */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Designed for Travelers</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No more 40 browser tabs open or spreadsheet confusion. Trip Planner consolidates sights, budgets, pacing,
              and local advice into one clean itinerary.
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Private & Secure</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Your trip preferences and data stay in your control.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Trip Planner Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Clean Architecture MVP</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
            <span>•</span>
            <span>Google Authentication</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { NavigationPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, CheckCircle2, Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { loginWithGoogle, loginWithEmail, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already authenticated, allow instant navigation
  const handleProceedToPlanner = () => {
    onNavigate('planner');
  };

  const handleGoogleAuth = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await loginWithGoogle();
      // On success, redirect to main Trip Planner experience
      onNavigate('planner');
    } catch (err) {
      setErrorMsg('Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await loginWithEmail(emailInput, nameInput);
      onNavigate('planner');
    } catch (err) {
      setErrorMsg('Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Brand Visual & Value Proposition */}
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Trip Planner Account</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Unlock the full power of your AI travel assistant
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Sign in with Google to save custom itineraries, synchronize your travel plans across devices, and receive
              personalized recommendations for your next escape.
            </p>
          </div>

          {/* Perks list */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Persistent Itinerary Storage</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save your generated day-by-day plans, budgets, and restaurant lists securely.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Conversational AI Memory</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refine travel schedules with custom queries and preserve your travel history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Priority Booking Previews</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Early access to upcoming hotel reservations and rental vehicle bookings in Version 2.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-md mx-auto space-y-6">
            {/* Header / Tabs */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-600/20">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {authMode === 'signin'
                  ? 'Sign in to access your saved trips and personalized plans.'
                  : 'Get started with Trip Planner in seconds.'}
              </p>
            </div>

            {/* Mode Toggle Pills */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                {errorMsg}
              </div>
            )}

            {/* 1. PRIMARY: GOOGLE AUTH BUTTON */}
            <div className="space-y-3">
              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-slate-400 active:scale-[0.99] disabled:opacity-50"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSubmitting ? 'Authenticating...' : 'Continue with Google'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Quick, secure one-tap Google authentication for travelers.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium uppercase">Or with email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* 2. SECONDARY: Clean Email/Password form (extensible architecture) */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    placeholder="alex.traveler@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="auth-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                id="auth-email-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{authMode === 'signin' ? 'Sign In to Trip Planner' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              By proceeding, you agree to Trip Planner's Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

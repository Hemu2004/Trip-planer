import React, { useState, useEffect } from 'react';
import { NavigationPage } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { AITripPlannerPage } from './pages/AITripPlannerPage';
import { ContactPage } from './pages/ContactPage';
import { AdminSupportPage } from './pages/AdminSupportPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { GeminiChatbot } from './components/GeminiChatbot';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { isAdmin, isLoading } = useAuth();

  // Initialize page, recognizing direct URL navigation or hash
  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    const raw = (window.location.pathname.replace(/^\//, '') || window.location.hash.replace(/^#/, '')).toLowerCase();
    if (raw === 'knowledge-base') return 'knowledge-base';
    if (raw === 'admin') return 'admin';
    if (raw === 'planner') return 'planner';
    if (raw === 'explore') return 'explore';
    if (raw === 'my-trips') return 'my-trips';
    if (raw === 'about') return 'about';
    if (raw === 'contact') return 'contact';
    if (raw === 'auth') return 'auth';
    return 'home';
  });

  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState<boolean>(false);

  // Synchronize browser history / URL with navigation
  const handleNavigate = (page: NavigationPage) => {
    // Direct access check for Super Admin routes:
    // If a normal user attempts to navigate directly to Knowledge Base or Admin Console, deny and route to home
    if ((page === 'knowledge-base' || page === 'admin') && !isAdmin) {
      setCurrentPage('home');
      if (window.history.pushState) {
        window.history.pushState(null, '', '/');
      }
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.history.pushState) {
      const path = page === 'home' ? '/' : `/${page}`;
      window.history.pushState(null, '', path);
    }
  };

  // Listen to browser forward/back buttons and hash changes
  useEffect(() => {
    const onLocationChange = () => {
      const raw = (window.location.pathname.replace(/^\//, '') || window.location.hash.replace(/^#/, '')).toLowerCase();
      if (raw === 'knowledge-base' || raw === 'admin') {
        if (isAdmin) {
          setCurrentPage(raw as NavigationPage);
        } else {
          // Deny access and redirect to home
          setCurrentPage('home');
          window.history.replaceState(null, '', '/');
        }
      } else if (raw === 'planner') setCurrentPage('planner');
      else if (raw === 'explore') setCurrentPage('explore');
      else if (raw === 'my-trips') setCurrentPage('my-trips');
      else if (raw === 'about') setCurrentPage('about');
      else if (raw === 'contact') setCurrentPage('contact');
      else if (raw === 'auth') setCurrentPage('auth');
      else if (raw === '' || raw === 'home') setCurrentPage('home');
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, [isAdmin]);

  // STRICT DIRECT URL ENFORCEMENT:
  // Once auth finishes loading, if user is on admin/knowledge-base and is NOT an Admin:
  // Deny access, redirect immediately to Home, and do not expose Admin data
  useEffect(() => {
    if (!isLoading && (currentPage === 'knowledge-base' || currentPage === 'admin') && !isAdmin) {
      setCurrentPage('home');
      if (window.history.replaceState) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [currentPage, isAdmin, isLoading]);

  const handleSelectDestinationForPlanner = (dest: string) => {
    setSelectedDestination(dest);
    handleNavigate('planner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation Bar - displays Knowledge Base & Admin links ONLY to Super Admin */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Dynamic Page Views */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectDestinationForPlanner={handleSelectDestinationForPlanner}
          />
        )}

        {currentPage === 'explore' && (
          <HomePage
            initialSection="explore"
            onNavigate={handleNavigate}
            onSelectDestinationForPlanner={handleSelectDestinationForPlanner}
          />
        )}

        {currentPage === 'my-trips' && (
          <AITripPlannerPage
            openSavedTrips={true}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}

        {currentPage === 'planner' && (
          <AITripPlannerPage
            initialDestination={selectedDestination}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'auth' && <AuthPage onNavigate={handleNavigate} />}

        {currentPage === 'contact' && <ContactPage />}

        {/* Super Admin Console is strictly guarded */}
        {currentPage === 'admin' && (
          isAdmin ? (
            <AdminSupportPage onNavigate={handleNavigate} />
          ) : (
            <HomePage
              onNavigate={handleNavigate}
              onSelectDestinationForPlanner={handleSelectDestinationForPlanner}
            />
          )
        )}

        {/* Knowledge Base is strictly guarded: only rendered if user is Super Admin */}
        {currentPage === 'knowledge-base' && (
          isAdmin ? (
            <KnowledgeBasePage onNavigate={handleNavigate} />
          ) : (
            <HomePage
              onNavigate={handleNavigate}
              onSelectDestinationForPlanner={handleSelectDestinationForPlanner}
            />
          )
        )}
      </main>

      {/* Global Floating Gemini Concierge Launcher */}
      {currentPage !== 'planner' && (
        <>
          {!isGlobalChatOpen && (
            <button
              id="global-floating-gemini-chat-btn"
              onClick={() => setIsGlobalChatOpen(true)}
              className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-amber-500 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 border border-white/20 group"
              title="Open Gemini AI Travel Concierge with Google Search Grounding"
            >
              <div className="relative">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
              </div>
              <span className="hidden sm:inline">Ask Gemini Concierge</span>
              <span className="sm:hidden">Gemini</span>
            </button>
          )}

          {isGlobalChatOpen && (
            <GeminiChatbot
              isFloating={true}
              isOpen={isGlobalChatOpen}
              onClose={() => setIsGlobalChatOpen(false)}
              destinationName={selectedDestination || 'your next dream holiday'}
              onNavigateToPlan={() => {
                setIsGlobalChatOpen(false);
                handleNavigate('planner');
              }}
            />
          )}
        </>
      )}

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

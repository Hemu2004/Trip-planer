import React, { useState } from 'react';
import { NavigationPage } from './types';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { AITripPlannerPage } from './pages/AITripPlannerPage';
import { ContactPage } from './pages/ContactPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDestinationForPlanner = (dest: string) => {
    setSelectedDestination(dest);
    handleNavigate('planner');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

        {/* Dynamic Page Views */}
        <main className="flex-1">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectDestinationForPlanner={handleSelectDestinationForPlanner}
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
        </main>

        {/* Global Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>
    </AuthProvider>
  );
}

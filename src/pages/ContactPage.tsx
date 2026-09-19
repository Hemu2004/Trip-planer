import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, MapPin, Clock, HelpCircle, User } from 'lucide-react';
import { ContactFormData } from '../types';
import { saveContactMessageToFirestore } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactFormData>({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Persist contact message in Firestore under /contactMessages
      try {
        await saveContactMessageToFirestore(formData);
      } catch (fsErr) {
        console.warn('Firestore message save note:', fsErr);
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmittedMessage(
          data.message || 'Your inquiry has been routed directly to our Administrator and Support Desk. We will reply shortly!'
        );
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          subject: '',
          message: '',
        });
      } else {
        setErrorMessage(data.error || 'Failed to submit your message. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          <span>Official Support Desk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How can our team help you?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Have questions about your itinerary, feedback on generated trips, or need personalized travel assistance?
          Submit a message directly to our dedicated support desk and administration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Contact Information & Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Support Desk Channels</h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Direct Support Desk</span>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Submissions are routed directly to the lead administrator and support team mailbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Response Commitment</span>
                  <p className="text-slate-500 text-xs mt-0.5">Prompt response to your email address within 24 hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Global Coverage</span>
                  <p className="text-slate-500 text-xs mt-0.5">Supporting worldwide itineraries and holiday schedules.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700">Privacy & Security:</span>
              <p>
                Your personal email and inquiries are kept strictly confidential and accessed only by our administrator to resolve your requests.
              </p>
            </div>
          </div>

          {/* Quick FAQ summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Frequently Asked Questions
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Is Trip Planner free to use?</p>
                <p className="text-slate-500 mt-0.5">
                  Yes, core AI trip planning, budget estimation, and itinerary generation are completely free.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Can I export my plan?</p>
                <p className="text-slate-500 mt-0.5">
                  Yes, you can save your itinerary to your account or sync events directly to Google Calendar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">Send a message to Support</h2>
              <p className="text-xs text-slate-500">Fill in the details below and our administrator will respond to your email.</p>
            </div>

            {submittedMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">Message Sent Successfully!</span>
                  <p className="mt-0.5">{submittedMessage}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-name-input"
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email-input"
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Inquiry Type</label>
                <input
                  id="contact-subject-input"
                  type="text"
                  placeholder="e.g. Itinerary Question, Google Calendar Sync, Feedback"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message-input"
                  rows={5}
                  required
                  placeholder="Tell us what you're thinking or how we can assist your travel journey..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <button
                id="contact-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Routing to Support...' : 'Submit Support Request'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

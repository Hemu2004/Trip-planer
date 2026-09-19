import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Loader2,
  X,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { TripPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  listGoogleCalendarEvents,
  syncEntireTripToCalendar,
  deleteGoogleCalendarEvent,
  GoogleCalendarEvent,
} from '../lib/googleCalendar';

interface GoogleCalendarSyncModalProps {
  trip: TripPlan;
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  trip,
  isOpen,
  onClose,
}) => {
  const { user, googleAccessToken, connectCalendar, isAuthenticated } = useAuth();

  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; item: string }>({
    current: 0,
    total: 0,
    item: '',
  });
  const [syncedEvents, setSyncedEvents] = useState<GoogleCalendarEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive Action Confirmation Modal state (Mandatory per Workspace Skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // Load calendar events for this trip when modal opens
  useEffect(() => {
    if (isOpen && googleAccessToken) {
      loadTripEvents(googleAccessToken);
    }
  }, [isOpen, googleAccessToken, trip.id]);

  const loadTripEvents = async (token: string) => {
    setIsLoadingEvents(true);
    setStatusMessage(null);
    try {
      // Fetch calendar events
      const events = await listGoogleCalendarEvents(token);
      // Filter to events that belong to this trip or contain trip destination & source
      const filtered = events.filter((ev) => {
        const tripProp = ev.extendedProperties?.private?.tripId;
        if (tripProp && tripProp === trip.id) return true;
        const summary = ev.summary || '';
        const desc = ev.description || '';
        return (
          summary.includes(trip.destination) ||
          desc.includes(trip.title) ||
          (desc.includes('Planned with AI Trip Planner') && summary.includes(trip.destination))
        );
      });
      setSyncedEvents(filtered);
    } catch (err: any) {
      console.warn('Could not load existing Google Calendar events:', err);
      // If unauthorized, token may need refresh
      if (err?.message?.includes('401') || err?.message?.includes('403')) {
        setStatusMessage({
          type: 'info',
          text: 'Google Calendar session expired. Click "Connect Google Calendar" to grant fresh access.',
        });
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleConnectAndSync = async () => {
    setStatusMessage(null);
    setIsSyncing(true);

    try {
      let token = googleAccessToken;
      if (!token) {
        token = await connectCalendar();
      }

      if (!token) {
        throw new Error('Could not acquire Google Calendar access token.');
      }

      const totalSlots = trip.itinerary.reduce((acc, d) => acc + d.slots.length, 0);
      setSyncProgress({ current: 0, total: totalSlots, item: 'Preparing itinerary events...' });

      const result = await syncEntireTripToCalendar(token, trip, (completed, total, item) => {
        setSyncProgress({ current: completed, total, item });
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully synced ${result.totalCreated} itinerary activities directly into your Google Calendar!`,
      });

      // Reload events to display
      await loadTripEvents(token);
    } catch (err: any) {
      console.error('Calendar sync failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to sync itinerary to Google Calendar. Please try again.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger confirmation dialog before deleting an event (Mandatory Workspace pattern)
  const promptDeleteSingleEvent = (event: GoogleCalendarEvent) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Calendar Event?',
      description: `Are you sure you want to delete "${event.summary}" from your Google Calendar? This action cannot be undone.`,
      actionLabel: 'Delete Event',
      onConfirm: async () => {
        let token = googleAccessToken;
        if (!token) {
          token = await connectCalendar();
        }
        await deleteGoogleCalendarEvent(token, event.id);
        setSyncedEvents((prev) => prev.filter((e) => e.id !== event.id));
        setStatusMessage({
          type: 'success',
          text: `Deleted "${event.summary}" from Google Calendar.`,
        });
      },
    });
  };

  // Trigger confirmation dialog before deleting all trip events
  const promptClearAllTripEvents = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete all ${syncedEvents.length} trip events?`,
      description: `This will permanently delete all ${syncedEvents.length} scheduled itinerary events for "${trip.title}" from your primary Google Calendar. Are you sure?`,
      actionLabel: 'Delete All Events',
      onConfirm: async () => {
        let token = googleAccessToken;
        if (!token) {
          token = await connectCalendar();
        }
        for (const ev of syncedEvents) {
          try {
            await deleteGoogleCalendarEvent(token, ev.id);
          } catch (e) {
            console.warn('Failed deleting single event:', ev.id, e);
          }
        }
        setSyncedEvents([]);
        setStatusMessage({
          type: 'success',
          text: 'Cleared all trip events from your Google Calendar.',
        });
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Google Calendar Sync
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Sync & manage scheduled activities for <span className="font-semibold text-slate-700">{trip.destination}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* Sync Overview Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 to-indigo-50/40 border border-sky-100/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Trip Itinerary Schedule</h3>
                <p className="text-[11px] text-slate-500">
                  {trip.itinerary.length} Days &bull; {trip.itinerary.reduce((sum, d) => sum + d.slots.length, 0)} Total Activities
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://calendar.google.com/calendar/u/0/r"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Open Google Calendar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Sync Progress Indicator */}
            {isSyncing && (
              <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    Syncing: {syncProgress.item}
                  </span>
                  <span>
                    {syncProgress.current} / {syncProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        syncProgress.total > 0
                          ? Math.min(100, Math.round((syncProgress.current / syncProgress.total) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sync Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleConnectAndSync}
                disabled={isSyncing}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing Itinerary to Google Calendar...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sync Entire Itinerary to Google Calendar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Currently Synced Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Events on Google Calendar ({syncedEvents.length})
              </h3>
              {syncedEvents.length > 0 && (
                <button
                  type="button"
                  onClick={promptClearAllTripEvents}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All Trip Events</span>
                </button>
              )}
            </div>

            {isLoadingEvents ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                <span className="text-slate-500 font-medium">Checking Google Calendar...</span>
              </div>
            ) : syncedEvents.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                <p className="font-semibold">No synced events found for this trip yet.</p>
                <p className="text-[11px] text-slate-400">
                  Click "Sync Entire Itinerary to Google Calendar" above to add all morning, afternoon, and evening plans.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {syncedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-slate-900 truncate text-xs">{event.summary}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {event.start.dateTime
                            ? new Date(event.start.dateTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : event.start.date || 'Scheduled'}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="View on Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => promptDeleteSingleEvent(event)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete from Google Calendar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Connected as: <span className="font-semibold text-slate-700">{user?.email || 'Google Traveler'}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for mutating Google Workspace data */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500">Google Calendar Modification</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.description}</p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isConfirmingAction}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmingAction}
                onClick={async () => {
                  setIsConfirmingAction(true);
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setIsConfirmingAction(false);
                    setConfirmDialog(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isConfirmingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmDialog.actionLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Inbox,
  Send,
  UserCheck,
  Users,
  MapPin,
  Database,
  Cpu,
  Compass,
  Plus,
  Sliders,
  Globe,
  Layers,
  Sparkles,
  Check,
  X,
  Phone,
} from 'lucide-react';
import { ContactMessageRecord, NavigationPage, MapLocationItem } from '../types';
import {
  getContactMessagesForAdmin,
  updateContactMessageStatus,
  deleteContactMessage,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PHONE,
} from '../firebase';
import { useAuth } from '../context/AuthContext';

interface AdminSupportPageProps {
  onNavigate: (page: NavigationPage) => void;
}

type AdminTab = 'inbox' | 'users' | 'destinations' | 'datasources' | 'ai-settings' | 'trips';

export const AdminSupportPage: React.FC<AdminSupportPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('inbox');

  // Support Inbox State
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRecord | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');

  // Destinations & Places State
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [placesList, setPlacesList] = useState<MapLocationItem[]>([]);
  const [selectedDestKey, setSelectedDestKey] = useState<string>('all');
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [newDestForm, setNewDestForm] = useState({
    name: '',
    country: '',
    tagline: '',
    typicalDuration: '5-7 Days',
    estimatedBudget: '$1,200 - $2,500',
    tags: 'Trending, Cultural',
  });
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [newPlaceForm, setNewPlaceForm] = useState({
    destination: 'bali',
    name: '',
    category: 'attraction' as const,
    address: '',
    priceLevel: '$$' as const,
    description: '',
  });

  // Data Sources State
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

  // AI & RAG Settings State
  const [aiSettings, setAiSettings] = useState<any>({
    activeModel: 'gemini-2.5-flash',
    temperature: 0.7,
    searchGroundingEnabled: true,
    ragGroundingEnabled: true,
    maxOutputTokens: 8192,
    ragTopK: 4,
    systemInstructions: 'You are an elite, highly knowledgeable global travel curator and holiday planning engine.',
  });
  const [isSavingAISettings, setIsSavingAISettings] = useState(false);

  // Trips Oversight State
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  // Helper: admin headers
  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-email': user?.email || SUPER_ADMIN_EMAIL,
  });

  // Load Inquiries
  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const records = await getContactMessagesForAdmin();
      setMessages(records);
      if (records.length > 0 && !selectedMessage) {
        setSelectedMessage(records[0]);
      }
    } catch (err: any) {
      setMessagesError(err?.message || 'Failed to load support inquiries.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.users) setUsersList(data.users);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load Destinations & Places
  const fetchDestinationsAndPlaces = async () => {
    try {
      const destRes = await fetch('/api/destinations');
      const destData = await destRes.json();
      if (destData.destinations) setDestinationsList(destData.destinations);

      const placesRes = await fetch('/api/places?destination=bali');
      const placesData = await placesRes.json();
      if (placesData.places) setPlacesList(placesData.places);
    } catch (err) {
      console.warn('Failed to load destinations/places:', err);
    }
  };

  // Load Data Sources
  const fetchDataSources = async () => {
    try {
      const res = await fetch('/api/admin/data-sources', { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.dataSources) setDataSources(data.dataSources);
    } catch (err) {
      console.warn('Failed to load data sources:', err);
    }
  };

  // Load AI Settings
  const fetchAISettings = async () => {
    try {
      const res = await fetch('/api/admin/ai-settings', { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.settings) setAiSettings(data.settings);
    } catch (err) {
      console.warn('Failed to load AI settings:', err);
    }
  };

  // Load Trips
  const fetchTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const res = await fetch('/api/admin/trips', { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.trips) setTripsList(data.trips);
    } catch (err) {
      console.warn('Failed to load trips:', err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
      fetchUsers();
      fetchDestinationsAndPlaces();
      fetchDataSources();
      fetchAISettings();
      fetchTrips();
    }
  }, [isAdmin]);

  // Support message handlers
  const handleStatusToggle = async (messageId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
    try {
      await updateContactMessageStatus(messageId, nextStatus);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: nextStatus } : m))
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      setActionSuccess(`Message marked as ${nextStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setMessagesError('Could not update status: ' + (err.message || 'unknown error'));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteContactMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      setConfirmDeleteId(null);
      setActionSuccess('Message deleted successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setMessagesError('Could not delete message: ' + (err.message || 'unknown error'));
      setConfirmDeleteId(null);
    }
  };

  // User management handlers
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsersList((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        setActionSuccess(`User status updated to ${data.user.status}`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else if (data.error) {
        setMessagesError(data.error);
        setTimeout(() => setMessagesError(null), 4000);
      }
    } catch (err: any) {
      setMessagesError('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setActionSuccess('User account removed');
        setTimeout(() => setActionSuccess(null), 3000);
      } else if (data.error) {
        setMessagesError(data.error);
        setTimeout(() => setMessagesError(null), 4000);
      }
    } catch (err: any) {
      setMessagesError('Failed to remove user account');
    }
  };

  // Destination handlers
  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestForm.name || !newDestForm.country) return;

    try {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          ...newDestForm,
          tags: newDestForm.tags.split(',').map((t) => t.trim()),
        }),
      });
      const data = await res.json();
      if (data.success && data.destination) {
        setDestinationsList((prev) => [data.destination, ...prev]);
        setIsAddingDestination(false);
        setNewDestForm({
          name: '',
          country: '',
          tagline: '',
          typicalDuration: '5-7 Days',
          estimatedBudget: '$1,200 - $2,500',
          tags: 'Trending, Cultural',
        });
        setActionSuccess(`Destination "${data.destination.name}" added to catalog.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to create destination');
    }
  };

  const handleDeleteDestination = async (id: string) => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDestinationsList((prev) => prev.filter((d) => d.id !== id));
        setActionSuccess(`Destination removed.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to delete destination');
    }
  };

  // Place handlers
  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceForm.name) return;

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(newPlaceForm),
      });
      const data = await res.json();
      if (data.success && data.place) {
        setPlacesList((prev) => [data.place, ...prev]);
        setIsAddingPlace(false);
        setNewPlaceForm({
          destination: 'bali',
          name: '',
          category: 'attraction',
          address: '',
          priceLevel: '$$',
          description: '',
        });
        setActionSuccess(`Place "${data.place.name}" added.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to create place');
    }
  };

  const handleDeletePlace = async (id: string) => {
    try {
      const res = await fetch(`/api/places/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPlacesList((prev) => prev.filter((p) => p.id !== id));
        setActionSuccess('Place entry removed.');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to delete place');
    }
  };

  // Data source sync
  const handleSyncDataSource = async (sourceId: string) => {
    setSyncingSourceId(sourceId);
    try {
      const res = await fetch(`/api/admin/data-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && data.dataSource) {
        setDataSources((prev) =>
          prev.map((ds) => (ds.id === sourceId ? data.dataSource : ds))
        );
        setActionSuccess(data.message || 'Data source synced successfully');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Sync failed for selected source');
    } finally {
      setSyncingSourceId(null);
    }
  };

  // Save AI Settings
  const handleSaveAISettings = async () => {
    setIsSavingAISettings(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(aiSettings),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('AI and RAG configuration saved.');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to save AI configuration');
    } finally {
      setIsSavingAISettings(false);
    }
  };

  // Delete Platform Trip
  const handleDeleteTrip = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/trips/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTripsList((prev) => prev.filter((t) => t.id !== id));
        setActionSuccess('Trip record removed.');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setMessagesError('Failed to delete trip');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This portal is reserved for the designated Trip Planner Super Administrator: {SUPER_ADMIN_EMAIL}.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === 'new' && m.status === 'resolved') return false;
    if (filter === 'resolved' && m.status !== 'resolved') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredUsers = usersList.filter((u) => {
    if (!usersSearch.trim()) return true;
    const q = usersSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const newCount = messages.filter((m) => m.status !== 'resolved').length;
  const resolvedCount = messages.filter((m) => m.status === 'resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Super Admin Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-indigo-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Super Admin Console
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Full Platform Authorization
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform & Data Administration
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-300" />
                <span className="font-semibold text-white">{SUPER_ADMIN_EMAIL}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-emerald-300">{SUPER_ADMIN_PHONE}</span>
              </div>
              <span className="text-slate-400">• High-Privilege Account</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('knowledge-base')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Database className="w-4 h-4 text-indigo-200" />
              <span>Knowledge Base (RAG)</span>
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 backdrop-blur-xs"
            >
              <Compass className="w-4 h-4 text-sky-300" />
              <span>AI Trip Planner</span>
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-slate-700/60 flex flex-wrap gap-2">
          {[
            { id: 'inbox', label: 'Support Inquiries', count: newCount, icon: Inbox },
            { id: 'users', label: 'User Accounts', count: usersList.length, icon: Users },
            { id: 'destinations', label: 'Destinations & Places', count: destinationsList.length, icon: MapPin },
            { id: 'datasources', label: 'Data Feeds & Sync', count: dataSources.length, icon: Database },
            { id: 'ai-settings', label: 'AI & Grounding', icon: Cpu },
            { id: 'trips', label: 'Platform Trips', count: tripsList.length, icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {messagesError && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{messagesError}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 1: SUPPORT INQUIRIES INBOX             */}
      {/* ========================================== */}
      {activeTab === 'inbox' && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900">{messages.length}</span>
                <p className="text-xs text-slate-500">Total Inquiries Received</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-amber-600">{newCount}</span>
                <p className="text-xs text-slate-500">Awaiting Response</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-emerald-600">{resolvedCount}</span>
                <p className="text-xs text-slate-500">Resolved Inquiries</p>
              </div>
            </div>
          </div>

          {/* Main Support Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Side: Message List */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search traveler name, email, subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    onClick={() => setFilter('new')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filter === 'new'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Active ({newCount})
                  </button>
                  <button
                    onClick={() => setFilter('resolved')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filter === 'resolved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Resolved ({resolvedCount})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400" />
                    <p>Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <Mail className="w-8 h-8 mx-auto text-slate-300" />
                    <p>No inquiries found in this view.</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    const isResolved = msg.status === 'resolved';

                    return (
                      <button
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`w-full text-left p-4 transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-sky-50/80 border-l-4 border-sky-600'
                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {msg.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {msg.subject}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {msg.email}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isResolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side: Message Detail */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col h-[650px] overflow-hidden">
              {selectedMessage ? (
                <div className="flex flex-col h-full space-y-6">
                  <div className="border-b border-slate-100 pb-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                          {selectedMessage.subject}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Received on{' '}
                          {new Date(selectedMessage.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleStatusToggle(selectedMessage.id, selectedMessage.status)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedMessage.status === 'resolved'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {selectedMessage.status === 'resolved' ? 'Mark Active' : 'Mark Resolved'}
                          </span>
                        </button>

                        {confirmDeleteId === selectedMessage.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteMessage(selectedMessage.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(selectedMessage.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                          <span>{selectedMessage.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {selectedMessage.email}
                        </div>
                      </div>

                      <a
                        href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                          'Re: ' + selectedMessage.subject
                        )}&body=${encodeURIComponent(
                          `Hi ${selectedMessage.name},\n\nThank you for reaching out to Trip Planner Support.\n\nRegarding your inquiry:\n"${selectedMessage.message.slice(
                            0,
                            200
                          )}..."\n\n`
                        )}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply via Email</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Message Content
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Ticket ID: {selectedMessage.id}</span>
                    <span>Direct Admin Mailbox Routing Active</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">No message selected</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Select an inquiry from the left to read its contents and reply.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: USER MANAGEMENT                    */}
      {/* ========================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Accounts & Role Management</h2>
              <p className="text-xs text-slate-500">
                Inspect registered platform accounts, account status, and roles. The Super Admin account is permanently protected.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name, email, phone..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trips</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => {
                  const isSuper = u.role === 'super_admin' || u.email === SUPER_ADMIN_EMAIL;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuper ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-indigo-600" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            Standard User
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {u.tripsCount || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuper ? (
                          <span className="text-[10px] font-semibold text-indigo-600 italic">
                            Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                            >
                              {u.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: DESTINATIONS & PLACES               */}
      {/* ========================================== */}
      {activeTab === 'destinations' && (
        <div className="space-y-6">
          {/* Destinations Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Curated Destinations Catalog</h2>
                <p className="text-xs text-slate-500">
                  Manage primary featured travel hubs available in the Explore view and AI Planner.
                </p>
              </div>
              <button
                onClick={() => setIsAddingDestination(!isAddingDestination)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingDestination ? 'Cancel' : 'Add Destination'}</span>
              </button>
            </div>

            {/* Add Destination Form */}
            {isAddingDestination && (
              <form onSubmit={handleCreateDestination} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Destination Specification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Destination Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Barcelona"
                      value={newDestForm.name}
                      onChange={(e) => setNewDestForm({ ...newDestForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Country</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Spain"
                      value={newDestForm.country}
                      onChange={(e) => setNewDestForm({ ...newDestForm, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Duration Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. 4-6 Days"
                      value={newDestForm.typicalDuration}
                      onChange={(e) => setNewDestForm({ ...newDestForm, typicalDuration: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Budget</label>
                    <input
                      type="text"
                      placeholder="e.g. $1,400 - $2,800"
                      value={newDestForm.estimatedBudget}
                      onChange={(e) => setNewDestForm({ ...newDestForm, estimatedBudget: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tagline & Summary</label>
                  <input
                    type="text"
                    placeholder="Short engaging description"
                    value={newDestForm.tagline}
                    onChange={(e) => setNewDestForm({ ...newDestForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingDestination(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Save Destination
                  </button>
                </div>
              </form>
            )}

            {/* Destinations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinationsList.map((d) => (
                <div key={d.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                      <span className="text-xs text-slate-500 font-medium">{d.country}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{d.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {d.typicalDuration}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {d.estimatedBudget}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {d.id}</span>
                    <button
                      onClick={() => handleDeleteDestination(d.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Places, Hotels & Attractions Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Curated Places, Hotels & Gastronomy</h2>
                <p className="text-xs text-slate-500">
                  Geo-referenced points of interest, accommodations, and restaurants.
                </p>
              </div>
              <button
                onClick={() => setIsAddingPlace(!isAddingPlace)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingPlace ? 'Cancel' : 'Add Place'}</span>
              </button>
            </div>

            {/* Add Place Form */}
            {isAddingPlace && (
              <form onSubmit={handleCreatePlace} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Place Specification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Place Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunset Sanctuary Hotel"
                      value={newPlaceForm.name}
                      onChange={(e) => setNewPlaceForm({ ...newPlaceForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={newPlaceForm.category}
                      onChange={(e) => setNewPlaceForm({ ...newPlaceForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="hotel">Hotel / Stay</option>
                      <option value="restaurant">Restaurant / Dining</option>
                      <option value="attraction">Attraction / Culture</option>
                      <option value="beach">Beach / Nature</option>
                      <option value="activity">Activity / Tour</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Destination Key</label>
                    <input
                      type="text"
                      placeholder="bali, paris, tokyo, rome..."
                      value={newPlaceForm.destination}
                      onChange={(e) => setNewPlaceForm({ ...newPlaceForm, destination: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Address / Street</label>
                  <input
                    type="text"
                    placeholder="e.g. Jalan Pantai Batu Bolong No. 12"
                    value={newPlaceForm.address}
                    onChange={(e) => setNewPlaceForm({ ...newPlaceForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPlace(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Save Place
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {placesList.slice(0, 12).map((place) => (
                <div key={place.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">{place.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase shrink-0">
                      {place.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{place.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>{place.priceLevel} • ★ {place.rating}</span>
                    <button
                      onClick={() => handleDeletePlace(place.id)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: DATA FEEDS & SYNC                   */}
      {/* ========================================== */}
      {activeTab === 'datasources' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application Data Sources & Feeds</h2>
            <p className="text-xs text-slate-500">
              Real-time connectivity monitoring and on-demand synchronization for vector stores, places directories, and weather feeds.
            </p>
          </div>

          <div className="space-y-4">
            {dataSources.map((ds) => (
              <div key={ds.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{ds.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {ds.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{ds.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Type: {ds.type}</span>
                    <span>Items Count: {ds.itemsCount}</span>
                    <span>Last Sync: {new Date(ds.lastSync).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSyncDataSource(ds.id)}
                  disabled={syncingSourceId === ds.id}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSourceId === ds.id ? 'animate-spin' : ''}`} />
                  <span>{syncingSourceId === ds.id ? 'Syncing...' : 'Sync Feed'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: AI & GROUNDING SETTINGS             */}
      {/* ========================================== */}
      {activeTab === 'ai-settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Gemini AI Model & Grounding Engine</h2>
            <p className="text-xs text-slate-500">
              Configure parameters, retrieval depth, and grounding pipelines for the AI Trip Planner and Concierge.
            </p>
          </div>

          <div className="space-y-5 max-w-3xl">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Active Intelligence Model</label>
              <input
                type="text"
                disabled
                value={aiSettings.activeModel || 'gemini-2.5-flash'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Primary model optimized for sub-second holiday plan generation and real-time chat.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Creativity / Temperature</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{aiSettings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={aiSettings.temperature}
                onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">RAG Document Grounding</p>
                  <p className="text-[11px] text-slate-500">Inject Knowledge Base files into prompts</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiSettings.ragGroundingEnabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, ragGroundingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Google Search Grounding</p>
                  <p className="text-[11px] text-slate-500">Real-time web verification for places</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiSettings.searchGroundingEnabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, searchGroundingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">RAG Top-K Document Snippets</label>
              <input
                type="number"
                min="1"
                max="10"
                value={aiSettings.ragTopK || 4}
                onChange={(e) => setAiSettings({ ...aiSettings, ragTopK: parseInt(e.target.value) || 4 })}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Curator System Instructions</label>
              <textarea
                rows={3}
                value={aiSettings.systemInstructions}
                onChange={(e) => setAiSettings({ ...aiSettings, systemInstructions: e.target.value })}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              onClick={handleSaveAISettings}
              disabled={isSavingAISettings}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingAISettings ? 'Saving...' : 'Save AI Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: PLATFORM TRIPS OVERSIGHT            */}
      {/* ========================================== */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Platform Itineraries Oversight</h2>
              <p className="text-xs text-slate-500">
                Audit and oversee all user-generated itineraries across the Trip Planner ecosystem.
              </p>
            </div>
            <button
              onClick={fetchTrips}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTrips ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Trip Title & Destination</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Duration & Party</th>
                  <th className="py-3 px-4">Est. Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tripsList.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{trip.title}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        {trip.destination}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {trip.userEmail}
                    </td>
                    <td className="py-3.5 px-4">
                      {trip.durationDays} Days • {trip.travelers} Traveler(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${trip.totalEstimated} {trip.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold">
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete trip record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

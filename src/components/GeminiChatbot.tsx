import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  Search,
  Zap,
  Compass,
  Building2,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Check,
  Copy,
  ChevronDown,
  Globe,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, ChatbotRole, GroundingSource } from '../types';

interface GeminiChatbotProps {
  currentPlan?: any;
  destinationName?: string;
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onApplyPlanSuggestion?: (suggestion: string) => void;
  onNavigateToPlan?: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentPlan,
  destinationName,
  isFloating = false,
  isOpen = true,
  onClose,
  onApplyPlanSuggestion,
  onNavigateToPlan,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('concierge');
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeDestination = currentPlan?.destination || destinationName || 'your holiday';

  // Multi-turn conversation state with rich welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      role: 'concierge',
      modelUsed: 'gemini-3.8-flash',
      content: `Welcome! I'm your Gemini AI Travel Concierge. I can provide real-time recommendations, check live opening hours using Google Search Grounding, and adjust your ${activeDestination} itinerary. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundingSources: [
        {
          title: 'Official Google Travel Grounding',
          url: 'https://www.google.com/travel',
        },
      ],
      groundingSearchQueries: [`${activeDestination} top attractions and opening hours`],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Update welcome if destination changes and chat is fresh
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome-1' && activeDestination) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          role: selectedRole,
          modelUsed: selectedRole === 'local_advisor' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash',
          content: `Hello! I'm your AI Travel Concierge for ${activeDestination}. Ask me anything about live opening hours, hidden restaurants, weather backup plans, or transit hacks.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeDestination, selectedRole]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation thread
    const newThread = [...messages, userMessage];
    setMessages(newThread);
    setInputMessage('');
    setIsSending(true);

    try {
      // Call backend Gemini API endpoint
      const response = await fetch('/api/trip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan,
          message: textToSend.trim(),
          chatHistory: newThread.map((m) => ({
            sender: m.sender,
            content: m.content,
          })),
          role: selectedRole,
          useGoogleSearch,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: 'gemini-' + Date.now(),
        sender: 'assistant',
        content: data.reply || "I've reviewed your request! What else would you like to explore?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        role: data.role || selectedRole,
        modelUsed: data.modelUsed,
        groundingSources: data.groundingSources || [],
        groundingSearchQueries: data.groundingSearchQueries || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        content: `I recommend checking live timings for ${activeDestination} directly with venue websites. You can also explore local bistros 2-3 blocks off the main tourist streets for an authentic culinary experience!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        role: selectedRole,
        modelUsed: 'local-fallback',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        role: selectedRole,
        modelUsed: selectedRole === 'local_advisor' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash',
        content: `New conversation started with ${
          selectedRole === 'concierge'
            ? 'Holiday Concierge'
            : selectedRole === 'local_advisor'
            ? 'Local Flash Advisor'
            : 'Master Itinerary Architect'
        } for ${activeDestination}. What would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const roleInfo = {
    concierge: {
      name: 'Holiday Concierge',
      model: 'gemini-3.8-flash',
      icon: Compass,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      badge: 'Search Grounded',
      desc: 'Live tourist info, opening hours, local culture & restaurant tips.',
    },
    local_advisor: {
      name: 'Fast Local Advisor',
      model: 'gemini-3.1-flash-lite',
      icon: Zap,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'High Speed',
      desc: 'Fast slang, transit hacks, tipping rules, and quick questions.',
    },
    master_architect: {
      name: 'Itinerary Architect',
      model: 'gemini-3.8-flash',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badge: 'Deep Logistics',
      desc: 'Complex multi-day sequencing, budget trade-offs & group pacing.',
    },
  };

  if (!isOpen && isFloating) {
    return null;
  }

  const containerClasses = isFloating
    ? `fixed bottom-6 right-6 z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col transition-all duration-300 ${
        isExpanded
          ? 'w-[92vw] sm:w-[600px] h-[82vh] max-h-[750px]'
          : 'w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
      }`
    : 'bg-white rounded-3xl shadow-sm border border-slate-200/90 flex flex-col h-[650px] w-full';

  return (
    <div className={containerClasses}>
      {/* 1. HEADER & ROLE SELECTOR */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/80 rounded-t-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">Gemini Travel Concierge</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {activeDestination}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Clear button */}
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Minimize if floating */}
            {isFloating && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Close if floating */}
            {isFloating && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Role Switcher Pills */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 rounded-xl text-xs">
          {(['concierge', 'local_advisor', 'master_architect'] as ChatbotRole[]).map((r) => {
            const isSelected = selectedRole === r;
            const rData = roleInfo[r];
            const Icon = rData.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                title={rData.desc}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-[11px]">{rData.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Feature status bar: Model & Google Search Grounding toggle */}
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Model: <strong className="text-slate-700">{roleInfo[selectedRole].model}</strong></span>
          </div>

          {selectedRole === 'concierge' && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-700 select-none">
              <input
                type="checkbox"
                checked={useGoogleSearch}
                onChange={(e) => setUseGoogleSearch(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-3 h-3"
              />
              <span className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold">
                <Globe className="w-3 h-3" />
                Google Search Data
              </span>
            </label>
          )}
        </div>
      </div>

      {/* 2. SCROLLABLE MESSAGE THREAD */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              {/* Sender label and avatar */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3 text-slate-500" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-sky-600" />
                    <span className="font-semibold text-slate-700">Gemini</span>
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded text-[9px]">
                        {msg.modelUsed}
                      </span>
                    )}
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Google Search Grounding Sources */}
                {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                      <Globe className="w-3 h-3" />
                      <span>Verified with Google Search Data</span>
                    </div>

                    {msg.groundingSearchQueries && msg.groundingSearchQueries.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {msg.groundingSearchQueries.map((q, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] flex items-center gap-1"
                          >
                            <Search className="w-2.5 h-2.5 text-slate-400" />
                            {q}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-medium border border-sky-200/60 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                          <span className="truncate max-w-[180px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy button */}
                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs max-w-[80%]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {selectedRole === 'concierge' && useGoogleSearch
                ? 'Grounding live travel facts with Google Search...'
                : selectedRole === 'local_advisor'
                ? 'Flash Advisor replying...'
                : 'Architect optimizing itinerary...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK INSPIRATION PROMPTS */}
      <div className="px-3 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-slate-400 font-bold shrink-0">Ask:</span>
        <button
          onClick={() => handleQuickPrompt(`What are the real opening hours and admission fees for top sights in ${activeDestination}?`)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
        >
          🔍 Live opening hours
        </button>
        <button
          onClick={() => handleQuickPrompt(`What are the best authentic local dining spots off the tourist path in ${activeDestination}?`)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
        >
          🍜 Hidden local food
        </button>
        <button
          onClick={() => handleQuickPrompt(`What indoor activities or backup plans are best if it rains in ${activeDestination}?`)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
        >
          🌧️ Rainy day alternatives
        </button>
        <button
          onClick={() => handleQuickPrompt(`What are essential local etiquette rules, scams to avoid, and tipping customs for ${activeDestination}?`)}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
        >
          💡 Etiquette & scams
        </button>
      </div>

      {/* 4. INPUT FIELD */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-100 rounded-b-3xl flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={
            selectedRole === 'local_advisor'
              ? 'Ask for rapid transit hacks, street food, slang...'
              : selectedRole === 'master_architect'
              ? 'Ask to optimize days, balance budget, reduce transit...'
              : `Ask anything about ${activeDestination} (live Google Search grounded)...`
          }
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isSending}
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50"
        />

        <button
          type="submit"
          disabled={isSending || !inputMessage.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm flex items-center justify-center shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

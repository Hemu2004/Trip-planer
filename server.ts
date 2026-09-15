import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Curated fallback planner will be used.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'Trip Planner API',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Contact endpoint
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  console.log(`[Contact Form Received] From: ${name} <${email}> | Subject: ${subject || 'General Inquiry'}`);
  console.log(`[Message]: ${message}`);

  return res.json({
    success: true,
    message: 'Thank you for reaching out to Trip Planner! Our team has received your message and will respond within 24 hours.',
    receivedAt: new Date().toISOString(),
  });
});

// Fallback plan generator for offline or missing-key scenarios
function generateFallbackPlan(params: any) {
  const {
    destination = 'Paris, France',
    startingLocation = 'New York',
    startDate = '2026-10-01',
    endDate = '2026-10-05',
    travelers = 2,
    budgetTier = 'moderate',
    pacing = 'balanced',
    interests = ['Culture & History', 'Food & Dining'],
  } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.min(10, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 4));

  const multiplier = budgetTier === 'budget' ? 0.6 : budgetTier === 'luxury' ? 2.5 : 1.0;
  const baseDailyPerPerson = 120 * multiplier;
  const dailyAverage = Math.round(baseDailyPerPerson * travelers);
  const totalEstimated = dailyAverage * calculatedDays;

  return {
    id: 'plan-' + Date.now(),
    createdAt: new Date().toISOString(),
    title: `${calculatedDays}-Day ${pacing.charAt(0).toUpperCase() + pacing.slice(1)} Holiday in ${destination}`,
    destination,
    startingLocation,
    startDate,
    endDate,
    durationDays: calculatedDays,
    travelers,
    pacing,
    budgetTier,
    summary: `A carefully tailored ${calculatedDays}-day escape to ${destination} designed for ${travelers} traveler(s) focusing on ${interests.join(', ') || 'local exploration'}. Enjoy a harmonious mix of iconic cultural milestones, scenic strolls, culinary spots, and leisure time.`,
    budget: {
      totalEstimated,
      dailyAverage,
      currency: 'USD',
      categories: {
        accommodation: Math.round(totalEstimated * 0.42),
        foodAndDining: Math.round(totalEstimated * 0.28),
        activitiesAndSights: Math.round(totalEstimated * 0.16),
        localTransit: Math.round(totalEstimated * 0.08),
        miscellaneous: Math.round(totalEstimated * 0.06),
      },
    },
    suggestedPlaces: [
      {
        id: 'place-1',
        name: `Historic Landmark Quarter`,
        category: 'Sightseeing & Heritage',
        description: `Stroll through the oldest cobblestone alleys of ${destination}, discovering iconic monuments, lively squares, and artisanal boutiques.`,
        estimatedCost: '$15 - $25 entry',
        bestTimeToVisit: 'Morning (09:00 - 11:30 AM)',
        rating: 4.9,
        tags: ['Iconic', 'Culture', 'Photography'],
      },
      {
        id: 'place-2',
        name: `Panoramic Viewpoint & Gardens`,
        category: 'Scenic & Nature',
        description: `Breathtaking 360-degree vistas over ${destination} surrounded by manicured floral pathways, tranquil fountains, and cozy coffee kiosks.`,
        estimatedCost: 'Free - $8 entry',
        bestTimeToVisit: 'Golden Hour (05:00 - 07:00 PM)',
        rating: 4.8,
        tags: ['Scenic Views', 'Sunset', 'Relaxing'],
      },
      {
        id: 'place-3',
        name: `Artisanal Food Market & Hall`,
        category: 'Culinary & Local Life',
        description: `Indulge in fresh regional specialties, cheese boards, fresh pastries, and authentic coffee at this vibrant local culinary destination.`,
        estimatedCost: '$20 - $35 per meal',
        bestTimeToVisit: 'Lunchtime (12:30 - 02:00 PM)',
        rating: 4.7,
        tags: ['Foodie', 'Local Flavors', 'Market'],
      },
      {
        id: 'place-4',
        name: `Modern Art & Cultural Center`,
        category: 'Museum & Art',
        description: `World-class exhibitions showcasing contemporary artists, architecture installations, and interactive digital experiences.`,
        estimatedCost: '$18 ticket',
        bestTimeToVisit: 'Mid-afternoon (02:30 - 04:30 PM)',
        rating: 4.8,
        tags: ['Art', 'Indoor', 'Architecture'],
      },
    ],
    suggestedActivities: [
      {
        id: 'act-1',
        title: 'Guided Neighborhood Walking Tour',
        category: 'Walking & History',
        description: 'Discover insider legends and hidden courtyards with an informative local historian.',
        duration: '2.5 hours',
        cost: '$28 per person',
      },
      {
        id: 'act-2',
        title: 'Sunset River or Harbor Cruise',
        category: 'Leisure & Romantic',
        description: 'Watch the twilight skyline glow while enjoying regional refreshments and gentle breezes.',
        duration: '1.5 hours',
        cost: '$35 per person',
      },
      {
        id: 'act-3',
        title: 'Cooking Masterclass or Wine Tasting',
        category: 'Gastronomy',
        description: 'Hands-on culinary session learning regional recipe secrets from seasoned chefs.',
        duration: '3 hours',
        cost: '$65 per person',
      },
    ],
    itinerary: Array.from({ length: calculatedDays }).map((_, index) => {
      const dayNum = index + 1;
      return {
        day: dayNum,
        theme:
          dayNum === 1
            ? 'Arrival & Heart of the City'
            : dayNum === 2
            ? 'Art, Architecture & Scenic Panoramas'
            : dayNum === 3
            ? 'Culinary Exploration & Vibrant Neighborhoods'
            : dayNum === 4
            ? 'Hidden Gems, Green Parks & Night Skyline'
            : `Day ${dayNum}: Relaxed Discovery & Local Gems`,
        slots: [
          {
            timeOfDay: 'Morning' as const,
            title: dayNum === 1 ? 'Check-in & Historic Plaza Walk' : 'Iconic Landmark & Morning Café',
            place: `${destination} Central Quarter`,
            description: `Begin the day with fresh espresso and pastries, then explore primary architectural landmarks before crowds gather.`,
            estimatedCost: `$15 per person`,
            transitTip: 'Comfortable walking shoes or 1 metro stop.',
          },
          {
            timeOfDay: 'Afternoon' as const,
            title: 'Cultural Immersion & Local Food Hall',
            place: `${destination} Arts & Heritage District`,
            description: `Browse museum highlights followed by lunch featuring seasonal local specialties.`,
            estimatedCost: `$30 per person`,
            transitTip: 'Short tram ride or 10-minute stroll.',
          },
          {
            timeOfDay: 'Evening' as const,
            title: 'Sunset Vista & Candlelit Dinner',
            place: `${destination} Scenic Waterfront / Hilltop`,
            description: `Take in the skyline sunset, followed by a relaxing dinner at a charming bistro with local music.`,
            estimatedCost: `$45 per person`,
            transitTip: 'Rideshare or evening leisure walk.',
          },
        ],
        dailyTip:
          dayNum === 1
            ? 'Pick up a multi-day transit pass at the station to save 30% on travel.'
            : 'Pre-book museum time slots online to skip the peak waiting lines.',
        mealSuggestion: 'Try the traditional slow-cooked specialty paired with locally produced regional beverages.',
        estimatedDayCost: Math.round(dailyAverage),
      };
    }),
    travelTips: [
      {
        category: 'Getting Around',
        title: 'Public Transit & Walking',
        content: `Walking is the best way to uncover charming side-streets in ${destination}. For longer journeys, metro or light rail is punctual, affordable, and safe.`,
      },
      {
        category: 'Budget Optimization',
        title: 'Lunch Specials & City Passes',
        content: 'Many prime restaurants offer high-value fixed-price lunch menus (Formule / Prix Fixe) at almost half the evening dinner cost.',
      },
      {
        category: 'Local Etiquette',
        title: 'Customs & Greetings',
        content: 'A polite greeting in the local language when entering shops and restaurants goes a very long way in warm hospitality.',
      },
      {
        category: 'Packing Advice',
        title: 'Footwear & Weather Prep',
        content: 'Pack broken-in walking sneakers for cobblestone streets, a compact umbrella, and a light layering jacket for cooler evenings.',
      },
    ],
    futureModules: {
      stays: [
        {
          name: 'The Grand Heritage Boutique Hotel',
          type: 'Boutique Hotel',
          neighborhood: 'Historic Old Town',
          priceLevel: '$$$',
          highlights: ['Rooftop Terrace', 'Complimentary Breakfast', 'Steps from Metro'],
        },
        {
          name: 'Lumiere Loft & Apartments',
          type: 'Design Apartment',
          neighborhood: 'Art & Design District',
          priceLevel: '$$',
          highlights: ['Full Kitchen', 'High-Speed Wi-Fi', 'Balcony Views'],
        },
        {
          name: 'Quiet Oasis Eco-Lodge',
          type: 'Boutique Stay',
          neighborhood: 'Botanical Garden Area',
          priceLevel: '$$',
          highlights: ['Garden Courtyard', 'Organic Café', 'Bicycle Rental'],
        },
      ],
      rentals: [
        {
          category: 'Public Transit Pass' as const,
          recommendation: 'Unlimited 3-to-7 day City Mobility Card',
          approxDailyCost: '$8 / day',
          bestFor: 'Effortless hop-on hop-off access across subway, trams, and ferries.',
        },
        {
          category: 'Scooter / Bike' as const,
          recommendation: 'App-based E-Bike Share & Hybrid City Cruisers',
          approxDailyCost: '$15 - $22 / day',
          bestFor: 'Zipping through scenic waterfronts, canals, and garden boulevards.',
        },
        {
          category: 'Car' as const,
          recommendation: 'Compact Eco-Hybrid (Recommended for day trips only)',
          approxDailyCost: '$45 - $65 / day',
          bestFor: 'Excursions to countryside vineyards, coastlines, and mountain lookouts.',
        },
      ],
    },
  };
}

// AI Trip Generator Endpoint
app.post('/api/trip/generate', async (req: Request, res: Response) => {
  const formData = req.body;
  const {
    destination,
    startingLocation,
    startDate,
    endDate,
    travelers,
    budgetTier,
    customBudget,
    currency = 'USD',
    pacing = 'balanced',
    interests = [],
    specialRequests = '',
  } = formData;

  if (!destination) {
    return res.status(400).json({ error: 'Destination is required.' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.log('[Trip Planner] Using curated fallback plan generator (no Gemini API key).');
    const fallbackPlan = generateFallbackPlan(formData);
    return res.json({ plan: fallbackPlan, source: 'curated' });
  }

  try {
    const prompt = `You are a world-class travel planner and itinerary designer for the "Trip Planner" app.
Generate a realistic, comprehensive, high quality holiday plan with the following specifications:
- Destination: "${destination}"
- Starting Location: "${startingLocation || 'Not specified'}"
- Travel Dates: From ${startDate || 'Flexible'} to ${endDate || 'Flexible'}
- Number of Travelers: ${travelers || 1}
- Budget Tier: "${budgetTier || 'moderate'}" ${customBudget ? `(Custom budget: approx $${customBudget})` : ''}
- Pacing Preference: "${pacing}" (relaxed = fewer packed activities with more leisure time; packed = high energy full days)
- Interests: ${interests.length ? interests.join(', ') : 'Sightseeing, local food, culture, hidden gems'}
- Additional user notes: "${specialRequests || 'None'}"

CRITICAL:
1. Provide practical, authentic places, realistic times, and genuine regional culinary advice.
2. Provide a realistic budget breakdown in ${currency}.
3. Create day-by-day itineraries (up to 5 days, matching the duration).
4. Provide practical local travel tips.
5. Provide a preview of recommended stays and transit/rentals to match our future booking platform.

Return your response strictly in the JSON format matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are the AI engine of Trip Planner. Output ONLY valid JSON conforming to the requested schema. Provide inspiring, highly realistic, and actionable travel plans.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            durationDays: { type: Type.INTEGER },
            budget: {
              type: Type.OBJECT,
              properties: {
                totalEstimated: { type: Type.NUMBER },
                dailyAverage: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                categories: {
                  type: Type.OBJECT,
                  properties: {
                    accommodation: { type: Type.NUMBER },
                    foodAndDining: { type: Type.NUMBER },
                    activitiesAndSights: { type: Type.NUMBER },
                    localTransit: { type: Type.NUMBER },
                    miscellaneous: { type: Type.NUMBER },
                  },
                  required: ['accommodation', 'foodAndDining', 'activitiesAndSights', 'localTransit', 'miscellaneous'],
                },
              },
              required: ['totalEstimated', 'dailyAverage', 'currency', 'categories'],
            },
            suggestedPlaces: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING },
                  bestTimeToVisit: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['name', 'category', 'description', 'estimatedCost', 'bestTimeToVisit', 'tags'],
              },
            },
            suggestedActivities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  cost: { type: Type.STRING },
                },
                required: ['title', 'category', 'description', 'duration', 'cost'],
              },
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  slots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeOfDay: { type: Type.STRING },
                        title: { type: Type.STRING },
                        place: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimatedCost: { type: Type.STRING },
                        transitTip: { type: Type.STRING },
                      },
                      required: ['timeOfDay', 'title', 'place', 'description', 'estimatedCost'],
                    },
                  },
                  dailyTip: { type: Type.STRING },
                  mealSuggestion: { type: Type.STRING },
                  estimatedDayCost: { type: Type.NUMBER },
                },
                required: ['day', 'theme', 'slots', 'dailyTip', 'mealSuggestion', 'estimatedDayCost'],
              },
            },
            travelTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['category', 'title', 'content'],
              },
            },
            futureModules: {
              type: Type.OBJECT,
              properties: {
                stays: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      neighborhood: { type: Type.STRING },
                      priceLevel: { type: Type.STRING },
                      highlights: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['name', 'type', 'neighborhood', 'priceLevel', 'highlights'],
                  },
                },
                rentals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                      approxDailyCost: { type: Type.STRING },
                      bestFor: { type: Type.STRING },
                    },
                    required: ['category', 'recommendation', 'approxDailyCost', 'bestFor'],
                  },
                },
              },
              required: ['stays', 'rentals'],
            },
          },
          required: [
            'title',
            'summary',
            'durationDays',
            'budget',
            'suggestedPlaces',
            'suggestedActivities',
            'itinerary',
            'travelTips',
            'futureModules',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);
    const completePlan = {
      ...parsed,
      id: 'plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      destination,
      startingLocation: startingLocation || 'Local Origin',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      travelers: travelers || 1,
      pacing,
      budgetTier,
    };

    return res.json({ plan: completePlan, source: 'gemini' });
  } catch (error: any) {
    console.error('Error in /api/trip/generate:', error);
    // Graceful fallback so user never gets stuck
    const fallback = generateFallbackPlan(formData);
    return res.json({ plan: fallback, source: 'curated-fallback', error: error?.message });
  }
});

// Conversational Refinement Endpoint
app.post('/api/trip/chat', async (req: Request, res: Response) => {
  const { currentPlan, message, chatHistory = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Intelligent local conversational helper
    const lower = message.toLowerCase();
    let reply = `Here's a tip for your trip to ${currentPlan?.destination || 'your destination'}: `;
    if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eat') || lower.includes('dinner')) {
      reply += `Be sure to venture one or two blocks off the main tourist streets. Look for bistros crowded with locals around 1:00 PM or 8:00 PM, and don't hesitate to ask for the daily chalkboard special!`;
    } else if (lower.includes('rain') || lower.includes('weather') || lower.includes('indoor')) {
      reply += `If the weather turns rainy, swap outdoor walks for the city's historic covered passages, world-class art museums, or a cozy cafe tasting session.`;
    } else if (lower.includes('budget') || lower.includes('cheap') || lower.includes('save')) {
      reply += `To stretch your budget further, take advantage of combo museum passes, dine at fresh food markets during lunch, and use public transit day-cards rather than individual taxi rides.`;
    } else if (lower.includes('kid') || lower.includes('family') || lower.includes('children')) {
      reply += `For family-friendly pacing, schedule interactive activities in the morning when energy is high, and leave afternoons open for park picnics, playground stops, or relaxing boat cruises.`;
    } else {
      reply += `I've noted that! For ${currentPlan?.destination || 'your destination'}, pacing and booking popular sights 2-3 weeks in advance makes all the difference. What else would you like to tweak in your itinerary?`;
    }

    return res.json({
      reply,
      source: 'curated',
    });
  }

  try {
    const systemInstruction = `You are "Trip Planner AI", an expert personal travel concierge.
The user is currently viewing their itinerary for: ${currentPlan?.destination || 'their holiday'}.
Destination summary: ${currentPlan?.summary || 'Standard holiday'}
Duration: ${currentPlan?.durationDays || 4} days.
Travelers: ${currentPlan?.travelers || 1}.
Budget Tier: ${currentPlan?.budgetTier || 'moderate'}.

Answer the user's question concisely, warm and professionally. Provide concrete recommendations, specific dish names, neighborhoods, or practical travel insights. If they ask to modify or adjust an aspect of the plan, give them direct actionable advice on how to tweak their schedule. Keep responses under 150 words.`;

    const contents = [
      ...chatHistory.map((m: any) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
      `User: ${message}`,
    ].join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      reply: response.text || 'I would be delighted to help adjust your holiday itinerary! What else would you like to customize?',
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Error in /api/trip/chat:', err);
    return res.json({
      reply: `For ${currentPlan?.destination || 'your trip'}, I suggest keeping afternoons flexible so you can explore hidden side streets or relax at local cafes. Let me know if you would like recommendations for specific cuisines or sights!`,
      source: 'curated-fallback',
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trip Planner server running on http://localhost:${PORT}`);
  });
}

startServer();

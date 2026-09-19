import {
  RAGDocument,
  WeatherForecast,
  RouteInfo,
  TransportOption,
  ExchangeRateInfo,
  MapLocationItem,
  RestaurantItem,
  SuggestedPlace,
  SuggestedActivity,
} from '../types';

// Curated RAG Travel Knowledge Base
export const RAG_KNOWLEDGE_STORE: RAGDocument[] = [
  {
    id: 'rag-bali-guide',
    title: 'Bali Holiday & Cultural Planning Guide',
    destination: 'Bali, Indonesia',
    category: 'destination_guide',
    content: `Bali enjoys a tropical climate with a dry season from May to September, which is the prime time for beach days, cliffside sunsets in Uluwatu, and diving in Nusa Penida.
When visiting temples such as Besakih, Uluwatu, or Tirta Empul, wear a sarong and sash (usually available to rent at the entrance). Remove shoes before entering sanctified pavilion platforms.
Traffic in Canggu and Seminyak can be congested; renting a scooter is popular for experienced riders, but hiring an air-conditioned car with a local driver for $40–$55/day is the safest, stress-free option for families and day trips to Ubud waterfalls.`,
    tags: ['Bali', 'Tropical', 'Culture', 'Temples', 'Transport'],
    source: 'Verified Travel Concierge RAG Archive',
    lastIndexed: '2026-09-15',
  },
  {
    id: 'rag-paris-guide',
    title: 'Paris Art, Dining & Neighborhood Itinerary Strategy',
    destination: 'France',
    category: 'destination_guide',
    content: `Paris is best experienced neighborhood by neighborhood to minimize transit fatigue.
Combine the Louvre with Palais-Royal gardens and the Tuileries; explore Montmartre in the early morning before midday crowds arrive at Sacré-Cœur.
Culinary Etiquette: Greet shopkeepers and waiters with a polite 'Bonjour Madame/Monsieur'. Dinner typically begins around 7:30 PM or 8:00 PM. Book popular neo-bistros in the 10th and 11th arrondissements 2–3 weeks in advance.
Public Transit: The Paris Metro and RER are efficient. Use a contactless Navigo Easy pass or contactless card at turnstiles.`,
    tags: ['Paris', 'Europe', 'Museums', 'Dining', 'Metro'],
    source: 'Verified Travel Concierge RAG Archive',
    lastIndexed: '2026-09-14',
  },
  {
    id: 'rag-tokyo-guide',
    title: 'Tokyo Urban Navigation, Etiquette & Dining',
    destination: 'Tokyo, Japan',
    category: 'destination_guide',
    content: `Tokyo balances hyper-futuristic efficiency with peaceful temple sanctums.
Train Etiquette: Talking on phone calls inside commuter trains is considered rude; stand on the left of escalators (in Tokyo) or follow the local flow.
Dining: High-end sushi, ramen bars, and omakase spots often require reservations months in advance or early ticket queues (such as in Tsukiji Outer Market or Ginza).
Luggage Forwarding: Japan's Takkyubin (luggage forwarding service) is inexpensive and allows travelers to send heavy luggage directly between hotels while taking the Shinkansen unencumbered.`,
    tags: ['Tokyo', 'Japan', 'Trains', 'Etiquette', 'Culinary'],
    source: 'Verified Travel Concierge RAG Archive',
    lastIndexed: '2026-09-12',
  },
  {
    id: 'rag-amalfi-guide',
    title: 'Amalfi Coast & Capri Scenic Travel Protocol',
    destination: 'Amalfi Coast, Italy',
    category: 'destination_guide',
    content: `The Amalfi Coast (Positano, Amalfi, Ravello) features dramatic cliffs and turquoise Mediterranean waters.
Transportation: Driving rental cars on the narrow coastal SS163 road can be stressful during peak summer. Prefer high-speed passenger ferries (Travelmar) connecting Salerno, Amalfi, Positano, and Capri for spectacular views without traffic jams.
Pacing: Pack comfortable walking shoes with rubber grip; Positano is built into vertical cliffs with hundreds of stone staircases.`,
    tags: ['Amalfi', 'Italy', 'Mediterranean', 'Ferries', 'Romantic'],
    source: 'Verified Travel Concierge RAG Archive',
    lastIndexed: '2026-09-10',
  },
  {
    id: 'rag-swiss-guide',
    title: 'Swiss Alps & Bernese Oberland Alpine Best Practices',
    destination: 'Swiss Alps, Switzerland',
    category: 'destination_guide',
    content: `Interlaken serves as the gateway to the car-free mountain villages of Lauterbrunnen, Wengen, Mürren, and Grindelwald.
Swiss Travel Pass: If staying 3 or more days and taking multiple cogwheel railways, boats on Lake Thun/Brienz, or cable cars, the Swiss Travel Pass offers tremendous value and seamless hops on public transport.
Mountain Weather: High-altitude conditions change rapidly. Always check live summit webcams before taking expensive lifts up to Jungfraujoch or Schilthorn.`,
    tags: ['Switzerland', 'Alps', 'Trains', 'Hiking', 'Nature'],
    source: 'Verified Travel Concierge RAG Archive',
    lastIndexed: '2026-09-11',
  },
  {
    id: 'rag-pacing-principles',
    title: 'The Balanced Travel Pacing Principle',
    destination: 'Global',
    category: 'itinerary_principles',
    content: `A common holiday mistake is over-scheduling: packing 4 to 5 ticketed attractions in one day creates burnout by Day 3.
Golden Rule of Pacing:
1. Schedule ONE major anchor activity in the morning when energy is highest (e.g., museum, hike, boat charter).
2. Dedicate mid-afternoon to relaxed dining, wandering historic quarters, or pool/beach leisure.
3. Plan sunset and evening around scenic viewpoints, rooftop drinks, and dinner without hard time constraints.
Leave at least 20% of schedule unallocated for spontaneous discoveries and weather flexibility.`,
    tags: ['Planning', 'Pacing', 'Itinerary Design', 'Best Practices'],
    source: 'Vacation Design Handbook',
    lastIndexed: '2026-09-16',
  },
  {
    id: 'rag-packing-tropical',
    title: 'Tropical & Beach Vacation Packing Guidance',
    destination: 'Global',
    category: 'packing_guidance',
    content: `For tropical destinations (Bali, Hawaii, Caribbean, Phuket):
- Reef-safe mineral sunscreen (oxybenzone-free to protect marine coral reefs)
- Breathable linen or lightweight moisture-wicking clothing
- High-quality sunglasses with UV400 polarization
- Waterproof phone pouch and dry-bag for catamaran cruises and waterfall treks
- Universal electrical adapter and compact power bank (10,000mAh)
- Quick-drying micro-fiber beach towel and insect repellent with picaridin`,
    tags: ['Packing', 'Beach', 'Tropical', 'Essentials'],
    source: 'Travel Logistics Core',
    lastIndexed: '2026-09-13',
  },
];

// Helper to retrieve RAG knowledge chunks
export function retrieveRAGKnowledge(query: string, destination: string): RAGDocument[] {
  const q = (query + ' ' + destination).toLowerCase();
  const matched = RAG_KNOWLEDGE_STORE.filter((doc) => {
    if (destination && doc.destination.toLowerCase().includes(destination.toLowerCase().split(',')[0].trim())) {
      return true;
    }
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.tags.some((t) => q.includes(t.toLowerCase()))
    );
  });

  return matched.length > 0 ? matched : RAG_KNOWLEDGE_STORE.slice(0, 3);
}

// Destination coordinates and curated map places database
export const DESTINATION_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  bali: { lat: -8.4095, lng: 115.1889, zoom: 11 },
  tokyo: { lat: 35.6762, lng: 139.6503, zoom: 12 },
  paris: { lat: 48.8566, lng: 2.3522, zoom: 13 },
  rome: { lat: 41.9028, lng: 12.4964, zoom: 13 },
  'swiss-alps': { lat: 46.6863, lng: 7.8632, zoom: 11 },
  interlaken: { lat: 46.6863, lng: 7.8632, zoom: 12 },
  'new-york': { lat: 40.7128, lng: -74.006, zoom: 12 },
  amalfi: { lat: 40.634, lng: 14.6027, zoom: 12 },
  santorini: { lat: 36.3932, lng: 25.4615, zoom: 12 },
  maui: { lat: 20.7984, lng: -156.3319, zoom: 11 },
  phuket: { lat: 7.8804, lng: 98.3923, zoom: 11 },
  barcelona: { lat: 41.3851, lng: 2.1734, zoom: 13 },
  goa: { lat: 15.2993, lng: 74.124, zoom: 11 },
};

// Rich Map Places by Destination
export const CURATED_MAP_PLACES: Record<string, MapLocationItem[]> = {
  bali: [
    {
      id: 'bali-p1',
      name: 'Uluwatu Cliffside Temple & Sunset Point',
      category: 'attraction',
      lat: -8.8291,
      lng: 115.0849,
      address: 'Pecatu, South Kuta, Badung Regency, Bali',
      city: 'Uluwatu',
      country: 'Indonesia',
      rating: 4.8,
      reviewsCount: 1420,
      priceLevel: '$$',
      estimatedCost: '$5 / entrance',
      description: 'Ancient sea temple perched atop a 70-meter limestone cliff overlooking ocean surf breaks.',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
      openingHours: '7:00 AM - 7:00 PM',
      dayNumber: 1,
    },
    {
      id: 'bali-p2',
      name: 'Tegallalang Rice Terraces & Jungle Swing',
      category: 'activity',
      lat: -8.4344,
      lng: 115.2778,
      address: 'Jl. Raya Tegallalang, Ubud, Gianyar, Bali',
      city: 'Ubud',
      country: 'Indonesia',
      rating: 4.7,
      reviewsCount: 3100,
      priceLevel: '$$',
      estimatedCost: '$10 - $25 with swing',
      description: 'UNESCO-recognized subak irrigation terraced emerald hillsides, artisan woodcarvers, and cafes.',
      imageUrl: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&auto=format&fit=crop&q=80',
      openingHours: '8:00 AM - 6:00 PM',
      dayNumber: 2,
    },
    {
      id: 'bali-p3',
      name: 'Padang Padang Beach',
      category: 'beach',
      lat: -8.8111,
      lng: 115.1037,
      address: 'Pecatu, Badung Regency, Bali',
      city: 'Uluwatu',
      country: 'Indonesia',
      rating: 4.6,
      reviewsCount: 890,
      priceLevel: '$',
      estimatedCost: '$2 / entrance',
      description: 'Secluded golden cove accessed through a limestone rock crevice, featured in Eat Pray Love.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      openingHours: 'Sunrise to Sunset',
      dayNumber: 1,
    },
    {
      id: 'bali-p4',
      name: 'Bambu Indah Eco Luxury Resort',
      category: 'hotel',
      lat: -8.5147,
      lng: 115.2415,
      address: 'Jl. Baung, Sayan, Kecamatan Ubud, Bali',
      city: 'Ubud',
      country: 'Indonesia',
      rating: 4.9,
      reviewsCount: 420,
      priceLevel: '$$$$',
      estimatedCost: '$280 - $450 / night',
      description: 'Celebrated bamboo architectural marvel overlooking the Ayung River with natural spring swimming pools.',
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
      dayNumber: 1,
    },
    {
      id: 'bali-p5',
      name: 'Locavore Herbivore Dining Lab',
      category: 'restaurant',
      lat: -8.5085,
      lng: 115.2638,
      address: 'Jl. Dewisita No.10, Ubud, Bali',
      city: 'Ubud',
      country: 'Indonesia',
      rating: 4.9,
      reviewsCount: 650,
      priceLevel: '$$$',
      estimatedCost: '$65 / tasting menu',
      description: 'World-renowned farm-to-table cuisine celebrating local Indonesian botanicals and modern gastronomy.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      openingHours: '12:00 PM - 10:00 PM',
      dayNumber: 2,
    },
    {
      id: 'bali-p6',
      name: 'Ngurah Rai International Airport (DPS)',
      category: 'airport',
      lat: -8.7482,
      lng: 115.1675,
      address: 'Tuban, Kuta, Badung, Bali',
      city: 'Denpasar',
      country: 'Indonesia',
      rating: 4.4,
      description: 'Primary international airport terminal welcoming global travelers to the Island of the Gods.',
    },
  ],
  paris: [
    {
      id: 'paris-p1',
      name: 'Eiffel Tower & Champ de Mars',
      category: 'attraction',
      lat: 48.8584,
      lng: 2.2945,
      address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
      city: 'Paris',
      country: 'France',
      rating: 4.8,
      reviewsCount: 8500,
      priceLevel: '$$',
      estimatedCost: '€18 - €29',
      description: 'The iconic 330-meter wrought-iron landmark offering panoramic skyline vistas across Paris.',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
      openingHours: '9:00 AM - 11:45 PM',
      dayNumber: 1,
    },
    {
      id: 'paris-p2',
      name: 'Musée du Louvre & Tuileries Garden',
      category: 'attraction',
      lat: 48.8606,
      lng: 2.3376,
      address: 'Rue de Rivoli, 75001 Paris',
      city: 'Paris',
      country: 'France',
      rating: 4.9,
      reviewsCount: 9200,
      priceLevel: '$$',
      estimatedCost: '€22',
      description: 'World’s largest art museum holding the Mona Lisa, Venus de Milo, and masterworks in a royal palace.',
      imageUrl: 'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=600&auto=format&fit=crop&q=80',
      openingHours: '9:00 AM - 6:00 PM (Closed Tuesday)',
      dayNumber: 2,
    },
    {
      id: 'paris-p3',
      name: 'Le Comptoir du Relais Bistro',
      category: 'restaurant',
      lat: 48.8524,
      lng: 2.3387,
      address: '9 Carr de l Odéon, 75006 Paris',
      city: 'Paris',
      country: 'France',
      rating: 4.7,
      reviewsCount: 1100,
      priceLevel: '$$$',
      estimatedCost: '€45 - €70',
      description: 'Quintessential Saint-Germain bistro by Yves Camdeborde serving duck confit and charcuterie boards.',
      imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80',
      openingHours: '12:00 PM - 11:00 PM',
      dayNumber: 1,
    },
    {
      id: 'paris-p4',
      name: 'Hôtel Regina Louvre (Classic Parisian Stays)',
      category: 'hotel',
      lat: 48.8638,
      lng: 2.3328,
      address: '2 Place des Pyramides, 75001 Paris',
      city: 'Paris',
      country: 'France',
      rating: 4.8,
      reviewsCount: 780,
      priceLevel: '$$$$',
      estimatedCost: '€380 - €650 / night',
      description: 'Belle Époque luxury hotel facing the Tuileries Garden and Musée d’Orsay.',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
      dayNumber: 1,
    },
    {
      id: 'paris-p5',
      name: 'Gare de Lyon TGV Station',
      category: 'station',
      lat: 48.8448,
      lng: 2.3735,
      address: 'Place Louis Armand, 75012 Paris',
      city: 'Paris',
      country: 'France',
      rating: 4.5,
      description: 'Major high-speed rail hub connecting Paris to the French Riviera, Swiss Alps, and Italy.',
    },
  ],
  tokyo: [
    {
      id: 'tokyo-p1',
      name: 'Senso-ji Ancient Temple & Asakusa Market',
      category: 'attraction',
      lat: 35.7148,
      lng: 139.7967,
      address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
      city: 'Tokyo',
      country: 'Japan',
      rating: 4.8,
      reviewsCount: 12000,
      priceLevel: '$',
      estimatedCost: 'Free admission',
      description: 'Tokyo’s oldest Buddhist temple founded in 645 AD with the iconic Kaminarimon thunder gate.',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
      dayNumber: 1,
    },
    {
      id: 'tokyo-p2',
      name: 'Shibuya Crossing & Sky Observation Deck',
      category: 'activity',
      lat: 35.6595,
      lng: 139.7004,
      address: '2 Chome-24-12 Shibuya, Tokyo',
      city: 'Tokyo',
      country: 'Japan',
      rating: 4.9,
      reviewsCount: 9500,
      priceLevel: '$$',
      estimatedCost: '¥2,200 ($15)',
      description: 'World’s busiest pedestrian crossing and 360-degree rooftop deck with Mt. Fuji horizon views.',
      imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
      dayNumber: 2,
    },
    {
      id: 'tokyo-p3',
      name: 'Ginza Hachigou Michelin Ramen',
      category: 'restaurant',
      lat: 35.6701,
      lng: 139.7699,
      address: '3 Chome-14-2 Ginza, Chuo City, Tokyo',
      city: 'Tokyo',
      country: 'Japan',
      rating: 4.9,
      reviewsCount: 880,
      priceLevel: '$$',
      estimatedCost: '¥1,500 - ¥2,200',
      description: 'French culinary technique meets classical Tokyo chuka soba broth in an intimate 6-seat counter.',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
      dayNumber: 1,
    },
  ],
};

// Weather live mock aggregation provider
export function getLiveWeatherForDestination(destination: string): WeatherForecast {
  const destLower = destination.toLowerCase();
  if (destLower.includes('bali') || destLower.includes('indonesia')) {
    return {
      destination: 'Bali, Indonesia',
      temperatureC: 29,
      temperatureF: 84,
      condition: 'Tropical Sunshine with Gentle Breeze',
      icon: 'Sun',
      precipitationChance: 15,
      bestSeason: 'May to October (Dry & Sunny Season)',
      advisory: 'Perfect beach weather with warm 28°C ocean currents.',
    };
  }
  if (destLower.includes('paris') || destLower.includes('france')) {
    return {
      destination: 'Paris, France',
      temperatureC: 19,
      temperatureF: 66,
      condition: 'Mild & Partly Cloudy',
      icon: 'CloudSun',
      precipitationChance: 20,
      bestSeason: 'April to June & September to November',
      advisory: 'Comfortable sightseeing temperatures; carry a light jacket for breezy evenings.',
    };
  }
  if (destLower.includes('tokyo') || destLower.includes('japan')) {
    return {
      destination: 'Tokyo, Japan',
      temperatureC: 22,
      temperatureF: 72,
      condition: 'Clear Blue Autumn Sky',
      icon: 'Sun',
      precipitationChance: 10,
      bestSeason: 'March to May (Cherry Blossom) & October to November (Foliage)',
      advisory: 'Superb walking weather for exploring parks and outdoor districts.',
    };
  }
  if (destLower.includes('swiss') || destLower.includes('alps') || destLower.includes('interlaken')) {
    return {
      destination: 'Interlaken / Swiss Alps',
      temperatureC: 16,
      temperatureF: 61,
      condition: 'Crisp Mountain Air & Sunny Valleys',
      icon: 'Mountain',
      precipitationChance: 25,
      bestSeason: 'June to September (Alpine Hiking) & December to March (Skiing)',
      advisory: 'Summit temperatures can be 8°C cooler; dress in thermal layers for mountain lifts.',
    };
  }
  return {
    destination,
    temperatureC: 24,
    temperatureF: 75,
    condition: 'Pleasant & Sunny',
    icon: 'Sun',
    precipitationChance: 15,
    bestSeason: 'Year-round leisure travel',
    advisory: 'Favorable conditions for holiday activities and outdoor exploration.',
  };
}

// Exchange rates provider
export function getExchangeRates(base = 'USD'): ExchangeRateInfo[] {
  return [
    { base, target: 'EUR', rate: 0.92, lastUpdated: '2026-09-17' },
    { base, target: 'JPY', rate: 154.2, lastUpdated: '2026-09-17' },
    { base, target: 'IDR', rate: 15850.0, lastUpdated: '2026-09-17' },
    { base, target: 'GBP', rate: 0.78, lastUpdated: '2026-09-17' },
    { base, target: 'CHF', rate: 0.89, lastUpdated: '2026-09-17' },
    { base, target: 'AUD', rate: 1.52, lastUpdated: '2026-09-17' },
  ];
}

export interface DestinationCard {
  id: string;
  name: string;
  country: string;
  tagline: string;
  imageUrl: string;
  badge: string;
  typicalDuration: string;
  estimatedBudget: string;
  tags: string[];
  defaultInterests: string[];
}

export const POPULAR_DESTINATIONS: DestinationCard[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    tagline: 'Futuristic neon, centuries-old shrines, and unmatched culinary depth.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    badge: 'Trending Top Pick',
    typicalDuration: '5-7 Days',
    estimatedBudget: '$140/day',
    tags: ['Culture', 'Culinary', 'Futuristic', 'Shopping'],
    defaultInterests: ['Food & Dining', 'Culture & History', 'Shopping'],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    tagline: 'Haussmann boulevards, world-class art collections, and intimate bistros.',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    badge: 'Classic Romance',
    typicalDuration: '4-6 Days',
    estimatedBudget: '$160/day',
    tags: ['Art & Museums', 'Architecture', 'Romantic', 'Cafés'],
    defaultInterests: ['Culture & History', 'Food & Dining', 'Art & Museums'],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    tagline: 'Emerald rice terraces, cliffside temples, surfing, and serene wellness retreats.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
    badge: 'Island Paradise',
    typicalDuration: '6-8 Days',
    estimatedBudget: '$85/day',
    tags: ['Beaches', 'Nature', 'Wellness', 'Culture'],
    defaultInterests: ['Nature & Adventure', 'Beaches & Relaxation', 'Wellness & Spa'],
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    tagline: 'Living open-air museum filled with ancient forums, gelato, and baroque fountains.',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    badge: 'Historic Wonder',
    typicalDuration: '4-5 Days',
    estimatedBudget: '$135/day',
    tags: ['Ancient Ruins', 'Gastronomy', 'Walkable'],
    defaultInterests: ['Culture & History', 'Food & Dining'],
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps (Interlaken)',
    country: 'Switzerland',
    tagline: 'Towering peaks, turquoise glacial lakes, and scenic cogwheel mountain railways.',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    badge: 'Alpine Adventure',
    typicalDuration: '5-6 Days',
    estimatedBudget: '$190/day',
    tags: ['Hiking', 'Scenic Views', 'Lakes', 'Nature'],
    defaultInterests: ['Nature & Adventure', 'Photography', 'Relaxation'],
  },
  {
    id: 'new-york',
    name: 'New York City',
    country: 'United States',
    tagline: 'Endless energy, Broadway theaters, skyline observation decks, and diverse neighborhoods.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
    badge: 'Urban Culture',
    typicalDuration: '4-5 Days',
    estimatedBudget: '$210/day',
    tags: ['Broadway', 'Skyline', 'Dining', 'Museums'],
    defaultInterests: ['Food & Dining', 'Culture & History', 'Nightlife'],
  },
];

export const TRAVEL_INTEREST_OPTIONS = [
  'Culture & History',
  'Food & Dining',
  'Nature & Adventure',
  'Beaches & Relaxation',
  'Art & Museums',
  'Photography',
  'Nightlife & Social',
  'Shopping & Boutiques',
  'Wellness & Spa',
  'Family & Kids',
  'Hidden Gems & Local Spots',
];

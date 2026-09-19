import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  APIProvider,
  Map as GoogleMap,
  Marker as GoogleMarker,
} from '@vis.gl/react-google-maps';
import { MapLocationItem, PlaceCategory, RouteInfo } from '../types';
import {
  Navigation,
  X,
  Plus,
  Clock,
  ExternalLink,
  Car,
  Footprints,
  Check,
  Compass,
  Map as MapIcon,
  Layers,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBUFOos2nOJVQSvr6Y-tuy81JTQBkZ3zBI';

interface InteractiveMapProps {
  locations?: MapLocationItem[];
  center?: L.LatLngTuple;
  zoom?: number;
  selectedLocationId?: string;
  onSelectLocation?: (location: MapLocationItem) => void;
  onAddToTrip?: (location: MapLocationItem) => void;
  activeRoute?: RouteInfo | null;
  dayNumberFilter?: number;
  heightClass?: string;
  showCategoryFilters?: boolean;
}

const CATEGORY_COLORS: Record<PlaceCategory, { bg: string; text: string; iconEmoji: string; hex: string }> = {
  beach: { bg: 'bg-teal-500', text: 'text-teal-700', iconEmoji: '🏖️', hex: '#0d9488' },
  hotel: { bg: 'bg-indigo-600', text: 'text-indigo-700', iconEmoji: '🏨', hex: '#4f46e5' },
  attraction: { bg: 'bg-sky-500', text: 'text-sky-700', iconEmoji: '🏛️', hex: '#0284c7' },
  restaurant: { bg: 'bg-amber-500', text: 'text-amber-700', iconEmoji: '🍽️', hex: '#d97706' },
  activity: { bg: 'bg-emerald-500', text: 'text-emerald-700', iconEmoji: '✨', hex: '#059669' },
  rental: { bg: 'bg-violet-500', text: 'text-violet-700', iconEmoji: '🚗', hex: '#7c3aed' },
  airport: { bg: 'bg-blue-600', text: 'text-blue-700', iconEmoji: '✈️', hex: '#2563eb' },
  station: { bg: 'bg-slate-600', text: 'text-slate-700', iconEmoji: '🚆', hex: '#475569' },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  locations = [],
  center = [-8.5069, 115.2625] as L.LatLngTuple, // Default Bali Ubud
  zoom = 11,
  selectedLocationId,
  onSelectLocation,
  onAddToTrip,
  activeRoute,
  dayNumberFilter,
  heightClass = 'h-[500px]',
  showCategoryFilters = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Map engine: default to Google Maps when API key is provided
  const [mapEngine, setMapEngine] = useState<'google' | 'osm'>(
    GOOGLE_MAPS_API_KEY ? 'google' : 'osm'
  );
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPlace, setSelectedPlace] = useState<MapLocationItem | null>(null);
  const [addedPlaces, setAddedPlaces] = useState<Record<string, boolean>>({});

  // Filter locations by category and optional day
  const filteredLocations = locations.filter((loc) => {
    if (activeCategory !== 'all' && loc.category !== activeCategory) return false;
    if (dayNumberFilter && loc.dayNumber && loc.dayNumber !== dayNumberFilter) return false;
    return true;
  });

  // Keep selected place in sync with selectedLocationId prop
  useEffect(() => {
    if (selectedLocationId) {
      const found = locations.find((l) => l.id === selectedLocationId);
      if (found) setSelectedPlace(found);
    }
  }, [selectedLocationId, locations]);

  // Leaflet initialization (only active when in 'osm' mode)
  useEffect(() => {
    if (mapEngine !== 'osm') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    // Clean, crisp travel-friendly tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapEngine]);

  // Leaflet view updates
  useEffect(() => {
    if (mapEngine !== 'osm' || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, zoom, { animate: true });
  }, [center[0], center[1], zoom, mapEngine]);

  // Leaflet markers
  useEffect(() => {
    if (mapEngine !== 'osm' || !mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    const bounds: [number, number][] = [];

    filteredLocations.forEach((loc) => {
      const catConfig = CATEGORY_COLORS[loc.category] || CATEGORY_COLORS.attraction;
      const isSelected = selectedPlace?.id === loc.id || selectedLocationId === loc.id;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '44px' : '36px'};
            height: ${isSelected ? '44px' : '36px'};
            background: ${catConfig.hex};
            color: white;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            font-size: ${isSelected ? '18px' : '15px'};
            cursor: pointer;
            transition: all 0.2s ease;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          ">
            <span>${catConfig.iconEmoji}</span>
          </div>
        `,
        iconSize: isSelected ? [44, 44] : [36, 36],
        iconAnchor: isSelected ? [22, 22] : [18, 18],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPlace(loc);
        if (onSelectLocation) onSelectLocation(loc);
        mapInstanceRef.current?.panTo([loc.lat, loc.lng], { animate: true });
      });

      markersGroupRef.current?.addLayer(marker);
      bounds.push([loc.lat, loc.lng]);
    });

    if (bounds.length > 1 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [filteredLocations, selectedPlace?.id, selectedLocationId, mapEngine]);

  // Leaflet Route Polyline
  useEffect(() => {
    if (mapEngine !== 'osm' || !mapInstanceRef.current) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 1) {
      const polyline = L.polyline(activeRoute.coordinates, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.85,
        dashArray: activeRoute.mode === 'walking' ? '8, 8' : undefined,
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (filteredLocations.length >= 2) {
      const coords = filteredLocations.map((l) => [l.lat, l.lng] as [number, number]);
      const polyline = L.polyline(coords, {
        color: '#0ea5e9',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.65,
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;
    }
  }, [activeRoute, filteredLocations, mapEngine]);

  // Handle "Add to Trip" click
  const handleAdd = (place: MapLocationItem) => {
    setAddedPlaces((prev) => ({ ...prev, [place.id]: true }));
    if (onAddToTrip) {
      onAddToTrip(place);
    }
  };

  // Re-center handler
  const handleRecenter = () => {
    if (mapEngine === 'osm' && mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg bg-slate-50">
      {/* Category Pills Header */}
      {showCategoryFilters && (
        <div className="absolute top-4 left-4 right-56 z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-white/60">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({locations.length})
            </button>
            <button
              onClick={() => setActiveCategory('beach')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'beach'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🏖️ Beaches
            </button>
            <button
              onClick={() => setActiveCategory('attraction')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'attraction'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🏛️ Attractions
            </button>
            <button
              onClick={() => setActiveCategory('hotel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'hotel'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🏨 Stays
            </button>
            <button
              onClick={() => setActiveCategory('restaurant')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'restaurant'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🍽️ Food
            </button>
            <button
              onClick={() => setActiveCategory('activity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'activity'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ✨ Activities
            </button>
          </div>
        </div>
      )}

      {/* Map Provider Selector & Layer Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200/80 text-xs">
          <button
            onClick={() => setMapEngine('google')}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapEngine === 'google'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to Google Maps"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>
          <button
            onClick={() => setMapEngine('osm')}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapEngine === 'osm'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to Travel Canvas"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Voyager</span>
          </button>
        </div>

        {/* Satellite / Terrain toggle when in Google Maps */}
        {mapEngine === 'google' && (
          <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200/80 text-[11px] font-semibold">
            <button
              onClick={() => setGoogleMapType('roadmap')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                googleMapType === 'roadmap' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Road
            </button>
            <button
              onClick={() => setGoogleMapType('satellite')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                googleMapType === 'satellite' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setGoogleMapType('terrain')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                googleMapType === 'terrain' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Terrain
            </button>
          </div>
        )}
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        title="Reset map view"
        className="absolute bottom-4 right-4 z-20 p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
      >
        <Navigation className="w-5 h-5 text-sky-600" />
      </button>

      {/* Route Info Badge (if active) */}
      {activeRoute && (
        <div className="absolute top-16 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-sky-100 flex items-center gap-3 max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            {activeRoute.mode === 'walking' ? (
              <Footprints className="w-5 h-5" />
            ) : (
              <Car className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">
              {activeRoute.origin} → {activeRoute.destination}
            </div>
            <div className="text-slate-500 font-medium">
              {activeRoute.distanceKm} km • ~{activeRoute.durationMinutes} mins ({activeRoute.mode})
            </div>
          </div>
        </div>
      )}

      {/* MAP VIEWPORT: Google Maps or Leaflet */}
      {mapEngine === 'google' ? (
        <div className={`w-full ${heightClass} z-0 bg-slate-100 relative`}>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              defaultCenter={{ lat: center[0], lng: center[1] }}
              center={{ lat: center[0], lng: center[1] }}
              defaultZoom={zoom}
              zoom={zoom}
              mapTypeId={googleMapType}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {filteredLocations.map((loc) => (
                <GoogleMarker
                  key={loc.id}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  title={`${loc.name} (${loc.category})`}
                  onClick={() => {
                    setSelectedPlace(loc);
                    if (onSelectLocation) onSelectLocation(loc);
                  }}
                />
              ))}
            </GoogleMap>
          </APIProvider>
        </div>
      ) : (
        <div
          id="vacation-leaflet-container"
          ref={mapContainerRef}
          className={`w-full ${heightClass} z-0`}
        />
      )}

      {/* Location Details Modal / Bottom Drawer */}
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-14 sm:right-auto sm:max-w-md z-30 bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                {selectedPlace.category}
              </span>
              {selectedPlace.dayNumber && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  Day {selectedPlace.dayNumber}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedPlace(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-4">
            {selectedPlace.imageUrl && (
              <img
                src={selectedPlace.imageUrl}
                alt={selectedPlace.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 leading-tight truncate">
                {selectedPlace.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {selectedPlace.description || selectedPlace.address}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-600">
                {selectedPlace.rating && (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    ★ {selectedPlace.rating}
                  </span>
                )}
                {selectedPlace.estimatedCost && (
                  <span className="text-emerald-700">{selectedPlace.estimatedCost}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Add to Trip, Open in Google Maps, Get Directions */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${selectedPlace.name} ${selectedPlace.address || ''}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-all flex items-center gap-1 border border-slate-200"
                title="View place on Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Google Maps</span>
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-1 border border-slate-200"
                title="Get turn-by-turn directions"
              >
                <Navigation className="w-3 h-3" />
                <span>Directions</span>
              </a>
            </div>

            <button
              onClick={() => handleAdd(selectedPlace)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                addedPlaces[selectedPlace.id]
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {addedPlaces[selectedPlace.id] ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add to Trip
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

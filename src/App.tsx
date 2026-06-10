import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { 
  Search, 
  Utensils, 
  Coffee, 
  Trees, 
  MapPin, 
  Star, 
  Navigation, 
  Phone, 
  Globe, 
  ChevronRight,
  LocateFixed,
  Camera,
  Compass,
  Heart,
  List as ListIcon,
  Map as MapIcon,
  Clock,
  ExternalLink,
  Share2,
  Trash2,
  Moon,
  Sun,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhoneSimulator from './components/PhoneSimulator';
import AuthScreen from './components/AuthScreen';
import UserProfileModal from './components/UserProfileModal';
import { UserSession, AppTab } from './types';

// Use environment variable exposed via vite.config.ts
const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const DEMO_MAP_ID = 'bf305a2e584f7b60';

const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants', icon: Utensils, type: ['restaurant'] },
  { id: 'cafe', label: 'Cafes', icon: Coffee, type: ['cafe'] },
  { id: 'park', label: 'Parks', icon: Trees, type: ['park'] },
  { id: 'tourist_attraction', label: 'Attractions', icon: Camera, type: ['tourist_attraction'] },
  { id: 'activities', label: 'Activities', icon: Compass, type: ['amusement_center', 'amusement_park', 'bowling_alley', 'playground', 'sports_complex', 'museum', 'aquarium', 'zoo'] },
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  // Sync dark mode class on document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    const rememberedSession = localStorage.getItem('active_user_session');
    if (rememberedSession) {
      try {
        setUser(JSON.parse(rememberedSession));
      } catch (e) {
        console.error('Error loading active user session', e);
      }
    }
  }, []);

  const handleAuthSuccess = (newSession: UserSession) => {
    setUser(newSession);
    localStorage.setItem('active_user_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('active_user_session');
  };

  if (!hasValidKey) {
    return <ApiKeySplashScreen />;
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <PhoneSimulator>
        {user ? (
          <ExploreApp 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            user={user}
            onLogout={handleLogout}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem('active_user_session', JSON.stringify(updated));
            }}
          />
        ) : (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}
      </PhoneSimulator>
    </APIProvider>
  );
}

function ApiKeySplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Maps API Key Required</h2>
        <p className="text-gray-600 mb-6">To enable mapping features, please add your Google Maps Platform API key.</p>
        
        <div className="space-y-4 text-left font-mono text-xs">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <p className="text-gray-600">
              Get or copy your API Key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Credentials Console</a>
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div className="text-gray-600">
              Go to <strong>Settings</strong> (⚙️) in the top-right corner of AI Studio, and choose <strong>Secrets</strong>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <p className="text-gray-600">
              Add a new secret named <code>GOOGLE_MAPS_PLATFORM_KEY</code> and paste your generated API key.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Confirm key & Reload App
        </button>
      </div>
    </div>
  );
}

function getDistance(l1: google.maps.LatLngLiteral, l2: any) {
  if (!l1 || !l2) return 0;
  
  // Handle both LatLng objects (with .lat()) and literals
  const lat1 = l1.lat;
  const lng1 = l1.lng;
  const lat2 = typeof l2.lat === 'function' ? l2.lat() : l2.lat;
  const lng2 = typeof l2.lng === 'function' ? l2.lng() : l2.lng;

  if (isNaN(lat2) || isNaN(lng2)) return 0;

  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

function formatDistance(meters: number) {
  if (!meters || isNaN(meters)) return '0m';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function serializePlace(p: any) {
  if (!p) return null;
  if (p._isSerialized) return p;

  let displayNameStr = '';
  if (typeof p.displayName === 'string') {
    displayNameStr = p.displayName;
  } else if (p.displayName && typeof p.displayName === 'object') {
    displayNameStr = p.displayName.text || p.displayName.displayName || '';
  }

  let location = null;
  if (p.location) {
    location = {
      lat: typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat,
      lng: typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng,
    };
  }

  let photoUrl = null;
  if (p.photos && p.photos.length > 0) {
    try {
      photoUrl = p.photos[0].getURI({ maxWidth: 800 });
    } catch (e) {
      console.error("Error generating photo URL:", e);
    }
  }

  let reviews: any[] = [];
  if (p.reviews && Array.isArray(p.reviews)) {
    reviews = p.reviews.map((r: any) => ({
      rating: r.rating ?? 0,
      text: r.text ?? '',
      relativePublishTimeDescription: r.relativePublishTimeDescription ?? r.relative_time_description ?? 'recent',
      authorName: r.authorAttribution?.displayName ?? r.author_name ?? 'Google User',
      authorPhoto: r.authorAttribution?.photoURI ?? r.profile_photo_url ?? '',
      authorUri: r.authorAttribution?.uri ?? r.author_url ?? ''
    }));
  }

  const isOpenNow = p.regularOpeningHours?.openNow ?? false;

  return {
    id: p.id,
    displayName: { text: displayNameStr },
    location: location,
    formattedAddress: p.formattedAddress,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    photos: p.photos,
    photoUrl: photoUrl,
    regularOpeningHours: p.regularOpeningHours ? {
      openNow: isOpenNow,
      weekdayDescriptions: p.regularOpeningHours.weekdayDescriptions ?? null
    } : null,
    editorialSummary: p.editorialSummary?.text || p.editorialSummary || '',
    nationalPhoneNumber: p.nationalPhoneNumber,
    websiteURI: p.websiteURI ?? p.websiteUri ?? '',
    websiteUri: p.websiteUri ?? p.websiteURI ?? '',
    types: p.types ?? [],
    reviews: reviews,
    _isSerialized: true
  };
}

function ExploreApp({ isDarkMode, setIsDarkMode, user, onLogout, onUpdateUser }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void, user: UserSession, onLogout: () => void, onUpdateUser: (updated: UserSession) => void }) {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MAP);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [places, setPlaces] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const lastSearchLocation = useRef<google.maps.LatLngLiteral | null>(null);
  const lastCategory = useRef(activeCategory.id);

  const placesLib = useMapsLibrary('places');
  const map = useMap();

  // Load saved places from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved_places');
    if (saved) {
      try {
        setSavedPlaces(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved places', e);
      }
    }
  }, []);

  const savePlacesToStorage = (updatedSaved: any[]) => {
    setSavedPlaces(updatedSaved);
    localStorage.setItem('saved_places', JSON.stringify(updatedSaved));
  };

  const toggleSavePlace = (place: any) => {
    const isSaved = savedPlaces.some(p => p.id === place.id);
    if (isSaved) {
      savePlacesToStorage(savedPlaces.filter(p => p.id !== place.id));
    } else {
      savePlacesToStorage([...savedPlaces, place]);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation((prev) => {
            if (!prev) return loc;
            if (getDistance(prev, loc) > 5) return loc;
            return prev;
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError("Location access denied. Using fallback location.");
          // Default to Mountain View if blocked/error
          setUserLocation((prev) => prev || { lat: 37.4221, lng: -122.0841 });
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocation not supported by yours browser.");
      setUserLocation({ lat: 37.4221, lng: -122.0841 });
    }
  }, []);

  const fetchFieldsForPlaces = async (rawPlaces: any[]) => {
    if (!rawPlaces) return [];
    // Serialize each place and compute distance
    return rawPlaces.map(p => {
      const serialized = serializePlace(p);
      const distanceMeters = userLocation && serialized?.location ? getDistance(userLocation, serialized.location) : 0;
      return { ...serialized, distanceMeters };
    }).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  };

  const searchPlacesByText = async (query: string) => {
    if (!placesLib || !query || !userLocation) return;
    setIsLoading(true);
    setActiveTab(AppTab.LIST); // Switch to list to show variety
    try {
      const { places: rawPlaces } = await (placesLib.Place as any).searchByText({
        textQuery: query,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'photos', 'types', 'regularOpeningHours', 'editorialSummary', 'nationalPhoneNumber', 'websiteURI', 'reviews'],
        locationBias: { center: userLocation, radius: 5000 },
        maxResultCount: 20,
      });
      const validPlaces = (rawPlaces || []).filter((p: any) => p.id && p.location);
      const enriched = await fetchFieldsForPlaces(validPlaces);
      setPlaces(enriched);
      if (enriched.length > 0 && map) {
        const bounds = new google.maps.LatLngBounds();
        enriched.forEach((p: any) => p.location && bounds.extend(p.location));
        map.fitBounds(bounds);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchNearbyPlaces = async (category: typeof CATEGORIES[0]) => {
    if (!placesLib || !userLocation) return;
    setIsLoading(true);
    try {
      const { places: rawPlaces } = await (placesLib.Place as any).searchNearby({
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'photos', 'types', 'regularOpeningHours', 'editorialSummary', 'nationalPhoneNumber', 'websiteURI', 'reviews'],
        locationRestriction: { center: userLocation, radius: 2000 },
        includedPrimaryTypes: category.type as string[],
        maxResultCount: 20,
      });
      const validPlaces = (rawPlaces || []).filter((p: any) => p.id && p.location);
      const enriched = await fetchFieldsForPlaces(validPlaces);
      setPlaces(enriched);
      if (map) {
         map.panTo(userLocation);
         map.setZoom(14);
      }
    } catch (error) {
      console.error('Error searching nearby:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation && placesLib && !searchQuery) {
      const categoryChanged = lastCategory.current !== activeCategory.id;
      const movedEnough = !lastSearchLocation.current || getDistance(userLocation, lastSearchLocation.current) > 100;

      if (categoryChanged || movedEnough) {
        lastSearchLocation.current = userLocation;
        lastCategory.current = activeCategory.id;
        searchNearbyPlaces(activeCategory);
      }
    }
  }, [userLocation, activeCategory, placesLib, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Top Search Area */}
      {activeTab !== AppTab.SAVED && (
        <header className="fixed top-0 left-0 right-0 z-40 p-4 pt-10 md:pt-4 pointer-events-none">
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
            {/* Action Bar */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Search for places..."
                  className="w-full h-14 pl-12 pr-4 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-2xl shadow-xl border-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPlacesByText(searchQuery)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-14 h-14 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-2xl flex-shrink-0"
                title={`${user.name}'s Passport`}
              >
                {user.avatar}
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 -mx-4 px-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all shadow-md ${
                    activeCategory.id === cat.id && !searchQuery
                      ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <cat.icon size={16} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          {locationError && (
            <div className="max-w-2xl mx-auto w-full px-4 pt-2 -mb-2 pointer-events-auto">
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between">
                <span>{locationError}</span>
                <button onClick={() => setLocationError(null)} className="opacity-50 hover:opacity-100">✕</button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Content Area */}
      <main className="flex-1 relative flex flex-col">
        {activeTab === AppTab.MAP && (
          <div className="absolute inset-0 z-0">
            {userLocation && (
              <Map
                defaultCenter={userLocation}
                defaultZoom={14}
                mapId={DEMO_MAP_ID}
                disableDefaultUI={true}
                colorScheme={isDarkMode ? 'DARK' : 'LIGHT'}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* User Location Marker */}
                <AdvancedMarker position={userLocation}>
                  <div className="relative">
                    <div className="absolute -inset-3 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="relative bg-blue-600 w-5 h-5 rounded-full border-2 border-white shadow-xl"></div>
                  </div>
                </AdvancedMarker>

                {/* Place Markers */}
                {places.map((place) => (
                  <PlaceMarker 
                    key={place.id} 
                    place={place} 
                    isSelected={selectedPlace?.id === place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                    }}
                  />
                ))}

                {/* Driving directions path line overlay */}
                {selectedPlace && userLocation && (
                  <RouteDisplay 
                    origin={userLocation} 
                    destination={selectedPlace.location} 
                  />
                )}
              </Map>
            )}

            {/* Selection Effect */}
            <MapEffect selectedPlace={selectedPlace} />

            {/* Float Buttons */}
            <div className="absolute bottom-24 right-4 flex flex-col gap-3 z-30">
              <button 
                onClick={() => {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    map?.panTo(loc);
                  });
                }}
                className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all"
              >
                <LocateFixed size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Results List View */}
        {activeTab === AppTab.LIST && (
          <div className="absolute inset-0 overflow-y-auto pt-44 pb-24 px-4 md:px-0 scroll-smooth no-scrollbar">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-xl font-bold dark:text-gray-100 flex items-center justify-between">
                <span>Nearby {searchQuery ? `results for "${searchQuery}"` : activeCategory.label}</span>
                <span className="text-xs font-normal text-gray-400">{places.length} results</span>
              </h2>
              {places.length === 0 && !isLoading && (
                <div className="py-20 text-center text-gray-400">
                  <Compass size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No places found in this area.</p>
                </div>
              )}
              {places.map((place) => (
                <PlaceListCard 
                  key={place.id} 
                  place={place} 
                  isSaved={savedPlaces.some(p => p.id === place.id)}
                  onToggleSave={() => toggleSavePlace(place)}
                  onClick={() => {
                    setSelectedPlace(place);
                    setActiveTab(AppTab.MAP);
                  }}
                  onViewDetails={() => setSelectedPlace(place)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Saved Places View */}
        {activeTab === AppTab.SAVED && (
          <div className="absolute inset-0 overflow-y-auto pt-10 pb-24 px-4 md:px-0 transition-colors">
            <div className="max-w-2xl mx-auto space-y-4">
              <h1 className="text-3xl font-extrabold dark:text-gray-100 mb-8">Favorites</h1>
              {savedPlaces.length === 0 ? (
                <div className="py-32 text-center text-gray-400">
                  <Heart size={64} className="mx-auto mb-4 opacity-10" />
                  <p className="text-lg">You haven't saved any places yet.</p>
                  <p className="text-sm mt-2">Tap the heart icon to save places you love.</p>
                  <button 
                    onClick={() => setActiveTab(AppTab.MAP)}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Explore Nearby
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedPlaces.map((place) => (
                    <PlaceListCard 
                      key={place.id} 
                      place={place} 
                      isSaved={true}
                      onToggleSave={() => toggleSavePlace(place)}
                      onClick={() => {
                        setSelectedPlace(place);
                        setActiveTab(AppTab.MAP);
                      }}
                      onViewDetails={() => setSelectedPlace(place)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-around items-center z-50 transition-colors">
        <NavButton 
          active={activeTab === AppTab.MAP} 
          onClick={() => setActiveTab(AppTab.MAP)} 
          icon={MapIcon} 
          label="Explore" 
        />
        <NavButton 
          active={activeTab === AppTab.LIST} 
          onClick={() => setActiveTab(AppTab.LIST)} 
          icon={ListIcon} 
          label="List" 
        />
        <NavButton 
          active={activeTab === AppTab.SAVED} 
          onClick={() => setActiveTab(AppTab.SAVED)} 
          icon={Heart} 
          label="Saved" 
        />
      </nav>

      {/* Place Details Overlay */}
      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetails 
            place={selectedPlace} 
            isSaved={savedPlaces.some(p => p.id === selectedPlace.id)}
            onToggleSave={() => toggleSavePlace(selectedPlace)}
            onClose={() => setSelectedPlace(null)} 
            userLocation={userLocation}
            user={user}
          />
        )}
      </AnimatePresence>

      {/* User Profile Passport Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <UserProfileModal 
            user={user}
            savedCount={savedPlaces.length}
            onLogout={() => {
              setIsProfileOpen(false);
              onLogout();
            }}
            onClose={() => setIsProfileOpen(false)}
            onUpdateUser={onUpdateUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MapEffect({ selectedPlace }: { selectedPlace: any }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedPlace?.location) {
      map.panTo(selectedPlace.location);
      map.setZoom(17);
    }
  }, [map, selectedPlace]);

  return null;
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        active 
          ? 'text-blue-600 dark:text-blue-400 scale-110' 
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
      }`}
    >
      <Icon size={24} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function PlaceListCard({ place, isSaved, onToggleSave, onClick, onViewDetails }: any) {
  const photoUrl = useMemo(() => {
    if (place.photos && place.photos.length > 0) {
      try {
        return place.photos[0].getURI({ maxWidth: 400 });
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [place]);

  const isOpen = place.regularOpeningHours?.openNow;
  const name = place.displayName?.text || place.displayName || "Not available";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={onViewDetails}
    >
      <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
            <Camera size={32} />
          </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${
            isSaved 
              ? 'bg-rose-500 text-white shadow-lg' 
              : 'bg-white/70 dark:bg-black/40 text-gray-700 dark:text-gray-200 hover:scale-110'
          }`}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate pr-2 leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-sm font-bold text-amber-500 flex-shrink-0">
              <Star size={14} fill="currentColor" />
              <span>{place.rating || 'N/A'}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{place.formattedAddress || "No address available"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
              isOpen ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
            }`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">• {formatDistance(place.distanceMeters)} away</span>
          </div>
        </div>
        
        {place.location && (
          <div className="flex gap-2 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <MapIcon size={12} /> View on Map
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PlaceMarker({ place, isSelected, onClick }: any) {
  const [markerRef] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={place.location}
      onClick={onClick}
      title={place.displayName?.text || place.displayName || ''}
      zIndex={isSelected ? 100 : 1}
    >
      <div className={`transition-all duration-300 ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'}`}>
        <Pin 
          background={isSelected ? "#2563eb" : "#ffffff"} 
          glyphColor={isSelected ? "#ffffff" : "#2563eb"}
          borderColor={isSelected ? "#ffffff" : "#2563eb"}
          scale={isSelected ? 1.2 : 1}
        />
      </div>
    </AdvancedMarker>
  );
}

function PlaceDetails({ place, isSaved, onToggleSave, onClose, userLocation, user }: any) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const routesLib = useMapsLibrary('routes');

  // Interactive local review states
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Fetch local reviews matching this place.id
  useEffect(() => {
    try {
      const stored = localStorage.getItem('local_reviews_' + place.id);
      if (stored) {
        setLocalReviews(JSON.parse(stored));
      } else {
        setLocalReviews([]);
      }
    } catch (e) {
      console.error('Error fetching local reviews', e);
    }
    // Clean fields
    setNewRating(5);
    setReviewText('');
  }, [place.id]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newRevObj = {
      authorName: user?.name || 'Explorer Guest',
      authorPhoto: null,
      authorAvatar: user?.avatar || '🧭',
      rating: newRating,
      text: reviewText.trim(),
      relativePublishTimeDescription: 'Just now'
    };

    const updated = [newRevObj, ...localReviews];
    setLocalReviews(updated);
    localStorage.setItem('local_reviews_' + place.id, JSON.stringify(updated));

    // Increment profile statistics review counters
    try {
      const currentCount = parseInt(localStorage.getItem('user_reviews_count') || '0', 10);
      localStorage.setItem('user_reviews_count', (currentCount + 1).toString());
    } catch (err) {
      console.error(err);
    }

    setReviewText('');
    setNewRating(5);
  };

  const allReviews = useMemo(() => {
    return [...localReviews, ...(place.reviews || [])];
  }, [localReviews, place.reviews]);

  useEffect(() => {
    if (place.photos && place.photos.length > 0) {
      setPhotoUrl(place.photos[0].getURI({ maxWidth: 1000 }));
    } else {
      setPhotoUrl(place.photoUrl || null);
    }

    if (routesLib && userLocation && place.location) {
      routesLib.Route.computeRoutes({
        origin: userLocation,
        destination: place.location,
        travelMode: 'DRIVING',
        fields: ['distanceMeters'],
      }).then(({ routes }) => {
        if (routes?.[0]) {
          const distKm = (routes[0].distanceMeters || 0) / 1000;
          setDistance(distKm.toFixed(1) + ' km');
        }
      });
    }
  }, [place, routesLib, userLocation]);

  const handleDirections = () => {
    if (place.location) {
      const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
      const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const handlePhone = () => {
    if (place.nationalPhoneNumber) {
      window.location.href = `tel:${place.nationalPhoneNumber}`;
    }
  };

  const handleWebsite = () => {
    const website = place.websiteURI || place.websiteUri;
    if (website) {
      window.open(website, '_blank');
    }
  };

  const isOpen = place.regularOpeningHours?.openNow;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-[100] max-w-2xl mx-auto p-4 md:mb-6"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.3)] dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[85vh] flex flex-col transition-colors">
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto my-3 md:hidden flex-shrink-0"></div>
        
        <div className="overflow-y-auto flex-1 no-scrollbar p-1 pb-6">
          <div className="relative h-56 md:h-64 bg-gray-100 dark:bg-gray-800 rounded-2.5xl overflow-hidden m-2 shadow-inner">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={place.displayName?.text || place.displayName || ''} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-750">
                <Camera size={64} />
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={onToggleSave}
                className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all ${
                  isSaved ? 'bg-rose-500 text-white' : 'bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white'
                }`}
              >
                <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-900 dark:text-white rounded-full shadow-lg"
              >
                <ChevronRight className="rotate-90 md:rotate-0" size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    isOpen ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    <Clock size={10} />
                    {isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  {place.regularOpeningHours?.weekdayDescriptions && (
                    <span className="text-[10px] text-gray-400 font-medium font-sans">Verified hours</span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-gray-100 leading-tight">
                  {place.displayName?.text || place.displayName || "Not available"}
                </h2>
                <div className="flex items-center gap-1.5 mt-2 text-gray-500 dark:text-gray-400">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="text-sm line-clamp-1 font-medium">{place.formattedAddress || "No address available"}</span>
                </div>
              </div>
              {place.rating && (
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500 font-bold px-2.5 py-1 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm">{place.rating}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                    {place.userRatingCount || 'N/A'} votes
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button 
                onClick={handleDirections}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
              >
                <Navigation size={18} />
                Directions {distance && <span className="opacity-70 font-normal">({distance})</span>}
              </button>
              
              <button 
                onClick={onClose}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
              >
                <MapIcon size={18} />
                View on Map
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                {place.nationalPhoneNumber && (
                  <button 
                    onClick={handlePhone}
                    className="flex-1 sm:w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-750 active:scale-95 transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <Phone size={18} />
                  </button>
                )}
                {(place.websiteURI || place.websiteUri) && (
                  <button 
                    onClick={handleWebsite}
                    className="flex-1 sm:w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-750 active:scale-95 transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <Globe size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Interactive User Review Submission form */}
            <div className="mt-8 bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-3xl border border-blue-100/50 dark:border-blue-950/40">
              <h4 className="text-sm font-black text-gray-950 dark:text-gray-100 flex items-center gap-1.5 mb-2">
                <Star size={16} fill="currentColor" className="text-amber-500" />
                <span>Write a local review</span>
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 block">
                Sharing honest reviews helps other explorers choose the best route landmarks!
              </p>
              
              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* Visual rating scale */}
                <div className="flex items-center gap-1.5 select-none">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setNewRating(starIdx)}
                      className="text-amber-500 transition-transform active:scale-125 duration-100 focus:outline-none"
                    >
                      <Star size={22} fill={newRating >= starIdx ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 font-mono ml-2 uppercase">Score: {newRating}/5</span>
                </div>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tell us about food, vibes, pricing..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="flex-1 h-11 px-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!reviewText.trim()}
                    className="px-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold rounded-2.5xl transition-all active:scale-[0.97] flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Post Log
                  </button>
                </div>
              </form>
            </div>

            {/* Google Reviews listing */}
            <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-950 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span>Google & Explorer Reviews</span>
                <span className="text-xs font-medium text-gray-400">
                  ({allReviews.length})
                </span>
              </h3>
              
              {allReviews.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {allReviews.map((review: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2.5xl border border-gray-100 dark:border-gray-850/40 font-sans tracking-wide leading-relaxed">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          {review.authorAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-lg shadow-sm border border-blue-100 dark:border-blue-900/10">
                              {review.authorAvatar}
                            </div>
                          ) : review.authorPhoto ? (
                            <img 
                              src={review.authorPhoto} 
                              alt={review.authorName} 
                              className="w-8 h-8 rounded-full object-cover shadow-sm" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {review.authorName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-905 dark:text-gray-100 leading-tight">
                              {review.authorName}
                            </p>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">
                              {review.relativePublishTimeDescription}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs font-black">
                          <Star size={12} fill="currentColor" className="text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-mono">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic pr-1">
                        "{review.text}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-850">
                  <p className="text-xs text-gray-405 italic">No detailed reviews available for this place yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RouteDisplay({ origin, destination }: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 6,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    }).catch(err => {
      console.error("Error computing routes:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination]);

  return null;
}


import { useState, useMemo, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { 
  Search, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Maximize2, 
  X,
  Compass,
  Coffee,
  Check,
  RotateCcw,
  Navigation,
  DollarSign
} from 'lucide-react';
import { prismaClient } from '../lib/prisma';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isRecommended: boolean;
}

interface Cafe {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  ambiance: string;
  isSpacious: boolean;
  hasSmokingArea: boolean;
  googlePlaceId: string | null;
  rating: number | null;
  reviewsCount: number | null;
  priceRange: string | null;
  imageUrl: string | null;
  menus: MenuItem[];
}

interface HomeProps {
  cafes: Cafe[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const cafes = await prismaClient.cafe.findMany({
      include: {
        menus: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const serializedCafes = JSON.parse(JSON.stringify(cafes));

    return {
      props: {
        cafes: serializedCafes,
      },
    };
  } catch (error) {
    console.error('Error fetching cafes for homepage:', error);
    return {
      props: {
        cafes: [],
      },
    };
  }
};

// Haversine Formula helper to calculate distance in KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home({ cafes = [] }: HomeProps) {
  // Geolocation States
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [spaciousFilter, setSpaciousFilter] = useState(false);
  const [smokingFilter, setSmokingFilter] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(99999); // Radius filter in km
  const [sortBy, setSortBy] = useState<string>('name'); // 'name', 'rating', 'distance'
  
  // Accordion state
  const [expandedCafeId, setExpandedCafeId] = useState<string | null>(null);

  // Dynamic Location Service
  const enableGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: parseFloat(position.coords.latitude.toString()),
          longitude: parseFloat(position.coords.longitude.toString()),
        });
        setLoadingLocation(false);
        setSortBy('distance'); // Automatically switch sorting to distance
      },
      (error) => {
        console.warn('Geolocation error, falling back to Malioboro Jogja Center:', error.message);
        // Fallback to Yogyakarta Monument / Malioboro Center coordinates
        setUserCoords({
          latitude: parseFloat('-7.7972'),
          longitude: parseFloat('110.3688'),
        });
        setLocationError('Gagal mengakses GPS. Menggunakan titik pusat Malioboro Jogja.');
        setLoadingLocation(false);
        setSortBy('distance');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Reset Location
  const disableGeolocation = () => {
    setUserCoords(null);
    setLocationError(null);
    if (sortBy === 'distance') {
      setSortBy('name');
    }
  };

  // Reset all filters including proximity
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSpaciousFilter(false);
    setSmokingFilter(false);
    setMaxDistance(99999);
    disableGeolocation();
  };

  // Compile cafes with calculated distances if user location is available
  const cafesWithDistance = useMemo(() => {
    return cafes.map(cafe => {
      let distance: number | null = null;
      if (userCoords) {
        distance = calculateDistance(
          parseFloat(userCoords.latitude.toString()),
          parseFloat(userCoords.longitude.toString()),
          parseFloat(cafe.latitude.toString()),
          parseFloat(cafe.longitude.toString())
        );
      }
      return { ...cafe, distance };
    });
  }, [cafes, userCoords]);

  // Derived category list
  const categories = useMemo(() => {
    const cats = cafes.map(cafe => cafe.category.trim());
    const uniqueCats = Array.from(new Set(cats));
    return ['All', ...uniqueCats.sort()];
  }, [cafes]);

  // Counts of cafes in each category based on current filters (excluding category itself)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: cafesWithDistance.length };
    
    cafesWithDistance.forEach(cafe => {
      const matchesSearch = 
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.ambiance.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpacious = !spaciousFilter || cafe.isSpacious;
      const matchesSmoking = !smokingFilter || cafe.hasSmokingArea;
      const matchesDistance = !cafe.distance || cafe.distance <= maxDistance;

      if (matchesSearch && matchesSpacious && matchesSmoking && matchesDistance) {
        counts[cafe.category] = (counts[cafe.category] || 0) + 1;
      }
    });

    // Recalculate total "All" matching current filters
    const totalMatching = cafesWithDistance.filter(cafe => {
      const matchesSearch = 
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.ambiance.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpacious = !spaciousFilter || cafe.isSpacious;
      const matchesSmoking = !smokingFilter || cafe.hasSmokingArea;
      const matchesDistance = !cafe.distance || cafe.distance <= maxDistance;
      return matchesSearch && matchesSpacious && matchesSmoking && matchesDistance;
    }).length;

    counts['All'] = totalMatching;

    return counts;
  }, [cafesWithDistance, searchQuery, spaciousFilter, smokingFilter, maxDistance]);

  // Processed (filtered + sorted) cafes list
  const processedCafes = useMemo(() => {
    let result = cafesWithDistance.filter(cafe => {
      // 1. Search Query
      const matchesSearch = 
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cafe.ambiance.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category
      const matchesCategory = selectedCategory === 'All' || cafe.category === selectedCategory;

      // 3. Facility Toggles
      const matchesSpacious = !spaciousFilter || cafe.isSpacious;
      const matchesSmoking = !smokingFilter || cafe.hasSmokingArea;

      // 4. Proximity Radius (if user coordinates loaded)
      const matchesDistance = !cafe.distance || cafe.distance <= maxDistance;

      return matchesSearch && matchesCategory && matchesSpacious && matchesSmoking && matchesDistance;
    });

    // 5. Sorting
    return result.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance === null || a.distance === undefined) return 1;
        if (b.distance === null || b.distance === undefined) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'rating') {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA; // Descending
      }
      // Default: sort by name A-Z
      return a.name.localeCompare(b.name);
    });
  }, [cafesWithDistance, searchQuery, selectedCategory, spaciousFilter, smokingFilter, maxDistance, sortBy]);

  // Helper: Format Indonesian Rupiah
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper: Category colors
  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('wfc') || cat.includes('work') || cat.includes('study')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (cat.includes('24') || cat.includes('jam')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (cat.includes('aesthetic') || cat.includes('seni')) {
      return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
    }
    if (cat.includes('outdoor') || cat.includes('alam')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
    return 'bg-stone-500/10 text-stone-300 border-stone-500/30';
  };

  return (
    <>
      <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
        __html: JSON.stringify({
       "@context": "https://schema.org",
       "@type": "WebSite",
       "name": "Nongkui",
       "url": "https://nongkui.myvnc.com"
        }),
        }}
      />
        <title>Nongkui — Jogja Cafe Discovery Directory</title>
        <meta name="description" content="Temukan cafe terbaik untuk WFC, 24 Jam, Aesthetic, dan Outdoor di Yogyakarta. Lengkap dengan rating, menu, dan filter jarak terdekat." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://i.ibb.co.com/JwcVLyP3/location-1.png" type="image/png" />
      </Head>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-800/80 pb-8 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-coffee-500 to-coffee-700 rounded-xl shadow-lg shadow-coffee-900/30">
                <Coffee className="h-7 w-7 text-stone-100" />
              </div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl">
                nongkui<span className="text-coffee-400">.</span>
              </h1>
            </div>
            <p className="mt-2 text-stone-400 text-sm sm:text-base max-w-2xl">
              Temukan tempat nongkrong, WFC, atau cafe aesthetic terbaik dengan data terverifikasi di Daerah Istimewa Yogyakarta.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-2 text-xs sm:text-sm text-stone-300 font-medium glass-card">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{cafes.length} Cafe DIY Aktif</span>
          </div>
        </header>

        {/* PROXIMITY AND LOCATION TOAST ERROR */}
        {locationError && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in">
            <span className="flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0" />
              <span>{locationError}</span>
            </span>
            <button onClick={() => setLocationError(null)} className="text-amber-500 hover:text-amber-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SEARCH AND FILTERS BAR */}
        <section className="mb-10 p-6 rounded-2xl glass-card border border-stone-800/50 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-500" />
              <input
                type="text"
                placeholder="Cari nama cafe, lokasi, atau suasana (misal: 'tenang', 'Sleman')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-11 pr-10 py-3.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 transition-all text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Facility & Location Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              
              {/* Geolocation Button */}
              <button
                onClick={userCoords ? disableGeolocation : enableGeolocation}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 select-none w-full sm:w-auto justify-center ${
                  userCoords 
                    ? 'bg-moss-500/20 text-moss-300 border-moss-500 shadow-md' 
                    : 'bg-stone-950/40 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <Compass className={`h-4 w-4 ${loadingLocation ? 'animate-spin' : ''}`} />
                <span>{userCoords ? 'Lokasi Aktif' : 'Terdekat Saya'}</span>
                {userCoords && (
                  <span onClick={(e) => { e.stopPropagation(); disableGeolocation(); }} className="ml-1 p-0.5 rounded-full hover:bg-moss-500/20 text-moss-400">
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>

              {/* Spacious Toggle */}
              <button
                onClick={() => setSpaciousFilter(!spaciousFilter)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 select-none w-full sm:w-auto justify-center ${
                  spaciousFilter 
                    ? 'bg-coffee-500/20 text-coffee-300 border-coffee-500 shadow-md shadow-coffee-950/20' 
                    : 'bg-stone-950/40 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded border transition-all ${
                  spaciousFilter ? 'border-coffee-400 bg-coffee-500 text-stone-950' : 'border-stone-600'
                }`}>
                  {spaciousFilter && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <Maximize2 className="h-4 w-4" />
                <span>Spacious</span>
              </button>

              {/* Smoking Area Toggle */}
              <button
                onClick={() => setSmokingFilter(!smokingFilter)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 select-none w-full sm:w-auto justify-center ${
                  smokingFilter 
                    ? 'bg-coffee-500/20 text-coffee-300 border-coffee-500 shadow-md' 
                    : 'bg-stone-950/40 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <div className={`flex items-center justify-center w-4 h-4 rounded border transition-all ${
                  smokingFilter ? 'border-coffee-400 bg-coffee-500 text-stone-950' : 'border-stone-600'
                }`}>
                  {smokingFilter && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 14h15v3H2v-3zm17 0h3v3h-3v-3zM9 5c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5H9zm5 0c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5h-1zM4 5c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5H4z"/>
                </svg>
                <span>Smoking Area</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC PROXIMITY FILTERS (WHEN GEOLOCATION ACTIVE) */}
          {userCoords && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-stone-950/60 p-4 rounded-xl border border-stone-850 animate-fade-in text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-moss-400 animate-pulse" />
                <span className="font-semibold text-stone-300">Proximity Radius:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { label: 'Semua Jarak', value: 99999 },
                  { label: 'Dalam 2 km', value: 2 },
                  { label: 'Dalam 5 km', value: 5 },
                  { label: 'Dalam 10 km', value: 10 },
                  { label: 'Dalam 20 km', value: 20 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMaxDistance(option.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      maxDistance === option.value
                        ? 'bg-moss-500 text-stone-950 border-moss-400 font-bold'
                        : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="sm:ml-auto flex items-center gap-2">
                <span>Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-coffee-500 focus:outline-none"
                >
                  <option value="distance">Jarak Terdekat</option>
                  <option value="rating">Rating Tertinggi</option>
                  <option value="name">Nama (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* DYNAMIC SORT BAR (WHEN GEOLOCATION INACTIVE) */}
          {!userCoords && (
            <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-stone-500 pt-2 border-t border-stone-850/50">
              <span>Urutan Cafe:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-400 rounded px-2.5 py-1 focus:ring-1 focus:ring-coffee-500 focus:outline-none"
              >
                <option value="name">Nama (A-Z)</option>
                <option value="rating">Rating Tertinggi</option>
              </select>
            </div>
          )}

          {/* Category Chips Bar */}
          <div className="pt-2 border-t border-stone-850/50">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
              Kategori Cafe
            </span>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => {
                const count = categoryCounts[category] || 0;
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all duration-150 ${
                      isSelected
                        ? 'bg-coffee-500 text-stone-950 border-coffee-400 font-bold shadow-md shadow-coffee-950/30'
                        : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                    }`}
                  >
                    {category === 'All' ? 'Semua Kategori' : category}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                      isSelected ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-900 text-stone-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RESULTS STATS & ACTIVE FILTERS RESET */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-stone-400 text-sm">
            Menampilkan <span className="text-coffee-300 font-semibold">{processedCafes.length}</span> dari <span className="text-stone-300 font-medium">{cafes.length}</span> cafe
          </p>
          {(searchQuery || selectedCategory !== 'All' || spaciousFilter || smokingFilter || userCoords || maxDistance !== 99999) && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-coffee-400 hover:text-coffee-300 border border-coffee-500/20 hover:border-coffee-500/40 px-3 py-1.5 rounded-lg bg-coffee-500/5 transition-all"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* CAFE GRID */}
        {processedCafes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-slide-up">
            {processedCafes.map((cafe) => {
              const isExpanded = expandedCafeId === cafe.id;
              const hasRecommendedMenus = cafe.menus.some(m => m.isRecommended);
              
              return (
                <article 
                  key={cafe.id} 
                  className="flex flex-col rounded-2xl glass-card glass-card-hover overflow-hidden"
                >
                  {/* Image Header with Float Badges */}
                  <div className="relative h-48 overflow-hidden bg-stone-900 border-b border-stone-850">
                    <img 
                      src={cafe.imageUrl ? cafe.imageUrl.replace(/=w\d+(-h\d+)?(-[a-z0-9-]+)?$/, '=w1200-h800-p') : getRandomPlaceholderImage(cafe.name)} 
                      alt={cafe.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating Rating Badge */}
                    <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md border border-stone-800 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-400 flex items-center gap-1 shadow-md">
                      <span>★</span>
                      <span>{cafe.rating ? cafe.rating.toFixed(1) : '4.5'}</span>
                      {cafe.reviewsCount ? (
                        <span className="text-stone-500 font-normal">({cafe.reviewsCount})</span>
                      ) : (
                        <span className="text-stone-500 font-normal">(42)</span>
                      )}
                    </div>

                    {/* Floating Proximity Distance Badge */}
                    {cafe.distance !== null && (
                      <div className="absolute bottom-3 left-3 bg-moss-500 text-stone-950 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                        <Navigation className="h-3 w-3 fill-current" />
                        <span>
                          {cafe.distance < 1 
                            ? `${Math.round(cafe.distance * 1000)} meter` 
                            : `${cafe.distance.toFixed(1)} km`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Header & Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Name */}
                      <h3 className="text-lg font-display font-bold text-stone-100 line-clamp-1 group-hover:text-coffee-300">
                        {cafe.name}
                      </h3>
                      {/* Category Badge */}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${getCategoryColor(cafe.category)}`}>
                        {cafe.category}
                      </span>
                    </div>

                    {/* Operational Hours & Price Range */}
                    <div className="flex flex-col gap-1.5 mb-3 text-stone-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-coffee-400 shrink-0" />
                        <span className="line-clamp-1">{cafe.openingHours || 'Tidak tersedia data jam buka'}</span>
                      </div>
                      
                      {cafe.priceRange && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-coffee-400 shrink-0" />
                          <span className="line-clamp-1 text-stone-300 font-medium">Harga: {cafe.priceRange}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-stone-400 text-xs mb-4 flex-1">
                      <MapPin className="h-3.5 w-3.5 text-coffee-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{cafe.address}</span>
                    </div>

                    {/* Facilities visual indicators */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-850 mt-auto gap-4">
                      
                      {/* Spacious Indicator */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${
                          cafe.isSpacious 
                            ? 'bg-moss-500/10 text-moss-400 border-moss-500/30' 
                            : 'bg-stone-900/40 text-stone-600 border-stone-850'
                        }`}>
                          <Maximize2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-500 font-semibold uppercase leading-none">Spacious</span>
                          <span className={`text-[11px] font-bold ${cafe.isSpacious ? 'text-moss-400' : 'text-stone-600'}`}>
                            {cafe.isSpacious ? 'Ya (Luas)' : 'Terbatas'}
                          </span>
                        </div>
                      </div>

                      {/* Smoking Area Indicator */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${
                          cafe.hasSmokingArea 
                            ? 'bg-moss-500/10 text-moss-400 border-moss-500/30' 
                            : 'bg-stone-900/40 text-stone-600 border-stone-850'
                        }`}>
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 14h15v3H2v-3zm17 0h3v3h-3v-3zM9 5c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5H9zm5 0c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5h-1zM4 5c0 2-3 3-3 5h2c0-1.5 2-2.5 2-5H4z"/>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-500 font-semibold uppercase leading-none">Smoking</span>
                          <span className={`text-[11px] font-bold ${cafe.hasSmokingArea ? 'text-moss-400' : 'text-stone-600'}`}>
                            {cafe.hasSmokingArea ? 'Tersedia' : 'Tidak Ada'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex border-t border-stone-850/80 divide-x divide-stone-850/80">
                    {/* Google Maps Route Button */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(cafe.latitude.toString())},${parseFloat(cafe.longitude.toString())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3.5 bg-stone-950/20 hover:bg-stone-950/50 text-stone-400 hover:text-stone-200 transition-all text-xs font-semibold text-center select-none"
                    >
                      <Navigation className="h-3.5 w-3.5 fill-stone-400 hover:fill-stone-200 rotate-45" />
                      <span>Rute Lokasi</span>
                    </a>

                    {/* Menu Accordion Trigger Button */}
                    <button
                      onClick={() => setExpandedCafeId(isExpanded ? null : cafe.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3.5 transition-all text-xs font-semibold select-none ${
                        isExpanded 
                          ? 'bg-stone-950/80 text-coffee-300' 
                          : 'bg-stone-950/20 hover:bg-stone-950/50 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Menu ({cafe.menus.length})</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </button>
                  </div>

                  {/* Expanded Menu List */}
                  {isExpanded && (
                    <div className="bg-stone-950/95 border-t border-stone-900 px-6 py-4 space-y-3 max-h-60 overflow-y-auto animate-fade-in">
                      {cafe.menus.length > 0 ? (
                        <div className="divide-y divide-stone-900/50">
                          {cafe.menus.map((menu) => (
                            <div 
                              key={menu.id} 
                              className={`flex items-center justify-between py-2 text-xs ${
                                menu.isRecommended ? 'text-amber-300 font-medium' : 'text-stone-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 pr-4">
                                {menu.isRecommended && (
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                )}
                                <span>{menu.name}</span>
                              </div>
                              <span className="font-semibold shrink-0 text-stone-300 font-mono">
                                {formatPrice(menu.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-stone-500 text-xs py-2 italic text-center">
                          Daftar menu belum tersedia
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <section className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card rounded-3xl border border-stone-800/40">
            <div className="p-4 bg-stone-900/60 rounded-full border border-stone-800 text-stone-500 mb-4">
              <Compass className="h-10 w-10 animate-pulse-subtle" />
            </div>
            <h3 className="text-xl font-display font-bold text-stone-200">
              Tidak Ada Cafe yang Cocok
            </h3>
            <p className="mt-2 text-stone-500 text-sm max-w-sm leading-relaxed">
              Coba kurangi filter fasilitas, perkecil radius pencarian, atau ubah kata pencarian Anda.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 flex items-center gap-2 bg-coffee-500 hover:bg-coffee-600 active:scale-95 text-stone-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-coffee-950/20 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Atur Ulang Pencarian
            </button>
          </section>
        )}
      </div>
    </>
  );
}

// Global deterministic image helper
function getRandomPlaceholderImage(name: string) {
  const defaultImageUrls = [
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1200&auto=format&fit=crop"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % defaultImageUrls.length;
  return defaultImageUrls[index];
}

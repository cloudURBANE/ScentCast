import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherWidget } from './components/WeatherWidget';
import { FragranceCapture } from './components/FragranceCapture';
import { Wardrobe, Fragrance, DestinationType, EnergyState } from './components/Wardrobe';
import { Wind, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScentIntentModal } from './components/ScentIntentModal';
import { LavaBackground } from './components/LavaBackground';

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  icon: string;
  location?: string;
  isLive?: boolean;
  error?: string;
}

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 40 }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayedText}</span>;
};

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono tracking-widest text-2xl sm:text-4xl text-white">
      {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

export default function App() {
  const [items, setItems] = React.useState<Fragrance[]>([]);
  const [isIntentModalOpen, setIsIntentModalOpen] = React.useState(false);
  const [activeRecommendation, setActiveRecommendation] = React.useState<Fragrance | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const fetchWeather = React.useCallback(async (lat?: number, lon?: number) => {
    try {
      const url = lat && lon ? `/api/weather?lat=${lat}&lon=${lon}` : '/api/weather';
      const response = await axios.get(url);
      setWeather(response.data);
    } catch (err) {
      console.error("Failed to fetch weather", err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const requestLocation = () => {
    if (!navigator.geolocation) { return; }
    setLocationStatus('requesting');
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('granted');
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationStatus('denied');
        setWeatherLoading(false);
      },
      { timeout: 12000, enableHighAccuracy: false }
    );
  };

  const handleAddItem = (item: any) => {
    setItems((prev) => [{
      ...item,
      notes: item.notes || ['Bergamot', 'Ambroxan', 'Pink Pepper'],
      concentration: item.concentration || 'Eau de Parfum',
      intents: item.intents || item.context?.occasion || ['Going Out'],
      energies: item.energies || ['Calm'],
      performance: item.performance || { sillage: 6, longevity: 7 },
      pyramid: item.pyramid || { top: ['Bergamot', 'Pink Pepper'], heart: ['Lavender', 'Geranium'], base: ['Ambroxan', 'Patchouli'] },
      context: item.context || { weather: ['Universal'], time: ['Universal'], occasion: ['Daily Wear'] }
    }, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter(item => item.id !== id));
  };

  const handleIntentComplete = (intent: { destination: DestinationType; energy: EnergyState }) => {
    setIsIntentModalOpen(false);
    if (items.length === 0) return;
    const scores = items.map(item => {
      let score = 10;
      if (item.intents?.includes(intent.destination)) score += 50;
      if (item.energies?.includes(intent.energy)) score += 40;
      if (weather) {
        const temp = weather.temp;
        const cond = weather.condition.toLowerCase();
        if (temp > 75 && (item.family?.includes('Fresh') || item.family?.includes('Citrus'))) score += 30;
        if (temp < 65 && (item.family?.includes('Woody') || item.family?.includes('Oriental'))) score += 30;
        if (cond.includes('rain') && item.notes?.some(n => n.includes('Vetiver') || n.includes('Patchouli'))) score += 20;
      }
      if (intent.destination === 'Night Out' && (item.performance?.sillage || 0) >= 6) score += 25;
      if (intent.destination === 'Work' && (item.performance?.sillage || 0) <= 6) score += 25;
      return { item, score };
    });
    scores.sort((a, b) => b.score - a.score);
    setTimeout(() => setActiveRecommendation(scores[0].item), 800);
  };

  return (
    <div className="min-h-screen bg-black selection:bg-scent-accent selection:text-black text-white relative overflow-x-hidden">
      <LavaBackground />
      <nav className="fixed top-0 left-0 right-0 h-24 border-b border-white/5 bg-black/40 backdrop-blur-2xl z-50 px-8">
        <div className="max-w-[1400px] mx-auto h-full flex items-center relative">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Wind size={24} strokeWidth={1} className="text-white" />
            <h1 className="font-serif text-2xl italic tracking-tighter uppercase">Scent Cast</h1>
          </div>
          <div className="ml-auto">
            <button
              onClick={requestLocation}
              disabled={locationStatus === 'requesting' || locationStatus === 'granted'}
              title={locationStatus === 'granted' ? 'Location Active' : locationStatus === 'denied' ? 'Location Denied' : 'Sync Location'}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/30 transition-all disabled:cursor-default"
            >
              <span className={`w-2 h-2 rounded-full ${locationStatus === 'granted' ? 'bg-green-400' : locationStatus === 'requesting' ? 'bg-yellow-400 animate-pulse' : locationStatus === 'denied' ? 'bg-red-400' : 'bg-white/20'}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24" />

      <main className="pb-24 px-8 max-w-[1700px] mx-auto md:-mt-12 relative z-10">
        <div className="space-y-40">
          <div className="w-full">
            <div className="flex flex-col items-center justify-center space-y-16 pt-32 text-center">
              <header className="space-y-10 flex flex-col items-center">
                <div className="w-full max-w-4xl overflow-hidden py-4 border-y border-white/5 flex select-none relative group">
                  <div className="flex animate-infinite-scroll gap-20 text-[11px] uppercase font-bold tracking-[0.5em] text-scent-muted font-sans whitespace-nowrap">
                    {[...Array(4)].map((_, i) => (
                      <span key={i} className="flex items-center gap-20">
                        <span>Add scents to your vault to unlock discovery</span>
                        <span className="text-white/10">•</span>
                        <span>Analyze atmospheric nuance for the perfect wear</span>
                        <span className="text-white/10">•</span>
                        <span>Your signature scent is currently syncing with the environment</span>
                        <span className="text-white/10">•</span>
                      </span>
                    ))}
                  </div>
                  <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
                  <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />
                </div>
                <h2 className="font-serif italic text-2xl sm:text-4xl lg:text-7xl leading-tight text-white max-w-4xl tracking-tighter">Find your signature for the current atmosphere.</h2>
              </header>

              <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto">
                <div className="w-full max-w-2xl">
                  <FragranceCapture onAdd={handleAddItem} />
                </div>
                <button
                  onClick={() => {
                    if (items.length === 0) { alert("Your vault is empty! Add at least one fragrance to discover your match."); return; }
                    setIsIntentModalOpen(true);
                  }}
                  className="w-full max-w-2xl h-14 bg-white text-black flex items-center justify-center gap-6 hover:bg-neutral-200 transition-all group rounded-[1.25rem] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                >
                  <Play size={20} className="fill-current group-hover:scale-110 transition-transform" />
                  <span className="font-serif italic text-xl sm:text-2xl">Discover Your Signature Scent</span>
                </button>
              </div>
            </div>
          </div>

          <div className="py-20 border-y border-white/5 bg-transparent overflow-hidden flex select-none relative">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black via-black/40 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black via-black/40 to-transparent z-20 pointer-events-none" />
            <div className="flex animate-infinite-scroll-slow gap-40 text-[18px] uppercase tracking-tighter text-white/40 font-serif italic whitespace-nowrap items-center">
              {[...Array(6)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-scent-accent/20 text-[9px] font-bold tracking-[0.4em] font-sans uppercase">Chronos:</span>
                      <LiveClock />
                    </div>
                  </div>
                  <span className="opacity-5 font-sans font-thin text-3xl select-none mx-4">/</span>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-scent-accent/20 text-[9px] font-bold tracking-[0.4em] font-sans uppercase">Atmosphere:</span>
                      <span className="text-white text-3xl sm:text-5xl font-serif italic tracking-tighter">{weatherLoading ? <Typewriter text="Syncing..." speed={30} /> : weather?.temp != null ? `${Math.round(weather.temp)}°F` : '—'}</span>
                    </div>
                  </div>
                  <span className="opacity-5 font-sans font-thin text-3xl select-none mx-4">/</span>
                  {weather?.location && (
                    <>
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-scent-accent/20 text-[9px] font-bold tracking-[0.4em] font-sans uppercase">Coordinate:</span>
                          <span className="text-white text-3xl sm:text-5xl font-serif italic tracking-tighter">{weather.location}</span>
                        </div>
                      </div>
                      <span className="opacity-5 font-sans font-thin text-3xl select-none mx-4">/</span>
                    </>
                  )}
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-scent-accent/20 text-[9px] font-bold tracking-[0.4em] font-sans uppercase">Matrix:</span>
                      <span className="text-white text-3xl sm:text-5xl font-serif italic tracking-tighter">{weatherLoading ? <Typewriter text="Detecting..." speed={30} /> : weather?.condition ?? '—'}</span>
                    </div>
                  </div>
                  <span className="opacity-5 font-sans font-thin text-3xl select-none mx-4">/</span>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-scent-accent/20 text-[9px] font-bold tracking-[0.4em] font-sans uppercase">Saturation:</span>
                      <span className="text-white text-3xl sm:text-5xl font-serif italic tracking-tighter">{weatherLoading ? <Typewriter text="Measuring..." speed={30} /> : weather?.humidity != null ? `${weather.humidity}%` : '—'}</span>
                    </div>
                  </div>
                  <span className="opacity-5 font-sans font-thin text-3xl select-none mx-4">/</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="pt-32 border-t border-white/5">
            <Wardrobe items={items} onDelete={handleDeleteItem} featuredItem={activeRecommendation} />
          </div>
        </div>
      </main>

      <ScentIntentModal isOpen={isIntentModalOpen} onClose={() => setIsIntentModalOpen(false)} onComplete={handleIntentComplete} />

      <AnimatePresence>
        {activeRecommendation && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
          >
            <div className="max-w-2xl w-full text-center space-y-12 p-8 sm:p-20 relative bg-black border border-white/10 shadow-2xl">
              <button onClick={() => setActiveRecommendation(null)} className="absolute top-8 right-8 p-2 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X size={24} />
              </button>
              <header>
                <p className="text-[10px] uppercase tracking-[0.4em] text-scent-accent font-bold mb-6">Strategic Alignment Found</p>
                <h2 className="font-serif italic text-3xl sm:text-6xl mb-6">You should wear</h2>
                <div className="h-1 w-16 bg-scent-accent mx-auto" />
              </header>
              <div className="py-16 border-y border-white/10 group cursor-pointer" onClick={() => setActiveRecommendation(null)}>
                <p className="text-xl uppercase tracking-[0.2em] text-white/40 mb-4 font-serif">{activeRecommendation.brand}</p>
                <h3 className="font-serif italic text-4xl sm:text-8xl transition-transform group-hover:scale-105 text-white">{activeRecommendation.name}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-scent-muted mb-3 font-bold">Olfactory Reason</p>
                  <p className="text-sm italic text-scent-muted leading-relaxed">Matches your current energy state and atmospheric conditions perfectly.</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-scent-muted mb-3 font-bold">Concentration</p>
                  <p className="text-sm italic text-scent-muted leading-relaxed">{activeRecommendation.concentration || 'Eau de Parfum'}</p>
                </div>
              </div>
              <button onClick={() => setActiveRecommendation(null)} className="w-full py-5 bg-scent-accent text-white uppercase tracking-[0.3em] text-[10px] font-bold hover:opacity-90 transition-opacity">
                Confirm Alignment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/5 py-16 px-8 mt-24">
        <div className="max-w-[1400px] mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Wind size={18} />
            <p className="font-serif font-bold italic tracking-tighter uppercase">Scent Cast</p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-scent-muted">© 2026 Olfactory Intelligence Systems</p>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShieldCheck, Wind } from 'lucide-react';

export interface ScentVector {
  freshness: number;
  sweetness: number;
  woodiness: number;
  spice: number;
  warmth: number;
  musk: number;
}

export type DestinationType = 'Staying In' | 'Going Out' | 'Work' | 'Night Out';
export type EnergyState = 'Calm' | 'Focused' | 'Confident' | 'Social' | 'Relaxed';

export interface Fragrance {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  season: string;
  notes?: string[];
  concentration?: string;
  scent_vector?: ScentVector;
  intents?: DestinationType[];
  energies?: EnergyState[];
  family?: string;
  performance?: { sillage: number; longevity: number };
  pyramid?: { top: string[]; heart: string[]; base: string[] };
  context?: { weather: string[]; time: string[]; occasion: string[] };
}

export const Wardrobe: React.FC<{
  items: Fragrance[];
  onDelete: (id: string) => void;
  featuredItem?: Fragrance | null;
}> = ({ items, onDelete, featuredItem }) => {
  const [selectedItem, setSelectedItem] = React.useState<Fragrance | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = items.filter(item => {
    if (!item?.name || !item?.brand) return false;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.family?.toLowerCase().includes(q) ||
      item.notes?.some(note => note?.toLowerCase().includes(q))
    );
  });

  const itemsPerShelf = 4;
  const shelves = [];
  for (let i = 0; i < filteredItems.length; i += itemsPerShelf) {
    shelves.push(filteredItems.slice(i, i + itemsPerShelf));
  }

  return (
    <div className="relative">
      <div className="space-y-32 relative z-10">
        <div className="flex flex-col items-center justify-center text-center border-b border-white/5 pb-16 gap-12">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.6em] text-white/40 font-bold">Archives // Private Vault</p>
            <h2 className="font-serif italic text-4xl sm:text-6xl md:text-8xl text-white tracking-tighter">Vault of Aromas</h2>
          </div>
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Olfactory Data..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-none h-16 px-8 text-white font-sans text-sm focus:border-white/20 outline-none transition-all placeholder:text-white/10 uppercase tracking-widest"
              />
            </div>
            <span className="font-serif italic text-white/20 text-xl sm:text-3xl whitespace-nowrap">{filteredItems.length} ENTRIES</span>
          </div>
        </div>

        {!searchQuery && items.length >= 10 && featuredItem && (
          <section className="space-y-16 py-24 bg-gradient-to-b from-white/[0.03] to-transparent border-y border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="flex items-center gap-4 px-4 relative z-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="font-serif italic text-2xl text-white/60 tracking-[0.3em] uppercase">Tactical Selection</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="flex justify-center relative z-10">
              <div className="relative group max-w-sm w-full">
                <div className="pedestal p-1">
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="glass-acrylic glass-acrylic-animate rounded-scent p-20 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => setSelectedItem(featuredItem)}
                  >
                    <div className="absolute top-10 left-10 text-[9px] uppercase tracking-[0.6em] text-white/30 font-bold">Recommended Manifest</div>
                    <img src={featuredItem.imageUrl} alt={featuredItem.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000 brightness-[1.15] relative z-10" referrerPolicy="no-referrer" />
                    <div className="text-center mt-12 space-y-3">
                      <p className="text-[10px] uppercase text-white/50 tracking-[0.5em] font-bold font-sans">{featuredItem.brand}</p>
                      <h4 className="font-serif italic text-3xl sm:text-5xl text-white tracking-tighter">{featuredItem.name}</h4>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-32 pb-40">
          {shelves.length > 0 ? shelves.map((shelfItems, shelfIndex) => (
            <div key={shelfIndex} className="relative group/shelf">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24 mb-1">
                {shelfItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer relative"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="glass-acrylic glass-acrylic-animate rounded-scent transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-[0_30px_70px_rgba(255,255,255,0.1)] relative overflow-hidden">
                      <div className="aspect-[3/4] p-10 flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.05] pointer-events-none" />
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 brightness-[1.05] relative z-10" referrerPolicy="no-referrer" />
                        <div className="absolute bottom-8 left-8 right-8 text-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                          <p className="text-[9px] uppercase tracking-widest text-white/60 mb-1 leading-tight">{item.brand}</p>
                          <h4 className="font-serif italic text-lg text-white leading-tight">{item.name}</h4>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-6 space-y-1 transition-opacity duration-500 group-hover:opacity-30">
                      <p className="text-[8px] uppercase text-white/30 tracking-[0.4em] font-bold font-sans">{item.brand}</p>
                      <h3 className="font-serif italic text-xl text-white leading-tight uppercase tracking-tighter">{item.name}</h3>
                    </div>
                  </motion.div>
                ))}
                {shelfIndex === shelves.length - 1 && shelfItems.length < 4 && (
                  <div className="glass-acrylic rounded-scent aspect-[3/4] flex flex-col items-center justify-center p-8 text-center group cursor-pointer border-dashed border-white/10 hover:bg-white/5 transition-all">
                    <div className="w-12 h-12 border border-dashed border-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform mb-4">
                      <span className="text-white/20 text-3xl">+</span>
                    </div>
                    <p className="font-serif italic text-white/20 text-2xl tracking-tighter uppercase">Expand Archive</p>
                  </div>
                )}
              </div>
            </div>
          )) : !searchQuery && (
            <div className="py-40 text-center border border-dashed border-white/5 rounded-scent">
              <p className="font-serif italic text-4xl text-white/10">The vault is currently vacant</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-12 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
            <motion.div
              layoutId={`fragrance-${selectedItem.id}`}
              className="relative w-full h-full sm:h-auto sm:max-h-[85dvh] max-w-4xl bg-neutral-900 shadow-2xl rounded-none sm:rounded-[2rem] overflow-hidden flex flex-col border border-white/5"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 z-[120] p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all rounded-full border border-white/10 text-white group">
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-8 sm:p-12 md:p-20 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="max-w-2xl mx-auto space-y-12">
                  <header className="text-center space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.6em] text-scent-accent font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-scent-accent animate-pulse" />
                      Intelligence Profile // {selectedItem.id.slice(0, 10)}
                    </motion.div>
                    <div>
                      <h2 className="font-serif italic text-4xl sm:text-7xl lg:text-8xl leading-tight text-white tracking-tighter uppercase">{selectedItem.name}</h2>
                      <p className="text-2xl text-white/40 font-serif italic">{selectedItem.brand}</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/5">
                    {[
                      { label: 'Concentration', value: selectedItem.concentration || 'EDP' },
                      { label: 'Environment', value: selectedItem.season },
                      { label: 'Projection', value: `${selectedItem.performance?.sillage || 5}/10` },
                      { label: 'Chronos', value: `${selectedItem.performance?.longevity || 6}/10` },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center md:text-left">
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-bold mb-1">{label}</p>
                        <p className="font-serif italic text-2xl text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-10">
                    <div className="flex items-center gap-4">
                      <Wind size={16} className="text-white/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Molecular Hierarchy</p>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="space-y-8">
                      {(['top', 'heart', 'base'] as const).map((level) => {
                        const notes = selectedItem.pyramid?.[level] || [];
                        if (notes.length === 0) return null;
                        return (
                          <div key={level} className="flex flex-col sm:flex-row gap-4 sm:gap-12 items-start group">
                            <p className="w-16 text-[9px] uppercase tracking-[0.3em] text-scent-accent font-bold pt-2">{level}</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 flex-1">
                              {notes.map(note => (
                                <span key={note} className="text-xl sm:text-3xl italic text-white/80 font-serif hover:text-white transition-all cursor-default">{note}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-8 pt-4">
                    <div className="flex items-center gap-4">
                      <ShieldCheck size={16} className="text-white/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Vector Signature</p>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    {selectedItem.scent_vector && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                        {Object.entries(selectedItem.scent_vector).map(([key, value]) => (
                          <div key={key} className="group">
                            <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/20 mb-2 group-hover:text-white/40 transition-all font-bold">
                              <span>{key}</span>
                              <span className="text-scent-accent font-mono">{value}/10</span>
                            </div>
                            <div className="h-0.5 bg-white/5 w-full relative overflow-hidden">
                              <motion.div
                                initial={{ x: '-100%' }} animate={{ x: `${-100 + (value as number) * 10}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-scent-accent absolute inset-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 py-6 bg-white text-black uppercase tracking-[0.4em] text-[11px] font-bold hover:bg-scent-accent hover:text-black transition-all">
                      Initialize Synthesis
                    </button>
                    <button
                      onClick={() => { onDelete(selectedItem.id); setSelectedItem(null); }}
                      className="px-8 py-6 bg-transparent border border-white/10 text-white/20 uppercase tracking-[0.3em] text-[10px] font-bold hover:border-red-500/50 hover:text-red-500 transition-all flex items-center justify-center gap-3 group"
                    >
                      <Trash2 size={16} className="group-hover:animate-bounce" /> Wipe Record
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

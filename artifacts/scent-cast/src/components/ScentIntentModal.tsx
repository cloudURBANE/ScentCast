import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Home, Sunset, Briefcase, Moon, Coffee, Zap, Flame, Users, Bed } from 'lucide-react';
import { DestinationType, EnergyState } from './Wardrobe';

interface ScentIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (intent: { destination: DestinationType; energy: EnergyState }) => void;
}

const DESTINATIONS: { type: DestinationType; icon: any; desc: string }[] = [
  { type: 'Staying In', icon: Home, desc: 'Indoor sanctuary' },
  { type: 'Going Out', icon: Sunset, desc: 'The transition' },
  { type: 'Work', icon: Briefcase, desc: 'Professional focus' },
  { type: 'Night Out', icon: Moon, desc: 'Social engagement' },
];

const ENERGIES: { type: EnergyState; icon: any; desc: string }[] = [
  { type: 'Calm', icon: Coffee, desc: 'Subtle presence' },
  { type: 'Focused', icon: Zap, desc: 'Mental clarity' },
  { type: 'Confident', icon: Flame, desc: 'Bold signature' },
  { type: 'Social', icon: Users, desc: 'Magnetic aura' },
  { type: 'Relaxed', icon: Bed, desc: 'Personal ease' },
];

export const ScentIntentModal: React.FC<ScentIntentModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = React.useState(1);
  const [destination, setDestination] = React.useState<DestinationType | null>(null);
  const [energy, setEnergy] = React.useState<EnergyState | null>(null);

  const handleNext = () => {
    if (step === 1 && destination) setStep(2);
    else if (step === 2 && destination && energy) {
      onComplete({ destination, energy });
      setStep(1);
      setDestination(null);
      setEnergy(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-scent-bg/95 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          className="relative w-full max-w-xl bg-white border border-scent-border shadow-2xl overflow-hidden z-10"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-scent-bg transition-colors border border-scent-border z-10">
            <X size={20} />
          </button>
          <div className="p-8 sm:p-12">
            <div className="flex gap-2 mb-12">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 transition-colors ${s <= step ? 'bg-scent-accent' : 'bg-scent-bg'}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-scent-muted mb-2">Discovery Engine // Step 01</p>
                    <h2 className="font-serif italic text-4xl">What is your destination?</h2>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DESTINATIONS.map((d) => (
                      <button
                        type="button"
                        key={d.type}
                        onClick={() => setDestination(d.type)}
                        className={`p-6 border text-left flex items-start gap-4 transition-all ${destination === d.type ? 'border-scent-accent bg-scent-accent/5' : 'border-scent-border hover:border-scent-muted'}`}
                      >
                        <d.icon size={20} className={destination === d.type ? 'text-scent-accent' : 'text-scent-muted'} />
                        <div>
                          <p className={`font-serif italic text-lg ${destination === d.type ? 'text-scent-accent' : ''}`}>{d.type}</p>
                          <p className="text-[10px] uppercase tracking-wider text-scent-muted">{d.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-scent-muted mb-2">Discovery Engine // Step 02</p>
                    <h2 className="font-serif italic text-4xl">Define your energy state</h2>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ENERGIES.map((e) => (
                      <button
                        type="button"
                        key={e.type}
                        onClick={() => setEnergy(e.type)}
                        className={`p-6 border text-left flex items-start gap-4 transition-all ${energy === e.type ? 'border-scent-accent bg-scent-accent/5' : 'border-scent-border hover:border-scent-muted'}`}
                      >
                        <e.icon size={20} className={energy === e.type ? 'text-scent-accent' : 'text-scent-muted'} />
                        <div>
                          <p className={`font-serif italic text-lg ${energy === e.type ? 'text-scent-accent' : ''}`}>{e.type}</p>
                          <p className="text-[10px] uppercase tracking-wider text-scent-muted">{e.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-12 flex items-center justify-between">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="text-[10px] uppercase tracking-[0.2em] text-scent-muted hover:text-scent-accent transition-colors">
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={(step === 1 && !destination) || (step === 2 && !energy)}
                className="ml-auto px-8 py-4 bg-scent-accent text-white uppercase tracking-[0.2em] text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 hover:opacity-90 transition-all"
              >
                {step === 2 ? 'Find My Match' : 'Proceed'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

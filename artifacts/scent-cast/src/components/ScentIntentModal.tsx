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

  const handleClose = () => {
    onClose();
    setStep(1);
    setDestination(null);
    setEnergy(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white shadow-2xl overflow-hidden"
          style={{ zIndex: 1 }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-black/40 hover:text-black hover:bg-black/5 transition-colors border border-black/10 z-10"
          >
            <X size={20} />
          </button>
          <div className="p-8 sm:p-12">
            <div className="flex gap-2 mb-12">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-0.5 flex-1 transition-colors duration-300 ${s <= step ? 'bg-black' : 'bg-black/15'}`}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">Discovery Engine // Step 01</p>
                    <h2 className="font-serif italic text-4xl text-black">What is your destination?</h2>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DESTINATIONS.map((d) => (
                      <button
                        type="button"
                        key={d.type}
                        onClick={() => setDestination(d.type)}
                        className={`p-5 border text-left flex items-start gap-4 transition-all duration-200 active:scale-[0.98] ${
                          destination === d.type
                            ? 'border-black bg-black text-white'
                            : 'border-black/15 hover:border-black/40 text-black'
                        }`}
                      >
                        <d.icon size={20} className={destination === d.type ? 'text-white mt-0.5' : 'text-black/40 mt-0.5'} />
                        <div>
                          <p className={`font-serif italic text-lg leading-tight ${destination === d.type ? 'text-white' : 'text-black'}`}>
                            {d.type}
                          </p>
                          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${destination === d.type ? 'text-white/60' : 'text-black/40'}`}>
                            {d.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-black/40 mb-2">Discovery Engine // Step 02</p>
                    <h2 className="font-serif italic text-4xl text-black">Define your energy state</h2>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ENERGIES.map((e) => (
                      <button
                        type="button"
                        key={e.type}
                        onClick={() => setEnergy(e.type)}
                        className={`p-5 border text-left flex items-start gap-4 transition-all duration-200 active:scale-[0.98] ${
                          energy === e.type
                            ? 'border-black bg-black text-white'
                            : 'border-black/15 hover:border-black/40 text-black'
                        }`}
                      >
                        <e.icon size={20} className={energy === e.type ? 'text-white mt-0.5' : 'text-black/40 mt-0.5'} />
                        <div>
                          <p className={`font-serif italic text-lg leading-tight ${energy === e.type ? 'text-white' : 'text-black'}`}>
                            {e.type}
                          </p>
                          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${energy === e.type ? 'text-white/60' : 'text-black/40'}`}>
                            {e.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-10 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-[10px] uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && !destination) || (step === 2 && !energy)}
                className="ml-auto px-8 py-4 bg-black text-white uppercase tracking-[0.2em] text-[10px] font-bold disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
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

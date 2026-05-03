import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Home, Sunset, Briefcase, Moon, Coffee, Zap, Flame, Users, Bed } from 'lucide-react';
import { DestinationType, EnergyState } from './Wardrobe';

interface ScentIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (intent: { destination: DestinationType; energy: EnergyState }) => void;
}

const DESTINATIONS: { type: DestinationType; icon: React.ElementType; desc: string }[] = [
  { type: 'Staying In', icon: Home, desc: 'Indoor sanctuary' },
  { type: 'Going Out', icon: Sunset, desc: 'The transition' },
  { type: 'Work', icon: Briefcase, desc: 'Professional focus' },
  { type: 'Night Out', icon: Moon, desc: 'Social engagement' },
];

const ENERGIES: { type: EnergyState; icon: React.ElementType; desc: string }[] = [
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
    if (step === 1 && destination) {
      setStep(2);
    } else if (step === 2 && destination && energy) {
      onComplete({ destination, energy });
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setDestination(null);
      setEnergy(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        />

        {/* Modal card — matches bg-black border border-white/10 pattern */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-black border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Close button — exact pattern from recommendation overlay */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-12">
            {/* Step counter label */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">
                Discovery Engine // Step 0{step} of 02
              </p>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mb-10">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-px flex-1 transition-all duration-500 ${s <= step ? 'bg-white' : 'bg-white/10'}`}
                />
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  <header>
                    <h2 className="font-serif italic text-3xl sm:text-4xl text-white tracking-tighter">
                      What is your destination?
                    </h2>
                    <p className="text-sm text-white/30 font-sans mt-2">
                      Select the context for your day.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DESTINATIONS.map((d) => {
                      const Icon = d.icon;
                      const selected = destination === d.type;
                      return (
                        <button
                          type="button"
                          key={d.type}
                          onClick={() => setDestination(d.type)}
                          className={`p-5 border text-left flex items-start gap-4 transition-all duration-200 active:scale-[0.97] group ${
                            selected
                              ? 'bg-white border-white'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
                          }`}
                        >
                          <Icon
                            size={18}
                            className={`mt-0.5 shrink-0 ${selected ? 'text-black' : 'text-white/30 group-hover:text-white/60'}`}
                          />
                          <div>
                            <p className={`font-serif italic text-lg leading-tight ${selected ? 'text-black' : 'text-white'}`}>
                              {d.type}
                            </p>
                            <p className={`text-[10px] uppercase tracking-[0.2em] mt-0.5 ${selected ? 'text-black/50' : 'text-white/30'}`}>
                              {d.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  <header>
                    <h2 className="font-serif italic text-3xl sm:text-4xl text-white tracking-tighter">
                      Define your energy state
                    </h2>
                    <p className="text-sm text-white/30 font-sans mt-2">
                      How do you want to be perceived today?
                    </p>
                  </header>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ENERGIES.map((e) => {
                      const Icon = e.icon;
                      const selected = energy === e.type;
                      return (
                        <button
                          type="button"
                          key={e.type}
                          onClick={() => setEnergy(e.type)}
                          className={`p-5 border text-left flex items-start gap-4 transition-all duration-200 active:scale-[0.97] group ${
                            selected
                              ? 'bg-white border-white'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
                          }`}
                        >
                          <Icon
                            size={18}
                            className={`mt-0.5 shrink-0 ${selected ? 'text-black' : 'text-white/30 group-hover:text-white/60'}`}
                          />
                          <div>
                            <p className={`font-serif italic text-lg leading-tight ${selected ? 'text-black' : 'text-white'}`}>
                              {e.type}
                            </p>
                            <p className={`text-[10px] uppercase tracking-[0.2em] mt-0.5 ${selected ? 'text-black/50' : 'text-white/30'}`}>
                              {e.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer actions */}
            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Primary CTA — exact pattern: bg-white text-black uppercase tracking */}
              <button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && !destination) || (step === 2 && !energy)}
                className="px-8 py-4 bg-white text-black uppercase tracking-[0.3em] text-[10px] font-bold disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
              >
                {step === 2 ? 'Find My Match' : 'Proceed'}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

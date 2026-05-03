import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onAuth: (token: string, email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      onAuth(data.token, data.email);
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-8"
      >
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-2 opacity-60">
            <Wind size={20} strokeWidth={1} />
            <span className="font-serif italic text-xl tracking-tighter uppercase text-white">Scent Cast</span>
          </div>

          <div className="text-center space-y-3">
            <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Olfactory Intelligence</p>
            <h1 className="font-serif italic text-4xl sm:text-5xl text-white tracking-tighter leading-tight">
              Enter your email<br />to access your vault
            </h1>
            <p className="text-sm text-white/30 font-sans">No password required. Your fragrances are saved to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                autoFocus
                className="w-full h-14 bg-white/[0.04] border border-white/10 pl-12 pr-6 text-white placeholder:text-white/20 font-sans text-sm outline-none focus:border-white/30 transition-all rounded-2xl"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center font-sans">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black font-serif italic text-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all disabled:opacity-50 rounded-2xl"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Access Vault</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

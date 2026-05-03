import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  authToken: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, userId, authToken }) => {
  const [hideImages, setHideImages] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const shareUrl = userId
    ? `${window.location.origin}/share/${userId}`
    : '';

  useEffect(() => {
    if (!isOpen || !authToken) return;
    setLoading(true);
    fetch('/api/share-settings', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(d => { if (typeof d.hideImages === 'boolean') setHideImages(d.hideImages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, authToken]);

  const handleToggleHideImages = async (val: boolean) => {
    setHideImages(val);
    setSaving(true);
    try {
      await fetch('/api/share-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ hideImages: val }),
      });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md mx-6 bg-neutral-900 border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-scent-accent animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.5em] text-scent-accent font-bold">Share Vault</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 transition-all rounded-full border border-white/10 text-white group"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">Your Share Link</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/[0.03] border border-white/10 px-4 py-3 text-[11px] text-white/50 font-mono truncate rounded-none select-all">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-3 bg-white text-black text-[9px] uppercase tracking-[0.3em] font-bold flex items-center gap-2 hover:bg-white/90 active:scale-[0.97] transition-all shrink-0"
                  >
                    {copied ? <><Check size={11} /> Copied</> : <><Link size={11} /> Copy</>}
                  </button>
                </div>
              </div>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-[9px] uppercase tracking-[0.35em] font-bold"
              >
                <ExternalLink size={11} />
                Preview Your Vault
              </a>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">Visibility Settings</p>
                {loading ? (
                  <div className="h-12 bg-white/[0.02] animate-pulse rounded-none" />
                ) : (
                  <button
                    onClick={() => handleToggleHideImages(!hideImages)}
                    disabled={saving}
                    className="flex items-center justify-between w-full px-4 py-4 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {hideImages ? (
                        <EyeOff size={14} className="text-white/40 shrink-0" />
                      ) : (
                        <Eye size={14} className="text-white/40 shrink-0" />
                      )}
                      <div className="text-left">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">
                          {hideImages ? 'Images Hidden' : 'Images Visible'}
                        </p>
                        <p className="text-[9px] text-white/25 mt-0.5">
                          {hideImages ? 'Share page shows names only' : 'Bottle images shown on share page'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${hideImages ? 'bg-scent-accent' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${hideImages ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </button>
                )}
              </div>

              <p className="text-[9px] text-white/20 text-center leading-relaxed">
                Anyone with this link can view your vault. They can click any fragrance to find it on Amazon.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

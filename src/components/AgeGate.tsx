import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('age-verified');
    if (!verified) {
      setIsVisible(true);
    } else {
      setHasVerified(true);
    }
  }, []);

  const handleVerify = (isOldEnough: boolean) => {
    if (isOldEnough) {
      localStorage.setItem('age-verified', 'true');
      // Set a cookie for server-side enforcement if needed
      document.cookie = "age_verified=true; path=/; max-age=31536000; SameSite=Lax";
      setIsVisible(false);
      setHasVerified(true);
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-primary">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-xl p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-muted rounded-full opacity-50" />
          
          <div className="relative z-10 text-center">
            <div className="inline-flex p-4 bg-brand-accent text-white rounded-full mb-8">
              <ShieldAlert size={32} />
            </div>
            
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-brand-primary">
              Age Verification Required
            </h2>
            
            <p className="text-gray-500 font-medium mb-12 leading-relaxed">
              You must be at least <span className="text-brand-accent font-bold">21 years of age</span> to enter this site. 
              By clicking enter, you verify that you are of legal age to view and purchase firearms in your jurisdiction.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => handleVerify(true)}
                className="btn-primary py-4 flex items-center justify-center space-x-2 group"
              >
                <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                <span>I am 21 or older</span>
              </button>
              <button 
                onClick={() => handleVerify(false)}
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-400 font-black uppercase tracking-widest text-xs hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center space-x-2 group"
              >
                <XCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span>I am under 21</span>
              </button>
            </div>
            
            <p className="mt-12 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
              Uncompromising Quality • Unwavering Compliance
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

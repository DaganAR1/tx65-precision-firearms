import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  containerClassName?: string;
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = 'https://picsum.photos/seed/65guns/800/600',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setError(true);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", containerClassName)}>
      <AnimatePresence mode="wait">
        {!isLoaded && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 skeleton"
          />
        )}
      </AnimatePresence>

      <motion.img
        src={error ? fallbackSrc : src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full h-full object-cover",
          className
        )}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};

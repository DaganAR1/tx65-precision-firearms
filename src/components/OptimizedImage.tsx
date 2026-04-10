import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  fallbackColor?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  fallbackColor = 'bg-gray-100',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter out standard img props that might conflict with motion props if needed,
  // but usually just spreading is fine if types are aligned.
  // The error suggests a conflict between React's AnimationEventHandler and Motion's.
  
  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Placeholder/Loading State */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn("absolute inset-0 z-10", fallbackColor)}
          />
        )}
      </AnimatePresence>

      <motion.img
        {...(props as any)}
        src={src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onLoad={() => setIsLoaded(true)}
        className={cn(className)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

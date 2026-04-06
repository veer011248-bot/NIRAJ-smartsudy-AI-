import React from 'react';
import { Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  rounded?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = "", rounded = "rounded-xl" }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 32
  };

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center ${rounded} bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 border border-white/20 overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
      </div>
      
      {/* Main Icon */}
      <motion.div
        animate={{ 
          y: [0, -2, 0],
          rotate: [0, 2, 0, -2, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 text-white"
      >
        <Bot size={iconSizes[size]} strokeWidth={2.5} />
      </motion.div>

      {/* Decorative Sparkle */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1 right-1 z-20 text-yellow-300"
      >
        <Sparkles size={iconSizes[size] / 2} />
      </motion.div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};

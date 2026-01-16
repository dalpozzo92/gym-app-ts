import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';

type CircularProgressProps = {
  percentage?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  text?: ReactNode;
  duration?: number;
};

// Funzione per ottenere il colore progressivo in base alla percentuale
const getProgressiveColor = (percentage: number): string => {
  if (percentage <= 25) {
    return '#ef4444'; // rosso
  } else if (percentage <= 50) {
    return '#f97316'; // arancione
  } else if (percentage <= 99) {
    return '#eab308'; // giallo
  } else {
    return '#22c55e'; // verde
  }
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage = 0,
  size = 120,
  strokeWidth = 8,
  color = 'var(--ion-color-primary)',
  backgroundColor = 'rgba(var(--ion-color-primary-rgb), 0.1)',
  showText = true,
  text,
  duration = 1.5
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determina il colore finale da usare
  const finalColor = React.useMemo(() => {
    if (color === 'progressColor') return getProgressiveColor(percentage);
    if (color === 'primary') return 'var(--ion-color-primary)';
    if (color === 'secondary') return 'var(--ion-color-secondary)';
    if (color === 'tertiary') return 'var(--ion-color-tertiary)';
    if (color === 'success') return 'var(--ion-color-success)';
    if (color === 'warning') return 'var(--ion-color-warning)';
    if (color === 'danger') return 'var(--ion-color-danger)';
    if (color === 'medium') return 'var(--ion-color-medium)';
    if (color === 'light') return 'var(--ion-color-light)';
    if (color === 'dark') return 'var(--ion-color-dark)';
    return color;
  }, [color, percentage]);

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={finalColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration,
            ease: "easeInOut"
          }}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(var(--ion-color-primary-rgb), 0.3))'
          }}
        />
      </svg>

      {showText && (
        <div className="circular-progress-text">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {text || `${Math.round(percentage)}%`}
          </motion.span>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;

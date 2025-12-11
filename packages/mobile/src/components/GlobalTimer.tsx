import React from 'react';
import { IonIcon, IonProgressBar } from '@ionic/react';
import { chevronDownOutline, stopOutline } from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '@/contexts/TimerContext';

const GlobalTimer: React.FC = () => {
  const { activeTimer, resetTimer, isTimerVisible, setTimerVisible } = useTimer();

  // Non mostrare nulla se non c'è un timer attivo
  if (!activeTimer) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = (activeTimer.initialSeconds - activeTimer.timeLeft) / activeTimer.initialSeconds;

  return (
    <AnimatePresence>
      {isTimerVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))', // Sopra il TabBar
            left: '16px',
            right: '16px',
            zIndex: 998,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: 'rgba(var(--ion-background-color-rgb), 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(var(--ion-color-primary-rgb), 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            {/* Timer display */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}
              >
                {formatTime(activeTimer.timeLeft)}
              </div>
              <IonProgressBar
                value={progress}
                color="primary"
                style={{
                  height: '4px',
                  borderRadius: '2px'
                }}
              />
            </div>

            {/* Bottone stop */}
            <button
              onClick={() => resetTimer(activeTimer.timerId)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(var(--ion-color-danger-rgb), 0.1)',
                border: '1px solid rgba(var(--ion-color-danger-rgb), 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <IonIcon
                icon={stopOutline}
                style={{
                  fontSize: '20px',
                  color: 'var(--ion-color-danger)'
                }}
              />
            </button>

            {/* Bottone nascondi */}
            <button
              onClick={() => setTimerVisible(false)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(var(--ion-color-medium-rgb), 0.1)',
                border: '1px solid rgba(var(--ion-color-medium-rgb), 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <IonIcon
                icon={chevronDownOutline}
                style={{
                  fontSize: '20px',
                  color: 'var(--ion-color-medium)'
                }}
              />
            </button>
          </div>
        </motion.div>
      )}

      {/* Floating button quando nascosto */}
      {!isTimerVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setTimerVisible(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))',
            right: '16px',
            zIndex: 998,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--ion-color-primary)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            fontWeight: '700',
            fontSize: '0.9rem'
          }}
        >
          {formatTime(activeTimer.timeLeft)}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default GlobalTimer;

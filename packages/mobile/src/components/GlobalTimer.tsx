import React, { useEffect, useRef } from 'react';
import { IonIcon, IonProgressBar, createAnimation } from '@ionic/react';
import { chevronDownOutline, stopOutline } from 'ionicons/icons';
import { useTimer } from '@/contexts/TimerContext';

const GlobalTimer: React.FC = () => {
  const { activeTimer, resetTimer, isTimerVisible, setTimerVisible } = useTimer();
  const expandedTimerRef = useRef<HTMLDivElement>(null);
  const floatingButtonRef = useRef<HTMLButtonElement>(null);

  // Animazioni per expanded timer
  useEffect(() => {
    if (!activeTimer) {
      // Se non c'è timer, nascondi immediatamente
      if (expandedTimerRef.current) {
        expandedTimerRef.current.style.display = 'none';
      }
      return;
    }

    if (expandedTimerRef.current) {
      if (isTimerVisible) {
        expandedTimerRef.current.style.display = 'flex';
        const animation = createAnimation()
          .addElement(expandedTimerRef.current)
          .duration(300)
          .easing('ease-out')
          .fromTo('transform', 'translateY(100px)', 'translateY(0)')
          .fromTo('opacity', '0', '1');
        animation.play();
      } else {
        const animation = createAnimation()
          .addElement(expandedTimerRef.current)
          .duration(250)
          .easing('ease-in')
          .fromTo('transform', 'translateY(0)', 'translateY(100px)')
          .fromTo('opacity', '1', '0');
        animation.play().then(() => {
          if (expandedTimerRef.current) {
            expandedTimerRef.current.style.display = 'none';
          }
        });
      }
    }
  }, [isTimerVisible]);

  // Animazioni per floating button
  useEffect(() => {
    if (!activeTimer) {
      // Se non c'è timer, nascondi immediatamente
      if (floatingButtonRef.current) {
        floatingButtonRef.current.style.display = 'none';
      }
      return;
    }

    if (floatingButtonRef.current) {
      if (!isTimerVisible) {
        floatingButtonRef.current.style.display = 'flex';
        const animation = createAnimation()
          .addElement(floatingButtonRef.current)
          .duration(250)
          .easing('ease-out')
          .fromTo('transform', 'scale(0)', 'scale(1)')
          .fromTo('opacity', '0', '1');
        animation.play();
      } else {
        const animation = createAnimation()
          .addElement(floatingButtonRef.current)
          .duration(200)
          .easing('ease-in')
          .fromTo('transform', 'scale(1)', 'scale(0)')
          .fromTo('opacity', '1', '0');
        animation.play().then(() => {
          if (floatingButtonRef.current) {
            floatingButtonRef.current.style.display = 'none';
          }
        });
      }
    }
  }, [isTimerVisible]);

  // Non mostrare nulla se non c'è un timer attivo
  if (!activeTimer) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = (activeTimer.initialSeconds - activeTimer.timeLeft) / activeTimer.initialSeconds;

  return (
    <>
      {/* Expanded Timer */}
      <div
        ref={expandedTimerRef}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))',
          left: '16px',
          right: '16px',
          zIndex: 10000000,
          display: isTimerVisible ? 'flex' : 'none',
          justifyContent: 'center'
        }}
      >
          <div
            style={{
              background: 'rgba(var(--ion-background-color-rgb), 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '50px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(var(--ion-color-primary-rgb), 0.1)',
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
      </div>

      {/* Floating button quando nascosto */}
      <button
        ref={floatingButtonRef}
        onClick={() => setTimerVisible(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + max(8px, env(safe-area-inset-bottom)))',
          right: '16px',
          zIndex: 10000000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--ion-color-primary)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4)',
          display: !isTimerVisible ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          fontWeight: '700',
          fontSize: '0.9rem'
        }}
      >
        {formatTime(activeTimer.timeLeft)}
      </button>
    </>
  );
};

export default GlobalTimer;

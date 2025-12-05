import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LoaderSize = 'small' | 'medium' | 'large';

type BilanciereLoaderProps = {
  show?: boolean;
  size?: LoaderSize | string;
  speed?: number;
  message?: string;
  onComplete?: ((cycle: number) => void) | null;
  autoHide?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  color?: string;
  backgroundColor?: string;
  discsColors?: string[] | null;
  fadeInDuration?: number;
  inline?: boolean; // NEW: for compact inline mode
};

const BilanciereLoader: React.FC<BilanciereLoaderProps> = ({
  show = true,
  size = "small",
  speed = 1,
  message = "",
  onComplete = null,
  autoHide = false,
  showProgress = false,
  progressValue = 0,
  inline = true // Default to compact inline mode
}) => {
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);

  // Configurazioni per diverse dimensioni
  const sizeConfigs: Record<string, {
    container: { width: number; height: number };
    bar: { width: number; height: number };
    bigDisc: { width: number; height: number };
    smallDisc: { width: number; height: number };
  }> = {
    small: {
      container: { width: 200, height: 40 },
      bar: { width: 60, height: 2 },
      bigDisc: { width: 5, height: 30 },
      smallDisc: { width: 3, height: 20 }
    },
    medium: {
      container: { width: 300, height: 60 },
      bar: { width: 150, height: 5 },
      bigDisc: { width: 16, height: 50 },
      smallDisc: { width: 10, height: 35 }
    },
    large: {
      container: { width: 400, height: 80 },
      bar: { width: 200, height: 7 },
      bigDisc: { width: 20, height: 65 },
      smallDisc: { width: 14, height: 45 }
    }
  };

  const config = sizeConfigs[size] || sizeConfigs.medium;

  // Posizioni per ogni disco in ogni fase (come nel tuo codice originale)
  const getPositions = () => {
    const centerX = config.container.width / 2;
    const barHalfWidth = config.bar.width / 2 - 10;

    return {
      // Fase 0: Tutti fuori schermo
      offscreen: {
        bigLeft: centerX - barHalfWidth - 30,
        bigRight: centerX + barHalfWidth + 30,
        smallLeft: centerX - barHalfWidth - 40,
        smallRight: centerX + barHalfWidth + 40
      },
      // Fase 1: Dischi grandi caricati (infilati centralmente)
      bigLoaded: {
        bigLeft: centerX - barHalfWidth - config.bigDisc.width,
        bigRight: centerX + barHalfWidth,
        smallLeft: centerX - barHalfWidth - 40,
        smallRight: centerX + barHalfWidth + 40,
      },
      // Fase 2: Tutti i dischi caricati (infilati centralmente)
      allLoaded: {
        bigLeft: centerX - barHalfWidth - config.bigDisc.width,
        bigRight: centerX + barHalfWidth,
        smallLeft: centerX - barHalfWidth - config.bigDisc.width - config.smallDisc.width - 2,
        smallRight: centerX + barHalfWidth + config.bigDisc.width + 2,
      },
      // Fase 3: Dischi piccoli appena fuori
      smallOut: {
        bigLeft: centerX - barHalfWidth - config.bigDisc.width,
        bigRight: centerX + barHalfWidth,
        smallLeft: centerX - barHalfWidth - 40,
        smallRight: centerX + barHalfWidth + 40,
      },
      // Fase 4: Tutti appena fuori
      allOut: {
        bigLeft: centerX - barHalfWidth - 30,
        bigRight: centerX + barHalfWidth + 30,
        smallLeft: centerX - barHalfWidth - 40,
        smallRight: centerX + barHalfWidth + 40,
      },
    };
  };

  const positions = getPositions();

  // Ciclo di animazione (la tua sequenza originale)
  useEffect(() => {
    if (!show) return;

    const baseSequence = [
      { phase: 0, duration: 300 },   // Start - tutti fuori
      { phase: 1, duration: 800 },   // Carica dischi grandi
      { phase: 2, duration: 500 },   // Carica dischi piccoli
      { phase: 2, duration: 800 },  // Pausa con tutti caricati
      { phase: 3, duration: 600 },   // Dischi piccoli escono
      { phase: 4, duration: 600 },   // Dischi grandi escono
      { phase: 4, duration: 300 },   // Pausa con tutti fuori
      { phase: 0, duration: 100 },   // Reset veloce
    ];

    // Aggiusta durate basate sulla velocità
    const adjustedSequence = baseSequence.map(step => ({
      ...step,
      duration: Math.max(step.duration / speed, 100)
    }));

    let currentStep = 0;

    const runAnimation = () => {
      const step = adjustedSequence[currentStep];
      setAnimationPhase(step.phase);

      // Se è l'ultimo step del ciclo
      if (currentStep === adjustedSequence.length - 1) {
        setCycleCount(prev => {
          const newCount = prev + 1;
          if (onComplete) onComplete(newCount);
          return newCount;
        });

        // Auto-hide dopo primo ciclo se richiesto
        if (autoHide && cycleCount >= 0) {
          return;
        }
      }

      currentStep = (currentStep + 1) % adjustedSequence.length;
    };

    runAnimation();
    const interval = setInterval(() => {
      runAnimation();
    }, adjustedSequence[currentStep === 0 ? adjustedSequence.length - 1 : currentStep - 1].duration);

    return () => clearInterval(interval);
  }, [show, speed, onComplete, autoHide, cycleCount]);

  // Funzione per ottenere le posizioni correnti basate sulla fase
  const getCurrentPositions = () => {
    switch (animationPhase) {
      case 0: return positions.offscreen;
      case 1: return positions.bigLoaded;
      case 2: return positions.allLoaded;
      case 3: return positions.smallOut;
      case 4: return positions.allOut;
      default: return positions.offscreen;
    }
  };

  const currentPos = getCurrentPositions();

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        style={inline ? {
          // Compact inline mode
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 20px',
          margin: '20px auto',
          maxWidth: '300px',
          //backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          //boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        } : {
          // Full-screen mode (legacy)
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--ion-background-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* CSS Inline */}
        <style>{`
          .bilanciere-container {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: ${config.container.width}px;
            height: ${config.container.height}px;
            margin-bottom: 20px;
          }

          .bilanciere-barra {
            width: ${config.bar.width}px;
            height: ${config.bar.height}px;
            background-color: var(--ion-text-color);
            border-radius: ${config.bar.height / 2}px;
            position: relative;
            z-index: 1;
          }

          .disco {
            position: absolute;
            background-color: var(--ion-text-color);
            border-radius: 2px;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 2;
            top: 50%;
            transform: translateY(-50%);
          }

          .disco.grande {
            width: ${config.bigDisc.width}px;
            height: ${config.bigDisc.height}px;
          }

          .disco.piccolo {
            width: ${config.smallDisc.width}px;
            height: ${config.smallDisc.height}px;
          }

          .disco.sinistro.grande {
            left: ${currentPos.bigLeft}px;
          }

          .disco.destro.grande {
            left: ${currentPos.bigRight}px;
          }

          .disco.sinistro.piccolo {
            left: ${currentPos.smallLeft}px;
          }

          .disco.destro.piccolo {
            left: ${currentPos.smallRight}px;
          }

          /* Progress bar */
          .progress-container {
            width: ${config.container.width}px;
            height: 4px;
            background: rgba(var(--ion-text-color-rgb), 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 20px;
          }

          .progress-bar {
            height: 100%;
            background: var(--ion-text-color);
            border-radius: 2px;
            transition: width 0.6s ease;
          }

          /* Messaggio */
          .loading-message {
            color: var(--ion-text-color);
            font-size: 1rem;
            font-weight: 500;
            margin-top: 15px;
            text-align: center;
            opacity: 0.8;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .bilanciere-container {
              transform: scale(0.8);
            }
            
            .loading-message {
              font-size: 0.9rem;
            }
          }
        `}</style>

        {/* Container del bilanciere */}
        <motion.div
          className="bilanciere-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Disco grande sinistro */}
          <div className="disco grande sinistro" />

          {/* Disco piccolo sinistro */}
          <div className="disco piccolo sinistro" />

          {/* Barra del bilanciere */}
          <motion.div
            className="bilanciere-barra"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Disco piccolo destro */}
          <div className="disco piccolo destro" />

          {/* Disco grande destro */}
          <div className="disco grande destro" />
        </motion.div>

        {/* Progress bar opzionale */}
        {showProgress && (
          <motion.div
            className="progress-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        )}

        {/* Messaggio di caricamento */}
        {message && (
          <motion.div
            className="loading-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.div>
        )}

        {/* Debug info (solo in development) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '100px',
              right: '20px',
              background: 'rgba(var(--ion-text-color-rgb), 0.1)',
              color: 'var(--ion-text-color)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div>Fase: {animationPhase}</div>
            <div>Ciclo: {cycleCount}</div>
            <div>Velocità: {speed}x</div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default BilanciereLoader;

import React, { useRef, useEffect, useState, useMemo, type CSSProperties } from 'react';

type AnimatedBackgroundProps = {
  variant?: 'dark-veil' | 'linee-move';
  intensity?: 'light' | 'medium' | 'intense' | string;
  height?: string;
  position?: 'fixed' | 'absolute' | 'relative';
  fadeInDuration?: number;
  speed?: number;
  className?: string;
};

const AnimatedBackgroundComponent: React.FC<AnimatedBackgroundProps> = ({ 
  variant = 'dark-veil', 
  intensity = 'medium',
  height = '100vh',
  position = 'fixed',
  fadeInDuration = 1500,
  speed = 1,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [animationKey] = useState(() => Math.random().toString(36).substr(2, 9));

  // Memoizza la configurazione
  const config = useMemo(() => {
    const configs: Record<string, { particles: number; waves: number; complexity: number; lines: number }> = {
      light: { 
        particles: 15, 
        waves: 8, 
        complexity: 0.6,
        lines: 3
      },
      medium: { 
        particles: 25, 
        waves: 12, 
        complexity: 0.8,
        lines: 4
      },
      intense: { 
        particles: 40, 
        waves: 18, 
        complexity: 1.0,
        lines: 5
      }
    };
    return configs[intensity] || configs.medium;
  }, [intensity]);

  // Memoizza la funzione per le durate
  const getAnimationDuration = useMemo<(baseDuration: number) => number>(() => {
    return (baseDuration: number) => Math.max(baseDuration / speed, 1);
  }, [speed]);

  // Fade-in solo al mount iniziale
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []); // Array vuoto - solo al mount

  // Memoizza la funzione per generare path ondulato
  const generateContinuousWavePath = useMemo<(amplitude: number, frequency: number, phase?: number) => string>(() => {
    return (amplitude: number, frequency: number, phase = 0) => {
      const points: Array<{ x: number; y: number }> = [];
      const step = 1.5;
      
      for (let x = -200; x <= 300; x += step) {
        const primaryWave = Math.sin((x + phase) * frequency) * amplitude;
        const secondaryWave = Math.sin((x + phase) * frequency * 1.7) * (amplitude * 0.25);
        const tertiaryWave = Math.sin((x + phase) * frequency * 0.6) * (amplitude * 0.4);
        const quaternaryWave = Math.sin((x + phase) * frequency * 3.1) * (amplitude * 0.15);
        
        const y = 50 + primaryWave + secondaryWave + tertiaryWave + quaternaryWave;
        points.push({ x, y });
      }
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length - 2; i++) {
        const current = points[i];
        const next = points[i + 1];
        const afterNext = points[i + 2];
        
        const controlPoint1X = current.x + (next.x - current.x) * 0.25;
        const controlPoint1Y = current.y + (next.y - current.y) * 0.25;
        const controlPoint2X = next.x - (afterNext.x - current.x) * 0.25;
        const controlPoint2Y = next.y - (afterNext.y - current.y) * 0.25;
        
        path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${next.x} ${next.y}`;
      }
      
      return path;
    };
  }, []);

  // Memoizza gli stili CSS per evitare ri-creazione
  const cssStyles = useMemo<string>(() => {
    const uniqueClass = `animated-bg-${animationKey}`;
    
    if (variant === 'linee-move') {
      return `
        .${uniqueClass} {
          overflow: hidden;
          background: transparent;
          position: relative;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        .${uniqueClass}.fixed {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
        }

        .${uniqueClass}.absolute {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        .${uniqueClass}.relative {
          position: relative;
          width: 100%;
          z-index: 0;
        }

        .${uniqueClass}::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(
            to bottom, 
            transparent 0%, 
            rgba(var(--ion-background-color-rgb), 0.1) 20%,
            rgba(var(--ion-background-color-rgb), 0.3) 40%,
            rgba(var(--ion-background-color-rgb), 0.6) 60%,
            rgba(var(--ion-background-color-rgb), 0.8) 80%,
            var(--ion-background-color) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        .${uniqueClass} .continuous-line {
          position: absolute;
          pointer-events: none;
          opacity: 1;
          will-change: transform;
        }

        .${uniqueClass} .continuous-line svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .${uniqueClass} .line-path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 6px currentColor);
        }

        .${uniqueClass} .line-type-1 .line-path { stroke: rgba(139, 92, 246, 0.7); stroke-width: 2.5; }
        .${uniqueClass} .line-type-2 .line-path { stroke: rgba(168, 85, 247, 0.6); stroke-width: 2; }
        .${uniqueClass} .line-type-3 .line-path { stroke: rgba(124, 58, 237, 0.8); stroke-width: 3; }
        .${uniqueClass} .line-type-4 .line-path { stroke: rgba(147, 51, 234, 0.5); stroke-width: 1.5; }
        .${uniqueClass} .line-type-5 .line-path { stroke: rgba(126, 34, 206, 0.7); stroke-width: 3.5; }

        @keyframes ${uniqueClass}-flow-1 {
          0% { transform: translateX(-50px) translateY(-10px); }
          25% { transform: translateX(-25px) translateY(5px); }
          50% { transform: translateX(0px) translateY(-5px); }
          75% { transform: translateX(25px) translateY(8px); }
          100% { transform: translateX(50px) translateY(-3px); }
        }

        @keyframes ${uniqueClass}-flow-2 {
          0% { transform: translateX(-60px) translateY(15px); }
          30% { transform: translateX(-20px) translateY(-8px); }
          60% { transform: translateX(20px) translateY(12px); }
          100% { transform: translateX(60px) translateY(-6px); }
        }

        @keyframes ${uniqueClass}-flow-3 {
          0% { transform: translateX(-45px) translateY(8px); }
          20% { transform: translateX(-15px) translateY(-12px); }
          40% { transform: translateX(15px) translateY(6px); }
          70% { transform: translateX(35px) translateY(-9px); }
          100% { transform: translateX(45px) translateY(4px); }
        }

        @keyframes ${uniqueClass}-flow-4 {
          0% { transform: translateX(-70px) translateY(-12px); }
          35% { transform: translateX(-30px) translateY(18px); }
          65% { transform: translateX(10px) translateY(-5px); }
          100% { transform: translateX(70px) translateY(10px); }
        }

        @keyframes ${uniqueClass}-flow-5 {
          0% { transform: translateX(-55px) translateY(20px); }
          40% { transform: translateX(-10px) translateY(-15px); }
          80% { transform: translateX(30px) translateY(8px); }
          100% { transform: translateX(55px) translateY(-12px); }
        }

        .${uniqueClass} .flow-1 { animation: ${uniqueClass}-flow-1 var(--line-duration-1) cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite alternate; }
        .${uniqueClass} .flow-2 { animation: ${uniqueClass}-flow-2 var(--line-duration-2) cubic-bezier(0.23, 0.40, 0.38, 0.96) infinite alternate; }
        .${uniqueClass} .flow-3 { animation: ${uniqueClass}-flow-3 var(--line-duration-3) cubic-bezier(0.26, 0.44, 0.42, 0.92) infinite alternate; }
        .${uniqueClass} .flow-4 { animation: ${uniqueClass}-flow-4 var(--line-duration-4) cubic-bezier(0.24, 0.48, 0.46, 0.88) infinite alternate; }
        .${uniqueClass} .flow-5 { animation: ${uniqueClass}-flow-5 var(--line-duration-5) cubic-bezier(0.28, 0.42, 0.44, 0.98) infinite alternate; }
      `;
    }

    // Dark veil variant
    return `
      .${uniqueClass} {
        overflow: hidden;
        background: transparent;
        position: relative;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }

      .${uniqueClass}.fixed {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
      }

      .${uniqueClass}.absolute {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .${uniqueClass}.relative {
        position: relative;
        width: 100%;
        z-index: 0;
      }

      .${uniqueClass}::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 100px;
        background: linear-gradient(
          to bottom, 
          transparent 0%, 
          rgba(var(--ion-background-color-rgb), 0.1) 20%,
          rgba(var(--ion-background-color-rgb), 0.3) 40%,
          rgba(var(--ion-background-color-rgb), 0.6) 60%,
          rgba(var(--ion-background-color-rgb), 0.8) 80%,
          var(--ion-background-color) 100%
        );
        pointer-events: none;
        z-index: 10;
      }

      .${uniqueClass} .complex-particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(40px);
        opacity: 0;
        will-change: transform, opacity;
      }

      .${uniqueClass} .complex-particle.type-1 {
        background: radial-gradient(circle, 
          rgba(139, 92, 246, 0.4) 0%, 
          rgba(168, 85, 247, 0.3) 30%, 
          rgba(147, 51, 234, 0.2) 60%, 
          transparent 100%);
      }

      .${uniqueClass} .complex-particle.type-2 {
        background: radial-gradient(ellipse, 
          rgba(124, 58, 237, 0.5) 0%, 
          rgba(139, 92, 246, 0.3) 40%, 
          transparent 80%);
      }

      .${uniqueClass} .complex-particle.type-3 {
        background: linear-gradient(45deg, 
          rgba(168, 85, 247, 0.3) 0%, 
          rgba(139, 92, 246, 0.4) 50%, 
          rgba(124, 58, 237, 0.2) 100%);
        border-radius: 40% 60% 70% 30%;
      }

      @keyframes ${uniqueClass}-particle-1 {
        0% { transform: translate(0, 0) scale(0.8) rotate(0deg); opacity: 0; }
        15% { opacity: 0.6; }
        25% { transform: translate(30px, -40px) scale(1.2) rotate(90deg); opacity: 0.4; }
        50% { transform: translate(-20px, 60px) scale(0.9) rotate(180deg); opacity: 0.7; }
        75% { transform: translate(50px, -30px) scale(1.1) rotate(270deg); opacity: 0.3; }
        85% { opacity: 0.5; }
        100% { transform: translate(0, 0) scale(0.8) rotate(360deg); opacity: 0; }
      }

      @keyframes ${uniqueClass}-particle-2 {
        0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
        20% { opacity: 0.4; transform: translate(-40px, 20px) scale(0.7) rotate(45deg); }
        40% { transform: translate(60px, -50px) scale(1.3) rotate(135deg); opacity: 0.6; }
        60% { transform: translate(-30px, 80px) scale(0.9) rotate(225deg); opacity: 0.3; }
        80% { transform: translate(40px, -60px) scale(1.1) rotate(315deg); opacity: 0.5; }
        100% { transform: translate(0, 0) scale(1) rotate(360deg); opacity: 0; }
      }

      @keyframes ${uniqueClass}-particle-3 {
        0% { transform: translate(0, 0) scale(0.9) rotate(0deg); opacity: 0; }
        10% { opacity: 0.3; }
        30% { transform: translate(-60px, -30px) scale(1.4) rotate(120deg); opacity: 0.5; }
        55% { transform: translate(70px, 90px) scale(0.6) rotate(240deg); opacity: 0.7; }
        80% { transform: translate(-50px, -80px) scale(1.2) rotate(300deg); opacity: 0.4; }
        90% { opacity: 0.6; }
        100% { transform: translate(0, 0) scale(0.9) rotate(360deg); opacity: 0; }
      }

      .${uniqueClass} .anim-1 { animation: ${uniqueClass}-particle-1 var(--particle-duration) ease-in-out infinite; }
      .${uniqueClass} .anim-2 { animation: ${uniqueClass}-particle-2 var(--particle-duration) ease-in-out infinite; }
      .${uniqueClass} .anim-3 { animation: ${uniqueClass}-particle-3 var(--particle-duration) ease-in-out infinite; }
    `;
  }, [variant, animationKey]);

  // Memoizza il contenuto JSX
  const backgroundContent = useMemo<React.ReactNode>(() => {
    if (variant === 'linee-move') {
      return (
        <>
          {/* Linee continue */}
          {Array.from({ length: config.lines }, (_, i) => {
            const top = 15 + (i * (70 / config.lines)) + (Math.random() * 6 - 3);
            const lineType = (i % 5) + 1;
            const flowType = (i % 5) + 1;
            
            const amplitude = 15 + Math.random() * 20;
            const frequency = 0.008 + Math.random() * 0.006;
            const phase = Math.random() * Math.PI * 2;

            const baseDuration = [45, 52, 38, 60, 48][flowType - 1];
            const duration = getAnimationDuration(baseDuration);

            return (
              <div
                key={`continuous-line-${i}-${animationKey}`}
                className={`continuous-line line-type-${lineType} flow-${flowType}`}
                style={(() => {
                  const lineStyle: CSSProperties = {
                    top: `${top}%`,
                    left: '0%',
                    width: '100%',
                    height: '200px',
                  };
                  (lineStyle as any)[`--line-duration-${flowType}`] = `${duration}s`;
                  return lineStyle;
                })()}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    className="line-path"
                    d={generateContinuousWavePath(amplitude, frequency, phase)}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            );
          })}

          {/* Linee aggiuntive */}
          {Array.from({ length: Math.floor(config.lines / 2) }, (_, i) => {
            const top = 25 + (i * (60 / Math.floor(config.lines / 2))) + (Math.random() * 4 - 2);
            const lineType = ((i + 2) % 5) + 1;
            const flowType = ((i + 3) % 5) + 1;
            
            const amplitude = 12 + Math.random() * 18;
            const frequency = 0.006 + Math.random() * 0.008;
            const phase = Math.random() * Math.PI * 2;

            const baseDuration = [45, 52, 38, 60, 48][flowType - 1];
            const duration = getAnimationDuration(baseDuration);

            return (
              <div
                key={`extra-line-${i}-${animationKey}`}
                className={`continuous-line line-type-${lineType} flow-${flowType}`}
                style={(() => {
                  const lineStyle: CSSProperties = {
                    top: `${top}%`,
                    left: '0%',
                    width: '100%',
                    height: '200px',
                    opacity: 0.6,
                  };
                  (lineStyle as any)[`--line-duration-${flowType}`] = `${duration}s`;
                  return lineStyle;
                })()}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    className="line-path"
                    d={generateContinuousWavePath(amplitude, frequency, phase)}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            );
          })}
        </>
      );
    }

    // Dark veil content
    return (
      <>
        {/* Particelle complesse */}
        {Array.from({ length: config.particles }, (_, i) => {
          const size = 40 + Math.random() * 80;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const baseDuration = 8 + Math.random() * 12;
          const duration = getAnimationDuration(baseDuration);
          const delay = Math.random() * 5;
          const type = (i % 3) + 1;
          const animType = (i % 3) + 1;

          return (
            <div
              key={`particle-${i}-${animationKey}`}
              className={`complex-particle type-${type} anim-${animType}`}
              style={(() => {
                const style: CSSProperties = {
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`
                };
                (style as any)['--particle-duration'] = `${duration}s`;
                return style;
              })()}
            />
          );
        })}
      </>
    );
  }, [variant, config, animationKey, getAnimationDuration, generateContinuousWavePath]);

  const uniqueClass = `animated-bg-${animationKey}`;

  return (
    <>
      <style>{cssStyles}</style>
      
      <div 
        ref={containerRef}
        className={`${uniqueClass} ${position} ${className}`}
        style={{ 
          height,
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${fadeInDuration}ms ease-out`
        }}
      >
        {backgroundContent}
      </div>
    </>
  );
};

const AnimatedBackground = React.memo(AnimatedBackgroundComponent);
AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;

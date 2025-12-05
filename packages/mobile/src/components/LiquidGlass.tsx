// import React from 'react';

// const LiquidGlass = ({
//   children,
//   width = '100%',
//   height = 60,
//   borderRadius = 30,
  
//   // Parametri semplici ma efficaci
//   transparency = 0.1,        // Trasparenza del vetro (0-1)
//   blur = 20,                // Blur backdrop (0-50)
//   brightness = 1.1,         // Luminosità (0.5-2)
//   contrast = 1.2,           // Contrasto (0.5-2)
//   saturation = 1.3,         // Saturazione (0.5-3)
  
//   // Bordi e riflessi
//   borderOpacity = 0.15,     // Opacità bordo (0-1)
//   reflectionIntensity = 0.2, // Intensità riflessi (0-1)
  
//   className = '',
//   style = {}
// }) => {
//   const containerStyle = {
//     width: typeof width === 'number' ? `${width}px` : width,
//     height: typeof height === 'number' ? `${height}px` : height,
//     borderRadius: `${borderRadius}px`,
//     ...style
//   };

//   return (
//     <div
//       className={`clean-liquid-glass ${className}`}
//       style={containerStyle}
//     >
//       {/* Contenuto */}
//       <div className="glass-content">
//         {children}
//       </div>

//       {/* Riflessi sottili */}
//       <div className="glass-reflections" />
      
//       {/* Bordo luminoso */}
//       <div className="glass-highlight" />

//       {/* CSS inline pulito */}
//       <style>{`
//         .clean-liquid-glass {
//           position: relative;
//           overflow: hidden;
          
//           /* Effetto glass pulito */
//           background: rgba(var(--ion-background-color-rgb), ${transparency});
//           backdrop-filter: blur(${blur}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturation});
//           -webkit-backdrop-filter: blur(${blur}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturation});
          
//           /* Bordo sottile */
//           border: 1px solid rgba(255, 255, 255, ${borderOpacity});
          
//           /* Ombra morbida */
//           box-shadow: 
//             0 8px 32px rgba(0, 0, 0, 0.08),
//             inset 0 1px 0 rgba(255, 255, 255, ${reflectionIntensity * 0.8});
//         }

//         .glass-content {
//           position: relative;
//           z-index: 10;
//           width: 100%;
//           height: 100%;
//           display: flex;
//           align-items: center;
//           padding: 0 20px;
//         }

//         /* Riflesso superiore dolce */
//         .glass-reflections {
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           height: 1px;
//           background: linear-gradient(
//             to right,
//             transparent 0%,
//             rgba(255, 255, 255, ${reflectionIntensity}) 20%,
//             rgba(255, 255, 255, ${reflectionIntensity * 1.5}) 50%,
//             rgba(255, 255, 255, ${reflectionIntensity}) 80%,
//             transparent 100%
//           );
//           border-radius: ${borderRadius}px ${borderRadius}px 0 0;
//           pointer-events: none;
//           z-index: 5;
//         }

//         /* Highlight laterale sinistro */
//         .glass-highlight {
//           position: absolute;
//           top: 2px;
//           left: 2px;
//           bottom: 2px;
//           width: 1px;
//           background: linear-gradient(
//             to bottom,
//             rgba(255, 255, 255, ${reflectionIntensity * 0.8}) 0%,
//             rgba(255, 255, 255, ${reflectionIntensity * 0.4}) 50%,
//             transparent 100%
//           );
//           border-radius: ${borderRadius}px 0 0 ${borderRadius}px;
//           pointer-events: none;
//           z-index: 5;
//         }

//         /* Adattamento temi */
//         .dark .clean-liquid-glass {
//           border-color: rgba(255, 255, 255, ${borderOpacity * 0.7});
//         }

//         :root:not(.dark) .clean-liquid-glass {
//           background: rgba(var(--ion-background-color-rgb), ${transparency * 1.5});
//           border-color: rgba(255, 255, 255, ${borderOpacity * 1.2});
//           box-shadow: 
//             0 8px 32px rgba(0, 0, 0, 0.12),
//             inset 0 1px 0 rgba(255, 255, 255, ${reflectionIntensity});
//         }

//         /* Responsive */
//         @media (max-width: 768px) {
//           .glass-content {
//             padding: 0 16px;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default LiquidGlass;


import React, { useId, useMemo, type CSSProperties } from 'react';

type LiquidGlassProps = {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  transparency?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  borderOpacity?: number;
  reflectionIntensity?: number;
  waveIntensity?: number;
  waveFrequency?: number;
  rippleEffect?: number;
  className?: string;
  style?: CSSProperties;
};

const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  width = '100%',
  height = 60,
  borderRadius = 30,
  transparency = 0.1,
  blur = 20,
  brightness = 1.1,
  contrast = 1.2,
  saturation = 1.3,
  borderOpacity = 0.15,
  reflectionIntensity = 0.2,
  waveIntensity = 0.8,      // Intensità onde sui bordi (0-2)
  waveFrequency = 4,        // Frequenza onde (2-8)
  rippleEffect = 0.5,       // Effetto increspatura (0-1)
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const maskId = `wave-mask-${uniqueId}`;
  const reflectionId = `reflection-${uniqueId}`;

  const containerStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style
  };

  // Genera path ondulato per i bordi
  const generateWavePath = (): string => {
    const w = 100;
    const h = 100;
    const normalizedWidth = typeof width === 'number' ? width : 300;
    const normalizedHeight = typeof height === 'number' ? height : 300;
    const radius = (borderRadius / Math.max(normalizedWidth, normalizedHeight)) * 100;
    const waveAmp = waveIntensity * 2;
    const freq = waveFrequency * 0.1;
    
    let path = '';
    
    // Top edge con onde
    path += `M ${radius} 0 `;
    for (let x = radius; x <= w - radius; x += 2) {
      const wave = Math.sin(x * freq) * waveAmp;
      path += `L ${x} ${wave} `;
    }
    
    // Top-right corner
    path += `Q ${w} 0 ${w} ${radius} `;
    
    // Right edge con onde
    for (let y = radius; y <= h - radius; y += 2) {
      const wave = Math.sin(y * freq + Math.PI/4) * waveAmp;
      path += `L ${w + wave} ${y} `;
    }
    
    // Bottom-right corner
    path += `Q ${w} ${h} ${w - radius} ${h} `;
    
    // Bottom edge con onde
    for (let x = w - radius; x >= radius; x -= 2) {
      const wave = Math.sin(x * freq + Math.PI/2) * waveAmp;
      path += `L ${x} ${h + wave} `;
    }
    
    // Bottom-left corner
    path += `Q 0 ${h} 0 ${h - radius} `;
    
    // Left edge con onde
    for (let y = h - radius; y >= radius; y -= 2) {
      const wave = Math.sin(y * freq + Math.PI*3/4) * waveAmp;
      path += `L ${wave} ${y} `;
    }
    
    // Top-left corner
    path += `Q 0 0 ${radius} 0 Z`;
    
    return path;
  };

  const wavePath = useMemo(() => generateWavePath(), [borderRadius, waveFrequency, waveIntensity, rippleEffect, width, height]);

  return (
    <div
      className={`liquid-glass-droplet ${className}`}
      style={containerStyle}
    >
      {/* SVG per forma ondulata */}
      <svg className="droplet-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {/* Maschera con bordi ondulati */}
          <clipPath id={maskId}>
            <path d={wavePath} />
          </clipPath>
          
          {/* Gradiente per riflessi */}
          <linearGradient id={reflectionId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`rgba(255,255,255,${reflectionIntensity})`} />
            <stop offset="30%" stopColor={`rgba(255,255,255,${reflectionIntensity * 0.6})`} />
            <stop offset="70%" stopColor={`rgba(255,255,255,${reflectionIntensity * 0.3})`} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          
          {/* Gradiente per increspature */}
          <radialGradient id={`ripple-${uniqueId}`} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor={`rgba(255,255,255,${rippleEffect * 0.3})`} />
            <stop offset="40%" stopColor={`rgba(255,255,255,${rippleEffect * 0.1})`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        
        {/* Forma di base */}
        <rect 
          width="100%" 
          height="100%" 
          fill="transparent"
          clipPath={`url(#${maskId})`}
        />
        
        {/* Layer riflessi */}
        <rect 
          width="100%" 
          height="100%" 
          fill={`url(#${reflectionId})`}
          clipPath={`url(#${maskId})`}
        />
        
        {/* Layer increspature */}
        <rect 
          width="100%" 
          height="100%" 
          fill={`url(#ripple-${uniqueId})`}
          clipPath={`url(#${maskId})`}
        />
      </svg>

      {/* Contenuto */}
      <div className="droplet-content">
        {children}
      </div>

      {/* CSS per effetto goccia */}
      <style>{`
        .liquid-glass-droplet {
          position: relative;
          overflow: hidden;
          
          /* Effetto glass con clip-path ondulato */
          background: rgba(var(--ion-background-color-rgb), ${transparency});
          backdrop-filter: blur(${blur}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturation});
          -webkit-backdrop-filter: blur(${blur}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturation});
          
          /* Clip path per forma ondulata */
          clip-path: path('${wavePath.replace(/L /g, 'L').replace(/Q /g, 'Q').replace(/M /g, 'M')}');
          
          /* Bordo con effetto ondulato */
          border: 1px solid rgba(255, 255, 255, ${borderOpacity});
          
          /* Ombra che segue la forma */
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.08));
        }

        .droplet-shape {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .droplet-content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 20px;
        }

        /* Effetto increspatura centrale */
        .liquid-glass-droplet::before {
          content: '';
          position: absolute;
          top: 20%;
          left: 30%;
          width: 40%;
          height: 60%;
          background: radial-gradient(
            ellipse,
            rgba(255, 255, 255, ${rippleEffect * 0.1}) 0%,
            rgba(255, 255, 255, ${rippleEffect * 0.05}) 50%,
            transparent 80%
          );
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          filter: blur(2px);
        }

        /* Riflesso superiore ondulato */
        .liquid-glass-droplet::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, ${reflectionIntensity * 0.4}) 0%,
            rgba(255, 255, 255, ${reflectionIntensity * 0.2}) 50%,
            transparent 100%
          );
          clip-path: path('${generateWavePath().split('Q')[0]} Q ${generateWavePath().split('Q')[1]}');
          pointer-events: none;
          z-index: 3;
        }

        /* Adattamenti per temi */
        .dark .liquid-glass-droplet {
          border-color: rgba(255, 255, 255, ${borderOpacity * 0.8});
        }

        :root:not(.dark) .liquid-glass-droplet {
          background: rgba(var(--ion-background-color-rgb), ${transparency * 1.3});
          border-color: rgba(255, 255, 255, ${borderOpacity * 1.5});
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.12));
        }

        /* Fallback per browser che non supportano clip-path avanzato */
        @supports not (clip-path: path('M 0 0')) {
          .liquid-glass-droplet {
            clip-path: none;
            border-radius: ${borderRadius}px;
          }
          
          .liquid-glass-droplet::after {
            clip-path: none;
            border-radius: ${borderRadius}px ${borderRadius}px 0 0;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .droplet-content {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default LiquidGlass;

import React, { useState, useEffect, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import BilanciereLoader from '@/components/BilanciereLoader';

type ContentWithMotionProps = {
  children: ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  errorMessage?: string;
  loaderSize?: 'small' | 'medium' | 'large';
  loaderSpeed?: number;
  loaderColor?: string;
  showProgress?: boolean;
  progressValue?: number;
  autoHideLoader?: boolean;
  customDiscColors?: string[] | null;
  useMotion?: boolean;
};

// Componente che mostra BilanciereLoader e poi anima il contenuto quando pronto
const ContentWithMotion: React.FC<ContentWithMotionProps> = ({ 
  children, 
  isLoading = false, 
  loadingMessage = 'Caricamento dati...',
  error = null,
  errorMessage = 'Si è verificato un errore. Riprova più tardi.',
  // Configurazioni per BilanciereLoader
  loaderSize = "small",
  loaderSpeed = 1,
  loaderColor = "var(--ion-color-primary)",
  showProgress = false,
  progressValue = 0,
  autoHideLoader = false,
  customDiscColors = null,
  useMotion = true,
}) => {
  const [contentVisible, setContentVisible] = useState<boolean>(false);
  
  // Quando isLoading diventa false, attiviamo l'animazione
  useEffect(() => {
    if (!isLoading && !error) {
      // Piccolo timeout per assicurarci che il DOM sia aggiornato
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      setContentVisible(false);
    }
  }, [isLoading, error]);
  
  const contentVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.07,
        delayChildren: 0.1
      }
    }
  };

  const errorVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    }
  };
  
  // Se sta caricando, mostriamo BilanciereLoader
  if (isLoading) {
    return (
      <BilanciereLoader
        show={true}
        message={loadingMessage}
        size={loaderSize}
        speed={loaderSpeed}
        color={loaderColor}
        backgroundColor="var(--ion-background-color)"
        showProgress={showProgress}
        progressValue={progressValue}
        autoHide={autoHideLoader}
        discsColors={customDiscColors}
        fadeInDuration={1000}
      />
    );
  }
  
  // Se c'è un errore, mostriamo il messaggio animato
  if (error) {
    return (
      <motion.div 
        className="error-container"
        variants={errorVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          padding: '40px 20px',
          textAlign: 'center',
          background: 'rgba(var(--ion-card-background-rgb), 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          margin: '20px',
          border: '1px solid rgba(var(--ion-color-danger-rgb), 0.2)'
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ 
            fontSize: '64px', 
            marginBottom: '20px',
            filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
          }}
        >
          ⚠️
        </motion.div>
        
        <motion.h3 
          style={{ 
            color: 'var(--ion-color-danger)', 
            marginBottom: '12px',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {errorMessage}
        </motion.h3>
        
        {error && (
          <motion.p 
            style={{ 
              fontSize: '0.9rem', 
              opacity: 0.8,
              color: 'var(--ion-text-color)',
              backgroundColor: 'rgba(var(--ion-color-danger-rgb), 0.1)',
              padding: '12px',
              borderRadius: '8px',
              maxWidth: '400px'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <strong>Dettaglio:</strong> {error}
          </motion.p>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: '20px' }}
        >
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--ion-color-primary)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3)'
            }}
            onMouseOver={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 16px rgba(var(--ion-color-primary-rgb), 0.4)';
            }}
            onMouseOut={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3)';
            }}
          >
            🔄 Riprova
          </button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Se le animazioni non sono richieste, restituiamo i children direttamente
  if (!useMotion) {
    return <>{children}</>;
  }

  // Altrimenti mostriamo il contenuto con animazione
  return (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate={contentVisible ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

export default ContentWithMotion;

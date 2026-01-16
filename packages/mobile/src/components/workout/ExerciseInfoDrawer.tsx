// @ts-nocheck
import React from 'react';
import { IonIcon, IonText, IonChip, IonLabel } from '@ionic/react';
import { closeOutline, barbellOutline } from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';

type ExerciseInfo = {
  id_exercise_list: number;
  name: string;
  description?: string;
  link_video?: string;
  muscolar_group_name?: string;
  notes?: string;
};

type ExerciseInfoDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseInfo | null;
  onReopenBottomSheet?: () => void; // ✅ NUOVO: callback per riaprire il bottomsheet
};

/**
 * Side Drawer per visualizzare le informazioni dell'esercizio
 * Si apre da destra e chiude il bottom sheet
 */
const ExerciseInfoDrawer: React.FC<ExerciseInfoDrawerProps> = ({ isOpen, onClose, exercise, onReopenBottomSheet }) => {
  if (!exercise) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence onExitComplete={() => {
      // Riapri il bottomsheet dopo che l'animazione di uscita è completa
      if (onReopenBottomSheet) {
        onReopenBottomSheet();
      }
    }}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 10000,
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Drawer con effetto LiquidGlass */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '85%',
              maxWidth: '400px',
              background: 'rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.65)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(var(--ion-color-medium-rgb), 0.1)',
              zIndex: 10001,
              overflowY: 'auto',
              paddingTop: 'max(60px, calc(env(safe-area-inset-top) + 60px))',
              paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 40px))',
              paddingLeft: '16px',
              paddingRight: '16px'
            }}
          >
            {/* Header con close button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <IonText style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                Info Esercizio
              </IonText>
              <motion.button
                onClick={handleClose}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(var(--ion-color-medium-rgb), 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: '20px', color: 'var(--ion-color-medium)' }} />
              </motion.button>
            </div>

            {/* Nome esercizio */}
            <IonText style={{ fontSize: '1.3rem', fontWeight: '700', display: 'block', marginBottom: '16px' }}>
              {exercise.name}
            </IonText>

            {/* Gruppo muscolare */}
            {exercise.muscolar_group_name && (
              <div style={{ marginBottom: '24px' }}>
                <IonChip
                  outline
                  style={{
                    background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                    color: 'var(--ion-color-primary)',
                    border: '1px solid var(--ion-color-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <IonIcon icon={barbellOutline} />
                  <IonLabel>{exercise.muscolar_group_name}</IonLabel>
                </IonChip>
              </div>
            )}

            {/* Video */}
            {exercise.link_video ? (
              <div
                style={{
                  marginBottom: '24px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  background: '#000',
                  position: 'relative',
                  width: '100%',
                  aspectRatio: exercise.link_video.includes('shorts/') ? '9/16' : '16/9'
                }}
              >
                {exercise.link_video.includes('youtube.com') || exercise.link_video.includes('youtu.be') ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`${exercise.link_video
                      .replace('watch?v=', 'embed/')
                      .replace('youtu.be/', 'www.youtube.com/embed/')
                      .replace('shorts/', 'embed/')
                    }?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`}
                    title="Video Esercizio"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  ></iframe>
                ) : (
                  <video
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    width="100%"
                    height="100%"
                    style={{
                      display: 'block',
                      objectFit: 'cover'
                    }}
                  >
                    <source src={exercise.link_video} type="video/mp4" />
                    Il tuo browser non supporta il tag video.
                  </video>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '32px 16px',
                  borderRadius: '16px',
                  background: 'rgba(var(--ion-color-medium-rgb), 0.1)',
                  border: '1px dashed rgba(var(--ion-color-medium-rgb), 0.3)',
                  textAlign: 'center'
                }}
              >
                <IonText color="medium" style={{ fontSize: '0.9rem' }}>
                  Nessun video disponibile
                </IonText>
              </div>
            )}

            {/* Descrizione */}
            {exercise.description && (
              <div style={{ marginBottom: '24px' }}>
                <IonText
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--ion-color-medium)',
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  Descrizione
                </IonText>
                <IonText
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: 'var(--ion-text-color)',
                    display: 'block'
                  }}
                >
                  {exercise.description}
                </IonText>
              </div>
            )}

            {/* Note PT */}
            {exercise.notes && (
              <div style={{ marginBottom: '24px' }}>
                <IonText
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--ion-color-medium)',
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  Note PT
                </IonText>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(var(--ion-color-warning-rgb), 0.1)',
                    border: '1px solid rgba(var(--ion-color-warning-rgb), 0.3)'
                  }}
                >
                  <IonText
                    style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      color: 'var(--ion-text-color)',
                      display: 'block'
                    }}
                  >
                    {exercise.notes}
                  </IonText>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExerciseInfoDrawer;

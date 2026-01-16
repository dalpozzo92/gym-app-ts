// @ts-nocheck
import React from 'react';
import { IonCard, IonItem, IonLabel, IonIcon, IonText, IonChip } from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import type { SetGroup } from '@/types/workout';

type SetListItemProps = {
  setGroup: SetGroup;
  onClick: () => void;
  isCompleted: boolean;
};

/**
 * Componente compatto per visualizzare una riga di serie (max 2 righe)
 * Supporta sia esercizi singoli che superset/jumpset
 */
const SetListItem: React.FC<SetListItemProps> = ({ setGroup, onClick, isCompleted }) => {
  const { groupType, setNumber, exercises } = setGroup;

  // Calcola se tutte le serie del gruppo sono completate
  const allSetsCompleted = exercises.every(({ set }) =>
    (set.actual_load || 0) > 0 && (set.actual_reps || 0) > 0
  );

  // Genera testo preview compatto per il gruppo
  const generatePreview = () => {
    if (groupType === 'single') {
      const { set } = exercises[0];
      const load = set.actual_load || 0;
      const reps = set.actual_reps || 0;

      // Serie completata: reps > 0
      if (reps > 0) {
        return { text: `${load}kg × ${reps}`, color: 'var(--ion-color-success)' };
      }
      // Serie da completare con carico suggerito: load > 0 ma reps = 0
      if (load > 0) {
        return { text: `${load}kg × --`, color: 'var(--ion-color-warning)' };
      }
      // Nessun dato
      return { text: 'Da completare', color: 'var(--ion-color-warning)' };
    }

    // Superset/Jumpset
    const previews = exercises.map(({ set }) => {
      const load = set.actual_load || 0;
      const reps = set.actual_reps || 0;

      if (reps > 0) {
        return `${load}kg×${reps}`;
      }
      if (load > 0) {
        return `${load}kg×--`;
      }
      return '--';
    });

    const allCompleted = exercises.every(({ set }) => (set.actual_reps || 0) > 0);
    return {
      text: previews.join(' • '),
      color: allCompleted ? 'var(--ion-color-success)' : 'var(--ion-color-warning)'
    };
  };

  // Nome del gruppo (abbreviato se necessario)
  const groupName = groupType === 'single'
    ? exercises[0].exercise.exercise_name
    : exercises.map(({ exercise }) => exercise.exercise_name).join(' + ');

  // Badge type
  const groupTypeLabel = groupType === 'superset' ? 'SS' : groupType === 'jumpset' ? 'JS' : null;

  // Target reps e carico prestabilito
  const targetReps = exercises[0].set.reps_min && exercises[0].set.reps_max
    ? `${exercises[0].set.reps_min}-${exercises[0].set.reps_max}`
    : null;

  const prescribedLoad = exercises[0].set.load || null;

  const preview = generatePreview();

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <IonCard
        button
        onClick={onClick}
        style={{
          margin: '0 0 8px 0',
          cursor: 'pointer'
        }}
      >
        <IonItem lines="none" detail={false} style={{ '--padding-start': '12px', '--padding-end': '12px', '--inner-padding-end': '0' }}>
          {/* Slot start: numero serie + icona completamento */}
          <div slot="start" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonText style={{ fontSize: '0.95rem', fontWeight: '700', minWidth: '55px' }}>
              Serie {setNumber}
            </IonText>
            <IonIcon
              icon={allSetsCompleted ? checkmarkCircleOutline : alertCircleOutline}
              style={{
                fontSize: '18px',
                color: allSetsCompleted ? 'var(--ion-color-success)' : 'var(--ion-color-warning)'
              }}
            />
          </div>

          {/* Label centrale: nome + preview (max 2 righe) */}
          <IonLabel>
            {/* Riga 1: Nome esercizio + badge superset/jumpset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.85rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: groupTypeLabel ? 'calc(100% - 40px)' : '100%'
              }}>
                {groupName}
              </h3>
              {groupTypeLabel && (
                <IonChip
                  style={{
                    height: '18px',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    margin: 0,
                    padding: '0 6px',
                    '--background': 'rgba(var(--ion-color-primary-rgb), 0.15)',
                    '--color': 'var(--ion-color-primary)'
                  }}
                >
                  {groupTypeLabel}
                </IonChip>
              )}
            </div>

            {/* Riga 2: Preview valori e target */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.8rem',
                color: preview.color,
                fontWeight: '500'
              }}>
                {preview.text}
              </span>
              {targetReps && (
                <span style={{
                  color: 'var(--ion-color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Target: {targetReps}
                </span>
              )}
            </div>
          </IonLabel>
        </IonItem>
      </IonCard>
    </motion.div>
  );
};

export default SetListItem;

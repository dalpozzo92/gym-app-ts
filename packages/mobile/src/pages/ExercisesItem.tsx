// @ts-nocheck
// src/components/ExerciseItem.jsx
import React, { useState } from 'react';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonBadge,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonText,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent
} from '@ionic/react';
import { 
  chevronDownOutline, 
  chevronUpOutline,
  timeOutline,
  informationCircleOutline,
  videocamOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

const ExerciseItem = ({ exercise, onComplete, showVideo }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSetComplete = () => {
    if (currentSet < (exercise.sets || 3)) {
      setCurrentSet(currentSet + 1);
    } else {
      onComplete(exercise.id);
      setShowModal(false);
    }
  };

  return (
    <>
      <IonCard className={expanded ? 'exercise-expanded' : ''}>
        <IonItem lines="none" button onClick={toggleExpand}>
          <IonLabel>
            <h2>{exercise.name}</h2>
            <p>
              {exercise.sets || 3} serie × {exercise.reps || 10} ripetizioni
            </p>
          </IonLabel>
          <IonIcon 
            icon={expanded ? chevronUpOutline : chevronDownOutline} 
            slot="end"
          />
        </IonItem>
        
        {expanded && (
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonChip outline>
                    <IonIcon icon={timeOutline} />
                    <IonLabel>Riposo: {exercise.rest || 60}s</IonLabel>
                  </IonChip>
                </IonCol>
                <IonCol size="6">
                  <IonBadge color="medium">
                    {exercise.weight ? `${exercise.weight} kg` : 'Peso corporeo'}
                  </IonBadge>
                </IonCol>
              </IonRow>
            </IonGrid>
            
            {exercise.notes && (
              <div className="ion-margin-top">
                <IonText>
                  <p>
                    <IonIcon icon={informationCircleOutline} style={{ marginRight: '8px' }} />
                    {exercise.notes}
                  </p>
                </IonText>
              </div>
            )}
            
            <div className="ion-margin-top ion-text-center">
              <IonButton onClick={() => showVideo(exercise)}>
                <IonIcon slot="start" icon={videocamOutline} />
                Guarda Video
              </IonButton>
              
              <IonButton onClick={() => setShowModal(true)}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                Inizia Esercizio
              </IonButton>
            </div>
          </IonCardContent>
        )}
      </IonCard>
      
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{exercise.name}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Chiudi</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="ion-text-center">
            <h2>Serie {currentSet} di {exercise.sets || 3}</h2>
            <h3>{exercise.reps || 10} ripetizioni</h3>
            
            {exercise.weight && (
              <h3>{exercise.weight} kg</h3>
            )}
            
            <div className="ion-margin-top">
              <IonButton size="large" expand="block" onClick={handleSetComplete}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                {currentSet < (exercise.sets || 3) ? 'Serie Completata' : 'Esercizio Completato'}
              </IonButton>
            </div>
            
            {currentSet < (exercise.sets || 3) && (
              <div className="ion-margin-top">
                <IonText color="medium">
                  <p>Riposa {exercise.rest || 60} secondi prima della prossima serie</p>
                </IonText>
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default ExerciseItem;
// @ts-nocheck

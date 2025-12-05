// @ts-nocheck
// src/pages/WorkoutPage.jsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonPage,
  IonBadge,
  IonAlert
} from '@ionic/react';
import { 
  fitnessOutline, 
  timeOutline, 
  checkmarkDoneOutline,
  informationCircleOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { getWorkoutDetails } from '@/api/workout';
import { logWorkoutSession } from '@/api/progress';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import TabBar from '@/components/TabBar'; 
import NavBar from '@/components/NavBar'; 

const WorkoutPage = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const history = useHistory();

  useEffect(() => {
    loadWorkoutDetails();
  }, [id]);

  const loadWorkoutDetails = async () => {
    try {
      setLoading(true);
      const workoutData = await getWorkoutDetails(id);
      setWorkout(workoutData);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dettagli dell\'allenamento:', err);
      setError('Impossibile caricare i dettagli. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await logWorkoutSession({
        workout_id: workout.id,
        completed_at: new Date().toISOString(),
        notes: 'Allenamento completato'
      });
      showToast('Allenamento registrato con successo!', 'success');
      setShowCompletionAlert(false);
      history.push('/progress');
    } catch (error) {
      console.error('Errore durante la registrazione dell\'allenamento:', error);
      showToast('Si è verificato un errore durante la registrazione', 'danger');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
    } catch (error) {
      return 'Data non valida';
    }
  };

  return (
          <>
    
      
        {loading ? (
          <div className="ion-padding ion-text-center">
            <IonSpinner name="crescent" />
            <IonText>Caricamento allenamento...</IonText>
          </div>
        ) : error ? (
          <div className="ion-padding ion-text-center">
            <IonText color="danger">{error}</IonText>
          </div>
        ) : workout ? (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{workout.name}</IonCardTitle>
                <div className="ion-margin-top">
                  <IonChip color="primary">
                    {workout.type || 'Generale'}
                  </IonChip>
                  <IonChip outline>
                    <IonIcon icon={timeOutline} />
                    <IonLabel>{workout.duration || '60'} min</IonLabel>
                  </IonChip>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p>{workout.description}</p>
                <p className="ion-margin-top">
                  <small>Creato il: {formatDate(workout.created_at)}</small>
                </p>
              </IonCardContent>
            </IonCard>
            
            <div className="ion-padding">
              <IonText>
                <h2>Esercizi</h2>
              </IonText>
            </div>
            
            <IonList>
              {workout.exercises?.map((exercise, index) => (
                <IonItem key={exercise.id || index}>
                  <IonLabel>
                    <h2>{exercise.name}</h2>
                    <IonGrid className="ion-no-padding">
                      <IonRow>
                        <IonCol size="auto">
                          <IonBadge color="medium">
                            {exercise.sets || 3} x {exercise.reps || 10}
                          </IonBadge>
                        </IonCol>
                        {exercise.rest && (
                          <IonCol size="auto">
                            <IonChip outline size="small">
                              <IonIcon icon={timeOutline} />
                              <IonLabel>{exercise.rest}s riposo</IonLabel>
                            </IonChip>
                          </IonCol>
                        )}
                      </IonRow>
                    </IonGrid>
                    {exercise.notes && (
                      <p className="ion-margin-top">
                        <IonIcon icon={informationCircleOutline} className="ion-margin-end" />
                        {exercise.notes}
                      </p>
                    )}
                  </IonLabel>
                  <IonIcon icon={arrowForwardOutline} slot="end" />
                </IonItem>
              ))}
            </IonList>
            
            <div className="ion-padding ion-margin-top">
              <IonButton 
                expand="block" 
                onClick={() => setShowCompletionAlert(true)}
              >
                <IonIcon slot="start" icon={checkmarkDoneOutline} />
                Segna come completato
              </IonButton>
            </div>
          </>
        ) : (
          <div className="ion-padding ion-text-center">
            <IonText>Allenamento non trovato</IonText>
          </div>
        )}
        
        <IonAlert
          isOpen={showCompletionAlert}
          onDidDismiss={() => setShowCompletionAlert(false)}
          header={'Completa allenamento'}
                    message={'Vuoi segnare questo allenamento come completato? Verrà registrato nei tuoi progressi.'}
          buttons={[
            {
              text: 'Annulla',
              role: 'cancel',
              handler: () => {
                setShowCompletionAlert(false);
              }
            },
            {
              text: 'Conferma',
              handler: handleCompleteWorkout
            }
          ]}
        />
      </>);
};

export default WorkoutPage;
// @ts-nocheck

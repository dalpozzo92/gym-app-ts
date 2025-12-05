import React from 'react';
import {
  IonText,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonBadge,
  IonItem,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonLabel
} from '@ionic/react';
import {
  fitnessOutline,
  trophyOutline,
  barbellOutline,
  statsChartOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  calendarOutline,
  timeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContentWithMotion from '@/components/MotionPage';
import CircularProgress from '@/components/CircularProgress';
import ROUTES from '@/routes';
import type { RefresherEventDetail } from '@ionic/core';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

const HomePage: React.FC = () => {
  const { activeWorkoutId } = useAuth();
  const history = useHistory();
  const { data: dashboardData, loading, error } = useHomeDashboard();

  const refreshData = async (event?: CustomEvent<RefresherEventDetail>) => {
    // Ricarica la pagina per aggiornare i dati
    window.location.reload();
    event?.detail.complete();
  };

  const goToWorkout = () => {
    if (activeWorkoutId) {
      history.push(ROUTES.PUBLIC.WORKOUT_WEEKS.replace(':id', String(activeWorkoutId)));
    } else if (dashboardData?.stats?.activeProgram?.id_program) {
      history.push(ROUTES.PUBLIC.WORKOUT_WEEKS.replace(':id', String(dashboardData.stats.activeProgram.id_program)));
    } else {
      history.push(ROUTES.PUBLIC.WORKOUT_LIST);
    }
  };

  // Calcola il tempo relativo per l'attività recente
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    return `${diffDays} giorni fa`;
  };

  const stats = dashboardData?.stats;

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={refreshData}>
        <IonRefresherContent />
      </IonRefresher>

      <ContentWithMotion
        isLoading={loading}
        loadingMessage="Caricamento dashboard..."
        errorMessage={error || "Errore nel caricamento"}
        loaderSize="small"
        loaderSpeed={1}
      >
        {/* Sfondo animato */}
        <AnimatedBackground
            variant="linee-move"
          intensity="light"
          height="250px"
          position="fixed"
          speed={3}
          fadeInDuration={2000}
        />
  {/* Sezione di saluto */}
          <IonGrid className="page-header ion-padding-horizontal">
            <IonRow>
              <IonCol>
                <IonText>
                  <h1 className="fw-bold fs-xxlarge">
                    Home                  </h1>
                  <p className="text-medium">
                    {dashboardData?.hasProgram
                      ? 'Pronto a raggiungere i tuoi obiettivi?'
                      : 'Inizia il tuo primo programma di allenamento!'}
                  </p>
                </IonText>
              </IonCol>
            </IonRow>
          </IonGrid>

        {/* Se non ha programmi attivi */}
        {!dashboardData?.hasProgram && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <IonCard>
              <IonCardContent className="ion-text-center ion-padding">
                <IonIcon
                  icon={barbellOutline}
                  color="primary"
                  style={{ fontSize: '4rem', marginBottom: '1rem' }}
                />
                <IonText>
                  <h2 className="fw-bold fs-large">Nessun programma attivo</h2>
                  <p className="text-medium ion-margin-top">
                    Inizia creando il tuo primo programma di allenamento
                  </p>
                </IonText>
                <IonButton
                  expand="block"
                  color="primary"
                  className="ion-margin-top"
                  onClick={() => history.push(ROUTES.PUBLIC.WORKOUT_LIST)}
                >
                  <IonIcon icon={fitnessOutline} slot="start" />
                  Esplora Programmi
                </IonButton>
              </IonCardContent>
            </IonCard>
          </motion.div>
        )}

        {/* Se ha programmi attivi, mostra le statistiche */}
        {dashboardData?.hasProgram && stats && (
          <>

        {/* Progresso Settimanale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <IonCard>
            <IonCardContent>
              <IonGrid className="ion-no-padding">
                <IonRow className="ion-align-items-center">
                  <IonCol size="auto">
                    <CircularProgress
                      percentage={stats.weekProgress * 100}
                      size={60}
                      strokeWidth={4}
                      color="progressColor"
                      text={`${Math.round(stats.weekProgress * 100)}%`}
                      duration={2}
                    />
                  </IonCol>
                  <IonCol>
                    <IonText>
                      <h2 className="fw-bold fs-large ion-no-margin">
                        Progresso Settimanale
                      </h2>
                      <p className="ion-no-margin text-medium">
                        {stats.completedDays} di {stats.totalDays} allenamenti completati
                      </p>
                    </IonText>
                    {stats.activeWeek && (
                      <IonBadge color="primary" className="ion-margin-top">
                        <IonIcon icon={calendarOutline} style={{ marginRight: '4px' }} />
                        Settimana {stats.activeWeek.week_number}
                      </IonBadge>
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </motion.div>

        {/* Prossimo Allenamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <IonCard button onClick={goToWorkout}>
            <IonCardContent>
              <IonGrid className="ion-no-padding">
                <IonRow className="ion-align-items-center">
                  <IonCol size="auto">
                    <IonIcon
                      icon={fitnessOutline}
                      color="primary"
                      style={{
                        fontSize: '2.5rem',
                        padding: '12px',
                        background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                        borderRadius: '12px'
                      }}
                    />
                  </IonCol>
                  <IonCol>
                    <IonText>
                      <h3 className="fw-bold fs-medium ion-no-margin">
                        Prossimo Allenamento
                      </h3>
                      <p className="ion-no-margin text-medium ion-margin-top">
                        {stats.nextWorkout}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="auto">
                    <IonIcon
                      icon={chevronForwardOutline}
                      color="medium"
                      style={{ fontSize: '1.5rem' }}
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </motion.div>

        {/* Statistiche Veloci - Grid solo per layout 2x2 */}
        <IonGrid className="ion-padding-horizontal">
          <IonRow>
            <IonCol size="6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      color="secondary"
                      style={{ fontSize: '2rem' }}
                    />
                    <IonText>
                      <h2 className="fw-bold fs-large ion-margin-top ion-no-margin">
                        {stats.totalWorkouts}
                      </h2>
                      <p className="ion-no-margin text-medium">
                        Allenamenti completati
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
            <IonCol size="6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon
                      icon={trophyOutline}
                      color="warning"
                      style={{ fontSize: '2rem' }}
                    />
                    <IonText>
                      <h2 className="fw-bold fs-large ion-margin-top ion-no-margin">
                        {stats.personalBests}
                      </h2>
                      <p className="ion-no-margin text-medium">
                        Esercizi tracciati
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon
                      icon={calendarOutline}
                      color="tertiary"
                      style={{ fontSize: '2rem' }}
                    />
                    <IonText>
                      <h2 className="fw-bold fs-large ion-margin-top ion-no-margin">
                        {stats.completedDays}
                      </h2>
                      <p className="ion-no-margin text-medium">
                        Giorni questa settimana
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
            <IonCol size="6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon
                      icon={timeOutline}
                      color="success"
                      style={{ fontSize: '2rem' }}
                    />
                    <IonText>
                      <h2 className="fw-bold fs-large ion-margin-top ion-no-margin">
                        {stats.lastWorkout}
                      </h2>
                      <p className="ion-no-margin text-medium">
                        Ultimo allenamento
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Attività Recente */}
        {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <IonCard>
              <IonCardContent>
                <IonText>
                  <h3 className="fw-bold fs-medium ion-margin-bottom">
                    Attività Recente
                  </h3>
                </IonText>
                <IonList lines="none">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <IonItem key={index}>
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        color="success"
                        slot="start"
                      />
                      <IonLabel>
                        <h3>Allenamento completato</h3>
                        <p>{activity.day_name} - Settimana {activity.week_number}</p>
                      </IonLabel>
                      <IonBadge color="medium" slot="end">
                        {getRelativeTime(activity.completed_at)}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <IonGrid className="ion-padding">
          <IonRow>
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={() => history.push(ROUTES.PUBLIC.WORKOUT_LIST)}
              >
                <IonIcon icon={fitnessOutline} slot="start" />
                Programmi
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                color="secondary"
                onClick={() => history.push(ROUTES.PUBLIC.SETTING)}
              >
                <IonIcon icon={statsChartOutline} slot="start" />
                Statistiche
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
        </>
        )}
      </ContentWithMotion>
    </>
  );
};

export default HomePage;

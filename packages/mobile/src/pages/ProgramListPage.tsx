// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonSpinner,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonAvatar,
  IonBadge,
  IonThumbnail
} from '@ionic/react';
import { addOutline, filterOutline, arrowForwardOutline, timeOutline, barbellOutline } from 'ionicons/icons';
import { getProgramList } from '@/api/program';
import { useAuth } from '@/contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import ContentWithMotion from '@/components/MotionPage';
import ROUTES from '@/routes';
import AnimatedBackground from '@/components/AnimatedBackground';

const ProgramListPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('primary');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');

  const history = useHistory();

  // Funzione per caricare i dati
  const loadData = async (event) => {
    try {
      setLoading(true);

      if (user?.id_user_details) {
        const programList = await getProgramList(user.id_user_details);
        setPrograms(programList || []);
      }

      setError(null);

      if (event) event.detail.complete();
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Impossibile caricare i dati. Riprova più tardi.');
      setToastMessage('Errore nel caricamento dei dati');
      setToastColor('danger');
      setShowToast(true);

      if (event) event.detail.complete();
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  // Funzione per formattare la data
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return `Oggi, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtra i programmi in base a categoria, stato e ricerca
  const filteredPrograms = programs.filter(program => {
    // Filtra per testo di ricerca
    const matchesSearch = !searchText ||
      (program.name && program.name.toLowerCase().includes(searchText.toLowerCase()));

    // Filtra per categoria
    const matchesCategory = selectedCategory === 'all' ||
      (selectedCategory === 'own' && program.is_own) ||
      (selectedCategory === 'trainer' && !program.is_own);

    // Filtra per stato
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && program.is_active) ||
      (selectedStatus === 'inactive' && !program.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Inizia un programma
  const startProgram = (program, e) => {
    e.stopPropagation();
    // Naviga alla pagina di programma con i dettagli del programma selezionato
    history.push(`/program/${program.id}`);
  };

  // Visualizza i dettagli di un programma
  const viewProgramDetails = (program) => {
    history.push(`/program-details/${program.id}`);
  };

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={loadData}>
        <IonRefresherContent />
      </IonRefresher>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color={toastColor}
      />

      <ContentWithMotion
        isLoading={loading}
        loadingMessage="Caricamento..."
        errorMessage="Errore nel caricamento."
        loaderSize="small"
        loaderSpeed={1}
      >
        {/* Sfondo con linee animate */}
        <AnimatedBackground
          variant="linee-move"
          intensity="light"
          height="250px"
          position="absolute"
          speed={3}
          fadeInDuration={2000}
        />
        <div className="ion-padding">
          {/* Sfondo con linee animate */}

          {/* Intestazione della pagina */}
          <div className="page-header">
            <IonText>
              <h1 className="fw-bold fs-xlarge">Programmi</h1>
              <p className="text-medium">Gestisci i tuoi programmi di allenamento</p>
            </IonText>
          </div>

          {/* Barra di ricerca */}
          <IonSearchbar
            value={searchText}
            onIonChange={e => setSearchText(e.detail.value)}
            placeholder="Cerca programmi"
            animated
            className="mb-md"
            style={{ '--border-radius': '12px' }}
          />

          {/* Segmenti per la categoria (proprio/trainer) */}
          <IonSegment
            value={selectedCategory}
            onIonChange={e => setSelectedCategory(e.detail.value)}
            className="custom-segment"
          >
            <IonSegmentButton value="all">
              <IonLabel>Tutti</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="own">
              <IonLabel>I miei</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="trainer">
              <IonLabel>Trainer</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Chips per lo stato (attivo/inattivo) */}
          <div className="chips-container">
            <IonChip
              color={selectedStatus === 'all' ? 'primary' : 'medium'}
              outline={selectedStatus !== 'all'}
              onClick={() => setSelectedStatus('all')}
            >
              <IonLabel>Tutti</IonLabel>
            </IonChip>
            <IonChip
              color={selectedStatus === 'active' ? 'primary' : 'medium'}
              outline={selectedStatus !== 'active'}
              onClick={() => setSelectedStatus('active')}
            >
              <IonLabel>Attivi</IonLabel>
            </IonChip>
            <IonChip
              color={selectedStatus === 'inactive' ? 'primary' : 'medium'}
              outline={selectedStatus !== 'inactive'}
              onClick={() => setSelectedStatus('inactive')}
            >
              <IonLabel>Archiviati</IonLabel>
            </IonChip>
          </div>

          {/* Risultati - Card separate per ogni programma */}
          {loading && programs.length > 0 ? (
            <IonCard className="ion-no-margin mb-md">
              <IonCardContent className="ion-text-center ion-padding">
                <IonSpinner name="crescent" />
                <IonText>
                  Caricamento programmi...
                </IonText>
              </IonCardContent>
            </IonCard>
          ) : filteredPrograms.length > 0 ? (
            <>
              {filteredPrograms.map(program => (
                <IonCard
                  key={program.id}
                  className="ion-no-margin mb-md"
                  button
                  onClick={() => viewProgramDetails(program)}
                >
                  <IonCardContent className="ion-no-padding">
                    <IonGrid>
                      <IonRow className="ion-align-items-center">
                        <IonCol size="auto">
                          <IonThumbnail style={{
                            width: '48px',
                            height: '48px',
                            '--border-radius': '12px',
                            background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                            position: 'relative'
                          }}>
                            <IonIcon
                              icon={barbellOutline}
                              color="primary"
                              style={{
                                fontSize: '1.5rem',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                            {/* Indicatore di stato (pallino verde per attivo) */}
                            {program.is_active && (
                              <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'var(--ion-color-success)',
                                border: '2px solid var(--ion-background-color)'
                              }}></div>
                            )}
                          </IonThumbnail>
                        </IonCol>
                        <IonCol>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IonCardTitle className="fs-large">{program.name || 'Scheda senza nome'}</IonCardTitle>
                            {program.is_active ? (
                              <IonBadge color="success" style={{ marginLeft: '8px', fontSize: '0.6rem', padding: '4px 8px' }}>
                                Attivo
                              </IonBadge>
                            ) : (
                              <IonBadge color="medium" style={{ marginLeft: '8px', fontSize: '0.6rem', padding: '4px 8px' }}>
                                Archiviato
                              </IonBadge>
                            )}
                          </div>
                          <IonCardSubtitle className="ion-no-margin">
                            <IonIcon icon={barbellOutline} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            {formatDate(program.created_at)}
                          </IonCardSubtitle>

                          {program.description && (
                            <IonText color="medium">
                              {program.description}
                            </IonText>
                          )}
                        </IonCol>
                      </IonRow>

                      <IonRow className="ion-align-items-center ion-margin-top">
                        <IonCol>
                          <IonChip
                            color="primary"
                            outline
                            size="small"
                          >
                            <IonLabel>{program.duration_workout} minuti</IonLabel>
                          </IonChip>
                        </IonCol>
                        <IonCol className="ion-text-end">
                          <IonButton
                            color="primary"
                            fill="solid"
                            shape="round"
                            size="small"
                            onClick={(e) => startProgram(program, e)}
                          >
                            Inizia
                            <IonIcon slot="end" icon={arrowForwardOutline} />
                          </IonButton>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              ))}
            </>
          ) : (
            <IonCard className="ion-no-margin mb-md">
              <IonCardContent className="ion-text-center ion-padding">
                <IonIcon
                  icon={filterOutline}
                  color="medium"
                  style={{ fontSize: '48px', marginBottom: '16px' }}
                />
                <IonText>
                  <h3>Nessun programma trovato</h3>
                  <p>
                    {searchText ?
                      'Prova con altri termini di ricerca o filtri.' :
                      'Crea il tuo primo programma di allenamento.'}
                  </p>
                </IonText>
                <IonButton
                  expand="block"
                  className="ion-margin-top"
                  routerLink="/add-program"
                >
                  <IonIcon slot="start" icon={addOutline} />
                  Crea programma
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </ContentWithMotion>

      {/* FAB per aggiungere nuovo programma */}
      <IonFab
        vertical="top"
        horizontal="end"
        slot="fixed"
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-area-top, 0px) + 60px)',
          right: '16px',
          zIndex: 999
        }}
      >
        <IonFabButton size="small" onClick={() => setIsInfoModalOpen(true)}>
          <IonIcon icon={addOutline} />
        </IonFabButton>
      </IonFab>
    </>
  );
};

export default ProgramListPage;
// @ts-nocheck

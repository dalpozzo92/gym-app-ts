// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent,
  IonText,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonChip,
  IonLabel,
  IonBadge,
  IonItem,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/react';
import {
  personOutline,
  trophyOutline,
  shareOutline,
  settingsOutline,
  playOutline,
  medalOutline,
  flameOutline,
  calendarOutline,
  timerOutline,
  checkmarkCircleOutline,
  starOutline,
  logoInstagram,
  heartOutline,
  peopleOutline,
  musicalNotesOutline,
  headsetOutline,
  libraryOutline,
  closeOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContentWithMotion from '@/components/MotionPage';
import LiquidGlassModal from '@/components/LiquidGlassModal';
import ROUTES from '@/routes';

// Componente Badge Achievement ridisegnato
const AchievementBadge = ({ badge, onShare }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minWidth: '100px',
        margin: '8px'
      }}
    >
      {/* Badge circolare */}
      <div
        onClick={() => onShare(badge)}
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: `var(--ion-color-${badge.color})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${badge.glowColor}`,
          cursor: 'pointer',
          marginBottom: '8px'
        }}
      >
        <IonIcon
          icon={badge.icon}
          style={{
            fontSize: '2rem',
            color: 'white'
          }}
        />
      </div>
      
      {/* Testo sotto il badge */}
      <IonText className="ion-text-center">
        <h4 className="fw-bold fs-small ion-no-margin">
          {badge.title}
        </h4>
        <p className="fs-small text-medium ion-no-margin">
          {badge.description}
        </p>
      </IonText>
    </motion.div>
  );
};

// Componente Modal per condivisione badge
const ShareBadgeModal = ({ isOpen, onClose, badge }) => {
  const shareToInstagram = () => {
    // Logica per condividere su Instagram
    const shareUrl = `https://www.instagram.com/`;
    window.open(shareUrl, '_blank');
    onClose();
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      title="Condividi Traguardo"
      initialBreakpoint={0.8}
      breakpoints={[0, 0.8, 1]}
    >
      {/* Background decorativo per il badge */}
      <div style={{
        background: `linear-gradient(135deg, var(--ion-color-${badge?.color}) 0%, var(--ion-color-${badge?.color}-shade) 100%)`,
        borderRadius: '20px',
        padding: '30px',
        textAlign: 'center',
        margin: '20px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Effetto brillantino */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <IonIcon
            icon={badge?.icon}
            style={{
              fontSize: '4rem',
              color: 'white',
              marginBottom: '16px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}
          />
          <IonText>
            <h1 className="fw-bold" style={{ color: 'white', margin: '0' }}>
              {badge?.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0' }}>
              {badge?.description}
            </p>
          </IonText>
        </motion.div>
      </div>

      <IonText className="ion-text-center ion-margin-vertical">
        <h2 className="fw-bold">Fantastico!</h2>
        <p className="text-medium">Hai sbloccato questo incredibile traguardo. Condividilo con i tuoi amici!</p>
      </IonText>

      <IonButton
        expand="block"
        color="primary"
        onClick={shareToInstagram}
        style={{ margin: '20px 0' }}
      >
        <IonIcon icon={logoInstagram} slot="start" />
        Condividi su Instagram
      </IonButton>
    </LiquidGlassModal>
  );
};

// Componente Playlist Spotify aggiornato
const SpotifyPlaylist = ({ playlist }) => {
  return (
    <IonCard>
      <IonCardContent>
        <IonGrid className="ion-no-padding">
          <IonRow className="ion-align-items-center">
            <IonCol size="auto">
              <IonAvatar style={{ width: '60px', height: '60px' }}>
                <img 
                  src={playlist.cover || '/api/placeholder/60/60'} 
                  alt="Playlist cover"
                />
              </IonAvatar>
            </IonCol>
            <IonCol>
              <IonText>
                <h3 className="fw-bold fs-medium ion-no-margin">{playlist.name}</h3>
                <p className="ion-no-margin text-medium">{playlist.trackCount} brani</p>
              </IonText>
              <IonChip color="success" outline size="small" className="ion-margin-top">
                <IonIcon icon={musicalNotesOutline} />
                <IonLabel>Spotify</IonLabel>
              </IonChip>
            </IonCol>
            <IonCol size="auto">
              <IonButton fill="clear" color="primary">
                <IonIcon icon={playOutline} style={{ fontSize: '1.5rem' }} />
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

// Componente Canzone Consigliata aggiornato
const RecommendedTrack = ({ track }) => {
  return (
    <IonCard>
      <IonCardContent>
        <IonGrid className="ion-no-padding">
          <IonRow className="ion-align-items-center">
            <IonCol size="auto">
              <IonAvatar style={{ width: '50px', height: '50px' }}>
                <img 
                  src={track.albumCover || '/api/placeholder/50/50'} 
                  alt="Album cover"
                />
              </IonAvatar>
            </IonCol>
            <IonCol>
              <IonText>
                <h4 className="fw-bold fs-medium ion-no-margin">{track.title}</h4>
                <p className="ion-no-margin text-medium">{track.artist}</p>
              </IonText>
              <IonBadge color="primary" className="ion-margin-top">
                <IonIcon icon={heartOutline} style={{ marginRight: '4px' }} />
                Consigliata per l'allenamento
              </IonBadge>
            </IonCol>
            <IonCol size="auto">
              <IonButton fill="clear" color="success">
                <IonIcon icon={playOutline} style={{ fontSize: '1.5rem' }} />
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

const ProfilePage = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('overview');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Dati mock del profilo
  const [profileData] = useState({
    followers: 1247,
    following: 892,
    workoutsCompleted: 156,
    isPersonalTrainer: true,
    bio: "💪 Personal Trainer certificato ISSA\n🏆 Specializzato in forza e ipertrofia\n🎯 Aiuto le persone a raggiungere i loro obiettivi\n📍 Milano, Italia",
    achievements: [
      {
        id: '1',
        title: 'Guerriero della Costanza',
        description: '30 giorni consecutivi',
        icon: flameOutline,
        color: 'danger',
        glowColor: 'rgba(239, 68, 68, 0.3)',
        unlockedAt: '2024-01-15'
      },
      {
        id: '2',
        title: 'Centurione',
        description: '100 allenamenti',
        icon: medalOutline,
        color: 'warning',
        glowColor: 'rgba(245, 158, 11, 0.3)',
        unlockedAt: '2024-01-10'
      },
      {
        id: '3',
        title: 'Maestro della Forza',
        description: 'PR in tutti gli esercizi',
        icon: trophyOutline,
        color: 'success',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        unlockedAt: '2024-01-05'
      }
    ],
    stats: {
      totalHours: 342,
      averagePerWeek: 4.2,
      currentStreak: 12,
      longestStreak: 45,
      favoriteDay: 'Lunedì',
      averageIntensity: 8.5
    },
    playlist: {
      name: "Beast Mode",
      trackCount: 47,
      cover: "/api/placeholder/60/60"
    },
    recommendedTrack: {
      title: "Till I Collapse",
      artist: "Eminem",
      albumCover: "/api/placeholder/50/50"
    }
  });

  const refreshProfile = async (event) => {
    setTimeout(() => {
      event?.detail.complete();
    }, 1000);
  };

  const shareAchievement = useCallback((badge) => {
    setSelectedBadge(badge);
    setShowShareModal(true);
  }, []);

  const handleFollow = () => {
    setToastMessage('Funzionalità disponibile presto!');
    setShowToast(true);
  };

  const renderOverview = () => (
    <>
      {/* Playlist Spotify */}
      <div className="ion-padding-horizontal">

      <IonText>
        <h3 className="fw-bold fs-medium">
          <IonIcon icon={libraryOutline} color="primary" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          La mia playlist
        </h3>
      </IonText>
 </div>
      <SpotifyPlaylist playlist={profileData.playlist} />
      {/* Canzone consigliata */}
            <div className="ion-padding-horizontal">

      <IonText>
        <h3 className="fw-bold fs-medium">
          <IonIcon icon={headsetOutline} color="secondary" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Consiglio del giorno
        </h3>
      </IonText>
       </div>
      <RecommendedTrack track={profileData.recommendedTrack} />
       

    </>
  );

  const renderAchievements = () => (
    <>
          <div className="ion-padding-horizontal">

      <IonText >
        <h3 className="fw-bold fs-medium">
          <IonIcon icon={trophyOutline} color="warning" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          I tuoi traguardi
        </h3>
        <p className="text-medium">Condividi i tuoi successi con la community!</p>
      </IonText>
       </div>
      
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        padding: '0 16px',
        gap: '16px',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}>
        {profileData.achievements.map(badge => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            onShare={shareAchievement}
          />
        ))}
      </div>

      {/* Progress stats */}
            <div className="ion-padding-horizontal">

      <IonText className="ion-padding-horizontal ion-margin-top">
        <h3 className="fw-bold fs-medium">
          <IonIcon icon={starOutline} color="tertiary" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Statistiche obiettive
        </h3>
      </IonText>
       </div>
      <IonCard>
        <IonCardContent>
          <IonList lines="none">
            <IonItem>
              <IonIcon icon={timerOutline} color="primary" slot="start" />
              <IonLabel>
                <h3>Ore totali di allenamento</h3>
                <p>{profileData.stats.totalHours} ore</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonIcon icon={calendarOutline} color="secondary" slot="start" />
              <IonLabel>
                <h3>Media settimanale</h3>
                <p>{profileData.stats.averagePerWeek} allenamenti</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonIcon icon={flameOutline} color="warning" slot="start" />
              <IonLabel>
                <h3>Streak attuale</h3>
                <p>{profileData.stats.currentStreak} giorni</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonIcon icon={starOutline} color="success" slot="start" />
              <IonLabel>
                <h3>Record consecutivi</h3>
                <p>{profileData.stats.longestStreak} giorni</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>
    </>
  );

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={refreshProfile}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Modal condivisione badge */}
      <ShareBadgeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        badge={selectedBadge}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color="success"
      />

      <ContentWithMotion
        isLoading={loading}
        loadingMessage="Caricamento profilo..."
        errorMessage="Errore nel caricamento"
        loaderSize="small"
        loaderSpeed={1}
      >
        {/* Sfondo animato */}
        <AnimatedBackground
          variant="dark-veil"
          intensity="light"
          height="200px"
          position="absolute"
          speed={1.5}
          fadeInDuration={2000}
        />

        {/* Header Profilo stile Instagram */}
              <div className="ion-padding-horizontal">

          <IonGrid className="ion-padding-horizontal">
            <IonRow className="ion-align-items-center">
              <IonCol size="auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <IonAvatar style={{ width: '80px', height: '80px', margin: '0' }}>
                    <img 
                      src={user?.avatar || '/api/placeholder/80/80'} 
                      alt="Profile"
                    />
                  </IonAvatar>
                </motion.div>
              </IonCol>
              <IonCol>
                <IonGrid className="ion-no-padding">
                  <IonRow>
                    <IonCol size="4" className="ion-text-center">
                      <IonText>
                        <h2 className="fw-bold ion-no-margin">{profileData.workoutsCompleted}</h2>
                        <p className="fs-xsmall text-medium ion-no-margin">Allenamenti</p>
                      </IonText>
                    </IonCol>
                    <IonCol size="4" className="ion-text-center">
                      <IonText>
                        <h2 className="fw-bold ion-no-margin">{profileData.followers}</h2>
                        <p className="fs-xsmall text-medium ion-no-margin">Follower</p>
                      </IonText>
                    </IonCol>
                    <IonCol size="4" className="ion-text-center">
                      <IonText>
                        <h2 className="fw-bold ion-no-margin">{profileData.following}</h2>
                        <p className="fs-xsmall text-medium ion-no-margin">Seguiti</p>
                      </IonText>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
          {/* Nome e bio */}
                <div className="ion-padding-horizontal">

          <IonText className="ion-margin-top">
            <h1 className="fw-bold fs-large ion-no-margin">
              {user?.name || 'Nome Utente'}
              {profileData.isPersonalTrainer && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  color="primary"
                  style={{ marginLeft: '8px', fontSize: '1.2rem' }}
                />
              )}
            </h1>
            
            {profileData.isPersonalTrainer && (
              <IonChip color="primary" className="ion-margin-top">
                <IonIcon icon={trophyOutline} />
                <IonLabel>Personal Trainer</IonLabel>
              </IonChip>
            )}
            
            <p className="text-medium ion-margin-top" style={{ whiteSpace: 'pre-line' }}>
              {profileData.bio}
            </p>
          </IonText>
         </div>

          {/* Pulsanti azione */}
                <div className="ion-padding-horizontal">

          <IonGrid className="ion-margin-top ion-no-padding">
            <IonRow>
              <IonCol size="6">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="primary"
                  size="small"
                  onClick={handleFollow}
                >
                  <IonIcon icon={peopleOutline} slot="start" />
                  Segui
                </IonButton>
              </IonCol>
              <IonCol size="2">
                <IonButton
                  expand="block"
                  fill="outline"
                  color="primary"
                  size="small"
                  onClick={() => history.push(ROUTES.PUBLIC.SETTING)}
                >
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
            </div>
        {/* Segment per navigare tra sezioni */}
              <div className="ion-padding-horizontal">

        <IonSegment
          value={selectedSegment}
          onIonChange={(e) => setSelectedSegment(e.detail.value)}
        //   className="ion-margin-horizontal"
        >
          <IonSegmentButton value="overview">
            <IonLabel>Panoramica</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="achievements">
            <IonLabel>Traguardi</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        </div>  
        {/* Contenuto basato sul segment selezionato */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSegment}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="ion-margin-top"
          >
            {selectedSegment === 'overview' && renderOverview()}
            {selectedSegment === 'achievements' && renderAchievements()}
          </motion.div>
        </AnimatePresence>
      </ContentWithMotion>
    </>
  );
};

export default ProfilePage;
// @ts-nocheck

import React, { useState } from 'react';
import { 
  IonToggle, 
  IonLabel, 
  IonIcon,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem
} from '@ionic/react';
import { 
  moonOutline, 
  sunnyOutline, 
  personOutline, 
  logOutOutline,
  lockClosedOutline,
  notificationsOutline,
  helpCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { logout } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useHistory } from 'react-router-dom';

// Stili comuni da riutilizzare
const styles = {
  profileAvatar: {
    width: '60px', 
    height: '60px', 
    borderRadius: '50%', 
    background: 'var(--ion-color-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16px',
    fontSize: '1.2rem',  // Font size ridotto
    color: 'white',
    fontWeight: 'bold'
  },
  profileName: {
    margin: '0', 
    fontWeight: 'bold', 
    fontSize: '1rem'  // Font size ridotto e consistente
  },
  profileEmail: {
    margin: '4px 0 0', 
    color: 'var(--ion-color-medium)',
    fontSize: '0.85rem'  // Font size ridotto e consistente
  },
  cardTitle: {
    fontSize: '1rem'  // Font size consistente per i titoli
  }
};

const SettingPage: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [enableNotifications, setEnableNotifications] = useState(true);
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await logout();
      authLogout(history); // Aggiorna lo stato dell'auth context
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <>
        <IonCard className="ion-margin-bottom">
          <IonCardHeader>
            <IonCardTitle style={styles.cardTitle}>Il tuo profilo</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={styles.profileAvatar}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              
              <div>
                <h2 style={styles.profileName}>{user?.name || 'Utente'}</h2>
                <p style={styles.profileEmail}>
                  {user?.email || 'utente@esempio.com'}
                </p>
              </div>
            </div>
            <div className="ion-padding-top">
              <IonButton size="small" expand="block" fill="outline" routerLink="/profile">
                <IonIcon slot="start" icon={personOutline} />
                Modifica Profilo
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
        
        {/* Carta impostazioni tema */}
        <IonCard className="ion-margin-bottom">
          <IonCardHeader>
            <IonCardTitle style={styles.cardTitle}>Personalizzazione</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="ion-no-padding">
              <IonIcon 
                slot="start" 
                icon={darkMode ? moonOutline : sunnyOutline} 
                color={darkMode ? "secondary" : "warning"} 
              />
              <IonLabel>
                <span style={{ fontSize: '0.95rem' }}>
                  {darkMode ? 'Tema Scuro' : 'Tema Chiaro'}
                </span>
              </IonLabel>
              <IonToggle 
                checked={darkMode}
                onIonChange={() => {
                  console.log('Toggle premuto, stato attuale:', darkMode);
                  toggleDarkMode();
                  setTimeout(() => {
                    console.log('Nuovo stato dopo toggle:', document.body.classList.contains('dark') ? 'scuro' : 'chiaro');
                    console.log('Valore in localStorage:', localStorage.getItem('darkMode'));
                  }, 100);
                }}
                slot="end"
              />
            </IonItem>
            
          <IonItem lines="none" className="ion-no-padding ion-margin-top">
            <IonIcon slot="start" icon={notificationsOutline} color="primary" />
            <IonLabel>
              <span style={{ fontSize: '0.95rem' }}>Notifiche</span>
            </IonLabel>
            <IonToggle 
              checked={enableNotifications}
              onIonChange={() => setEnableNotifications(prev => !prev)}
              slot="end"
            />
          </IonItem>
          </IonCardContent>
        </IonCard>
        
        {/* Carta sicurezza */}
        <IonCard className="ion-margin-bottom">
          <IonCardHeader>
            <IonCardTitle style={styles.cardTitle}>Sicurezza</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="ion-no-padding" detail routerLink="/change-password">
              <IonIcon slot="start" icon={lockClosedOutline} color="primary" />
              <IonLabel>
                <span style={{ fontSize: '0.95rem' }}>Cambia Password</span>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>
        
        {/* Carta informazioni */}
        <IonCard className="ion-margin-bottom">
          <IonCardHeader>
            <IonCardTitle style={styles.cardTitle}>Supporto</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="ion-no-padding" detail routerLink="/help">
              <IonIcon slot="start" icon={helpCircleOutline} color="primary" />
              <IonLabel>
                <span style={{ fontSize: '0.95rem' }}>Aiuto e FAQ</span>
              </IonLabel>
            </IonItem>
            
            <IonItem lines="none" className="ion-no-padding ion-margin-top" detail routerLink="/about">
              <IonIcon slot="start" icon={informationCircleOutline} color="primary" />
              <IonLabel>
                <span style={{ fontSize: '0.95rem' }}>Informazioni</span>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>
        
        {/* Pulsante Logout */}
        <IonCard className="ion-margin-bottom">
          <IonCardContent>
            <IonButton 
              expand="block" 
              color="danger" 
              size="default"
              onClick={handleLogout}
            >
              <IonIcon slot="start" icon={logOutOutline} />
              <span style={{ fontSize: '0.95rem' }}>Logout</span>
            </IonButton>
          </IonCardContent>
        </IonCard>
        
        {/* Footer con versione */}
        <div className="ion-text-center ion-padding">
          <IonText color="medium" style={{ fontSize: '0.75rem' }}>
            Versione 1.0.0
          </IonText>
        </div>
      </>  
  );
};

export default SettingPage;

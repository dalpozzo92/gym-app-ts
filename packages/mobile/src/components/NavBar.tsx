import React from 'react';
import { 
  IonHeader, 
  IonGrid,
  IonCol,
  IonRow,
  IonIcon,
  IonText,
  IonButton
} from '@ionic/react';
import { settingsOutline, chevronBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ROUTES from '../routes';

type NavBarProps = {
  title?: string;
  showBackButton?: boolean;
  showAvatar?: boolean;
  showSettingsButton?: boolean;
};

const NavBar: React.FC<NavBarProps> = ({ 
  title,
  showBackButton = false,
  showAvatar = true,
  showSettingsButton = true
}) => {
  const history = useHistory();
  const { user } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.map((part) => part.charAt(0)).join('').toUpperCase();
  };

  const initials = getInitials(user?.name);

  // Stili inline esistenti...
  const styles: Record<string, any> = {
    header: {
    },
    container: {
      padding: '8px 16px',
      paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
      background: 'transparent'
    },
    navbar: {
      '--background': 'rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.5)',
      backdropFilter: 'blur(10px) saturate(2)',
      WebkitBackdropFilter: 'blur(10px) saturate(2)',
      borderRadius: '19px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(var(--ion-border-color-rgb, 255, 255, 255), 0.15)',
      overflow: 'hidden',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      position: 'relative'
    }
  };

  return (
    <IonHeader className="ion-no-border" style={styles.header}>
      <div style={styles.container}>
        <div style={styles.navbar}>
          <IonGrid style={{ margin: 0, padding: 0}}>
            <IonRow className="ion-align-items-center" style={{ margin: 0, padding: 0, height: '100%' }}>
              
              {/* Pulsante Indietro - Solo se abilitato */}
              {showBackButton && (
                <IonCol size="auto" style={{ padding: 0 }}>
                  <IonButton
                    fill="clear"
                    onClick={() => history.goBack()}
                    style={{
                      '--background': 'transparent',
                      '--border-radius': '8px',
                      '--box-shadow': 'none',
                      '--padding-start': '6px',
                      '--padding-end': '0px',
                      '--padding-top': '6px',
                      '--padding-bottom': '6px',
                      backdropFilter: 'blur(10px)',
                      width: '30px',
                      height: '30px',
                      margin: '0 4px 0 0'
                    }}
                  >
                    <IonIcon 
                      icon={chevronBackOutline} 
                      style={{ fontSize: '20px', color: 'var(--ion-text-color)' }}
                    />
                  </IonButton>
                </IonCol>
              )}
              
              {/* Avatar - Solo se abilitato */}
              {showAvatar && (
                <IonCol size="auto" style={{ padding: 0 }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    marginRight: '10px',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden'
                  }}>
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Avatar" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--ion-color-primary)',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: 'white',
                        borderRadius: '50%'
                      }}>
                        {initials || '?'}
                      </div>
                    )}
                  </div>
                </IonCol>
              )}
              
              {/* Titolo - Usa il titolo passato o il saluto di default */}
              <IonCol style={{ padding: 0 }}>
                <IonText>
                  <h2 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--ion-text-color)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>
                    {title || `Ciao, ${user?.name?.split(' ')[0] || 'Utente'}`}
                  </h2>
                </IonText>
              </IonCol>
              
              {/* Pulsante Impostazioni - Solo se abilitato */}
              {showSettingsButton && (
                <IonCol size="auto" style={{ padding: 0 }}>
                  <IonButton
                    fill="clear"
                    onClick={() => history.push(ROUTES.PUBLIC.SETTING)}
                    style={{
                      '--background': 'transparent',
                      '--border-radius': '8px',
                      '--box-shadow': 'none',
                      '--padding-start': '6px',
                      '--padding-end': '0px',
                      '--padding-top': '6px',
                      '--padding-bottom': '6px',
                      width: '30px',
                      height: '30px',
                      margin: '0'
                    }}
                  >
                    <IonIcon 
                      icon={settingsOutline} 
                      style={{ 
                        fontSize: '25px', 
                        color: 'var(--ion-text-color)', 
                        opacity: '0.8' 
                      }}
                    />
                  </IonButton>
                </IonCol>
              )}
            </IonRow>
          </IonGrid>
        </div>
      </div>
    </IonHeader>
  );
};

export default NavBar;

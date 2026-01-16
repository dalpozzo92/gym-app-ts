import React, { type CSSProperties } from 'react';
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

  // Stili liquid glass come TabBar
  const styles: Record<string, CSSProperties> = {
    header: {
      position: 'relative'
    },
    navbarWrapper: {
      position: 'relative',
      paddingTop: 'var(--ion-safe-area-top, 0px)'
    },
    navbarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottomLeftRadius: '24px',
      borderBottomRightRadius: '24px',
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.2)
      `,
      zIndex: 0
    },
    navbarContent: {
      position: 'relative',
      zIndex: 1,
      padding: '12px 16px',
      minHeight: '56px',
      display: 'flex',
      alignItems: 'center'
    },
    backButton: {
      '--background': 'transparent',
      '--border-radius': '12px',
      '--box-shadow': 'none',
      '--padding-start': '8px',
      '--padding-end': '8px',
      '--padding-top': '8px',
      '--padding-bottom': '8px',
      width: '40px',
      height: '40px',
      margin: '0 8px 0 0'
    } as CSSProperties,
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      marginRight: '12px',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      flexShrink: 0
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%'
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ion-color-primary)',
      fontWeight: '600',
      fontSize: '14px',
      color: 'white',
      borderRadius: '50%'
    },
    title: {
      margin: 0,
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'var(--ion-color-light)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
    },
    settingsButton: {
      '--background': 'transparent',
      '--border-radius': '12px',
      '--box-shadow': 'none',
      '--padding-start': '8px',
      '--padding-end': '8px',
      '--padding-top': '8px',
      '--padding-bottom': '8px',
      width: '40px',
      height: '40px',
      margin: '0'
    } as CSSProperties,
    iconStyle: {
      fontSize: '24px',
      color: 'var(--ion-color-light)'
    }
  };

  return (
    <IonHeader className="ion-no-border" style={styles.header}>
      <div style={styles.navbarWrapper}>
        {/* Background liquid glass layer */}
        <div style={styles.navbarBackground} />

        {/* Content layer */}
        <div style={styles.navbarContent}>
          <IonGrid style={{ margin: 0, padding: 0, width: '100%' }}>
            <IonRow className="ion-align-items-center" style={{ margin: 0, padding: 0 }}>

              {/* Pulsante Indietro - Solo se abilitato */}
              {showBackButton && (
                <IonCol size="auto" style={{ padding: 0 }}>
                  <IonButton
                    fill="clear"
                    onClick={() => history.goBack()}
                    style={styles.backButton}
                  >
                    <IonIcon
                      icon={chevronBackOutline}
                      style={styles.iconStyle}
                    />
                  </IonButton>
                </IonCol>
              )}

              {/* Avatar - Solo se abilitato */}
              {showAvatar && (
                <IonCol size="auto" style={{ padding: 0 }}>
                  <div style={styles.avatar}>
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        style={styles.avatarImage}
                      />
                    ) : (
                      <div style={styles.avatarPlaceholder}>
                        {initials || '?'}
                      </div>
                    )}
                  </div>
                </IonCol>
              )}

              {/* Titolo - Usa il titolo passato o il saluto di default */}
              <IonCol style={{ padding: 0 }}>
                <IonText>
                  <h2 style={styles.title}>
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
                    style={styles.settingsButton}
                  >
                    <IonIcon
                      icon={settingsOutline}
                      style={{ ...styles.iconStyle, opacity: 0.8 }}
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

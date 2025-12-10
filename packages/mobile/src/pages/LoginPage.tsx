// src/pages/LoginPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  IonItem,
  IonToast,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonImg,
  IonHeader
} from '@ionic/react';
import { lockClosedOutline, mailOutline, logInOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { loginUser } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import ROUTES from '@/routes';
import '@/theme/LoginPage.css'; // Importa il CSS personalizzato
import AnimatedBackground from '@/components/AnimatedBackground';
import BilanciereLoader from '@/components/BilanciereLoader';
import type { IonInputCustomEvent, InputChangeEventDetail } from '@ionic/core';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  const [showLoadingToast, setShowLoadingToast] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // ✅ Nuovo: stato per loading iniziale
  
  // Riferimenti ai campi input per accedere ai loro valori nativi
  const emailInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  
  const history = useHistory();
  const { login, isAuthenticated, loading: authLoading, checkAuth } = useAuth();

  // Controlla se l'utente è già autenticato all'avvio
  useEffect(() => {
    const attemptAutoLogin = async () => {
      setIsCheckingAuth(true);
      try {
        const isValid = await checkAuth();
        if (isValid) {
          history.replace(ROUTES.PUBLIC.HOME);
        }
      } catch (error) {
        console.error('Auto login error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    attemptAutoLogin();
  }, []);

  // Redirect se l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      history.replace(ROUTES.PUBLIC.HOME);
    }
  }, [isAuthenticated, authLoading, history]);

  // Aggiungiamo un effetto per controllare i valori autocomplete
  useEffect(() => {
    // Controlliamo dopo un breve ritardo per permettere all'autocomplete di essere applicato
    const timer = setTimeout(() => {
      const emailEl = emailInputRef.current;
      const passwordEl = passwordInputRef.current;
      
      if (emailEl && passwordEl) {
        // Accediamo al valore nativo per verificare se è stato compilato da autocomplete
        const nativeEmailEl = emailEl.querySelector('input');
        const nativePasswordEl = passwordEl.querySelector('input');
        
        if (nativeEmailEl && nativeEmailEl.value && email !== nativeEmailEl.value) {
          setEmail(nativeEmailEl.value);
        }
        
        if (nativePasswordEl && nativePasswordEl.value && password !== nativePasswordEl.value) {
          setPassword(nativePasswordEl.value);
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Ottieni valori attuali dai campi di input (utile per l'autocomplete)
    const currentEmail = emailInputRef.current?.querySelector('input')?.value || email;
    const currentPassword = passwordInputRef.current?.querySelector('input')?.value || password;
    
    // Aggiorna lo stato se necessario
    if (currentEmail !== email) setEmail(currentEmail);
    if (currentPassword !== password) setPassword(currentPassword);
    
    if (!currentEmail || !currentPassword) {
      setToastMessage('Inserisci email e password');
      setToastColor('warning');
      setShowErrorToast(true);
      return;
    }
    
    try {
      setLoading(true);
      setShowLoadingToast(true);
      const user = await loginUser(currentEmail, currentPassword);
      login(user);
      history.replace(ROUTES.PUBLIC.HOME);
    } catch (error) {
      console.error('Login error:', error);
      setToastMessage('Credenziali non valide. Riprova.');
      setToastColor('danger');
      setShowErrorToast(true);
    } finally {
      setLoading(false);
      setShowLoadingToast(false);
    }
  };

  // ✅ Mostra schermata di caricamento durante verifica token iniziale
  if (isCheckingAuth) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ion-background-color)',
        zIndex: 9999
      }}>
        <BilanciereLoader
          show={true}
          size="small"
          speed={1.2}
          message="Ipertrofia in corso..."
          inline={false}
        />
      </div>
    );
  }

  return (
    <>
      <IonContent fullscreen className="ion-padding custom-login-page">
        {/* Toast per errori e messaggi di avviso (in alto) */}
        <IonToast
          isOpen={showErrorToast}
          onDidDismiss={() => setShowErrorToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />

        {/* Toast per indicare il caricamento (in basso) */}
        <IonToast
          isOpen={showLoadingToast}
          onDidDismiss={() => setShowLoadingToast(false)}
          position="bottom"
          message="Caricamento in corso..."
          duration={0} // Resta aperto finché non lo chiudiamo
          buttons={[]}
        />

         <AnimatedBackground 
                    variant="linee-move" 
                    intensity="light"
                    height="250px"
                    position="absolute"
                    speed={3}
                    fadeInDuration={2000}
                  />

        <IonGrid fixed>
          <IonRow className="ion-justify-content-center ion-align-items-center" style={{ minHeight: '100%' }}>
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <div className="ion-text-center ion-padding-vertical ion-margin-bottom">
                <IonImg
                  src="./logo.png"
                  alt="Crew App Logo"
                  style={{ width: "200px", margin: "0 auto" }}
                />
              </div>

              <IonCard className="ion-no-margin">
                <IonCardContent>
                  <IonHeader className="ion-text-center ion-margin-bottom">
                    <IonText className="fs-large fw-bold">Accedi al tuo account</IonText>
                  </IonHeader>
                  <form onSubmit={handleLogin} autoComplete="on">
                    <div className="ion-margin-vertical">
                      <IonItem className="rounded-lg custom-item" lines="none">
                        <IonIcon 
                          icon={mailOutline} 
                          slot="start" 
                          color="medium"
                        />
                        <IonInput
                          ref={emailInputRef}
                          type="email"
                          placeholder="Email"
                          value={email}
                          autocomplete="email"
                          name="email"
                          onIonChange={(e: IonInputCustomEvent<InputChangeEventDetail>) => setEmail(e.detail.value ?? '')}
                          required
                          clearInput
                        />
                      </IonItem>
                    </div>
                    
                    <div className="ion-margin-vertical">
                      <IonItem className="rounded-lg custom-item" lines="none">
                        <IonIcon 
                          icon={lockClosedOutline} 
                          slot="start" 
                          color="medium"
                        />
                        <IonInput
                          ref={passwordInputRef}
                          type="password"
                          placeholder="Password"
                          value={password}
                          autocomplete="current-password"
                          name="password"
                          onIonChange={(e: IonInputCustomEvent<InputChangeEventDetail>) => setPassword(e.detail.value ?? '')}
                          required
                          clearInput
                        />
                      </IonItem>
                    </div>
                    
                    <div className="ion-text-center ion-margin-bottom">
                      <IonText color="medium" className="fs-small">
                        <a href="#" style={{ textDecoration: 'none' }}>
                          Password dimenticata?
                        </a>
                      </IonText>
                    </div>
                    
                    <IonButton 
                      expand="block" 
                      type="submit"
                      className="ion-margin-vertical"
                      style={{ margin: '2rem 0 1rem' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <>
                          <IonIcon icon={logInOutline} slot="start" />
                          Accedi
                        </>
                      )}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
              
              <div className="ion-text-center ion-padding-vertical">
                <IonText color="medium">
                  Non hai un account?{' '}
                  <a 
                    onClick={() => history.push(ROUTES.PUBLIC.REGISTER)}
                    style={{ 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      color: 'var(--ion-color-primary)' 
                    }}
                  >
                    Registrati
                  </a>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </>
  );
};

export default LoginPage;

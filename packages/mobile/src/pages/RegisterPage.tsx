// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { 
  IonPage, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonText,
  IonCard,
  IonCardContent,
  IonItem,
  IonLoading,
  IonToast,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { 
  lockClosedOutline, 
  mailOutline, 
  personOutline, 
  checkmarkCircleOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { registerUser } from '@/api/auth';
import ROUTES from '@/routes';
import AnimatedBackground from '@/components/AnimatedBackground';
import type { IonInputCustomEvent, InputChangeEventDetail } from '@ionic/core';
 
const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('danger');
  
  const history = useHistory();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setToastMessage('Completa tutti i campi');
      setToastColor('warning');
      setShowToast(true);
      return;
    }
    
    if (password !== confirmPassword) {
      setToastMessage('Le password non coincidono');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    
    try {
      setLoading(true);
      await registerUser(name, email, password);
      setToastMessage('Registrazione completata! Ora puoi accedere.');
      setToastColor('success');
      setShowToast(true);
      
      // Redirect dopo un breve ritardo
      setTimeout(() => {
        history.replace(ROUTES.PUBLIC.LOGIN);
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      setToastMessage('Registrazione fallita. L\'email potrebbe essere già in uso.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      {/* <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={ROUTES.PUBLIC.LOGIN} text="" />
          </IonButtons>
          <IonTitle>Registrazione</IonTitle>
        </IonToolbar>
      </IonHeader> */}
      
      <IonContent fullscreen className="ion-padding custom-login-page">
        <IonLoading isOpen={loading} message="Registrazione in corso..." />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />

        <AnimatedBackground 
                            variant="linee-move" 
                            intensity="light"
                            height="250px"
                            position="fixed"
                            speed={3}
                            fadeInDuration={2000}
                          />
        
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <div className="ion-text-center ion-padding-vertical">
                <h1 className="fw-bold">Crea Account</h1>
                <p className="text-medium">Inserisci i tuoi dati per registrarti</p>
              </div>
              
              <IonCard className="ion-no-margin">
                <IonCardContent>
                  <form onSubmit={handleRegister}>
                    <div className="ion-margin-vertical">
                      <IonItem className="rounded-lg custom-item" lines="none">
                        <IonIcon 
                          icon={personOutline} 
                          slot="start" 
                          color="medium"
                        />
                        <IonInput
                          placeholder="Nome completo"
                          value={name}
                          onIonChange={(e: IonInputCustomEvent<InputChangeEventDetail>) => setName(e.detail.value ?? '')}
                          required
                          clearInput
                        />
                      </IonItem>
                    </div>
                    
                    <div className="ion-margin-vertical">
                      <IonItem className="rounded-lg custom-item" lines="none">
                        <IonIcon 
                          icon={mailOutline} 
                          slot="start" 
                          color="medium"
                        />
                        <IonInput
                          type="email"
                          placeholder="Email"
                          value={email}
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
                          type="password"
                          placeholder="Password"
                          value={password}
                          onIonChange={(e: IonInputCustomEvent<InputChangeEventDetail>) => setPassword(e.detail.value ?? '')}
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
                          type="password"
                          placeholder="Conferma password"
                          value={confirmPassword}
                          onIonChange={(e: IonInputCustomEvent<InputChangeEventDetail>) => setConfirmPassword(e.detail.value ?? '')}
                          required
                          clearInput
                        />
                      </IonItem>
                    </div>
                    
                    <IonButton 
                      expand="block" 
                      type="submit"
                      className="ion-margin-vertical"
                      style={{ margin: '2rem 0 1rem' }}
                    >
                      <IonIcon icon={checkmarkCircleOutline} slot="start" />
                      Registrati
                    </IonButton>
                    
                    <p className="ion-text-center text-medium fs-small">
                      Registrandoti, accetti i nostri Termini di Servizio e la Privacy Policy
                    </p>
                  </form>
                </IonCardContent>
              </IonCard>
              
              <div className="ion-text-center ion-padding-vertical">
                <IonText color="medium">
                  Hai già un account?{' '}
                  <a 
                    onClick={() => history.push(ROUTES.PUBLIC.LOGIN)}
                    style={{ 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      color: 'var(--ion-color-primary)' 
                    }}
                  >
                    Accedi
                  </a>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;

// src/components/InstallPrompt.jsx
import React, { useEffect, useState } from "react";
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import { shareOutline } from 'ionicons/icons';

// Funzione per rilevare se il dispositivo è un iPhone
const isIos = (): boolean => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
// Funzione per verificare se l'app è già in modalità standalone
const isInStandaloneMode = (): boolean => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

const InstallPrompt: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isIos() && !isInStandaloneMode()) {
      // Mostra il Modal automaticamente dopo 2 secondi su iOS
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Aggiungi alla schermata Home!</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Per installare l'app:</h2>
        <IonList>
          <IonItem>
            <IonLabel>
              1. Tocca il pulsante Condividi <IonIcon icon={shareOutline} />
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              2. Scorri verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              3. Conferma l'installazione
            </IonLabel>
          </IonItem>
        </IonList>
        <div className="ion-padding">
          <IonButton expand="block" onClick={() => setShowModal(false)}>
            OK, ho capito!
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default InstallPrompt;

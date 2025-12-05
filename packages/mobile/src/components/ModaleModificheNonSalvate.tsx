import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonIcon,
  IonCard,
  IonCardContent
} from '@ionic/react';
import {
  alertCircleOutline,
  saveOutline,
  exitOutline
} from 'ionicons/icons';

type Props = {
  isOpen: boolean;
  onSalvaOra: () => void;
  onEsci: () => void;
};

const ModaleModificheNonSalvate: React.FC<Props> = ({ isOpen, onSalvaOra, onEsci }) => {
  return (
    <IonModal
      isOpen={isOpen}
      initialBreakpoint={0.4}
      breakpoints={[0, 0.4, 0.6]}
      backdropDismiss={false}
    >
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={alertCircleOutline} />
              <span>Modifiche non salvate</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard style={{
          background: 'rgba(var(--ion-color-warning-rgb), 0.1)',
          border: '1px solid rgba(var(--ion-color-warning-rgb), 0.3)'
        }}>
          <IonCardContent>
            <IonText>
              <h2 className="fw-bold ion-no-margin" style={{ marginBottom: '12px' }}>
                Hai modifiche non salvate
              </h2>
              <p className="ion-no-margin" style={{ color: 'var(--ion-color-medium)' }}>
                Se esci ora, potresti perdere i dati inseriti. Vuoi salvare le modifiche prima di uscire?
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '24px'
        }}>
          <IonButton
            expand="block"
            color="primary"
            size="large"
            onClick={onSalvaOra}
            style={{
              '--border-radius': '12px',
              fontWeight: '600'
            }}
          >
            <IonIcon icon={saveOutline} slot="start" />
            Salva e esci
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            size="large"
            onClick={onEsci}
            style={{
              '--border-radius': '12px',
              fontWeight: '600'
            }}
          >
            <IonIcon icon={exitOutline} slot="start" />
            Esci senza salvare
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ModaleModificheNonSalvate;

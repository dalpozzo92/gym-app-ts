import React, { type ReactNode } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

type LiquidGlassModalProps = {
  isOpen: boolean;
  onDidDismiss: () => void;
  title?: string;
  children: ReactNode;
  initialBreakpoint?: number;
  breakpoints?: number[];
  backdrop?: boolean;
  backdropDismiss?: boolean;
  showCloseButton?: boolean;
  className?: string;
};

const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  isOpen,
  onDidDismiss,
  title,
  children,
  initialBreakpoint = 0.75,
  breakpoints = [0, 0.4, 0.75, 1],
  backdrop = true,
  backdropDismiss = true,
  showCloseButton = true,
  className = ''
}) => {
  return (
    <>
      <style>{`
        ion-modal.liquid-glass-modal {
          --border-radius: 25px;
          --box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          --backdrop-opacity: 0.4;
        }

        ion-modal.liquid-glass-modal::part(backdrop) {
          background: rgba(var(--ion-background-color-rgb), 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        ion-modal.liquid-glass-modal::part(content) {
          background: rgba(var(--ion-background-color-rgb), 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        ion-modal.liquid-glass-modal ion-header {
          background: transparent;
        }

        ion-modal.liquid-glass-modal ion-toolbar {
          --background: rgba(var(--ion-background-color-rgb), 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          --border-width: 0;
        }

        ion-modal.liquid-glass-modal ion-content {
          --background: transparent;
        }
      `}</style>

      <IonModal
        isOpen={isOpen}
        onDidDismiss={onDidDismiss}
        presentingElement={undefined}
        showBackdrop={backdrop}
        backdropDismiss={backdropDismiss}
        breakpoints={breakpoints}
        initialBreakpoint={initialBreakpoint}
        className={`liquid-glass-modal ${className}`}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{title}</IonTitle>
            {showCloseButton && (
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={onDidDismiss}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            )}
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {children}
        </IonContent>
      </IonModal>
    </>
  );
};

export default LiquidGlassModal;

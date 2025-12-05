// src/pages/UnauthorizedPage.jsx
import React from 'react';
import { 
  IonContent, 
  IonButton, 
  IonIcon,
  IonText,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { homeOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '@/components/Layout';
import ROUTES from '@/routes';

const UnauthorizedPage: React.FC = () => {
  const history = useHistory();

  return (
    <Layout title="Accesso Negato" showTabs={false}>
      <IonContent fullscreen className="ion-padding">
        <div className="ion-text-center ion-padding-top">
          <IonIcon 
            icon={alertCircleOutline} 
            color="danger" 
            style={{ fontSize: '64px' }} 
          />
          
          <IonText color="danger">
            <h2>Accesso Negato</h2>
          </IonText>
          
          <IonCard>
            <IonCardContent>
              <IonText>
                <p>
                  Non hai i permessi necessari per visualizzare questa pagina. 
                  Solo gli amministratori possono accedere a questa sezione.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
          
          <IonButton 
            expand="block" 
            onClick={() => history.push(ROUTES.PUBLIC.HOME)}
            className="ion-margin-top"
          >
            <IonIcon slot="start" icon={homeOutline} />
            Torna alla Home
          </IonButton>
        </div>
      </IonContent>
    </Layout>
  );
};

export default UnauthorizedPage;

// @ts-nocheck
// src/pages/admin/DashboardPage.jsx
import React from 'react';
import { 
  IonContent, 
  IonText, 
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/react';
import { homeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Layout from '@/components/Layout';
import ROUTES from '@/routes';

const DashboardPage = () => {
  const history = useHistory();

  return (
    <Layout title="Dashboard Admin" showTabs={false}>
      <IonContent className="ion-padding">
        <IonText>
          <h1>Dashboard Amministratore</h1>
        </IonText>
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Pannello di Controllo</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Benvenuto nella dashboard amministratore di Crew App.</p>
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
      </IonContent>
    </Layout>
  );
};

export default DashboardPage;
// @ts-nocheck

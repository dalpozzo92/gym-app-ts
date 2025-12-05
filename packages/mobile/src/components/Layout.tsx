import React, { type ReactNode } from 'react';
import { IonContent, IonFooter, IonToolbar, IonTitle, IonHeader } from '@ionic/react';
import TabBar from '@/components/TabBar';

type LayoutProps = {
  children: ReactNode;
  showTabs?: boolean;
  showNavBar?: boolean;
  title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, showTabs = true, showNavBar = true, title }) => {
  return (
    <>
      {showNavBar && (
        <IonHeader translucent className="ion-no-border">
          <IonToolbar>
            {title && <IonTitle>{title}</IonTitle>}
          </IonToolbar>
        </IonHeader>
      )}
      
      <IonContent fullscreen>
        {children}
      </IonContent>
      
      {showTabs && (
        <IonFooter translucent className="ion-no-border">
          <IonToolbar />
          <TabBar />
        </IonFooter>
      )}
    </>
  );
};

export default Layout;

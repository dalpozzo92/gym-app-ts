import React, { type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import NavBar from '@/components/NavBar';
import TabBar from '@/components/TabBar';
import MotionPage from '@/components/MotionPage';
import { getRouteConfig, type RouteLayoutConfig } from '@/routes';
import { useLocation } from 'react-router-dom';

type PageLayoutProps = {
  children: ReactNode;
  customConfig?: RouteLayoutConfig | null;
};

// Componente di layout centralizzato
const PageLayout: React.FC<PageLayoutProps> = ({ children, customConfig = null }) => {
  const location = useLocation();
  
  // Usa la configurazione personalizzata passata come prop o ottienila dalla rotta corrente
  const config = customConfig || getRouteConfig(location.pathname);
  
  return (
    <IonPage className="no-scrollbar">
{config.showNavBar && (
        <NavBar 
          title={config.title}
          showBackButton={config.showBackButton}
          showAvatar={config.showAvatar}
          showSettingsButton={config.showSettingsButton}
        />
      )}
      <IonContent fullscreen>
        <MotionPage useMotion={config.useMotion}>
          {children}
        </MotionPage>
      </IonContent>
      
      {config.showTabs && <TabBar />}
    </IonPage>
  );
};

export default PageLayout;

import React from 'react';
import { IonGrid, IonRow, IonCol, IonIcon, IonText } from '@ionic/react';
import '@/theme/QuickActions.css';

type QuickAction = {
  id: string | number;
  icon: any;
  color?: string;
  label: string;
  onClick: () => void;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    // <IonGrid className="ion-padding-vertical quick-actions-grid">
    //   <IonRow>
    //     {actions.map(action => (
    //       <IonCol key={action.id} size="3">
    //         <div 
    //           className="quick-action-btn"
    //           onClick={action.onClick}
    //         >
    //           <div className={`quick-icon icon-${action.color}`}>
    //             <IonIcon icon={action.icon} />
    //           </div>
    //           <IonText className="quick-label">
    //             {action.label}
    //           </IonText>
    //         </div>
    //       </IonCol>
    //     ))}
    //   </IonRow>
    // </IonGrid>
        <IonGrid className="quick-actions">
            <IonRow>
              {actions.map(action => (
                <IonCol key={action.id} size="3">
                  <div onClick={action.onClick} style={{ textAlign: 'center' }}>
                    <div className={`item-icon ${action.color}-light`} style={{ margin: '0 auto' }}>
                      <IonIcon 
                        icon={action.icon} 
                        color={action.color} 
                        style={{ fontSize: '1.4rem' }} 
                      />
                    </div>
                    <IonText color="medium">
                      <p className="ion-no-margin" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                        {action.label}
                      </p>
                    </IonText>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>


  );
};



export default QuickActions;

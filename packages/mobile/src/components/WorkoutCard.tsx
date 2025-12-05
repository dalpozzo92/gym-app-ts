import React from 'react';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, timeOutline, fitnessOutline } from 'ionicons/icons';
import '@/theme/WorkoutCard.css';

type Workout = {
  name?: string;
  created_at?: string;
  [key: string]: unknown;
};

type WorkoutCardProps = {
  workout: Workout;
  onClick?: () => void;
  formatDate: (date?: string) => string;
};

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onClick, formatDate }) => {
  return (
    <div 
      className="action-card shadow-sm rounded-lg"
      onClick={onClick}
    >
      <div className="workout-card-content">
        <div className="workout-icon-container">
          <IonIcon icon={fitnessOutline} color="primary" />
        </div>
        
        <div className="workout-details">
          <h4 className="fw-bold workout-name">
            {workout.name || 'Scheda senza nome'}
          </h4>
          <p className="workout-date">
            <IonIcon icon={timeOutline} />
            {formatDate(workout.created_at)}
          </p>
        </div>
        
        <IonIcon 
          icon={arrowForwardOutline} 
          color="medium"
          className="workout-arrow"
        />
      </div>
    </div>
  );
};

export default WorkoutCard;

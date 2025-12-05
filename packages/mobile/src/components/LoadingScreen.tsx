// src/components/LoadingScreen.jsx
import React from 'react';
import { IonSpinner } from '@ionic/react';
import { useTheme } from '@/contexts/ThemeContext';

const LoadingScreen: React.FC = () => {
  const { darkMode } = useTheme();
  
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: darkMode ? '#121212' : '#f8f8f8',
      transition: 'background-color 0.3s ease',
      color: darkMode ? '#ffffff' : '#333333'
    }}>
      <div style={{ 
        padding: '30px',
        borderRadius: '50%',
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <IonSpinner 
          name="crescent" 
          style={{ 
            width: '40px', 
            height: '40px',
            color: 'var(--ion-color-primary)'
          }} 
        />
      </div>
      <p style={{ 
        margin: 0,
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        fontSize: '16px',
        fontWeight: 500,
        opacity: 0.8
      }}>
        Caricamento...
      </p>
    </div>
  );
};

export default LoadingScreen;

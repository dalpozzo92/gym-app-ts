import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ThemeContextValue = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

// Crea il contesto
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Hook personalizzato per usare il contesto
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Variabile di stato per la modalità scura
  const [darkMode, setDarkMode] = useState(() => {
    // Controlla subito il localStorage al primo render
    try {
      const savedTheme = localStorage.getItem('darkMode');
      return savedTheme !== null ? savedTheme === 'true' : true; // Default a true se non salvato
    } catch (e) {
      console.error('Errore nel leggere il tema dal localStorage:', e);
      return true; // Default a dark in caso di errore
    }
  });

  // Applica la modalità scura al body quando darkMode cambia
  useEffect(() => {
    try {
      console.log('Applicando tema:', darkMode ? 'scuro' : 'chiaro');
      
      if (darkMode) {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
        document.documentElement.classList.remove('dark');
      }
      
      // Salva nel localStorage
      localStorage.setItem('darkMode', String(darkMode));
    } catch (e) {
      console.error("Errore nell'applicare il tema:", e);
    }
  }, [darkMode]); // Importante: dipende da darkMode

  // Funzione per cambiare il tema
  const toggleDarkMode = () => {
    try {
      console.log('Toggle tema da:', darkMode ? 'scuro' : 'chiaro', 'a:', !darkMode ? 'scuro' : 'chiaro');
      setDarkMode(prevMode => !prevMode);
    } catch (e) {
      console.error('Errore nel cambio tema:', e);
    }
  };

  // Valore fornito dal provider
  const value = {
    darkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getTrainerTheme, type TrainerTheme } from '@/api/users';
import { hexToRgb, getContrastColor, shadeColor, tintColor } from '@/utils/colorUtils';
import { getPreference, savePreference } from '../db/dexie'; // Updated import path

type ThemeContextValue = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  trainerTheme: TrainerTheme | null;
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
  const { isAuthenticated } = useAuth();
  const [trainerTheme, setTrainerTheme] = useState<TrainerTheme | null>(null); // Initialize with null

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
  }, [darkMode]);

  // ============================================
  // Applica variabili CSS al root
  // ============================================
  const applyTheme = (theme: TrainerTheme) => {
    if (!theme) return;

    const root = document.documentElement;

    const setStyle = (name: string, value: string) => root.style.setProperty(name, value);

    const applyColorSet = (name: string, hex: string) => {
      const rgb = hexToRgb(hex);
      const contrast = getContrastColor(hex);
      const contrastRgb = hexToRgb(contrast);
      const shade = shadeColor(hex, 12);
      const tint = tintColor(hex, 12);

      setStyle(`--ion-color-${name}`, hex);
      if (rgb) setStyle(`--ion-color-${name}-rgb`, rgb);
      setStyle(`--ion-color-${name}-contrast`, contrast);
      if (contrastRgb) setStyle(`--ion-color-${name}-contrast-rgb`, contrastRgb);
      setStyle(`--ion-color-${name}-shade`, shade);
      setStyle(`--ion-color-${name}-tint`, tint);
    };

    if (theme.color_primary) applyColorSet('primary', theme.color_primary);
    if (theme.color_secondary) {
      applyColorSet('secondary', theme.color_secondary);
      // Imposta sfondo card con opacità del secondario (come richiesto)
      // Usiamo rgb per l'opacità
      const secRgb = hexToRgb(theme.color_secondary);
      if (secRgb) {
        // Nota: qui assumiamo una opacità fissa, es. 0.2 o 0.15 come i default
        // Nel variables.css il default dark è rgba(20, 39, 62, 0.288)
        // Proviamo una via di mezzo leggibile
        setStyle('--ion-card-background', `rgba(${secRgb}, 0.03)`);
      }
    }
    if (theme.color_tertiary) applyColorSet('tertiary', theme.color_tertiary);

    console.log('🎨 [ThemeContext] Tema trainer applicato:', theme);
  };

  const resetTheme = () => {
    const root = document.documentElement;
    const props = [
      'primary', 'secondary', 'tertiary'
    ];
    const suffixes = ['', '-rgb', '-contrast', '-contrast-rgb', '-shade', '-tint'];

    props.forEach(p => {
      suffixes.forEach(s => {
        root.style.removeProperty(`--ion-color-${p}${s}`);
      });
    });
    root.style.removeProperty('--ion-card-background');
  };

  // ============================================
  // Carica tema salvato (IndexedDB) all'avvio
  // ============================================
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await getPreference<TrainerTheme>('trainer_theme');
        if (savedTheme) {
          console.log('💾 [ThemeContext] Tema caricato da IndexedDB');
          setTrainerTheme(savedTheme);
          applyTheme(savedTheme);
        }
      } catch (err) {
        console.error('❌ [ThemeContext] Errore caricamento tema salvato:', err);
      }
    };
    loadSavedTheme();
  }, []); // Run once on mount

  // Gestione tema dinamico del personal trainer
  useEffect(() => {
    const fetchAndApplyTheme = async () => {
      if (!isAuthenticated) {
        // Reset al tema di default (rimuove le variabili inline)
        resetTheme();
        setTrainerTheme(null);
        // Clear saved theme from IndexedDB if user logs out
        await savePreference('trainer_theme', null);
        return;
      }

      console.log('🔍 [ThemeContext] Cerco tema personal trainer...');
      try {
        const theme = await getTrainerTheme();

        if (theme) {
          console.log('✅ [ThemeContext] Tema trovato:', theme);
          setTrainerTheme(theme);
          applyTheme(theme);
          // Salva in IndexedDB per il futuro
          await savePreference('trainer_theme', theme);
          console.log('💾 [ThemeContext] Tema salvato in IndexedDB');
        } else {
          console.log('ℹ️ [ThemeContext] Nessun tema personalizzato, uso default');
          resetTheme(); // Assicuriamoci che sia pulito
          setTrainerTheme(null);
          await savePreference('trainer_theme', null); // Clear if no theme
        }
      } catch (error) {
        console.error('❌ [ThemeContext] Errore recupero tema:', error);
        // If fetching fails, try to load from saved preference
        const savedTheme = await getPreference<TrainerTheme>('trainer_theme');
        if (savedTheme) {
          console.log('💾 [ThemeContext] Carico tema da IndexedDB a causa di errore fetch.');
          setTrainerTheme(savedTheme);
          applyTheme(savedTheme);
        } else {
          resetTheme();
          setTrainerTheme(null);
        }
      }
    };

    fetchAndApplyTheme();
  }, [isAuthenticated]); // Dependency array is [isAuthenticated]

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
    toggleDarkMode,
    trainerTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};


import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

type TimerState = {
  timerId: string;
  initialSeconds: number;
  timeLeft: number;
  isRunning: boolean;
  startedAt: number | null;
};

type TimerContextValue = {
  activeTimer: TimerState | null;
  startTimer: (timerId: string, seconds: number) => void;
  pauseTimer: (timerId: string) => void;
  resetTimer: (timerId: string) => void;
  getTimerState: (timerId: string) => TimerState | null;
  isTimerVisible: boolean;
  setTimerVisible: (visible: boolean) => void;
};

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export const useTimer = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

type TimerProviderProps = {
  children: ReactNode;
};

const TIMER_STORAGE_KEY = 'exercise_timer_state';

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(true); // Visibilità timer nel tabbar
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Carica timer salvato all'avvio
  useEffect(() => {
    try {
      const savedTimer = localStorage.getItem(TIMER_STORAGE_KEY);
      if (savedTimer) {
        const timerState: TimerState = JSON.parse(savedTimer);

        // ✅ Se il timer era in esecuzione, calcola il tempo trascorso
        if (timerState.isRunning && timerState.startedAt) {
          const elapsedSeconds = Math.floor((Date.now() - timerState.startedAt) / 1000);
          const newTimeLeft = Math.max(0, timerState.timeLeft - elapsedSeconds);

          if (newTimeLeft > 0) {
            // Ripristina il timer
            setActiveTimer({
              ...timerState,
              timeLeft: newTimeLeft
            });
          } else {
            // Timer scaduto durante assenza
            localStorage.removeItem(TIMER_STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Errore caricamento timer:', error);
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, []);

  // ✅ Salva timer in localStorage ogni volta che cambia
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [activeTimer]);

  // ✅ Gestione countdown
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.timeLeft <= 1) {
            // Timer completato
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return null;
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeTimer?.isRunning, activeTimer?.timeLeft]);

  const startTimer = useCallback((timerId: string, seconds: number) => {
    setActiveTimer({
      timerId,
      initialSeconds: seconds,
      timeLeft: seconds,
      isRunning: true,
      startedAt: Date.now()
    });
  }, []);

  const pauseTimer = useCallback((timerId: string) => {
    setActiveTimer((prev) => {
      if (!prev || prev.timerId !== timerId) return prev;
      return {
        ...prev,
        isRunning: false,
        startedAt: null
      };
    });
  }, []);

  const resetTimer = useCallback((timerId: string) => {
    setActiveTimer((prev) => {
      if (!prev || prev.timerId !== timerId) return prev;
      return null;
    });
  }, []);

  const getTimerState = useCallback((timerId: string): TimerState | null => {
    if (activeTimer?.timerId === timerId) {
      return activeTimer;
    }
    return null;
  }, [activeTimer]);

  const setTimerVisible = useCallback((visible: boolean) => {
    setIsTimerVisible(visible);
  }, []);

  const value: TimerContextValue = {
    activeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimerState,
    isTimerVisible,
    setTimerVisible
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

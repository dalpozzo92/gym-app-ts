import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getProgramActive, getProgramWeeks, type Program, type ProgramWeek } from '@/api/program';
import { useAuth } from './AuthContext';

type ProgramState = {
  activeProgram: Program | null;
  program_weeks: ProgramWeek[];
  activeWeek: number | null;
  viewedWeek: number | null;
  expandedDayIds: number[];
  isLoading: boolean;
  error: string | null;
};

type ProgramContextValue = ProgramState & {
  refetchProgram: () => Promise<void>;
  setActiveWeek: (weekNumber: number) => void;
  setViewedWeek: (weekNumber: number) => void;
  setExpandedDayIds: (ids: number[]) => void;
};

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined);

export const useProgram = (): ProgramContextValue => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
};

type ProgramProviderProps = {
  children: ReactNode;
};

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const { isAuthenticated, id_user_details } = useAuth();

  const [state, setState] = useState<ProgramState>({
    activeProgram: null,
    program_weeks: [],
    activeWeek: null,
    viewedWeek: null,
    expandedDayIds: [],
    isLoading: true,
    error: null
  });

  // ============================================
  // Fetch programma attivo e settimane
  // ============================================
  const loadProgramData = async () => {
    if (!isAuthenticated) {
      setState({
        activeProgram: null,
        program_weeks: [],
        activeWeek: null,
        viewedWeek: null,
        expandedDayIds: [],
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🔍 [ProgramContext] Caricamento programma attivo...');

      // Carica programma attivo
      const program = await getProgramActive(id_user_details);

      if (!program) {
        setState({
          activeProgram: null,
          program_weeks: [],
          activeWeek: null,
          viewedWeek: null,
          expandedDayIds: [],
          isLoading: false,
          error: 'Nessun programma attivo trovato'
        });
        return;
      }

      console.log('✅ [ProgramContext] Programma attivo caricato:', program);

      // Carica settimane del programma
      const weeks = await getProgramWeeks((program as any).id_program);

      console.log('✅ [ProgramContext] Settimane caricate:', weeks);

      // Trova settimana attiva
      const activeWeekData = weeks.find((w: any) => w.is_active);
      const activeWeekNumber = activeWeekData ? (activeWeekData as any).week_number : 1;

      setState(prev => ({
        activeProgram: program,
        program_weeks: weeks,
        activeWeek: activeWeekNumber,
        // ✅ Se viewedWeek è già impostato (id utente naviga avanti e indietro), manteniamolo. 
        // Altrimenti (primo load), imposta a activeWeekNumber.
        viewedWeek: prev.viewedWeek !== null ? prev.viewedWeek : activeWeekNumber,
        expandedDayIds: prev.expandedDayIds,
        isLoading: false,
        error: null
      }));

      console.log('✅ [ProgramContext] Settimana attiva:', activeWeekNumber);
    } catch (error: any) {
      console.error('❌ [ProgramContext] Errore caricamento programma:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Errore nel caricamento del programma'
      }));
    }
  };

  // ============================================
  // Refetch manuale
  // ============================================
  const refetchProgram = async () => {
    await loadProgramData();
  };

  // ============================================
  // Imposta settimana attiva manualmente
  // ============================================
  const setActiveWeek = (weekNumber: number) => {
    setState(prev => ({ ...prev, activeWeek: weekNumber }));
  };

  // ============================================
  // Imposta settimana VISUALIZZATA
  // ============================================
  const setViewedWeek = (weekNumber: number) => {
    setState(prev => ({ ...prev, viewedWeek: weekNumber }));
  };

  // ============================================
  // Imposta accordion espansi
  // ============================================
  const setExpandedDayIds = (ids: number[]) => {
    setState(prev => ({ ...prev, expandedDayIds: ids }));
  };

  // ============================================
  // Effect: Carica dati quando utente loggato
  // ============================================
  useEffect(() => {
    loadProgramData();
  }, [isAuthenticated, id_user_details]);

  // ============================================
  // Context value
  // ============================================
  const value: ProgramContextValue = {
    ...state,
    refetchProgram,
    setActiveWeek,
    setViewedWeek,
    setExpandedDayIds
  };

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};

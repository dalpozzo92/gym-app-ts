import { useEffect } from 'react';
import { getAllPendingOps } from '@/db/dexie';

export const useBeforeUnloadWarning = () => {
  useEffect(() => {
    const handler = async (e: BeforeUnloadEvent) => {
      const pending = await getAllPendingOps();
      if (pending.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
};

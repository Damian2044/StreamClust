import { useRef, useCallback } from 'react';

/**
 * Hook para gestionar la cancelación de peticiones en axios
 * @returns {Object} Objeto con controller y funciones para cancelar/resetear
 */
export const useAbortController = () => {
  const controllerRef = useRef(null);
  const isCancelledRef = useRef(false);

  const getAbortSignal = useCallback(() => {
    // Si fue cancelado o no existe, crear uno nuevo
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
      isCancelledRef.current = false;
    }
    return controllerRef.current.signal;
  }, []);

  const cancelAll = useCallback(() => {
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      isCancelledRef.current = true;
      controllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current = null;
    isCancelledRef.current = false;
  }, []);

  const isCancelled = useCallback(() => {
    return isCancelledRef.current || (controllerRef.current?.signal.aborted ?? false);
  }, []);

  return {
    getAbortSignal,
    cancelAll,
    reset,
    isCancelled,
  };
};

export default useAbortController;


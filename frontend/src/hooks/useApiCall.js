import { useCallback } from 'react';
import { useError } from './useError';

/**
 * Hook para realizar llamadas a API con manejo automático de errores
 * @param {Function} apiFunction - La función de servicio que hace la llamada a API
 * @returns {Object} Objeto con loading state y función para llamar
 */
export const useApiCall = () => {
  const { addError } = useError();

  const executeApiCall = useCallback(
    async (apiFunction, ...args) => {
      try {
        return await apiFunction(...args);
      } catch (error) {
        // Si el error ya fue capturado por el interceptor,
        // no lo mostramos de nuevo para evitar duplicados
        console.error('API Error:', error);
        throw error;
      }
    },
    [addError]
  );

  return { executeApiCall };
};

export default useApiCall;

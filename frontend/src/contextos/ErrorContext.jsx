import React, { createContext, useState, useCallback } from 'react';
import { traducirMensajeInterfaz } from '../lib/errores';

export const ErrorContext = createContext();
const FALLBACK_POR_TIPO = {
  success: 'Operation completed successfully.',
  warning: 'Please review the warning and try again.',
  error: 'An unexpected error occurred.',
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const removeError = useCallback((id) => {
    setErrors((prev) => prev.filter((err) => err.id !== id));
  }, []);

  const obtenerDuracionVisible = useCallback((message, type) => {
    const texto = String(message ?? '');
    const basePorTipo = {
      success: 2200,
      warning: 3200,
      error: 4200,
    };

    const base = basePorTipo[type] ?? basePorTipo.error;
    const extraPorLongitud = texto.length * 12;

    return Math.min(Math.max(base + extraPorLongitud, base), 8000);
  }, []);

  const addError = useCallback((message, type = 'error', options = {}) => {
    const mensajeNormalizado = traducirMensajeInterfaz(
      message,
      FALLBACK_POR_TIPO[type] ?? FALLBACK_POR_TIPO.error
    );
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newError = { id, message: mensajeNormalizado, type };
    setErrors((prev) => [...prev, newError]);

    // Give slightly more time to longer messages unless a specific timeout is provided.
    setTimeout(() => {
      removeError(id);
    }, options.timeoutMs ?? obtenerDuracionVisible(mensajeNormalizado, type));

    return id;
  }, [obtenerDuracionVisible, removeError]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

import axios from "axios";
import { obtenerMensajeError } from "./errores";

// Sistema global para capturar errores desde interceptores
let errorCallback = null;

export const setErrorCallback = (callback) => {
    errorCallback = callback;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Interceptor de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si fue cancelado por AbortController, no mostrar error
        if (axios.isCancel(error)) {
            console.log('Request cancelled by the user');
            return Promise.reject(error);
        }

        let mensaje = 'Server connection error';
        let tipo = 'error';
        const metodo = error.config?.method?.toUpperCase() || 'DESCONOCIDO';
        const esEnvio = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(metodo);

        if (error.response) {
            // Error de respuesta del servidor
            const { status, data } = error.response;

            // Intentar obtener mensaje del servidor
            if (data?.detail || data?.message || data?.error || typeof data === 'string') {
                mensaje = obtenerMensajeError(data, mensaje);
            } else {
                // Mensajes por código de estado - diferenciado para envíos
                const statusMessages = {
                    400: esEnvio
                        ? 'Invalid data. Check the information you are sending.'
                        : 'Invalid request. Check the submitted data.',
                    401: 'Unauthorized. Please sign in.',
                    403: 'Forbidden. You do not have permission to perform this action.',
                    404: esEnvio
                        ? 'The resource does not exist or has been removed.'
                        : 'Resource not found.',
                    409: 'Conflict: this information already exists or conflicts with existing data.',
                    422: esEnvio
                        ? 'Validation error. Check the data you are trying to send.'
                        : 'Invalid data. Check the format of your request.',
                    429: 'Too many requests. Please try again later.',
                    500: esEnvio
                        ? 'There was an error processing your information. Please try again.'
                        : 'Internal server error. Please try again later.',
                    502: 'Server unavailable. Please try again later.',
                    503: 'The service is currently unavailable. Please try again later.',
                    504: 'Request timed out. The operation took too long.'
                };
                mensaje = statusMessages[status] || `Server error (${status})`;
            }
        } else if (error.request) {
            // No hubo respuesta del servidor
            if (esEnvio) {
                mensaje = 'Could not connect to the server to send your information. Check your internet connection.';
            } else {
                mensaje = 'No response from the server. Check your internet connection.';
            }
        } else {
            // Error en la configuración de la solicitud
            if (esEnvio) {
                mensaje = 'There was an error preparing the information for submission.';
            } else {
                mensaje = error.message || 'Unknown error';
            }
        }

        // Llamar al callback si está establecido
        if (error.response?.data && typeof error.response.data === 'object') {
            error.response.data.__notified = true;
        }
        error.__notified = true;

        if (errorCallback) {
            errorCallback(mensaje, tipo);
        }

        return Promise.reject(error);
    }
);

export default api;

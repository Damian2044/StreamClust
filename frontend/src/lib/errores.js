function normalizarTexto(valor) {
  return String(valor ?? '').trim();
}

function normalizarClave(valor) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const TRADUCCIONES_EXACTAS = new Map([
  ['tamanios maximos actualizados exitosamente.', 'Maximum sizes updated successfully.'],
  ['tamanos maximos actualizados exitosamente.', 'Maximum sizes updated successfully.'],
  ['tamano maximo actualizado exitosamente.', 'Maximum size updated successfully.'],
  ['deteniendo operacion...', 'Stopping operation...'],
  ['operacion detenida.', 'Operation stopped.'],
  ['operacion cancelada.', 'Operation cancelled.'],
]);

const REEMPLAZOS_DIRECTOS = [
  {
    regex: /(^.*?:\s*)?el valor no puede ser menor (?:a|que) (-?\d+(?:\.\d+)?)\.?$/i,
    reemplazo: (_, prefijo = '', limite) => `${prefijo}The value cannot be lower than ${limite}.`,
  },
  {
    regex: /(^.*?:\s*)?el valor no puede ser mayor (?:a|que) (-?\d+(?:\.\d+)?)\.?$/i,
    reemplazo: (_, prefijo = '', limite) => `${prefijo}The value cannot be greater than ${limite}.`,
  },
  {
    regex: /(^.*?:\s*)?campo requerido\.?$/i,
    reemplazo: (_, prefijo = '') => `${prefijo}This field is required.`,
  },
  {
    regex: /(^.*?:\s*)?valor invalido\.?$/i,
    reemplazo: (_, prefijo = '') => `${prefijo}Invalid value.`,
  },
];

const REGLAS_TRADUCCION = [
  {
    test: (clave) => clave.includes('actualiz') && clave.includes('taman') && clave.includes('maxim') && clave.includes('exitos'),
    salida: 'Maximum sizes updated successfully.',
  },
  {
    test: (clave) => clave.includes('no se pudo') && clave.includes('actualiz') && clave.includes('taman'),
    salida: 'The maximum sizes could not be updated.',
  },
  {
    test: (clave) => clave.includes('deteniendo operacion') || (clave.includes('operacion') && clave.includes('deten')),
    salida: 'Stopping operation...',
  },
  {
    test: (clave) => clave.includes('sesion') && (clave.includes('no encontrada') || clave.includes('no existe') || clave.includes('invalida')),
    salida: 'The clustering session was not found or is no longer valid.',
  },
  {
    test: (clave) => clave.includes('no hay') && clave.includes('puntos') && clave.includes('pendientes'),
    salida: 'There are no new pending points to send to clustering.',
  },
];

function pareceEspanol(valor) {
  const clave = normalizarClave(valor);
  if (!clave) {
    return false;
  }

  return (
    /\b(no se|actualiz|taman|tamano|tamanio|operacion|sesion|archivo|archivos|datos|imagenes|texto|columna|etiqueta|rechaz|exito|invalido|requerido|deteniendo)\b/.test(clave) ||
    /\b(el|la|los|las|una|para|con|sin|desde|hasta|este|esta|estos|estas)\b/.test(clave)
  );
}

function traducirLinea(valor, fallback = '') {
  const texto = normalizarTexto(valor);
  if (!texto) {
    return fallback;
  }

  const clave = normalizarClave(texto);
  const traduccionExacta = TRADUCCIONES_EXACTAS.get(clave);
  if (traduccionExacta) {
    return traduccionExacta;
  }

  for (const { regex, reemplazo } of REEMPLAZOS_DIRECTOS) {
    if (regex.test(texto)) {
      return texto.replace(regex, reemplazo);
    }
  }

  for (const { test, salida } of REGLAS_TRADUCCION) {
    if (test(clave)) {
      return salida;
    }
  }

  if (fallback && pareceEspanol(texto)) {
    return fallback;
  }

  return texto;
}

export function traducirMensajeInterfaz(valor, fallback = '') {
  const texto = normalizarTexto(valor);
  if (!texto) {
    return fallback;
  }

  const traducido = texto
    .split('\n')
    .map((linea) => traducirLinea(linea, fallback))
    .join('\n')
    .trim();

  return traducido || fallback;
}

function formatearDetalle(item) {
  if (typeof item === 'string') {
    return traducirMensajeInterfaz(item);
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  const mensaje = traducirMensajeInterfaz(item.msg ?? item.message ?? item.detail ?? item.error);
  if (!mensaje) {
    return '';
  }

  if (!Array.isArray(item.loc) || item.loc.length === 0) {
    return mensaje;
  }

  return `${item.loc.join(' > ')}: ${mensaje}`;
}

export function obtenerMensajeError(error, fallback = 'An unexpected error occurred.') {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return traducirMensajeInterfaz(error, fallback) || fallback;
  }

  if (Array.isArray(error)) {
    const mensajes = error.map(formatearDetalle).filter(Boolean);
    return mensajes.length > 0 ? mensajes.join('\n') : fallback;
  }

  if (typeof error !== 'object') {
    return traducirMensajeInterfaz(error, fallback) || fallback;
  }

  if (error.response?.data) {
    return obtenerMensajeError(error.response.data, fallback);
  }

  if (error.reason) {
    return obtenerMensajeError(error.reason, fallback);
  }

  if (Array.isArray(error.detail)) {
    const mensajes = error.detail.map(formatearDetalle).filter(Boolean);
    return mensajes.length > 0 ? mensajes.join('\n') : fallback;
  }

  const mensaje =
    error.detail ??
    error.message ??
    error.error ??
    error.msg;

  return traducirMensajeInterfaz(mensaje, fallback) || fallback;
}

export function esErrorCancelado(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return Boolean(
    error.__CANCEL__ ||
    error.code === 'ERR_CANCELED' ||
    error.name === 'CanceledError' ||
    error.name === 'AbortError'
  );
}

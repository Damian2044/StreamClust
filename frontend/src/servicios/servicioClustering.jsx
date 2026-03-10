import api from '../lib/axios'

const RUTASESION = "/sesiones"
const RUTACLUSTERING = "/cort/sesiones"

export async function iniciarClusteringServicio({ k, cardinalidades, metodo, escalar, signal }) {
  try {
    if (metodo === "imagen") metodo = "imagenes"
    const cuerpo = {
      k,
      cardinalidades,
      metodo,
      escalar,
    }
    const { data } = await api.post(RUTASESION, cuerpo, { signal })
    return data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    }
    throw error
  }
}

export async function agregarPuntoClusteringServicio({ sesionId, etiqueta, archivo, signal }) {
  try {
    const formData = new FormData()
    if (etiqueta !== undefined && etiqueta !== null) {
      formData.append('etiqueta_real', etiqueta)
    }
    formData.append('imagen', archivo)

    const { data } = await api.post(`${RUTACLUSTERING}/${sesionId}/puntos/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal
    })
    return data.data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    }
    throw error
  }
}

export async function agregarPuntoClusteringServicioDatasets({ sesionId, etiqueta, punto, tipo, signal }) {
  try {

    const valor = tipo === "datasets"
      ? punto
      : Array.isArray(punto) ? punto[0] : punto;

    const formData = {
      [tipo === "datasets" ? "vector" : "texto"]: valor
    };

    if (etiqueta !== undefined && etiqueta !== null) {
      formData.etiqueta_real = etiqueta;
    }

    const { data } = await api.post(
      `${RUTACLUSTERING}/${sesionId}/puntos/${tipo}`,
      formData,
      {
        headers: { 'Content-Type': 'application/json' },
        signal
      }
    );

    return data.data;

  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw error;
  }
}

export async function actualizarTamaniosClusteringServicio({ sesionId, tamanosNuevos, signal }) {
  try {
    const cuerpo = { cardinalidades: tamanosNuevos }
    const { data } = await api.put(`${RUTACLUSTERING}/${sesionId}/cardinalidades`, cuerpo, { signal })
    return data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    }
    throw error
  }
}

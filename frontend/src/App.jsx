import React, { useState, useEffect, useRef } from 'react';
import LateralIzquierdo from './componentes/CargaDatosLateral/LateralIzquierdo';
import BarraSeleccionFlotante from './componentes/BarraSeleccionFlotante';
import PanelConfiguracion from './componentes/PanelConfiguracion';
import ModuloImagenes from "./modules/imagenes/ModuloImagenes";
import ModuloTexto from "./modules/texto/ModuloTexto";
import ModuloDatos from "./modules/datosEstructurados/ModuloDatos";
import {
  iniciarClusteringServicio,
  agregarPuntoClusteringServicio,
  actualizarTamaniosClusteringServicio,
  agregarPuntoClusteringServicioDatasets
} from './servicios/servicioClustering';
import { ChevronDoubleRightIcon, ChevronDoubleLeftIcon }
  from "@heroicons/react/24/outline";
import MenuPestanas from './componentes/MenuPestañas';
import { useError } from './hooks/useError';
import ErrorNotification from './componentes/ErrorNotification';
import { setErrorCallback } from './lib/axios';
import { esErrorCancelado, obtenerMensajeError, traducirMensajeInterfaz } from './lib/errores';
import { useAbortController } from './hooks/useAbortController';
import Papa from 'papaparse';

const DELIMITADOR_POR_DEFECTO = "auto";
const VARIABLES_SELECCIONADAS_INICIALES = { features: [], target: "" };
const ORDEN_ENVIO_POR_DEFECTO = { modo: "semilla", semilla: "42" };
const MOSTRAR_SELECTOR_SEMILLA = import.meta.env.VITE_MOSTRAR_SEED !== "false";
const crearParametrosClusterPorDefecto = () => ({
  k: 3,
  maxSizes: [10, 10, 10],
});
const EXTENSIONES_IMAGEN_PERMITIDAS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
  'tif',
  'tiff',
  'ico',
  'heic',
  'heif',
]);

function App() {
  const { addError } = useError();
  const { getAbortSignal, cancelAll, reset } = useAbortController();
  // --- ESTADOS GLOBALES ---
  const [batches, setBatches] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [bulkLabelInput, setBulkLabelInput] = useState('');
  const [tabActiva, setTabActiva] = useState("datasets");
  const [delimitador, setDelimitador] = useState(DELIMITADOR_POR_DEFECTO);
  // visibilidad de la columna izquierda (lotes + configuración)
  const [leftVisible, setLeftVisible] = useState(true);
  const [processedImages, setProcessedImages] = useState([]); // imágenes
  const [datosDataset, setDatosDataset] = useState([]);       // filas de dataset
  const [columnasDataset, setColumnasDataset] = useState([]); // nombres de columnas
  const [encabezadoDataset, setEncabezadoDataset] = useState(true)
  const [variablesSeleccionadas, setVariablesSeleccionadas] = useState({ ...VARIABLES_SELECCIONADAS_INICIALES });
  const [variablesPanelVersion, setVariablesPanelVersion] = useState(0);
  const [panelConfiguracionVersion, setPanelConfiguracionVersion] = useState(0);
  const [ordenEnvio, setOrdenEnvio] = useState({ ...ORDEN_ENVIO_POR_DEFECTO });
  const [datosProcesados, setDatosProcesados] = useState([])

  // --- ESTADOS CLUSTERING ---
  const [isClustering, setIsClustering] = useState(false);
  const [estaProcesandoEnvio, setEstaProcesandoEnvio] = useState(false);
  const [clusterPoints, setClusterPoints] = useState([]);
  const [initialMaxSizes, setInitialMaxSizes] = useState([]);
  const [dimensionFeaturesInicial, setDimensionFeaturesInicial] = useState(null);
  const [incomingQueue, setIncomingQueue] = useState([]);
  const [idSesionClustering, setIdSesionClustering] = useState(null);
  const [eventosClustering, setEventosClustering] = useState([]);
  const [asignacionesClusters, setAsignacionesClusters] = useState({});
  const [idsEnClustering, setIdsEnClustering] = useState({});
  const [tiemposClustering, setTiemposClustering] = useState({});
  const [tamaniosActuales, setTamaniosActuales] = useState([]);
  const [proyeccionPCA, setProyeccionPCA] = useState([]);

  // REFERENCIAS
  const lastSelectedIndexRef = useRef(null); // Índice de la última imagen clicada
  const clusteringSectionRef = useRef(null);

  const liberarPreviews = (items = []) => {
    items.forEach((item) => {
      if (typeof item?.previewUrl === 'string') {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  function limpiarDataset() {

    setDatosDataset([]);
    setColumnasDataset([]);
    setProcessedImages([]);
    setEncabezadoDataset(true);
    setVariablesSeleccionadas({ ...VARIABLES_SELECCIONADAS_INICIALES });
    setVariablesPanelVersion((prev) => prev + 1);
  }

  const reiniciarDatosCargados = () => {
    liberarPreviews([...processedImages, ...datosProcesados]);
    setBatches([]);
    setProcessedImages([]);
    setDatosDataset([]);
    setColumnasDataset([]);
    setEncabezadoDataset(true);
    setDelimitador(DELIMITADOR_POR_DEFECTO);
    setVariablesSeleccionadas({ ...VARIABLES_SELECCIONADAS_INICIALES });
    setVariablesPanelVersion((prev) => prev + 1);
  };

  const [clusterParams, setClusterParams] = useState(() => crearParametrosClusterPorDefecto());

  const crearGeneradorSemilla = (semilla) => {
    let m = 2147483647; // 2^31 - 1
    let a = 1103515245;
    let c = 12345;
    let estado = semilla % m;
    return () => {
      estado = (a * estado + c) % m;
      return estado / m;
    };
  };

  const barajarConSemilla = (array, semilla) => {
    const rnd = crearGeneradorSemilla(semilla);
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const obtenerPuntosEnOrdenDeEnvio = (puntos) => {
    if (!MOSTRAR_SELECTOR_SEMILLA) {
      return barajarConSemilla(puntos, 42);
    }

    if (ordenEnvio.modo === "original") {
      return [...puntos];
    }

    const semilla = Number.parseInt(ordenEnvio.semilla, 10);
    return barajarConSemilla(puntos, Number.isFinite(semilla) ? semilla : 42);
  };

  // --- FUNCIONES AUXILIARES ---
  const generateImageId = (batchId, index) => `b${batchId}-i${index}-${Date.now()}`;

  const esArchivoImagenValido = (file) => {
    if (!file || typeof file.name !== 'string') {
      return false;
    }

    const tipo = String(file.type ?? '').toLowerCase().trim();
    if (tipo.startsWith('image/')) {
      return true;
    }

    const extension = file.name.split('.').pop()?.toLowerCase().trim();
    return Boolean(extension && EXTENSIONES_IMAGEN_PERMITIDAS.has(extension));
  };

  const separarArchivosImagenes = (files = []) => {
    const validos = [];
    const invalidos = [];

    files.forEach((file) => {
      if (esArchivoImagenValido(file)) {
        validos.push(file);
      } else {
        invalidos.push(file);
      }
    });

    return { validos, invalidos };
  };

  // --- MANEJADORES DE CARGA ---
  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      event.target.value = null;
      return;
    }

    const { validos, invalidos } = separarArchivosImagenes(files);

    if (invalidos.length > 0) {
      addError(`${invalidos.length} non-image file(s) were skipped.`, 'warning');
    }

    if (validos.length === 0) {
      addError('Only image files can be loaded in the Images section.', 'warning');
      event.target.value = null;
      return;
    }

    // Agrupar por subcarpeta dentro de la carpeta seleccionada
    // Ej: "ecommerce products/jeans/img1.jpg" -> lote "jeans"
    const gruposPorCarpeta = {};
    for (const file of validos) {
      const relativePath = file.webkitRelativePath || file.name;
      const partes = relativePath.split('/');

      let nombreCarpeta;
      if (partes.length >= 3) {
        // root/subcarpeta/archivo...
        nombreCarpeta = partes[1];
      } else if (partes.length === 2) {
        // root/archivo
        nombreCarpeta = partes[0];
      } else {
        nombreCarpeta = 'Unnamed folder';
      }

      nombreCarpeta = (nombreCarpeta || 'Unnamed folder').trim();

      if (!gruposPorCarpeta[nombreCarpeta]) {
        gruposPorCarpeta[nombreCarpeta] = [];
      }
      gruposPorCarpeta[nombreCarpeta].push(file);
    }

    const baseId = Date.now();
    let offset = 0;
    const nuevosBatches = Object.entries(gruposPorCarpeta).map(([carpeta, archivos]) => ({
      id: baseId + offset++,
      name: carpeta,
      type: 'imagenes',
      count: archivos.length,
      files: archivos,
      label: carpeta,
    }));

    if (nuevosBatches.length > 0) {
      setBatches((prev) => [...prev, ...nuevosBatches]);
    }

    event.target.value = null;
  };

  const handleMultipleSelect = (data) => {
    // Caso imágenes (evento normal)
    if (data?.target?.files) {
      const files = Array.from(data.target.files);
      const { validos, invalidos } = separarArchivosImagenes(files);

      if (invalidos.length > 0) {
        addError(`${invalidos.length} non-image file(s) were skipped.`, 'warning');
      }

      if (validos.length === 0) {
        addError('Only image files can be loaded in the Images section.', 'warning');
        data.target.value = null;
        return;
      }

      const newBatch = {
        id: Date.now(),
        name: `${validos.length} images`,
        type: "imagenes",
        count: validos.length,
        files: validos,
        label: ""
      };

      setBatches((prev) => [...prev, newBatch]);
      data.target.value = null;
      return;
    }

    // Caso dataset o texto
    if (data?.file) {
      const newBatch = {
        id: Date.now(),
        name: data.file.name,
        type: data.tipo || "datasets",
        count: 1,
        files: [data.file],
        label: ""
      };

      setBatches((prev) => [...prev, newBatch]);
    }
  };

  const removeBatch = (id) => setBatches((prev) => prev.filter((batch) => batch.id !== id));
  const updateBatchLabel = (id, newLabel) =>
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, label: newLabel } : b)));

  const handleProcessBatch = async (batchId) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    try {

    // ---------- IMÁGENES ----------
    if (batch.type === "imagenes") {
      const { validos, invalidos } = separarArchivosImagenes(batch.files);

      if (invalidos.length > 0) {
        addError(`${invalidos.length} non-image file(s) were removed from this batch.`, 'warning');
      }

      if (validos.length === 0) {
        addError('This batch does not contain valid image files.', 'warning');
        setBatches((prev) => prev.filter((b) => b.id !== batchId));
        return;
      }

      const finalLabel = batch.label.trim() === "" ? "Unlabeled" : batch.label;
      const newGalleryImages = validos.map((file, index) => ({
        id: generateImageId(batchId, index),
        file,
        previewUrl: URL.createObjectURL(file),
        label: finalLabel,
        batchName: batch.name,
      }));
      setProcessedImages((prev) => [...prev, ...newGalleryImages]);
    }

    // ---------- DATASETS ----------
    if (batch.type === "dataset") {
      const file = batch.files[0];

      const resultado = await new Promise((resolve) => {
        Papa.parse(file, {
          delimiter: delimitador === "auto" ? "" : delimitador,
          header: encabezadoDataset,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (res) => resolve(res),
        });
      });

      let columnas, datos;

      if (encabezadoDataset) {
        columnas = resultado.meta.fields;
        datos = resultado.data.map(fila => columnas.map(col => fila[col]));
      } else {
        columnas = resultado.data[0].map((_, i) => `x${i + 1}`);
        datos = resultado.data;
      }

      // eliminar filas completamente vacías o NaN
      datos = datos.filter(fila =>
        fila.every(valor =>
          valor !== null &&
          valor !== undefined &&
          valor !== "" &&
          !(typeof valor === "number" && isNaN(valor))
        )
      );
      console.log(datos)

      setColumnasDataset(columnas);
      setProcessedImages(datos);
      setVariablesSeleccionadas({ ...VARIABLES_SELECCIONADAS_INICIALES });
      setVariablesPanelVersion((prev) => prev + 1);
    }
    // eliminar lote
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    } catch (error) {
      console.error('Error procesando lote:', error);
      addError(obtenerMensajeError(error, `Could not process batch ${batch.name}.`), 'error', { timeoutMs: 7000 });
    }
  };

  // --- SELECCIÓN POR CLICK SIMPLE (SIN CTRL / SHIFT) ---
  const handleImageClick = (imgId) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(imgId)) {
        // Si ya estaba seleccionada, se deselecciona
        return prev.filter((id) => id !== imgId);
      }
      // Si no estaba, se añade manteniendo posibles múltiples seleccionadas
      return [...prev, imgId];
    });
  };

  // Limpiar selección al hacer clic en el fondo vacío
  const handleBackgroundClick = (e) => {
    // Si el click fue directo al fondo (no en una imagen)
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  const clearSelection = () => {
    setSelectedImageIds([]);
    setBulkLabelInput("");
    lastSelectedIndexRef.current = null;
  };

  const applyBulkLabel = () => {
    if (bulkLabelInput.trim() === "") return;
    setProcessedImages(prev => prev.map(img => selectedImageIds.includes(img.id) ? { ...img, label: bulkLabelInput } : img));
    clearSelection();
  };

  const deleteSelectedImages = () => {
    setProcessedImages((prev) => prev.filter((img) => !selectedImageIds.includes(img.id)));
    clearSelection();
  };
  const propsModulo = {
    processedImages,
    datosProcesados,
    idsEnClustering,
    selectedImageIds,
    handleImageClick,
    handleBackgroundClick,
    setProcessedImages,
    proyeccionPCA,
    clusterParams,
    eventosClustering,
    asignacionesClusters,
    tiemposClustering,
  };

  // --- CONFIGURACIÓN ---
  const handleKChange = (e) => {
    if (isClustering) return;
    const val = parseInt(e.target.value);
    if (!Number.isFinite(val) || val < 1) return;
    const newMaxSizes = new Array(val).fill(10);
    setClusterParams(prev => ({ ...prev, k: val, maxSizes: newMaxSizes }));
  };

  const handleMaxSizeChange = (index, newVal) => {
    if (estaProcesandoEnvio) return;
    const valorParseado = parseInt(newVal);
    const referenciaMinima = isClustering ? (initialMaxSizes[index] ?? 1) : 1;
    const val = Number.isFinite(valorParseado) ? Math.max(valorParseado, referenciaMinima) : referenciaMinima;
    const newSizes = [...clusterParams.maxSizes];
    newSizes[index] = val;
    setClusterParams(prev => ({ ...prev, maxSizes: newSizes }));
  };

  const handleApplySameMaxSize = (newVal) => {
    if (isClustering) return;
    const val = parseInt(newVal);
    if (!Number.isFinite(val) || val < 1) return;
    setClusterParams((prev) => ({
      ...prev,
      maxSizes: new Array(prev.k).fill(val),
    }));
  };


  const enviarPuntoAlServicio = async (img, sesionId, tabActiva, signal) => {
    const params = {
      sesionId,
      etiqueta: img.label,
      tipo: tabActiva,
      signal
    };

    if (tabActiva === "imagen") {
      return await agregarPuntoClusteringServicio({ ...params, archivo: img.file });
    }

    // Para "datasets" u otros tipos
    return await agregarPuntoClusteringServicioDatasets({ ...params, punto: img.file });
  };

  const obtenerClusterAsignadoValido = (respuestaPunto) => {
    const cluster = Number(respuestaPunto?.etiqueta_asignada);
    return Number.isFinite(cluster) && cluster >= 0 ? cluster : null;
  };

  const actualizarEstadoConRespuestaClustering = (punto, respuestaPunto) => {
    const clusterAsignado = obtenerClusterAsignadoValido(respuestaPunto);

    if (tabActiva === "imagen") {
      setProcessedImages((prev) => prev.filter((img) => img.id !== punto.id));
      setDatosProcesados((prev) =>
        prev.some((img) => img.id === punto.id) ? prev : [...prev, punto]
      );
      setIdsEnClustering((prev) => {
        if (!prev[punto.id]) {
          return prev;
        }

        const siguiente = { ...prev };
        delete siguiente[punto.id];
        return siguiente;
      });
    }

    if (tabActiva === "datasets" || tabActiva === "texto") {
      setProcessedImages((prev) => {
        const siguientes = prev.filter((fila) => fila !== punto.filaOriginal);
        if (siguientes.length === 0) {
          resetVariablesSeleccionadas();
        }
        return siguientes;
      });
      setDatosProcesados((prev) =>
        prev.some((item) => item.id === punto.id) ? prev : [...prev, punto]
      );
      setIdsEnClustering((prev) => {
        if (!prev[punto.id]) {
          return prev;
        }

        const siguiente = { ...prev };
        delete siguiente[punto.id];
        return siguiente;
      });
    }

    if (clusterAsignado !== null) {
      setAsignacionesClusters((prev) => ({ ...prev, [punto.id]: clusterAsignado }));
    }

    setEventosClustering((prev) => [...prev, respuestaPunto]);

    if (Array.isArray(respuestaPunto.tamanios_actuales)) {
      setTamaniosActuales(respuestaPunto.tamanios_actuales);
    }

    if (
      clusterAsignado !== null &&
      respuestaPunto.pca_listo &&
      Array.isArray(respuestaPunto.punto_pca) &&
      respuestaPunto.punto_pca.length >= 2
    ) {
      setProyeccionPCA((prev) => ({
        puntos: [
          ...(prev?.puntos ?? []),
          {
            idFront: punto.id ?? Date.now(),
            x: respuestaPunto.punto_pca[0],
            y: respuestaPunto.punto_pca[1],
            cluster: clusterAsignado,
          }
        ],
        centroides: (respuestaPunto.centroides_pca ?? []).map((c, i) => ({
          x: c[0],
          y: c[1],
          cluster: i,
        }))
      }));
    }
  };

  const requiereVariablesX = (tipo = tabActiva) =>
    tipo === "datasets" || tipo === "texto";

  const asegurarVariablesXSeleccionadas = (accion = 'start', tipo = tabActiva) => {
    if (!requiereVariablesX(tipo)) {
      return true;
    }

    const tieneFeatures =
      Array.isArray(variablesSeleccionadas.features) &&
      variablesSeleccionadas.features.length > 0;

    if (tieneFeatures) {
      return true;
    }

    addError(
      accion === 'send'
        ? 'Select at least one X variable before sending new data to clustering. Target is optional.'
        : 'Select at least one X variable before starting clustering. Target is optional.',
      'warning'
    );
    return false;
  };

  const filtrarDatos = () => {
    if (
      !Array.isArray(variablesSeleccionadas.features) ||
      variablesSeleccionadas.features.length === 0
    ) {
      throw new Error('Select at least one X variable before clustering. Target is optional.');
    }

    const indicesFeatures = variablesSeleccionadas.features.map(f =>
      columnasDataset.indexOf(f)
    );

    const indiceTarget = variablesSeleccionadas.target
      ? columnasDataset.indexOf(variablesSeleccionadas.target)
      : -1;

    const datos = processedImages.map(fila =>
      indicesFeatures.map(i => {
        const v = fila[i];
        return !isNaN(v) && v !== "" ? parseFloat(v) : v;
      })
    );

    const etiquetas = indiceTarget >= 0
      ? processedImages.map(fila => fila[indiceTarget])
      : [];

    return { datos, etiquetas };
  };

  const resetClusteringRuntimeStates = () => {
    setIsClustering(false);
    setEstaProcesandoEnvio(false);
    setClusterPoints([]);
    setSelectedImageIds([]);
    setBulkLabelInput("");
    setIncomingQueue([]);
    setIdSesionClustering(null);
    setEventosClustering([]);
    setAsignacionesClusters({});
    setIdsEnClustering({});
    setTiemposClustering({});
    setTamaniosActuales([]);
    setProyeccionPCA([]);
    setDatosProcesados([]);
    setInitialMaxSizes([]);
    setDimensionFeaturesInicial(null);
    lastSelectedIndexRef.current = null;
  };

  const resetPanelConfiguracion = () => {
    setClusterParams(crearParametrosClusterPorDefecto());
    setPanelConfiguracionVersion((prev) => prev + 1);
  };

  const resetVariablesSeleccionadas = () => {
    setVariablesSeleccionadas({ ...VARIABLES_SELECCIONADAS_INICIALES });
    setVariablesPanelVersion((prev) => prev + 1);
  };

  const detenerEjecucionClustering = () => {
    cancelAll();
    reset();
    resetClusteringRuntimeStates();
  };

  const reiniciarInterfazActual = () => {
    detenerEjecucionClustering();
    reiniciarDatosCargados();
    resetPanelConfiguracion();
  };

  const manejarErrorFatalClustering = (error, fallback = 'The clustering operation could not be completed.') => {
    console.error('Error fatal en clustering:', error);
    reiniciarInterfazActual();

    if (error?.__notified) {
      return;
    }

    addError(obtenerMensajeError(error, fallback), 'error', { timeoutMs: 7000 });
  };

  const resetClusteringStates = () => {
    resetClusteringRuntimeStates();
    reiniciarDatosCargados();
  };

  // --- CAMBIO DE PESTAÑA CON VALIDACIÓN ---
  const handleChangeTab = (newTab) => {
    if (isClustering) {
      addError('You cannot change tabs while clustering is active. Stop the operation first.', 'warning');
      return;
    }
    resetClusteringStates();
    resetPanelConfiguracion();
    setTabActiva(newTab);
  };

  // --- START / STOP CLUSTERING ---
  const toggleClustering = async () => {
    // CASO 1: DETENER
    if (isClustering) {
      addError('Stopping operation...', 'warning', { timeoutMs: 2500 });
      detenerEjecucionClustering();
      reiniciarDatosCargados();
      return;
    }

    // CASO 2: INICIAR (Validación)
    let puntosEnviados = 0;
    let totalPuntosAEnviar = 0;
    let envioCancelado = false;

    if (processedImages.length < 1) {
      addError("You must load data first.", "warning");
      return;
    }
    if (!asegurarVariablesXSeleccionadas('start')) {
      return;
    }

    // Preparación de inicio
      setInitialMaxSizes([...clusterParams.maxSizes]);
    setDimensionFeaturesInicial(
      requiereVariablesX()
        ? variablesSeleccionadas.features.length
        : null
    );
    setIsClustering(true);
    setEstaProcesandoEnvio(true);
    reset(); // Resetear el abort controller para una nueva sesión

    try {
      const respuestaInicio = await iniciarClusteringServicio({
        k: clusterParams.k,
        cardinalidades: clusterParams.maxSizes,
        metodo: tabActiva,
        escalar: false,
        signal: getAbortSignal() // Pasar el signal
      });

      const sesionId = respuestaInicio.data.sesion_id;
      setIdSesionClustering(sesionId);

      const esDataset = tabActiva === "datasets" || tabActiva === "texto";
      let puntos;

      if (esDataset) {
        const { datos, etiquetas } = filtrarDatos();
        // Mapea a objetos con id para que el loop funcione igual
        puntos = datos.map((fila, i) => ({
          id: crypto.randomUUID(),
          file: fila,
          filaOriginal: processedImages[i],
          label: etiquetas[i] ?? null,
        }));
      } else {
        puntos = processedImages;
      }

      // ── Loop idéntico para ambos casos ─────────────────────
      const puntosBarajados = obtenerPuntosEnOrdenDeEnvio(puntos);
      totalPuntosAEnviar = puntosBarajados.length;



      for (const punto of puntosBarajados) {
        // Verificar si fue cancelado antes de enviar
        const signal = getAbortSignal();
        if (signal.aborted) {
          console.log('Clustering cancelado por usuario');
          envioCancelado = true;
          break;
        }

        const ahora = Date.now();
        // Actualización de estado inicial para la imagen
        setIdsEnClustering(prev => ({ ...prev, [punto.id]: true }));
        setTiemposClustering(prev => ({ ...prev, [punto.id]: ahora }));

        try {
          const resPunto = await enviarPuntoAlServicio(punto, sesionId, tabActiva, signal);
          actualizarEstadoConRespuestaClustering(punto, resPunto);
          puntosEnviados += 1;

        } catch (e) {
          // Si fue cancelado por usuario, salir del loop
          if (esErrorCancelado(e)) {
            console.log('Solicitud cancelada para punto:', punto.id);
            envioCancelado = true;
            break;
          }
          manejarErrorFatalClustering(e, `Could not process point ${punto.id}.`);
          return;
        }
      }

      if (!envioCancelado) {
        addError(`Initial data sending completed (${puntosEnviados}/${totalPuntosAEnviar}).`, 'success');
      }
    } catch (error) {
      // Si fue cancelado, no mostrar error (fue intencional del usuario)
      if (esErrorCancelado(error)) {
        console.log('Clustering cancelado por el usuario');
        return;
      }
      manejarErrorFatalClustering(error, 'Could not start or continue clustering.');
    } finally {
      setEstaProcesandoEnvio(false);
    }
  };

  const confirmarAumentoTamanios = async () => {
    if (!isClustering || !idSesionClustering || estaProcesandoEnvio) return;

    // Validación frontend: solo permitir subir (o mantener) respecto al límite vigente
    if (Array.isArray(initialMaxSizes) && initialMaxSizes.length === clusterParams.maxSizes.length) {
      for (let i = 0; i < clusterParams.maxSizes.length; i++) {
        const referencia = initialMaxSizes[i] ?? 0;
        const propuesto = clusterParams.maxSizes[i] ?? 0;
        if (propuesto < referencia) {
          addError(
            `The maximum size for C${i + 1} (${propuesto}) cannot be lower than the current limit (${referencia}).`,
            "warning"
          );
          return;
        }
      }
    }
    try {
      const respuesta = await actualizarTamaniosClusteringServicio({
        sesionId: idSesionClustering,
        tamanosNuevos: clusterParams.maxSizes,
        signal: getAbortSignal()
      });

      const datosRespuesta = respuesta?.data ?? respuesta ?? {};
      const tamaniosPrevios = [...initialMaxSizes];
      const tamaniosActualizadosFuente =
        datosRespuesta.cardinalidades ??
        datosRespuesta.tamaniosMaximos ??
        respuesta?.tamaniosMaximos ??
        clusterParams.maxSizes;
      const tamaniosActualesFuente =
        datosRespuesta.tamanios_actuales ??
        datosRespuesta.tamaniosActuales ??
        respuesta?.tamaniosActuales;
      const fueExitosa =
        respuesta?.success === true ||
        respuesta?.estado === 'ok' ||
        Array.isArray(tamaniosActualizadosFuente);

      if (!fueExitosa) {
        addError('The maximum sizes could not be updated.', "error");
        return;
      }

      const tamaniosActualizados = Array.isArray(tamaniosActualizadosFuente)
        ? [...tamaniosActualizadosFuente]
        : [...clusterParams.maxSizes];

      setClusterParams((prev) => ({
        ...prev,
        maxSizes: tamaniosActualizados,
      }));
      setInitialMaxSizes(tamaniosActualizados);

      if (Array.isArray(tamaniosActualesFuente)) {
        setTamaniosActuales(tamaniosActualesFuente);
      }

      const cambios = tamaniosActualizados
        .map((nuevo, i) => {
          const anterior = tamaniosPrevios[i] ?? nuevo;
          if (nuevo === anterior) return null;
          return `C${i + 1}: ${anterior} -> ${nuevo}`;
        })
        .filter(Boolean);

      const mensajeExito =
        traducirMensajeInterfaz(
          respuesta?.message ?? datosRespuesta?.message,
          'Maximum sizes updated successfully.'
        ) ??
        'Maximum sizes updated successfully.';

      addError(
        cambios.length > 0
          ? `${mensajeExito}\n${cambios.join('\n')}`
          : mensajeExito,
        "success"
      );
    } catch (e) {
      console.error('Error actualizando tamaños máximos', e);
      addError(
        obtenerMensajeError(e, 'The maximum sizes could not be updated. Check the constraints.'),
        "error"
      );
    }
  };

  const enviarNuevasImagenesAlClustering = async () => {
    if (!isClustering || !idSesionClustering || estaProcesandoEnvio) return;

    if (!asegurarVariablesXSeleccionadas('send')) {
      return;
    }

    if (
      requiereVariablesX() &&
      dimensionFeaturesInicial !== null &&
      variablesSeleccionadas.features.length !== dimensionFeaturesInicial
    ) {
      addError(
        `New data must use ${dimensionFeaturesInicial} X variable(s), but ${variablesSeleccionadas.features.length} are selected.`,
        'warning'
      );
      return;
    }

    let puntosEnviados = 0;
    let totalPuntosAEnviar = 0;
    let envioCancelado = false;

    try {

    const esDataset = tabActiva === "datasets" || tabActiva === "texto";
    let todosPuntos;

    if (esDataset) {
      const { datos, etiquetas } = filtrarDatos();
      todosPuntos = datos.map((fila, i) => ({
        id: crypto.randomUUID(),
        file: fila,
        filaOriginal: processedImages[i],
        label: etiquetas[i] ?? null,
      }));
    } else {
      todosPuntos = processedImages;
    }


    if (todosPuntos.length === 0) {
      addError('There are no new pending points to send to clustering.', "warning");
      return;
    }

    setEstaProcesandoEnvio(true);
    const puntosAEnviar = obtenerPuntosEnOrdenDeEnvio(todosPuntos);
    totalPuntosAEnviar = puntosAEnviar.length;

    for (const punto of puntosAEnviar) {
      const signal = getAbortSignal();
      if (signal.aborted) {
        console.log('Envío cancelado');
        envioCancelado = true;
        break;
      }

      const ahora = Date.now();
      setIdsEnClustering(prev => ({ ...prev, [punto.id]: true }));
      setTiemposClustering(prev => ({ ...prev, [punto.id]: ahora }));

      try {
        const resPunto = await enviarPuntoAlServicio(punto, idSesionClustering, tabActiva, signal);
        actualizarEstadoConRespuestaClustering(punto, resPunto);
        puntosEnviados += 1;

      } catch (e) {
        if (esErrorCancelado(e)) {
          console.log('Solicitud cancelada para punto:', punto.id);
          envioCancelado = true;
          break;
        }
        manejarErrorFatalClustering(e, `Could not add point ${punto.id} to clustering.`);
        return;
      }
    }

    if (!envioCancelado) {
      addError(`New data sending completed (${puntosEnviados}/${totalPuntosAEnviar}).`, 'success');
    }
    } catch (error) {
      if (esErrorCancelado(error)) {
        console.log('Envio de nuevos datos cancelado por el usuario');
        return;
      }

      manejarErrorFatalClustering(error, 'Could not prepare the new data for clustering.');
    } finally {
      setEstaProcesandoEnvio(false);
    }
  };

  // --- EFECTOS ---
  // Configurar callback de errores desde axios
  useEffect(() => {
    setErrorCallback((mensaje, tipo) => {
      addError(mensaje, tipo);
    });
  }, [addError]);

  useEffect(() => {
    if (isClustering && clusteringSectionRef.current) {
      setTimeout(() => clusteringSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [isClustering]);

  useEffect(() => {
    // La lógica de animación de puntos se ha desactivado temporalmente
  }, [isClustering, incomingQueue, clusterParams]);



  const renderContenido = () => {
    switch (tabActiva) {
      case "datasets":
        return <ModuloDatos
          titulo_Galeria="Dataset"
          datosDataset={processedImages}
          columnasDataset={columnasDataset}
          limpiarData={limpiarDataset}
          datosProcesados={datosProcesados}
          setVariablesSeleccionadas={setVariablesSeleccionadas}
          variablesSeleccionadas={variablesSeleccionadas}
          variablesPanelVersion={variablesPanelVersion}
          {...propsModulo} />;


      case "imagen":
        return <ModuloImagenes titulo_Galeria="Gallery" {...propsModulo} />;
      case "texto":
        return <ModuloTexto
          titulo_Galeria="Text"
          datosDataset={processedImages}
          columnasDataset={columnasDataset}
          limpiarData={limpiarDataset}
          datosProcesados={datosProcesados}
          setVariablesSeleccionadas={setVariablesSeleccionadas}
          variablesSeleccionadas={variablesSeleccionadas}
          variablesPanelVersion={variablesPanelVersion}
          {...propsModulo} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen select-none overflow-x-hidden bg-white font-sans text-gray-900">
      <ErrorNotification />
      <div
        className={`
          relative flex flex-col 
          transition-all duration-700
          ${leftVisible ? "w-[320px]" : "w-10"}
          bg-white border-r-2 border-gray-200 shadow-sm
        `}
      >
        {/* Botón */}
        <button
          onClick={() => setLeftVisible(!leftVisible)}
          className="
            absolute top-3 -right-4
            w-8 h-8
            bg-white border border-gray-300
            rounded-full shadow-md
            flex items-center justify-center
            hover:bg-gray-100 transition
            z-30
          "
        >
          {leftVisible ? (
            <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronDoubleRightIcon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* Contenido solo si está abierto */}
        <div
          className={`
            transition-opacity duration-300
            ${leftVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <LateralIzquierdo
            lotes={batches}
            onProcesarLote={handleProcessBatch}
            onEliminarLote={removeBatch}
            onActualizarEtiqueta={updateBatchLabel}
            onSeleccionCarpeta={handleFolderSelect}
            onSeleccionMultiple={handleMultipleSelect}
            pestañaActiva={tabActiva}
            delimitador={delimitador}
            setDelimitador={setDelimitador}
            setEncabezado={setEncabezadoDataset}
            encabezado={encabezadoDataset}
          />

          <PanelConfiguracion
            resetVersion={panelConfiguracionVersion}
            estaClustering={isClustering}
            estaProcesandoEnvio={estaProcesandoEnvio}
            parametrosCluster={clusterParams}
            tamaniosIniciales={initialMaxSizes}
            onCambiarK={handleKChange}
            onCambiarTamanoMaximo={handleMaxSizeChange}
            onAplicarTamanoTodos={handleApplySameMaxSize}
            onToggleClustering={toggleClustering}
            onAumentarTamanios={confirmarAumentoTamanios}
            onEnviarNuevosDatos={enviarNuevasImagenesAlClustering}
            ordenEnvio={ordenEnvio}
            onCambiarOrdenEnvio={setOrdenEnvio}
            mostrarSelectorSemilla={MOSTRAR_SELECTOR_SEMILLA}
          />
        </div>
      </div>


      {/* ÁREA PRINCIPAL: GALERÍA + RESULTADOS */}
      <main className="flex-1 flex flex-col bg-white relative min-w-0">
        <header className="h-auto shrink-0 border-b border-gray-200 bg-white px-8 py-4 flex flex-col z-10 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                StreamClust: Online Clustering with Size Constraints
              </h1>

            </div>
          </div>

          {/* MENU DE PESTAÑAS */}
          <MenuPestanas
            tabActiva={tabActiva}
            setTabActiva={handleChangeTab}
            isDisabled={isClustering}
          />
        </header>

        {/* Barra flotante de selección */}
        <BarraSeleccionFlotante
          cantidadSeleccionados={selectedImageIds.length}
          textoEtiqueta={bulkLabelInput}
          onCambiarTextoEtiqueta={setBulkLabelInput}
          onAplicarEtiquetaMasiva={applyBulkLabel}
          onBorrarSeleccion={deleteSelectedImages}
          onLimpiarSeleccion={clearSelection}
        />

        {/* Contenedor principal */}
        <div className="p-6 pb-20">
          {renderContenido()}
        </div>
      </main>

    </div>
  );
}

export default App; 

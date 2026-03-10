import React, { useState } from 'react'
import { ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { obtenerPaletaClusters } from '../lib/paletaClusters'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useError } from '../hooks/useError'

const MOSTRAR_DESCARGA_ZIP = !['0', 'false', 'no', 'off'].includes(
  String(import.meta.env.VITE_MOSTRAR_DESCARGA_ZIP ?? 'true').toLowerCase().trim()
)

function PanelClustersImagenes({ imagenesProcesadas, asignacionesClusters, tiemposClustering, cantidadClusters }) {
  const { addError } = useError()
  const [clusterSeleccionado, setClusterSeleccionado] = useState(null)
  const [abierto, setAbierto] = useState(true)
  const [descargandoZip, setDescargandoZip] = useState(false)
  const paleta = obtenerPaletaClusters(cantidadClusters)

  const obtenerImagenesCluster = (indiceCluster) => {
    const lista = imagenesProcesadas.filter((img) => asignacionesClusters[img.id] === indiceCluster)
    return lista
      .slice()
      .sort((a, b) => (tiemposClustering[b.id] || 0) - (tiemposClustering[a.id] || 0))
  }

  const sanitizarTexto = (valor) => {
    if (!valor) return 'unlabeled'
    return String(valor).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'unlabeled'
  }

  const obtenerNombreArchivo = (img, indice) => {
      const original = img?.file?.name || `image_${indice + 1}.jpg`
    const etiqueta = sanitizarTexto(img?.label)
    return `${String(indice + 1).padStart(3, '0')}_${etiqueta}_${original}`
  }

  const crearZipDeClusters = async ({ soloCluster = null } = {}) => {
    const zip = new JSZip()
    let totalArchivos = 0

    const indices = soloCluster === null
      ? Array.from({ length: cantidadClusters }, (_, i) => i)
      : [soloCluster]

    for (const indiceCluster of indices) {
      const imagenes = obtenerImagenesCluster(indiceCluster)
      if (imagenes.length === 0) continue

      const carpeta = zip.folder(`cluster_${indiceCluster}`)
      for (let i = 0; i < imagenes.length; i++) {
        const img = imagenes[i]
        if (!img?.file) continue
        carpeta.file(obtenerNombreArchivo(img, i), img.file)
        totalArchivos += 1
      }
    }

    return { zip, totalArchivos }
  }

  const descargarResultadosClusters = async () => {
    if (descargandoZip) return

    try {
      setDescargandoZip(true)
      const { zip, totalArchivos } = await crearZipDeClusters()
      if (totalArchivos === 0) {
        addError('There are no images assigned to clusters for download.', 'warning')
        return
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `cluster_results_k${cantidadClusters}.zip`)
    } catch (error) {
      console.error('Error generando ZIP de resultados', error)
      addError('Could not generate the results ZIP file.', 'error')
    } finally {
      setDescargandoZip(false)
    }
  }

  const descargarClusterSeleccionado = async () => {
    if (clusterSeleccionado === null || descargandoZip) return

    try {
      setDescargandoZip(true)
      const { zip, totalArchivos } = await crearZipDeClusters({ soloCluster: clusterSeleccionado })
      if (totalArchivos === 0) {
        addError('This cluster has no images available for download.', 'warning')
        return
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `cluster_${clusterSeleccionado}_results.zip`)
    } catch (error) {
      console.error('Error generando ZIP del cluster', error)
      addError('Could not generate the selected cluster ZIP file.', 'error')
    } finally {
      setDescargandoZip(false)
    }
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div
        className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setAbierto((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setAbierto((prev) => !prev)
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-600"
            title={abierto ? 'Close clusters' : 'Open clusters'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 9A.75.75 0 011.75 11h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 11.75zm0 5A.75.75 0 011.75 16h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 16.75zM1.75 7a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H1.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Clustering Results
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">k = {cantidadClusters}</span>
          {MOSTRAR_DESCARGA_ZIP && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                descargarResultadosClusters()
              }}
              disabled={descargandoZip}
              className={`text-[11px] font-bold px-3 py-1.5 rounded border transition-colors ${descargandoZip
                ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {descargandoZip ? 'Generating ZIP...' : 'Download ZIP'}
            </button>
          )}
        </div>
      </div>
      {abierto && (
        <div className="p-5 space-y-5 bg-white text-sm">
          {cantidadClusters <= 0 ? (
            <p className="text-gray-600 font-medium">Set k &gt; 0 to view clusters.</p>
          ) : (
            <>
              <div className="max-h-[calc(10*11rem)] overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: cantidadClusters }).map((_, indiceCluster) => {
                    const imagenesCluster = obtenerImagenesCluster(indiceCluster)
                    const seleccion = clusterSeleccionado === indiceCluster
                    const primera = imagenesCluster[0]
                    const colorCluster = paleta[indiceCluster % paleta.length]

                    return (
                      <button
                        key={indiceCluster}
                        type="button"
                        onClick={() => setClusterSeleccionado(indiceCluster)}
                        className={`group flex min-h-[11rem] flex-col rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 ${seleccion
                          ? 'border-gray-300 bg-gray-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                        style={{
                          boxShadow: seleccion ? `0 0 0 1px ${colorCluster}55` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorCluster }} />
                          <span className="font-semibold text-gray-800 text-sm">
                            Cluster {indiceCluster}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {imagenesCluster.length}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          assigned image{imagenesCluster.length === 1 ? '' : 's'}
                        </p>
                        <div className="mt-4 flex min-h-[5rem] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                          {primera ? (
                            <img
                              src={primera.previewUrl}
                              alt={primera.file?.name || 'image'}
                              className="max-h-20 max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">No preview</span>
                          )}
                        </div>
                        <div className={`mt-4 flex items-center gap-1 text-xs font-medium text-indigo-500 transition-opacity ${seleccion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <span>View images</span>
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {clusterSeleccionado !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white border border-gray-300 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden">
                    <div className="h-12 px-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
                      <div>
                        <span className="text-sm font-bold text-gray-900 mr-2 inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: paleta[clusterSeleccionado % paleta.length] }}
                          />
                          Cluster {clusterSeleccionado}
                        </span>
                        <span className="text-xs text-gray-600">
                          Images assigned to this cluster
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {MOSTRAR_DESCARGA_ZIP && (
                          <button
                            type="button"
                            className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${descargandoZip
                              ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            onClick={descargarClusterSeleccionado}
                            disabled={descargandoZip}
                          >
                            {descargandoZip ? 'Generating...' : 'Download ZIP'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                          onClick={() => setClusterSeleccionado(null)}
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                          Exit
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {obtenerImagenesCluster(clusterSeleccionado).map((img) => (
                          <div
                            key={img.id}
                            className="bg-white border border-gray-300 rounded overflow-hidden flex flex-col items-center p-2 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-full h-28 overflow-hidden flex items-center justify-center bg-gray-100">
                              <img
                                src={img.previewUrl}
                                 alt={img.file?.name || 'image'}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <p className="text-[11px] text-gray-700 truncate w-full text-center" title={img.file?.name}>
                              {img.file?.name}
                            </p>
                            <p className="text-[11px] truncate w-full text-center font-medium py-1" style={{ color: paleta[clusterSeleccionado % paleta.length] }} title={img.label}>
                              {img.label}
                            </p>
                          </div>
                        ))}
                        {obtenerImagenesCluster(clusterSeleccionado).length === 0 && (
                          <p className="text-sm text-gray-600 col-span-full">
                            No images have been assigned to this cluster yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PanelClustersImagenes

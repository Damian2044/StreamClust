import React from 'react'

const MOSTRAR_DUNN = import.meta.env.VITE_MOSTRAR_DUNN !== 'false'

function PanelEventosClustering({ eventos }) {
  const [abierto, setAbierto] = React.useState(true)
  const ultimo = eventos.length > 0 ? eventos[eventos.length - 1] : null
  const metricasInternas = ultimo?.metricas_internas || {}
  const metricasExternas = ultimo?.metricas_externas || {}
  const aceptados = eventos.filter((e) => e.etiqueta_asignada != -1).length
  const rechazados = eventos.length - aceptados

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow min-h-[56px]">
      <div className="h-14 bg-gray-100/70 border-b border-gray-200 flex items-center px-4 justify-between cursor-pointer" onClick={() => setAbierto((v) => !v)}>
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setAbierto((prev) => !prev)
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors text-gray-600"
            title={abierto ? 'Close summary' : 'Open summary'}
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

          Online Clustering Summary
        </span>
        <span className="text-sm text-gray-700 font-medium">
          {eventos.length} processed points
        </span>
      </div>

      <div
        className={`
                    transition-all duration-500 ease-in-out overflow-hidden
                    ${abierto ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}
                `}
      >
        <div className="p-6 bg-gray-100/80 text-base text-gray-900 space-y-4">
          {ultimo ? (
            <>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-2">Internal metrics</p>
                  <p className="mb-1">
                    Silhouette{' '}
                    <span className="font-semibold text-cyan-600 text-xl">
                      {(metricasInternas.silueta ?? 0).toFixed?.(3)}
                    </span>
                  </p>
                  {MOSTRAR_DUNN && (
                    <p>
                      Dunn{' '}
                      <span className="font-semibold text-cyan-600 text-xl">
                        {(metricasInternas.dunn ?? 0).toFixed?.(3)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-2">External metrics</p>
                  <p className="mb-1">
                    ARI{' '}
                    <span className="font-semibold text-emerald-600 text-xl">
                      {(metricasExternas.ari ?? 0).toFixed?.(3)}
                    </span>
                  </p>
                  <p className="mb-1">
                    AMI{' '}
                    <span className="font-semibold text-emerald-600 text-xl">
                      {(metricasExternas.ami ?? 0).toFixed?.(3)}
                    </span>
                  </p>
                  <p>
                    NMI{' '}
                    <span className="font-semibold text-emerald-600 text-xl">
                      {(metricasExternas.nmi ?? 0).toFixed?.(3)}
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-center">
                  <p className="text-sm text-gray-600 mb-2">Point status</p>
                  <p className="mb-1">
                    Accepted{' '}
                    <span className="text-emerald-400 font-semibold text-2xl">{aceptados}</span>
                  </p>
                  <p>
                    Rejected{' '}
                    <span className="text-red-400 font-semibold text-2xl">{rechazados}</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-base">
              No points have been processed yet. Start clustering to see the summary.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PanelEventosClustering

import React from 'react';
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function PanelConfiguracion({
  resetVersion,
  estaClustering,
  parametrosCluster,
  tamaniosIniciales,
  onCambiarK,
  onCambiarTamanoMaximo,
  onAplicarTamanoTodos,
  onToggleClustering,
  onAumentarTamanios,
  onEnviarNuevosDatos,
}) {
  const [tamanoComun, setTamanoComun] = React.useState('100');
  const EstadoIcono = estaClustering ? LockClosedIcon : ExclamationTriangleIcon;

  React.useEffect(() => {
    setTamanoComun('100');
  }, [resetVersion]);

  return (
    <aside className="w-80 border-l border-slate-200 flex flex-col shrink-0 z-20 ">
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-violet-300 rounded-full" />
          Configuration
        </h3>
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar pb-10">
        <hr className="border-slate-200" />

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex justify-between items-center">
            Clustering Online
            {estaClustering && (
              <span className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-bold animate-pulse">
                RUNNING
              </span>
            )}
          </h4>

          <div
            className={`border rounded-lg p-3 mb-4 transition-colors ${estaClustering
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
              }`}
          >
            <p
              className={`text-[11px] font-semibold flex gap-2 items-start ${estaClustering ? 'text-emerald-600' : 'text-amber-600'
                }`}
            >
              <EstadoIcono className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {estaClustering
                  ? 'Safe Mode: Parameters are locked.'
                  : 'Set the parameters before starting clustering.'}
              </span>
            </p>
          </div>

          <div className="space-y-4">
            {/* K */}
            <div>
              <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                Number of Clusters (k)
              </label>
              <input
                type="number"
                min="1"
                value={parametrosCluster.k}
                onChange={onCambiarK}
                disabled={estaClustering}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition ${estaClustering
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200 focus:border-blue-300 bg-white'
                  }`}
              />
            </div>

            {/* Tamaños */}
            <div>
              <label className="text-[11px] text-slate-500 font-semibold block mb-2">
                Maximum Size per Cluster
              </label>

              {!estaClustering && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    min="1"
                    value={tamanoComun}
                    onChange={(e) => setTamanoComun(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onAplicarTamanoTodos(tamanoComun);
                      }
                    }}
                    className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-300"
                    placeholder="e.g. 100"
                  />
                  <button
                    type="button"
                    onClick={() => onAplicarTamanoTodos(tamanoComun)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                  >
                    Apply to all
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {parametrosCluster.maxSizes.map((tamano, indice) => (
                  <div key={indice} className="flex items-center gap-2">
                    <span className="text-[10px] w-6 text-slate-400">
                      C{indice}
                    </span>
                    <input
                      type="number"
                      min={estaClustering ? (tamaniosIniciales?.[indice] ?? 1) : 1}
                      value={tamano}
                      onChange={(e) =>
                        onCambiarTamanoMaximo(indice, e.target.value)
                      }
                      className={`flex-1 border rounded px-2 py-1.5 text-xs outline-none ${estaClustering
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 focus:border-blue-300'
                        }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTON PRINCIPAL */}
          <button
            onClick={onToggleClustering}
            className={`w-full mt-6 font-semibold py-3 rounded-xl transition ${estaClustering
              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
          >
            {estaClustering ? 'Stop Clustering' : 'Start Clustering'}
          </button>

          {estaClustering && (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={onEnviarNuevosDatos}
                className="w-full text-[12px] font-semibold py-2 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition"
              >
                Send new data to clustering
              </button>

              <button
                type="button"
                onClick={onAumentarTamanios}
                className="w-full text-[12px] font-semibold py-2 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition"
              >
                Increase cluster size
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default PanelConfiguracion;

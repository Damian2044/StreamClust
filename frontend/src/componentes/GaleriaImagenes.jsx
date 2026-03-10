import React, { useState } from 'react';
import { CameraIcon, CheckIcon } from '@heroicons/react/24/outline';

function GaleriaImagenes({
  titulo,
  imagenesProcesadas,
  idsSeleccionados,
  onClickImagen,
  onClickFondo,
  onLimpiarTodo,
}) {
  const [abierta, setAbierta] = useState(true);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow relative">
      <div className="h-10 bg-gray-100/50 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 relative pointer-events-auto">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAbierta((prev) => !prev)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors"
            title={abierta ? 'Close gallery' : 'Open gallery'}
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
          {titulo} ({imagenesProcesadas.length})
        </span>
        <button
          onClick={onLimpiarTodo}
          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      {abierta && (
        <div
          className="max-h-[420px] overflow-y-auto custom-scrollbar p-6 bg-gray-100/50 relative"
          onClick={onClickFondo}
        >
          {imagenesProcesadas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <CameraIcon className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Waiting for processing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {imagenesProcesadas.map((imagen, indice) => {
                const estaSeleccionada = idsSeleccionados.includes(imagen.id);
                return (
                  <div
                    key={imagen.id}
                    onClick={() => onClickImagen(imagen.id)}
                    className={`relative group cursor-pointer transition-all duration-100 bg-gray-100 rounded-xl p-2 border image-card ${estaSeleccionada
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-900/50 scale-[1.02]'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-200'
                      }`}
                  >
                    <div className="bg-white rounded-lg h-32 w-full flex items-center justify-center overflow-hidden mb-2 relative pointer-events-none">
                      <img
                        src={imagen.previewUrl}
                        alt="preview"
                        className="max-h-full max-w-full object-contain p-2"
                        loading="lazy"
                      />
                      <div
                        className={`absolute inset-0 bg-gray-900/10 transition-opacity ${estaSeleccionada ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                      >
                        <div
                          className={`absolute top-2 left-2 w-5 h-5 rounded border shadow-sm flex items-center justify-center ${estaSeleccionada
                            ? 'bg-cyan-500 border-cyan-500'
                            : 'bg-white border-slate-300'
                            }`}
                        >
                          {estaSeleccionada && (
                            <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-1 pointer-events-none">
                      <p
                        className={`text-xs font-bold truncate mb-0.5 ${imagen.label === 'Unlabeled'
                          ? 'text-gray-500 italic'
                          : 'text-cyan-700'
                          }`}
                      >
                        {imagen.label}
                      </p>
                      <p
                        className="text-[10px] text-gray-500 truncate"
                        title={imagen.file && imagen.file.name ? imagen.file.name : ''}
                      >
                        {imagen.file && imagen.file.name ? imagen.file.name : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GaleriaImagenes;

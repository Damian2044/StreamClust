import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function BarraSeleccionFlotante({
  cantidadSeleccionados,
  textoEtiqueta,
  onCambiarTextoEtiqueta,
  onAplicarEtiquetaMasiva,
  onBorrarSeleccion,
  onLimpiarSeleccion,
}) {
  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${cantidadSeleccionados > 0
          ? 'translate-y-0 opacity-100'
          : 'translate-y-[-20px] opacity-0 pointer-events-none'
        }`}
    >
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow w-[90vw] max-w-2xl">
        <span className="bg-cyan-500/10 text-cyan-400 text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
          {cantidadSeleccionados} items
        </span>
        <input
          type="text"
          placeholder="New label..."
          value={textoEtiqueta}
          onChange={(e) => onCambiarTextoEtiqueta(e.target.value)}
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
        />
        <button
          onClick={onAplicarEtiquetaMasiva}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Apply
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1" />
        <button
          onClick={onBorrarSeleccion}
          className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          Delete
        </button>
        <button
          onClick={onLimpiarSeleccion}
          className="px-2 text-gray-400 transition-colors hover:text-gray-800"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default BarraSeleccionFlotante;

import React, { useState } from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';


function TablaDataset({
    titulo,
    datos = [],
    columnas = [],
    onLimpiarTodo,
    className = "",
    onToggleAbierta,
}) {
    const [abierta, setAbierta] = useState(true);

    // Detectar columnas si no vienen
    let columnasFinales = columnas;
    if (columnasFinales.length === 0 && datos.length > 0) {
        if (Array.isArray(datos[0])) {
            columnasFinales = datos[0].map((_, i) => `x${i + 1}`);
        } else {
            columnasFinales = Object.keys(datos[0]);
        }
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow relative ${abierta ? className : ""}`}>
            {/* Header */}
            <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 relative">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setAbierta((prev) => {
                                const siguiente = !prev;
                                onToggleAbierta?.(siguiente);
                                return siguiente;
                            });
                        }}
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
                    {titulo} ({datos.length})
                </span>

                <button
                    onClick={onLimpiarTodo}
                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Tabla */}
            <div
                className={`
                    transition-all duration-500 ease-in-out overflow-hidden flex flex-col
                    ${abierta ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >

                <div className="max-h-[420px] flex-1 overflow-auto custom-scrollbar bg-gray-50 p-2">
                    {datos.length === 0 ? (
                        <div className="h-60 flex flex-col items-center justify-center opacity-40">
                            <TableCellsIcon className="mb-2 h-12 w-12 text-gray-400" />
                            <p className="text-gray-500 font-medium">
                                Waiting for dataset...
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full border border-gray-300 text-xs text-left">
                            <thead className="bg-gray-200 sticky top-0 z-10">
                                <tr>
                                    {columnasFinales.map((col, i) => (
                                        <th
                                            key={i}
                                            className="px-3 py-2 font-bold text-gray-700 border border-gray-300"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {datos.map((fila, i) => (
                                    <tr key={i} className="hover:bg-gray-100">
                                        {columnasFinales.map((col, j) => (
                                            <td
                                                key={j}
                                                className="px-3 py-1.5 border border-gray-300"
                                            >
                                                {Array.isArray(fila) ? fila[j] : fila[col]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TablaDataset;

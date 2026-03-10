import React from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

function CargaTexto({ delimitador, setDelimitador, onSeleccionMultiple, lotesDatos, onProcesarLote, onEliminarLote, tieneEncabezado, setTieneEncabezado }) {
    return (
        <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" >
                {lotesDatos.map((lote) => (
                    <div
                        key={lote.id}
                        className="bg-gray-100 border border-gray-300 rounded-xl p-3 shadow relative group transition-all hover:border-gray-400"
                    >
                        <div
                            className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${lote.type === "dataset" ? "bg-blue-500" : "bg-emerald-500"
                                }`}
                        />

                        <div className="pl-3">
                            <div className="flex justify-between items-start mb-2">
                                <h4
                                    className="text-sm font-bold text-gray-900 truncate w-32"
                                    title={lote.name}
                                >
                                    {lote.name}
                                </h4>

                                <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded border border-gray-300">
                                    {lote.count}
                                </span>
                            </div>

                            <div className="relative mb-2">
                                <span className="text-[10px] text-gray-500 absolute -top-1.5 left-2 bg-white px-1">
                                    Delimiter
                                </span>

                                <select
                                    value={delimitador}
                                    onChange={(e) => setDelimitador(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                                >
                                    <option value="auto">Automatic</option>
                                    <option value=",">Comma (,)</option>
                                    <option value=";">Semicolon (;)</option>
                                    <option value="\t">Tab</option>
                                    <option value="|">Pipe (|)</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    checked={tieneEncabezado}
                                    onChange={(e) => setTieneEncabezado(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-cyan-500"
                                />
                                <span className="text-xs text-gray-600">Has header</span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onProcesarLote(lote.id)}
                                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold py-1.5 rounded"
                                >
                                    Add
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onEliminarLote(lote.id)}
                                    className="bg-gray-200 hover:bg-red-100 hover:text-red-400 text-gray-700 p-1.5 rounded transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
                }
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="space-y-3">
                    <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 cursor-pointer rounded-lg p-3 transition-all">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
                            <DocumentArrowUpIcon className="h-4 w-4" />
                            Upload text file
                        </span>

                        <input
                            type="file"
                            accept=".csv,.txt,.data,.xls,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                                onSeleccionMultiple(e);
                                e.target.value = null; // Esto permite seleccionar el mismo archivo otra vez
                            }}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}

export default CargaTexto;

import React from "react";
import { FolderOpenIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

function CargaImagenes({ onSeleccionCarpeta, onSeleccionMultiple, lotesImagenes, onProcesarLote, onActualizarEtiqueta, onEliminarLote }) {
    return (
        <>
            {/* LOTES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" >
                {
                    lotesImagenes.map((lote) => (
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
                                        Label
                                    </span>

                                    <input
                                        type="text"
                                        value={lote.label}
                                        placeholder="Optional, press Enter"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                onProcesarLote(lote.id);
                                            }
                                        }}
                                        onChange={(e) =>
                                            onActualizarEtiqueta(lote.id, e.target.value)
                                        }
                                        className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                                    />
                                </div>


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
            </div >
            <div className="p-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 cursor-pointer rounded-lg p-3 text-center transition-all group">
                        <FolderOpenIcon className="mx-auto mb-1 h-6 w-6 text-gray-600 transition-colors group-hover:text-cyan-600" />
                        <div className="text-[10px] text-gray-700 font-bold uppercase">
                            Folder
                        </div>

                        <input
                            type="file"
                            webkitdirectory="true"
                            directory="true"
                            className="hidden"
                            onChange={onSeleccionCarpeta}
                        />
                    </label>

                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 cursor-pointer rounded-lg p-3 text-center transition-all group">
                        <PhotoIcon className="mx-auto mb-1 h-6 w-6 text-gray-600 transition-colors group-hover:text-cyan-600" />
                        <div className="text-[10px] text-gray-700 font-bold uppercase">
                            Photos
                        </div>

                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={onSeleccionMultiple}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}

export default CargaImagenes;

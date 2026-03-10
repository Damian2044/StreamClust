import React from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline";

function TablaCapacidadClusters({ clusters = {} }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow mt-6 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gray-100 border-b text-sm font-semibold text-gray-600">
                <div className="flex items-center gap-2 p-3 border-r border-gray-200">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>Cluster</span>
                </div>
                <div className="p-3 border-r border-gray-200">Max Capacity</div>
                <div className="p-3 border-r border-gray-200">Assigned</div>
                <div className="p-3">Fill Level</div>
            </div>

            {/* Filas */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                {Object.entries(clusters).map(([nombre, datos], index) => {
                    const porcentaje =
                        datos.capacidad > 0
                            ? datos.total / datos.capacidad
                            : 0;

                    return (
                        <div
                            key={index}
                            className="grid grid-cols-4 items-center border-b last:border-none text-sm"
                        >
                            {/* Nombre */}
                            <div className="p-3 border-r border-gray-200 font-medium text-gray-700">
                                {nombre}
                            </div>

                            {/* Capacidad */}
                            <div className="p-3 border-r border-gray-200 text-gray-600">
                                {datos.capacidad}
                            </div>

                            {/* Asignados */}
                            <div className="p-3 border-r border-gray-200 text-gray-600">
                                {datos.total}
                            </div>

                            {/* Barra */}
                            <div className="p-3 flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-2 bg-red-500 transition-all duration-700"
                                        style={{
                                            width: `${porcentaje * 100}%`,
                                        }}
                                    />
                                </div>

                                <span className="text-xs text-gray-500 w-10">
                                    {(porcentaje).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TablaCapacidadClusters;

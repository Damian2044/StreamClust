import React, { useMemo, useState } from "react";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { obtenerPaletaClusters } from "../lib/paletaClusters";

function TablaInstanciasClusters({
    imagenesProcesadas = [],
    asignacionesClusters = {},
    cantidadClusters = 0,
    featuresSeleccionadas = []
}) {
    const [abierto, setAbierto] = useState(true);
    const [clusterAbierto, setClusterAbierto] = useState(null); // índice del cluster en modal

    const paleta = obtenerPaletaClusters(cantidadClusters);
    // Agrupar instancias por cluster, orden secuencial (sin id)
    const porCluster = useMemo(() => {
        const grupos = {};
        for (let c = 0; c < cantidadClusters; c++) grupos[c] = [];

        imagenesProcesadas.forEach((img, i) => {
            const cluster = asignacionesClusters?.[img.id] ?? null; // ← img.id en vez de i
            if (cluster !== null && grupos[cluster] !== undefined) {
                grupos[cluster].push({
                    id: img.id ?? i,
                    label: img.label ?? null,
                    variables: img.datos ?? img.file ?? [],
                });
            }
        });

        return grupos;
    }, [imagenesProcesadas, asignacionesClusters, cantidadClusters]);

    const totalVariables =
        Object.values(porCluster).find(g => g.length > 0)?.[0]?.variables?.length ?? 0;

    const clusterModal = clusterAbierto !== null ? porCluster[clusterAbierto] ?? [] : [];

    return (
        <>
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow overflow-hidden">
                {/* Header */}
                <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAbierto(prev => !prev)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors text-gray-600"
                            title={abierto ? "Close" : "Open"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 9A.75.75 0 011.75 11h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 11.75zm0 5A.75.75 0 011.75 16h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 16.75zM1.75 7a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H1.75z" clipRule="evenodd" />
                            </svg>
                        </button>
                        Clustering Results
                    </span>
                </div>

                {/* Cards de clusters */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${abierto ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}>
                    {cantidadClusters === 0 ? (
                        <p className="text-center py-8 text-gray-400 text-sm">
                            No clustering data yet
                        </p>
                    ) : (
                        <div className="max-h-[48rem] overflow-y-auto custom-scrollbar p-4">
                            <div className="grid grid-cols-3 gap-4">
                            {Array.from({ length: cantidadClusters }).map((_, c) => {
                                const color = paleta[c % paleta.length];
                                const instancias = porCluster[c] ?? [];

                                return (
                                    <button
                                        key={c}
                                        onClick={() => setClusterAbierto(c)}
                                        className="bg-white border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="font-semibold text-gray-800 text-sm">
                                                Cluster {c}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{instancias.length}</p>
                                        <p className="text-xs text-gray-400 mt-1">assigned instances</p>

                                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
                                            <span>View table</span>
                                            <ChevronRightIcon className="h-3.5 w-3.5" />
                                        </div>
                                    </button>
                                );
                            })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal tabla */}
            {clusterAbierto !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header modal */}
                        <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: paleta[clusterAbierto % paleta.length] }}
                                />
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    Cluster {clusterAbierto} — {clusterModal.length} instances
                                </span>
                            </div>
                            <button
                                onClick={() => setClusterAbierto(null)}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                Exit
                            </button>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-auto flex-1">
                            <table className="min-w-full text-sm border-collapse">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="border border-gray-200 px-4 py-2 text-left text-gray-600 font-semibold">LABEL</th>
                                        {Array.from({ length: totalVariables }).map((_, i) => (
                                            <th key={i} className="border border-gray-200 px-4 py-2 text-left text-gray-600 font-semibold">
                                                {featuresSeleccionadas[i] ?? `x${i + 1}`}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clusterModal.length === 0 ? (
                                        <tr>
                                            <td colSpan={2 + totalVariables} className="text-center py-8 text-gray-400">
                                                This cluster has no assigned instances
                                            </td>
                                        </tr>
                                    ) : (
                                        clusterModal.map((fila) => (
                                            <tr key={fila.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="border border-gray-200 px-4 py-1.5 text-gray-500 text-xs">
                                                    {fila.label ?? "—"}
                                                </td>
                                                {fila.variables.map((v, i) => (
                                                    <td key={i} className="border border-gray-200 px-4 py-1.5 text-gray-700">
                                                        {typeof v === "number" ? v.toFixed(3) : v}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TablaInstanciasClusters;

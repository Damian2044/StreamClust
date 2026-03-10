import React from "react";
import ReactECharts from "echarts-for-react";
import { useState } from 'react';
import TablaCapacidadClusters from "./TablaCapacidad";
function GraficaClusters({
    clusters = {},
    totalInstancias = 0,
    procesadas = 0,
    ultimoCluster = null,
}) {
    const formatearNombreCluster = (nombre) => {
        if (typeof nombre !== "string") return String(nombre ?? "");

        const match = nombre.match(/^cluster_(\d+)$/i);
        if (match) {
            return `Cluster ${match[1]}`;
        }

        return nombre;
    };

    const data_grafica = Object.fromEntries(
        Object.entries(clusters).map(([nombre, datos]) => [
            nombre, datos.total
        ])
    )
    const nombresClusters = Object.keys(data_grafica);
    const valoresClusters = Object.values(data_grafica);



    const colores = [
        "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
        "#14B8A6", "#EC4899", "#6366F1", "#F97316", "#84CC16",
        "#06B6D4", "#A855F7", "#F43F5E", "#22C55E", "#EAB308",
        "#0EA5E9", "#D946EF", "#FB923C", "#4ADE80", "#FACC15",
    ];
    const indexUltimo = nombresClusters.indexOf(`cluster_${ultimoCluster}`)
    const colorUltimo = indexUltimo >= 0 ? colores[indexUltimo % colores.length] : "#818CF8"

    const option = {
        animationDuration: 800,

        tooltip: {
            trigger: "item",
            backgroundColor: "#111827",
            borderRadius: 10,
            textStyle: {
                color: "#fff",
            },
            formatter: (params) => {
                const cluster = formatearNombreCluster(params.name);
                const valor = params.value;
                const porcentaje = totalInstancias
                    ? ((valor / totalInstancias) * 100).toFixed(2)
                    : 0;

                return `
                    <div style="padding:6px">
                        <strong>${cluster}</strong><br/>
                        Instances: ${valor}<br/>
                        % of dataset: ${porcentaje}%
                    </div>
                `;
            },
        },

        xAxis: {
            type: "category",
            data: nombresClusters,
            name: "Clusters",
            nameLocation: "middle",
            nameGap: 40,
            nameTruncate: {
                maxWidth: 120,
                ellipsis: "",
            },
            nameTextStyle: {
                color: "#6B7280",
                fontSize: 12,
                fontWeight: 600,
                align: "center",
            },
            axisLabel: {
                interval: 0,
                hideOverlap: false,
                width: 90,
                overflow: "break",
                lineHeight: 14,
                formatter: (value) => formatearNombreCluster(value).replace(" ", "\n"),
            },
        },
        yAxis: {
            type: "value",
            name: "Instances",
        },
        series: [
            {
                type: "bar",
                data: valoresClusters.map((v, i) => ({
                    value: v,
                    name: nombresClusters[i],
                    itemStyle: {
                        color: colores[i % colores.length],
                        borderRadius: [6, 6, 0, 0],
                    },
                })),
                barWidth: "55%",
            },
        ],
        grid: {
            left: "6%",
            right: "6%",
            bottom: "22%",
            containLabel: true,
        },
    };

    const progreso = totalInstancias
        ? Math.round((procesadas / totalInstancias) * 100)
        : 0;
    const [abierta, setAbierta] = useState(true);
    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow relative mt-4">

            {/* HEADER (igual al otro panel) */}
            <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setAbierta((prev) => !prev)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors"
                        title={abierta ? 'Close panel' : 'Open panel'}
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

                    Clustering Panel
                </span>
            </div>

            {/* CONTENIDO */}
            <div
                className={`
                    transition-all duration-500 ease-in-out overflow-hidden
                    ${abierta ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="flex flex-col gap-6 p-5 xl:flex-row">

                    {/* GRAFICA */}
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">
                            Cluster Distribution
                        </h3>

                        <div className="min-w-0 overflow-hidden">
                            <ReactECharts option={option} style={{ height: 360, width: "100%" }} />
                        </div>
                    </div>

                    {/* PANEL INFO */}
                    <div className="w-full shrink-0 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-inner xl:w-72">
                        <h4 className="font-semibold text-gray-700 mb-4">
                            Clustering Status
                        </h4>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">
                                Processed instances
                            </p>

                            <div className="text-xl font-bold text-gray-800">
                                {procesadas} / {totalInstancias}
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                                <div
                                    className="h-2 bg-indigo-400 transition-all duration-700"
                                    style={{ width: `${progreso}%` }}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Last assigned cluster
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colorUltimo }}></div>
                                <span className="font-semibold text-gray-800">
                                    {ultimoCluster ?? "None"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Active clusters</p>
                            <div className="text-lg font-semibold text-gray-800">
                                {nombresClusters.length}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <TablaCapacidadClusters
                        clusters={clusters}
                    />
                </div>
            </div>

        </div>
    );
}

export default GraficaClusters;

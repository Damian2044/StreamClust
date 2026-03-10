import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const SECTION_TITLE_CLASS = "mb-2 text-sm font-semibold text-slate-600";
const CHIP_BASE_CLASS = "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold leading-none tracking-[0.01em] shadow-sm";
const SELECT_BASE_CLASS = "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const COMPACT_SELECT_CLASS = `${SELECT_BASE_CLASS} w-full sm:w-[12rem]`;

function VariablesPanel({
    columnasNumericas = [],
    columnasEtiquetas = [],
    onChange,
    soloUnaFeature = false,
    seleccionarTodasLasFeaturesInicialmente = false
}) {
    const obtenerFeaturesIniciales = () => {
        if (soloUnaFeature) {
            return columnasNumericas.slice(0, 1);
        }

        if (seleccionarTodasLasFeaturesInicialmente) {
            return [...columnasNumericas];
        }

        return columnasNumericas.slice(0, 2);
    };

    const [abierta, setAbierta] = useState(true);
    const [features, setFeatures] = useState(() => obtenerFeaturesIniciales());
    const [target, setTarget] = useState("");
    const [featurePendiente, setFeaturePendiente] = useState("");
    const featuresDisponibles = columnasNumericas.filter((c) => !features.includes(c) && c !== target);
    const targetsDisponibles = columnasEtiquetas.filter((col) => !features.includes(col));

    useEffect(() => {
        if (columnasNumericas.length === 0) {
            setFeatures([]);
            setTarget("");
            setFeaturePendiente("");
        } else if (features.length === 0 && columnasNumericas.length >= 1) {
            const iniciales = obtenerFeaturesIniciales();
            setFeatures(iniciales);
            onChange?.({ features: iniciales, target });
        }
    }, [columnasNumericas, features.length, onChange, seleccionarTodasLasFeaturesInicialmente, soloUnaFeature, target]);

    useEffect(() => {
        if (target && !columnasEtiquetas.includes(target)) {
            setTarget("");
            onChange?.({ features, target: "" });
        }
    }, [columnasEtiquetas, features, onChange, target]);

    const agregarFeature = (col) => {
        if (!col || features.includes(col)) {
            return;
        }

        const nuevas = soloUnaFeature ? [col] : [...features, col];
        setFeatures(nuevas);
        setFeaturePendiente("");
        onChange?.({ features: nuevas, target });
    };

    const quitarFeature = (col) => {
        const nuevas = features.filter((f) => f !== col);
        setFeatures(nuevas);
        onChange?.({ features: nuevas, target });
    };

    const seleccionarTarget = (col) => {
        const nuevas = features.filter((f) => f !== col);
        setTarget(col);
        setFeatures(nuevas);
        onChange?.({ features: nuevas, target: col });
    };

    const limpiarTarget = () => {
        setTarget("");
        onChange?.({ features, target: "" });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow relative">
            {/* Header (igual que tu componente) */}
            <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-20">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                    Variables
                </span>
            </div>

            <div
                className={`
                    transition-all duration-500 ease-in-out overflow-hidden
                    ${abierta ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="px-5 py-4 space-y-4 bg-gray-50">
                    {/* FEATURES */}
                    <div>
                        <p className={SECTION_TITLE_CLASS}>
                            Features (X variables):
                        </p>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex min-h-[3.25rem] flex-wrap items-center gap-2">
                            {features.map((col) => (
                                <span
                                    key={col}
                                    className={`${CHIP_BASE_CLASS} border-rose-200 bg-rose-50 text-rose-700`}
                                >
                                    {col}
                                    <button
                                        type="button"
                                        onClick={() => quitarFeature(col)}
                                        className="rounded-full transition-colors hover:text-rose-500"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}

                            {features.length === 0 && (
                                <span className="text-[13px] font-medium text-slate-400">
                                    No features selected yet.
                                </span>
                            )}
                            </div>

                            <div className="mt-3 border-t border-slate-100 pt-3">
                                <select
                                    value={featurePendiente}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setFeaturePendiente(valor);
                                        agregarFeature(valor);
                                    }}
                                    className={COMPACT_SELECT_CLASS}
                                    disabled={featuresDisponibles.length === 0}
                                >
                                    <option value="">Add</option>
                                    {featuresDisponibles.map((col) => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TARGET */}
                    <div>
                        <p className={SECTION_TITLE_CLASS}>
                            Target (Ground Truth Label - Optional):
                        </p>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex min-h-[3.25rem] flex-wrap items-center gap-2">
                                {target ? (
                                    <span className={`${CHIP_BASE_CLASS} border-sky-200 bg-sky-50 text-sky-700`}>
                                        {target}
                                        <button
                                            type="button"
                                            onClick={limpiarTarget}
                                            className="rounded-full transition-colors hover:text-sky-500"
                                        >
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ) : (
                                    <span className="text-[13px] font-medium text-slate-400">
                                        No target selected.
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 border-t border-slate-100 pt-3">
                                    <select
                                        value={target}
                                        onChange={(e) => seleccionarTarget(e.target.value)}
                                        className={COMPACT_SELECT_CLASS}
                                    >
                                        <option value="">(None)</option>
                                        {targetsDisponibles.map((col) => <option key={col} value={col}>{col}</option>)}
                                    </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VariablesPanel;

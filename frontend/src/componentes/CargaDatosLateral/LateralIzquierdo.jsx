import React from "react";
import CargaImagenes from "./CargaImagenes";
import CargaDatos from "./CargaDatos";
import CargaTexto from "./CargaTexto";

function LateralIzquierdo({
  lotes,
  onProcesarLote,
  onEliminarLote,
  onActualizarEtiqueta,
  onSeleccionCarpeta,
  onSeleccionMultiple,
  pestañaActiva,
  delimitador,
  setDelimitador,
  setEncabezado,
  encabezado
}) {

  const renderCargaArchivos = () => {
    switch (pestañaActiva) {
      case "imagen":
        return (
          <CargaImagenes
            onSeleccionCarpeta={onSeleccionCarpeta}
            onSeleccionMultiple={onSeleccionMultiple}
            lotesImagenes={lotes}
            onProcesarLote={onProcesarLote}
            onEliminarLote={onEliminarLote}
            onActualizarEtiqueta={onActualizarEtiqueta}
          />
        );

      case "datasets":
        return (
          <CargaDatos
            delimitador={delimitador}
            setDelimitador={setDelimitador}
            onSeleccionMultiple={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              onSeleccionMultiple({
                file,
                autoProcesar: true,
                tipo: "dataset"
              });
            }}
            lotesDatos={lotes}
            onProcesarLote={onProcesarLote}
            onEliminarLote={onEliminarLote}
            tieneEncabezado={encabezado}
            setTieneEncabezado={setEncabezado}
          />
        );

      case "texto":
        return (
          <CargaTexto
            delimitador={delimitador}
            setDelimitador={setDelimitador}
            onSeleccionMultiple={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              onSeleccionMultiple({
                file,
                autoProcesar: true,
                tipo: "dataset"
              });
            }}
            lotesDatos={lotes}
            onProcesarLote={onProcesarLote}
            onEliminarLote={onEliminarLote}
            tieneEncabezado={encabezado}
            setTieneEncabezado={setEncabezado}
          />
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-80 border-r border-gray-200 flex flex-col shrink-0 z-20">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
          {pestañaActiva === "imagen" && "Image Upload"}
          {pestañaActiva === "datasets" && "Structured Data Upload"}
          {pestañaActiva === "texto" && "Document Upload"}
        </h3>
        <span className="text-xs text-gray-500 ml-3.5">
          {lotes.length} pending
        </span>
      </div>

      {/* CARGA DE ARCHIVOS */}
      {renderCargaArchivos()}
    </aside>
  );
}

export default LateralIzquierdo;

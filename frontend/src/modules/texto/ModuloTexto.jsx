import TablaDataset from "../../componentes/DatesetVisualizacion";
import VisualizacionClustering from "../../componentes/VisualizacionClustering";
import PanelEventosClustering from "../../componentes/PanelEventosClustering";
import TablaInstanciasClusters from "../../componentes/PanelClusterTabla";
import VariablesPanel from "../../componentes/SelectorVariables";
import GraficaClusters from "../../componentes/GraficaBarrasClusters";
import { obtenerColumnasTargetValidas } from "../../lib/tiposColumnas";

function ModuloTexto({
    titulo_Galeria,
    processedImages,
    datosDataset,
    columnasDataset,
    limpiarData,
    idsEnClustering,
    proyeccionPCA,
    clusterParams,
    eventosClustering,
    asignacionesClusters,
    tiemposClustering,
    setVariablesSeleccionadas,
    datosProcesados,
    variablesSeleccionadas,
    variablesPanelVersion
}) {
    const columnasTexto = columnasDataset.filter((col, i) =>
        datosDataset.some(fila => {
            const v = fila[i];
            return typeof v !== "number" || isNaN(v);
        })
    );
    const columnasTarget = obtenerColumnasTargetValidas(columnasDataset, datosDataset);
    const ultimo_evento = Object.values(eventosClustering).at(-1)
    const distribucion = ultimo_evento?.distribucion
    const clusters = Object.fromEntries(
        Object.entries(distribucion ?? {}).map(([nombre, datos]) => [
            nombre, { total: datos.total_puntos, capacidad: datos.capacidad_maxima }
        ])
    )
    const ultimo_cluster = Object.values(asignacionesClusters).at(-1)
    return (
        <>
            <div className="flex w-full flex-col gap-4 xl:flex-row">
                <div className="min-w-0 flex-1">
                    <TablaDataset
                        titulo={titulo_Galeria}
                        datos={datosDataset}
                        columnas={columnasDataset}
                        onLimpiarTodo={() => limpiarData()}
                    />
                </div>

                <div className="w-full xl:w-80 xl:shrink-0">
                    <VariablesPanel
                        columnasNumericas={columnasTexto}
                        columnasEtiquetas={columnasTarget}
                        onChange={setVariablesSeleccionadas}
                        resetVersion={variablesPanelVersion}
                        soloUnaFeature={true} />
                </div>
            </div>
            <GraficaClusters clusters={clusters}
                totalInstancias={datosProcesados.length}
                procesadas={eventosClustering.length}
                ultimoCluster={ultimo_cluster}
            />

            <VisualizacionClustering
                proyeccionPCA={proyeccionPCA}
                cantidadClusters={clusterParams.k}
            />

            <PanelEventosClustering eventos={eventosClustering} />

            <TablaInstanciasClusters
                imagenesProcesadas={datosProcesados}
                asignacionesClusters={asignacionesClusters}
                cantidadClusters={clusterParams.k}
                featuresSeleccionadas={variablesSeleccionadas.features}
            />
        </>
    );
}

export default ModuloTexto;

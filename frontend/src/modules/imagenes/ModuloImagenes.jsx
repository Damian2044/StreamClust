import GaleriaImagenes from "../../componentes/GaleriaImagenes"
import VisualizacionClustering from "../../componentes/VisualizacionClustering";
import PanelEventosClustering from "../../componentes/PanelEventosClustering";
import GraficaClusters from "../../componentes/GraficaBarrasClusters";
import PanelClustersImagenes from "../../componentes/PanelClustersImagenes"

function ModuloImagenes({
    titulo_Galeria,
    processedImages,
    idsEnClustering,
    selectedImageIds,
    handleImageClick,
    handleBackgroundClick,
    setProcessedImages,
    proyeccionPCA,
    clusterParams,
    eventosClustering,
    asignacionesClusters,
    tiemposClustering,
}) {
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
            <GaleriaImagenes
                titulo={titulo_Galeria}
                imagenesProcesadas={processedImages.filter(
                    (img) => !idsEnClustering[img.id]
                )}
                idsSeleccionados={selectedImageIds}
                onClickImagen={handleImageClick}
                onClickFondo={handleBackgroundClick}
                onLimpiarTodo={() => setProcessedImages([])}
            />
            <GraficaClusters clusters={clusters}
                totalInstancias={processedImages.length}
                procesadas={eventosClustering.length}
                ultimoCluster={ultimo_cluster}
            />
            <VisualizacionClustering
                proyeccionPCA={proyeccionPCA}
                cantidadClusters={clusterParams.k}
            />

            <PanelEventosClustering eventos={eventosClustering} />

            <PanelClustersImagenes
                imagenesProcesadas={processedImages}
                asignacionesClusters={asignacionesClusters}
                tiemposClustering={tiemposClustering}
                cantidadClusters={clusterParams.k}
            />
        </>
    );
}

export default ModuloImagenes;
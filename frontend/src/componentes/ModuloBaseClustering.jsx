import GaleriaImagenes from "./GaleriaImagenes";
import VisualizacionClustering from "./VisualizacionClustering";
import PanelEventosClustering from "./PanelEventosClustering";
import PanelClustersImagenes from "./PanelClustersImagenes";

function ModuloBaseClustering({
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

export default ModuloBaseClustering;
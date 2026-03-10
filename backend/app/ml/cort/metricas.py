from __future__ import annotations

from typing import Dict, Optional

import numpy as np
from sklearn.metrics import (
    adjusted_mutual_info_score,
    adjusted_rand_score,
    mutual_info_score,
    normalized_mutual_info_score,
    silhouette_score,
)
from sklearn.metrics.cluster._supervised import (
    expected_mutual_information,
)


class Metricas:
    """Calcula metricas internas/externas y distribucion de clusters."""

    def __init__(
        self,
        num_clusters: int,
        metricas_aproximadas: bool = True,
        guardar_puntos: bool = False,
    ) -> None:
        self.num_clusters = int(num_clusters)
        if self.num_clusters <= 0:
            raise ValueError("num_clusters must be greater than 0.")

        self.metricas_aproximadas = bool(metricas_aproximadas)
        self.guardar_puntos = (not self.metricas_aproximadas) or bool(guardar_puntos)

        # Estadisticos online por cluster con Welford (sin guardar puntos).
        self.conteos_por_cluster = np.zeros(self.num_clusters, dtype=int)
        self.medias_por_cluster: Optional[np.ndarray] = None
        self.sumas_desviaciones_cuadradas_por_cluster: Optional[np.ndarray] = None
        self.dimension_vector: Optional[int] = None
        self.radios_maximos_por_cluster = np.zeros(self.num_clusters, dtype=float)
        self._indice_por_etiqueta_real: dict[object, int] = {}
        self._contingencia_externa = np.zeros((0, self.num_clusters), dtype=np.int64)
        self._sumas_por_etiqueta_real = np.zeros(0, dtype=np.int64)
        self._sumas_por_cluster_asignado = np.zeros(self.num_clusters, dtype=np.int64)
        self._muestras_validas_externas = 0
        self._sumatoria_combinaciones_celdas = 0
        self._sumatoria_combinaciones_reales = 0
        self._sumatoria_combinaciones_clusters = 0

        self.etiquetas_por_cluster = np.empty(self.num_clusters, dtype=object)
        self.puntos_por_cluster = np.empty(self.num_clusters, dtype=object)
        for indice_cluster in range(self.num_clusters):
            self.etiquetas_por_cluster[indice_cluster] = {}
            self.puntos_por_cluster[indice_cluster] = []

    @staticmethod
    def _incremento_combinaciones_2(valor_actual: int) -> int:
        """Delta de C(n, 2) al pasar de n a n + 1."""
        return int(max(valor_actual, 0))

    def _asegurar_etiqueta_real(self, etiqueta_real: object) -> int:
        indice = self._indice_por_etiqueta_real.get(etiqueta_real)
        if indice is not None:
            return int(indice)

        indice_nuevo = int(self._contingencia_externa.shape[0])
        self._indice_por_etiqueta_real[etiqueta_real] = indice_nuevo
        self._contingencia_externa = np.vstack(
            (
                self._contingencia_externa,
                np.zeros((1, self.num_clusters), dtype=np.int64),
            )
        )
        self._sumas_por_etiqueta_real = np.append(
            self._sumas_por_etiqueta_real,
            np.array([0], dtype=np.int64),
        )
        return indice_nuevo

    def _registrar_metricas_externas(self, indice_cluster: int, etiqueta_real: object) -> None:
        """
        Actualiza el estado incremental de ARI/AMI/NMI.

        Solo cuenta muestras con:
        - etiqueta real conocida (etiqueta_real != None)
        - cluster valido (0 <= indice_cluster < num_clusters)

        Esto mantiene la misma semantica que la ruta exacta basada en sklearn:
        muestras sin etiqueta real o con cluster -1 no participan en metricas externas.
        """
        if etiqueta_real is None or indice_cluster < 0 or indice_cluster >= self.num_clusters:
            return

        indice_etiqueta_real = self._asegurar_etiqueta_real(etiqueta_real)
        conteo_celda = int(self._contingencia_externa[indice_etiqueta_real, indice_cluster])
        suma_real = int(self._sumas_por_etiqueta_real[indice_etiqueta_real])
        suma_cluster = int(self._sumas_por_cluster_asignado[indice_cluster])

        self._sumatoria_combinaciones_celdas += self._incremento_combinaciones_2(conteo_celda)
        self._sumatoria_combinaciones_reales += self._incremento_combinaciones_2(suma_real)
        self._sumatoria_combinaciones_clusters += self._incremento_combinaciones_2(suma_cluster)

        self._contingencia_externa[indice_etiqueta_real, indice_cluster] = conteo_celda + 1
        self._sumas_por_etiqueta_real[indice_etiqueta_real] = suma_real + 1
        self._sumas_por_cluster_asignado[indice_cluster] = suma_cluster + 1
        self._muestras_validas_externas += 1

    @staticmethod
    def _entropia_desde_conteos(conteos: np.ndarray) -> float:
        conteos_np = np.asarray(conteos, dtype=float).reshape(-1)
        conteos_np = conteos_np[conteos_np > 0.0]
        if conteos_np.size == 0:
            return 0.0
        if conteos_np.size == 1:
            return 0.0

        total = float(np.sum(conteos_np))
        probabilidades = conteos_np / total
        return float(-np.sum(probabilidades * np.log(probabilidades)))

    @staticmethod
    def _promedio_generalizado(valor_a: float, valor_b: float, metodo: str = "arithmetic") -> float:
        if metodo == "min":
            return float(min(valor_a, valor_b))
        if metodo == "geometric":
            return float(np.sqrt(max(valor_a, 0.0) * max(valor_b, 0.0)))
        if metodo == "arithmetic":
            return float(np.mean([valor_a, valor_b]))
        if metodo == "max":
            return float(max(valor_a, valor_b))
        raise ValueError(
            "'metodo' must be 'min', 'geometric', 'arithmetic', or 'max'."
        )

    def _mutual_information_contingencia(self) -> float:
        """
        Calcula MI desde la matriz de contingencia incremental.

        Aqui usamos la API publica de sklearn (`mutual_info_score`) y evitamos
        reconstruir arrays completos de etiquetas en cada punto.
        """
        if self._muestras_validas_externas <= 0 or self._contingencia_externa.size == 0:
            return 0.0
        return float(
            mutual_info_score(
                labels_true=None,
                labels_pred=None,
                contingency=self._contingencia_externa,
            )
        )

    def _adjusted_rand_index_incremental(self) -> float:
        """ARI exacto derivado incrementalmente desde la contingencia acumulada."""
        n_muestras = int(self._muestras_validas_externas)
        if n_muestras < 2:
            return 0.0

        total_pares = float((n_muestras * (n_muestras - 1)) / 2.0)
        if total_pares <= 0.0:
            return 0.0

        indice_esperado = (
            float(self._sumatoria_combinaciones_reales)
            * float(self._sumatoria_combinaciones_clusters)
            / total_pares
        )
        indice_maximo = 0.5 * (
            float(self._sumatoria_combinaciones_reales)
            + float(self._sumatoria_combinaciones_clusters)
        )
        denominador = indice_maximo - indice_esperado
        if abs(denominador) <= np.finfo("float64").eps:
            return 1.0

        numerador = float(self._sumatoria_combinaciones_celdas) - indice_esperado
        return float(numerador / denominador)

    def _normalized_mutual_information_incremental(self) -> float:
        """NMI calculado desde conteos agregados, sin reconstruir el historial completo."""
        n_muestras = int(self._muestras_validas_externas)
        if n_muestras < 2:
            return 0.0

        clases_activas = int(np.count_nonzero(self._sumas_por_etiqueta_real))
        clusters_activos = int(np.count_nonzero(self._sumas_por_cluster_asignado))
        if (clases_activas == clusters_activos == 1) or (clases_activas == clusters_activos == 0):
            return 1.0

        mi = self._mutual_information_contingencia()
        if mi == 0.0:
            return 0.0

        entropia_reales = self._entropia_desde_conteos(self._sumas_por_etiqueta_real)
        entropia_clusters = self._entropia_desde_conteos(self._sumas_por_cluster_asignado)
        normalizador = self._promedio_generalizado(
            entropia_reales,
            entropia_clusters,
            "arithmetic",
        )
        if normalizador <= 0.0:
            return 0.0
        return float(mi / normalizador)

    def _adjusted_mutual_information_incremental(self) -> float:
        """
        AMI calculado desde la contingencia incremental.

        Nota:
        - `expected_mutual_information` sigue viniendo de una API interna de sklearn
          porque sklearn no expone una alternativa publica para obtener EMI a partir
          de una contingencia ya agregada.
        - cuando la sesion pide metricas exactas, la ruta exacta usa directamente
          las funciones publicas de sklearn sobre los arrays completos.
        """
        n_muestras = int(self._muestras_validas_externas)
        if n_muestras < 2:
            return 0.0

        clases_activas = int(np.count_nonzero(self._sumas_por_etiqueta_real))
        clusters_activos = int(np.count_nonzero(self._sumas_por_cluster_asignado))
        if (clases_activas == clusters_activos == 1) or (clases_activas == clusters_activos == 0):
            return 1.0
        if clases_activas == 1 or clusters_activos == 1:
            return 0.0

        mi = self._mutual_information_contingencia()
        with np.errstate(divide="ignore", invalid="ignore"):
            emi = float(expected_mutual_information(self._contingencia_externa, n_muestras))
        entropia_reales = self._entropia_desde_conteos(self._sumas_por_etiqueta_real)
        entropia_clusters = self._entropia_desde_conteos(self._sumas_por_cluster_asignado)
        numerador = mi - emi
        normalizador = self._promedio_generalizado(
            entropia_reales,
            entropia_clusters,
            "arithmetic",
        )
        denominador = normalizador - emi
        eps = np.finfo(np.float64).eps
        if abs(denominador) <= eps:
            return 1.0 if abs(numerador) <= eps else 0.0

        return float(numerador / denominador)

    @staticmethod
    def _calcular_metricas_externas_exactas(
        etiquetas_reales: np.ndarray,
        etiquetas_asignadas: np.ndarray,
    ) -> Dict[str, float]:
        """
        Ruta exacta de metricas externas.

        Usa las funciones publicas de sklearn igual que hacemos con silueta exacta.
        Antes de calcular, excluye:
        - muestras sin etiqueta real
        - muestras con cluster asignado = -1
        """
        resultado = {"ari": 0.0, "ami": 0.0, "nmi": 0.0}
        if int(etiquetas_asignadas.size) < 2:
            return resultado

        mascara_reales = np.fromiter(
            (et is not None for et in etiquetas_reales),
            dtype=bool,
            count=int(etiquetas_reales.size),
        )
        mascara_validos = mascara_reales & (etiquetas_asignadas != -1)
        if int(np.count_nonzero(mascara_validos)) < 2:
            return resultado

        reales = etiquetas_reales[mascara_validos]
        asignadas = etiquetas_asignadas[mascara_validos]
        try:
            resultado["ari"] = float(adjusted_rand_score(reales, asignadas))
            resultado["ami"] = float(adjusted_mutual_info_score(reales, asignadas))
            resultado["nmi"] = float(normalized_mutual_info_score(reales, asignadas))
        except Exception:
            pass
        return resultado

    def _registrar_etiqueta(self, indice_cluster: int, etiqueta_real: object) -> None:
        """Incrementa conteo de etiqueta real por cluster."""
        clave = "sin_etiqueta" if etiqueta_real is None else etiqueta_real
        conteos = self.etiquetas_por_cluster[indice_cluster]
        conteos[clave] = int(conteos.get(clave, 0)) + 1

    def _asegurar_estructura_online(self, punto: np.ndarray) -> None:
        """Inicializa estructuras online en la primera observacion."""
        dimension = int(np.asarray(punto, dtype=float).reshape(-1).shape[0])
        if self.medias_por_cluster is None or self.sumas_desviaciones_cuadradas_por_cluster is None:
            self.dimension_vector = dimension
            self.medias_por_cluster = np.zeros((self.num_clusters, dimension), dtype=float)
            self.sumas_desviaciones_cuadradas_por_cluster = np.zeros((self.num_clusters, dimension), dtype=float)
            return
        if int(self.dimension_vector or -1) != dimension:
            raise ValueError(
                f"Inconsistent dimension in metrics: {dimension} != {self.dimension_vector}."
            )

    def _actualizar_estadisticos_cluster(self, indice_cluster: int, punto: np.ndarray) -> None:
        """Actualiza media y dispersion por cluster usando Welford vectorial."""
        punto_np = np.asarray(punto, dtype=float).reshape(-1)
        self._asegurar_estructura_online(punto_np)

        if self.medias_por_cluster is None or self.sumas_desviaciones_cuadradas_por_cluster is None:
            return

        conteo_anterior = int(self.conteos_por_cluster[indice_cluster])
        conteo_nuevo = conteo_anterior + 1
        self.conteos_por_cluster[indice_cluster] = conteo_nuevo

        media_anterior = self.medias_por_cluster[indice_cluster]
        delta = punto_np - media_anterior
        media_nueva = media_anterior + (delta / float(conteo_nuevo))
        delta2 = punto_np - media_nueva

        self.sumas_desviaciones_cuadradas_por_cluster[indice_cluster] += (delta * delta2)
        self.medias_por_cluster[indice_cluster] = media_nueva

    def _media_cluster(self, indice_cluster: int) -> Optional[np.ndarray]:
        """Media actual del cluster."""
        total = int(self.conteos_por_cluster[indice_cluster])
        if total <= 0 or self.medias_por_cluster is None:
            return None
        return self.medias_por_cluster[indice_cluster].copy()

    def _varianza_total_cluster(self, indice_cluster: int) -> float:
        """
        Varianza total del cluster (suma de varianzas por dimension).
        Se calcula online con Welford, sin guardar puntos.
        """
        total = int(self.conteos_por_cluster[indice_cluster])
        if total <= 1:
            return 0.0

        if self.sumas_desviaciones_cuadradas_por_cluster is None:
            return 0.0

        suma_desv2 = float(np.sum(self.sumas_desviaciones_cuadradas_por_cluster[indice_cluster]))
        suma_desv2 = max(suma_desv2, 0.0)
        return float(suma_desv2 / float(total - 1))

    def registrar_resultado(
        self,
        punto: np.ndarray,
        etiqueta_asignada: int,
        etiqueta_real: object,
        num_activos: int,
        distancia_centroide_referencia: Optional[float] = None,
    ) -> None:
        """Registra resultado para metricas internas sin duplicar estado de etiquetas globales."""
        indice_cluster = int(etiqueta_asignada)
        if indice_cluster < 0 or indice_cluster >= int(num_activos):
            return

        punto_np = np.asarray(punto, dtype=float)
        if self.guardar_puntos:
            self.puntos_por_cluster[indice_cluster].append(punto_np.copy())
        self._registrar_etiqueta(indice_cluster, etiqueta_real)
        self._actualizar_estadisticos_cluster(indice_cluster, punto_np)
        self._registrar_metricas_externas(indice_cluster, etiqueta_real)
        if distancia_centroide_referencia is not None and np.isfinite(distancia_centroide_referencia):
            self.radios_maximos_por_cluster[indice_cluster] = max(
                float(self.radios_maximos_por_cluster[indice_cluster]),
                float(max(distancia_centroide_referencia, 0.0)),
            )

    def _silueta_aproximada(self, num_activos: int, tamanios_actuales: np.ndarray) -> float:
        """
        Silueta aproximada sin guardar puntos.

        Aproxima cada cluster por media y varianza total:
        - a_c ~= sqrt(2 * var_total_c)
        - b_cj ~= sqrt(||mu_c - mu_j||^2 + var_total_c + var_total_j)
        """
        if num_activos < 2 or float(np.sum(tamanios_actuales[:num_activos])) < 3.0:
            return 0.0

        if self.medias_por_cluster is None:
            return 0.0

        clusters_activos = [
            indice
            for indice in range(num_activos)
            if float(tamanios_actuales[indice]) > 0.0 and int(self.conteos_por_cluster[indice]) > 0
        ]
        if len(clusters_activos) < 2:
            return 0.0

        medias_por_cluster = {indice: self._media_cluster(indice) for indice in clusters_activos}
        varianzas_totales_por_cluster = {
            indice: self._varianza_total_cluster(indice) for indice in clusters_activos
        }

        acumulado = 0.0
        conteo_total = 0.0
        for indice_cluster in clusters_activos:
            total_cluster = float(tamanios_actuales[indice_cluster])
            if total_cluster <= 0.0:
                continue

            media_cluster = medias_por_cluster.get(indice_cluster)
            if media_cluster is None:
                continue

            var_total_cluster = float(max(varianzas_totales_por_cluster.get(indice_cluster, 0.0), 0.0))
            distancia_intra_aprox = float(np.sqrt(max(2.0 * var_total_cluster, 0.0)))

            distancia_inter_min_aprox = np.inf
            for indice_otro in clusters_activos:
                if indice_otro == indice_cluster:
                    continue
                media_otro = medias_por_cluster.get(indice_otro)
                if media_otro is None:
                    continue
                var_total_otro = float(max(varianzas_totales_por_cluster.get(indice_otro, 0.0), 0.0))
                dist2 = float(np.dot(media_cluster - media_otro, media_cluster - media_otro))
                distancia_esperada = float(np.sqrt(max(dist2 + var_total_cluster + var_total_otro, 0.0)))
                distancia_inter_min_aprox = min(distancia_inter_min_aprox, distancia_esperada)

            if not np.isfinite(distancia_inter_min_aprox) or distancia_inter_min_aprox < 0.0:
                continue

            denom = max(distancia_intra_aprox, distancia_inter_min_aprox)
            if denom > 0.0:
                acumulado += (
                    (distancia_inter_min_aprox - distancia_intra_aprox) / denom
                ) * total_cluster
                conteo_total += total_cluster

        return float(acumulado / conteo_total) if conteo_total > 0.0 else 0.0

    def _dunn_aproximado(
        self,
        centroides_activos: np.ndarray,
        num_activos: int,
        tamanios_actuales: np.ndarray,
    ) -> float:
        """
        Dunn aproximado sin guardar puntos.

        Proxy online simple:
        - separacion ~= minima distancia entre centroides activos
        - diametro ~= 2 * radio_maximo_observado del cluster
        """
        if num_activos < 2:
            return 0.0

        clusters_activos = [
            indice
            for indice in range(num_activos)
            if float(tamanios_actuales[indice]) > 0.0 and int(self.conteos_por_cluster[indice]) > 0
        ]
        if len(clusters_activos) < 2:
            return 0.0

        separacion_minima = np.inf
        for posicion_a, indice_a in enumerate(clusters_activos):
            for indice_b in clusters_activos[posicion_a + 1 :]:
                separacion_minima = min(
                    separacion_minima,
                    float(
                        np.linalg.norm(
                            np.asarray(centroides_activos[indice_a], dtype=float)
                            - np.asarray(centroides_activos[indice_b], dtype=float)
                        )
                    ),
                )

        if not np.isfinite(separacion_minima):
            return 0.0

        diametro_maximo = float(
            2.0 * max(
                (float(self.radios_maximos_por_cluster[indice]) for indice in clusters_activos),
                default=0.0,
            )
        )

        if diametro_maximo > 0.0 and np.isfinite(separacion_minima):
            return float(separacion_minima / diametro_maximo)
        return 0.0

    def _silueta_exacta(self, num_activos: int) -> float:
        """Silueta exacta con puntos guardados."""
        puntos = []
        etiquetas = []
        for indice_cluster in range(num_activos):
            puntos_cluster = self.puntos_por_cluster[indice_cluster]
            for punto in puntos_cluster:
                puntos.append(punto)
                etiquetas.append(indice_cluster)

        if len(puntos) < 3 or len(np.unique(np.asarray(etiquetas, dtype=int))) < 2:
            return 0.0

        try:
            return float(silhouette_score(np.asarray(puntos, dtype=float), etiquetas))
        except Exception:
            return 0.0

    def _dunn_exacto(self, num_activos: int) -> float:
        """Indice Dunn exacto."""
        if num_activos < 2:
            return 0.0

        separacion_minima = np.inf
        for indice_a in range(num_activos):
            for indice_b in range(indice_a + 1, num_activos):
                for punto_a in self.puntos_por_cluster[indice_a]:
                    for punto_b in self.puntos_por_cluster[indice_b]:
                        separacion_minima = min(
                            separacion_minima,
                            float(np.linalg.norm(punto_a - punto_b)),
                        )

        diametro_maximo = 0.0
        for indice_cluster in range(num_activos):
            puntos = self.puntos_por_cluster[indice_cluster]
            for indice_a in range(len(puntos)):
                for indice_b in range(indice_a + 1, len(puntos)):
                    diametro_maximo = max(
                        diametro_maximo,
                        float(np.linalg.norm(puntos[indice_a] - puntos[indice_b])),
                    )

        if diametro_maximo > 0.0 and np.isfinite(separacion_minima):
            return float(separacion_minima / diametro_maximo)
        return 0.0

    def calcular_metricas_internas(
        self,
        centroides_activos: np.ndarray,
        tamanios_actuales: np.ndarray,
        total_asignaciones: int,
        usar_aproximadas: Optional[bool] = None,
    ) -> Dict[str, float]:
        """Calcula metricas internas actuales usando estado centralizado en el modelo."""
        resultado = {"silueta": 0.0, "dunn": 0.0}
        if int(total_asignaciones) < 2:
            return resultado

        num_activos = int(centroides_activos.shape[0])
        if num_activos < 1:
            return resultado

        tamanios_np = np.asarray(tamanios_actuales, dtype=float).reshape(-1)
        usar_aproximadas = self.metricas_aproximadas if usar_aproximadas is None else bool(usar_aproximadas)

        if usar_aproximadas or not self.guardar_puntos:
            resultado["silueta"] = self._silueta_aproximada(num_activos, tamanios_np)
            resultado["dunn"] = self._dunn_aproximado(centroides_activos, num_activos, tamanios_np)
            return resultado

        resultado["silueta"] = self._silueta_exacta(num_activos)
        resultado["dunn"] = self._dunn_exacto(num_activos)
        return resultado

    def calcular_metricas_externas(
        self,
        etiquetas_reales: Optional[np.ndarray] = None,
        etiquetas_asignadas: Optional[np.ndarray] = None,
        usar_exactas: Optional[bool] = None,
    ) -> Dict[str, float]:
        """
        Calcula ARI/AMI/NMI por una de dos rutas:

        - exacta: usa sklearn sobre arrays completos
        - incremental: usa la contingencia acumulada para evitar recalculo total
        """
        usar_exactas = (not self.metricas_aproximadas) if usar_exactas is None else bool(usar_exactas)
        if usar_exactas:
            if etiquetas_reales is None or etiquetas_asignadas is None:
                return {"ari": 0.0, "ami": 0.0, "nmi": 0.0}
            return self._calcular_metricas_externas_exactas(
                etiquetas_reales=np.asarray(etiquetas_reales, dtype=object),
                etiquetas_asignadas=np.asarray(etiquetas_asignadas, dtype=int),
            )

        resultado = {"ari": 0.0, "ami": 0.0, "nmi": 0.0}
        if int(self._muestras_validas_externas) < 2:
            return resultado

        try:
            resultado["ari"] = self._adjusted_rand_index_incremental()
            resultado["ami"] = self._adjusted_mutual_information_incremental()
            resultado["nmi"] = self._normalized_mutual_information_incremental()
        except Exception:
            pass
        return resultado

    def calcular_distribucion(
        self,
        num_activos: int,
        tamanios_actuales: np.ndarray,
        tamanios_maximos: np.ndarray,
    ) -> Dict[str, Dict[str, object]]:
        """Retorna distribucion actual por cluster activo."""
        distribucion: Dict[str, Dict[str, object]] = {}
        tamanios_actuales_np = np.asarray(tamanios_actuales, dtype=int).reshape(-1)
        tamanios_maximos_np = np.asarray(tamanios_maximos, dtype=int).reshape(-1)

        for indice_cluster in range(num_activos):
            capacidad = int(tamanios_maximos_np[indice_cluster])
            total = int(tamanios_actuales_np[indice_cluster])
            ocupacion = (float(total) / float(capacidad)) if capacidad > 0 else 0.0
            distribucion[f"cluster_{indice_cluster}"] = {
                "total_puntos": total,
                "capacidad_maxima": capacidad,
                "ocupacion": round(ocupacion, 4),
                "etiquetas_reales": dict(self.etiquetas_por_cluster[indice_cluster]),
            }
        return distribucion

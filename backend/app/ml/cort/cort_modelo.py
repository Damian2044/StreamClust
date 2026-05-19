from __future__ import annotations

from typing import Dict, Optional, Union

import numpy as np

from .cort import CORT
from .metricas import Metricas


class CORTModelo:
    """Wrapper de CORT con estado centralizado y metricas conectadas."""

    def __init__(
        self,
        k: int,
        cardinalidades: list | np.ndarray,
        *,
        metricas_aproximadas: bool = True,
        guardar_puntos: bool = False,
    ):
        """
        Inicializa el modelo.

        Parametros:
        - k: numero de clusters.
        - cardinalidades: capacidades maximas por cluster.
        - metricas_aproximadas: modo de calculo de metricas internas.
        - guardar_puntos: fuerza guardado de puntos para metricas exactas.
        """
        self.k = int(k)
        if self.k <= 1:
            raise ValueError("k must be greater than 1.")

        self.cardinalidades = self._normalizar_cardinalidades(cardinalidades, self.k)
        self.metricas_aproximadas = bool(metricas_aproximadas)
        self.guardar_puntos = (not self.metricas_aproximadas) or bool(guardar_puntos)

        self._modelo_cort = CORT(k=self.k, cardinalidades=self.cardinalidades.tolist())
        self._metricas = Metricas(
            num_clusters=self.k,
            metricas_aproximadas=self.metricas_aproximadas,
            guardar_puntos=self.guardar_puntos,
        )

        # Estado unico de etiquetas en el modelo.
        self._etiquetas_reales: list[object] = []
        self._etiquetas_asignadas: list[int] = []

    @property
    def etiqueta_error(self) -> int:
        """Etiqueta de error definida por CORT."""
        return int(self._modelo_cort._ETIQUETA_ERROR)

    @staticmethod
    def _normalizar_cardinalidades(cardinalidades: list | np.ndarray, k: int) -> np.ndarray:
        """
        Convierte cardinalidades a numpy 1D de longitud k y valores positivos.
        """
        card_np = np.asarray(cardinalidades, dtype=int).reshape(-1)
        if card_np.size != int(k):
            raise ValueError(f"cardinalidades must have length k={k}.")
        if np.any(card_np <= 0):
            raise ValueError("All cardinalidades values must be > 0.")
        return card_np.astype(int)

    @staticmethod
    def _normalizar_punto(nuevo_punto: Union[np.ndarray, list, tuple]) -> np.ndarray:
        """
        Convierte un punto a vector numpy 1D valido.
        """
        punto = np.asarray(nuevo_punto, dtype=float)
        if punto.ndim != 1:
            raise ValueError("The point must be a 1D vector.")
        if not np.all(np.isfinite(punto)):
            raise ValueError("The point contains non-finite values.")
        return punto

    def _respuesta_ok(self, mensaje: str, data: Dict[str, object]) -> dict:
        return {"success": True, "message": mensaje, "data": data}

    def _respuesta_error(self, mensaje: str, data: Dict[str, object]) -> dict:
        return {"success": False, "message": mensaje, "data": data}

    def _motivo_etiqueta_error(self) -> Dict[str, object]:
        """Determina causa probable de etiqueta de error devuelta por CORT."""
        k_fundados = int(self._modelo_cort.KFundados)
        fundados = getattr(self._modelo_cort, "fundados", None)
        if fundados is not None:
            cupo_activo = np.asarray(self._modelo_cort.cupoRestante[np.asarray(fundados, dtype=bool)], dtype=int)
        else:
            cupo_activo = np.asarray(self._modelo_cort.cupoRestante[:k_fundados], dtype=int)
        sin_espacio = bool(cupo_activo.size > 0 and np.all(cupo_activo <= 0))
        return {
            "motivo": "sin_espacio" if sin_espacio else "error_asignacion",
            "k_fundados": k_fundados,
            "cupo_activo": cupo_activo.copy(),
        }

    @property
    def centroides_activos(self) -> np.ndarray:
        """Centroides actualmente fundados."""
        k_fundados = int(self._modelo_cort.KFundados)
        if k_fundados <= 0:
            return np.empty((0, 0), dtype=float)
        fundados = getattr(self._modelo_cort, "fundados", None)
        if fundados is not None:
            centroides = np.asarray(self._modelo_cort.centroides, dtype=float)
            if centroides.ndim != 2 or centroides.shape[1] == 0:
                return np.empty((0, 0), dtype=float)
            return centroides.copy()
        return np.asarray(self._modelo_cort.centroides[:k_fundados], dtype=float).copy()

    @property
    def tamanios_actuales(self) -> np.ndarray:
        """Conteo actual por cluster."""
        return np.asarray(self._modelo_cort.conteo, dtype=int).copy()

    @property
    def etiquetas_asignadas(self) -> np.ndarray:
        return np.asarray(self._etiquetas_asignadas, dtype=int).copy()

    @property
    def etiquetas_reales(self) -> np.ndarray:
        return np.asarray(self._etiquetas_reales, dtype=object).copy()

    def _registrar_estado_etiquetas(self, etiqueta_real: object, etiqueta_asignada: int) -> None:
        """Registra etiquetas en el estado central del modelo."""
        self._etiquetas_reales.append(etiqueta_real)
        self._etiquetas_asignadas.append(int(etiqueta_asignada))

    def _calcular_metricas_internas(
        self,
        centroides_activos: np.ndarray,
        tamanios_actuales: np.ndarray,
        usar_aproximadas: Optional[bool] = None,
    ) -> Dict[str, float]:
        return self._metricas.calcular_metricas_internas(
            centroides_activos=centroides_activos,
            tamanios_actuales=tamanios_actuales,
            total_asignaciones=len(self._etiquetas_asignadas),
            usar_aproximadas=usar_aproximadas,
        )

    def _calcular_metricas_externas(self, usar_exactas: Optional[bool] = None) -> Dict[str, float]:
        etiquetas_reales = None
        etiquetas_asignadas = None
        if (not self.metricas_aproximadas) if usar_exactas is None else bool(usar_exactas):
            etiquetas_reales = np.asarray(self._etiquetas_reales, dtype=object)
            etiquetas_asignadas = np.asarray(self._etiquetas_asignadas, dtype=int)
        return self._metricas.calcular_metricas_externas(
            etiquetas_reales=etiquetas_reales,
            etiquetas_asignadas=etiquetas_asignadas,
            usar_exactas=usar_exactas,
        )

    def _calcular_distribucion(
        self,
        num_activos: int,
        tamanios_actuales: np.ndarray,
    ) -> Dict[str, Dict[str, object]]:
        return self._metricas.calcular_distribucion(
            num_activos=num_activos,
            tamanios_actuales=tamanios_actuales,
            tamanios_maximos=self.cardinalidades,
        )

    def _armar_data_respuesta(
        self,
        etiqueta_asignada: int,
        centroides_activos: np.ndarray,
        tamanios_actuales: np.ndarray,
    ) -> Dict[str, object]:
        """Construye payload estandar de salida."""
        num_activos = int(centroides_activos.shape[0])
        return {
            "etiqueta_asignada": int(etiqueta_asignada),
            "k_fundados": int(self._modelo_cort.KFundados),
            "tamanios_actuales": np.asarray(tamanios_actuales, dtype=int).copy(),
            "cardinalidades": self.cardinalidades.copy(),
            "metricas_internas": self._calcular_metricas_internas(
                centroides_activos=centroides_activos,
                tamanios_actuales=tamanios_actuales,
            ),
            "metricas_externas": self._calcular_metricas_externas(),
            "distribucion": self._calcular_distribucion(
                num_activos=num_activos,
                tamanios_actuales=tamanios_actuales,
            ),
        }

    def asignar_punto(
        self,
        nuevo_punto: Union[np.ndarray, list, tuple],
        etiqueta_real: Union[int, str, None] = None,
    ) -> dict:
        """
        Procesa un punto con CORT y retorna success/message/data.
        """
        try:
            punto = self._normalizar_punto(nuevo_punto)
            centroides_antes = self.centroides_activos
            if centroides_antes.size > 0 and punto.shape[0] != centroides_antes.shape[1]:
                return self._respuesta_error(
                    "Inconsistent dimension with the active centroids.",
                    {
                        "dimension_punto": int(punto.shape[0]),
                        "dimension_esperada": int(centroides_antes.shape[1]),
                        "k_fundados": int(self._modelo_cort.KFundados),
                    },
                )

            etiqueta_asignada = int(self._modelo_cort.procesarPunto(punto))
            self._registrar_estado_etiquetas(etiqueta_real=etiqueta_real, etiqueta_asignada=etiqueta_asignada)

            distancia_centroide_referencia: Optional[float] = None
            if 0 <= etiqueta_asignada < int(centroides_antes.shape[0]):
                distancia_centroide_referencia = float(
                    np.linalg.norm(punto - np.asarray(centroides_antes[etiqueta_asignada], dtype=float))
                )

            centroides_despues = self.centroides_activos
            self._metricas.registrar_resultado(
                punto=punto,
                etiqueta_asignada=etiqueta_asignada,
                etiqueta_real=etiqueta_real,
                num_activos=int(centroides_despues.shape[0]),
                distancia_centroide_referencia=distancia_centroide_referencia,
            )

            tamanios_actuales = self.tamanios_actuales
            data = self._armar_data_respuesta(
                etiqueta_asignada=etiqueta_asignada,
                centroides_activos=centroides_despues,
                tamanios_actuales=tamanios_actuales,
            )
            if etiqueta_asignada == self.etiqueta_error:
                data["diagnostico"] = self._motivo_etiqueta_error()
                return self._respuesta_error("Could not assign the point.", data)

            return self._respuesta_ok("Point assigned successfully.", data)
        except Exception as error:
            return self._respuesta_error(
                f"Unexpected error: {error}",
                {
                    "tipo_error": type(error).__name__,
                    "detalle_error": str(error),
                },
            )

    def actualizar_tamanios_maximos(self, cardinalidades_nuevas: list | np.ndarray) -> dict:
        """
        Actualiza cardinalidades maximas y sincroniza estado del wrapper.
        """
        try:
            nuevas = self._normalizar_cardinalidades(cardinalidades_nuevas, self.k)
            resultado = self._modelo_cort.actualizar_tamanios_maximos(nuevas.tolist())

            if bool(resultado.get("success", False)):
                self.cardinalidades = np.asarray(self._modelo_cort.cardinalidades, dtype=int).copy()
                return self._respuesta_ok(
                    "Maximum sizes updated successfully.",
                    {
                        "cardinalidades": self.cardinalidades.copy(),
                        "tamanios_actuales": self.tamanios_actuales.copy(),
                        "resultado_cort": resultado.get("data"),
                    },
                )

            return self._respuesta_error(
                str(resultado.get("message", "Could not update the sizes.")),
                {
                    "entrada_recibida": np.asarray(cardinalidades_nuevas, dtype=int).reshape(-1),
                    "detalle_cort": resultado.get("data"),
                },
            )
        except Exception as error:
            return self._respuesta_error(
                f"Unexpected error: {error}",
                {
                    "tipo_error": type(error).__name__,
                    "detalle_error": str(error),
                    "entrada_recibida": np.asarray(cardinalidades_nuevas, dtype=object).reshape(-1)
                    if cardinalidades_nuevas is not None
                    else None,
                },
            )

    def obtener_resumen_final(self, usar_aproximadas: bool = True) -> dict:
        """
        Retorna resumen final de metricas y estado.
        """
        try:
            centroides_activos = self.centroides_activos
            tamanios_actuales = self.tamanios_actuales
            return self._respuesta_ok(
                "Summary generated successfully.",
                {
                    "metricas_internas": self._calcular_metricas_internas(
                        centroides_activos=centroides_activos,
                        tamanios_actuales=tamanios_actuales,
                        usar_aproximadas=bool(usar_aproximadas)
                    ),
                    "metricas_externas": self._calcular_metricas_externas(
                        usar_exactas=not bool(usar_aproximadas)
                    ),
                    "distribucion": self._calcular_distribucion(
                        num_activos=int(centroides_activos.shape[0]),
                        tamanios_actuales=tamanios_actuales,
                    ),
                    "tamanios_actuales": tamanios_actuales.copy(),
                    "cardinalidades": self.cardinalidades.copy(),
                    "k_fundados": int(self._modelo_cort.KFundados),
                },
            )
        except Exception as error:
            return self._respuesta_error(
                f"Unexpected error: {error}",
                {
                    "tipo_error": type(error).__name__,
                    "detalle_error": str(error),
                },
            )

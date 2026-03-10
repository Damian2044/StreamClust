function esValorVacio(valor) {
  return valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "");
}

function esValorTargetValido(valor) {
  if (typeof valor === "number") {
    return Number.isInteger(valor);
  }

  return typeof valor === "string";
}

export function obtenerColumnasTargetValidas(columnas = [], datos = []) {
  if (!Array.isArray(columnas) || !Array.isArray(datos)) {
    return [];
  }

  return columnas.filter((_, indice) => {
    const valoresColumna = datos
      .map((fila) => (Array.isArray(fila) ? fila[indice] : undefined))
      .filter((valor) => !esValorVacio(valor));

    if (valoresColumna.length === 0) {
      return false;
    }

    return valoresColumna.every(esValorTargetValido);
  });
}

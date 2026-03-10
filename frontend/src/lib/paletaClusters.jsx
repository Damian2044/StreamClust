export function generarColorCluster(indice, totalClusters = 1) {
  const total = Math.max(1, Number(totalClusters) || 1)
  const idx = Math.max(0, Number(indice) || 0)
  const hue = Math.round((idx * 360) / total) % 360
  return `hsl(${hue} 30% 80%)`
}

const COLORES = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#14B8A6", "#EC4899", "#6366F1", "#F97316", "#84CC16",
  "#06B6D4", "#A855F7", "#F43F5E", "#22C55E", "#EAB308",
  "#0EA5E9", "#D946EF", "#FB923C", "#4ADE80", "#FACC15",
];

export function obtenerPaletaClusters(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => COLORES[i % COLORES.length]);
}
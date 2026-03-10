import React, { useState, useRef, useEffect } from 'react';
import { obtenerPaletaClusters } from '../lib/paletaClusters';

function PuntoCluster({ x, y, color, esCentroide, label }) {
  const [hovered, setHovered] = useState(false);

  if (esCentroide) {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
        }}
      >
        {/* Anillos animados del centroide */}
        <div style={{
          position: 'absolute', inset: '-12px', borderRadius: '50%',
          border: `1.5px solid ${color}`,
          opacity: 0.3,
          animation: 'pulse-ring 2s ease-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '-6px', borderRadius: '50%',
          border: `1.5px solid ${color}`,
          opacity: 0.5,
          animation: 'pulse-ring 2s ease-out infinite 0.4s',
        }} />
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          backgroundColor: color,
          border: '2.5px solid #1e293b',
          boxShadow: `0 0 10px ${color}80`,
          position: 'relative',
        }} />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: hovered ? 30 : 10,
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      }}
    >
      {hovered && label && (
        <div style={{
          position: 'absolute',
          bottom: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: 'rgba(15,23,42,0.95)',
          color: 'white',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          border: `1px solid ${color}50`,
          pointerEvents: 'none',
        }}>
          {label}
        </div>
      )}
      <div style={{
        width: hovered ? 10 : 7,
        height: hovered ? 10 : 7,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: hovered ? 1 : 0.82,
        boxShadow: hovered ? `0 0 8px ${color}` : `0 0 3px ${color}60`,
        transition: 'all 0.15s ease',
        border: hovered ? '1.5px solid white' : '1px solid rgba(255,255,255,0.3)',
      }} />
    </div>
  );
}
function normalizarCoordenadas(puntos, centroides = []) {
  const todos = [...puntos, ...centroides];

  if (todos.length === 0) return { puntosNorm: [], centroidesNorm: [] };

  const xs = todos.map(p => p.x);
  const ys = todos.map(p => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangoX = maxX - minX || 1; // evita división por 0
  const rangoY = maxY - minY || 1;

  const padding = 0.05; // 5% de margen para que los puntos no queden en el borde

  const normalizar = (p) => ({
    ...p,
    x: padding + ((p.x - minX) / rangoX) * (1 - padding * 2),
    y: padding + ((p.y - minY) / rangoY) * (1 - padding * 2),
  });

  return {
    puntosNorm: puntos.map(normalizar),
    centroidesNorm: centroides.map(normalizar),
  };
}

function VisualizacionClustering({ proyeccionPCA, cantidadClusters = 1 }) {
  const [abierto, setAbierto] = useState(true);
  const [clusterVisible, setClusterVisible] = useState(null); // null = todos

  if (!proyeccionPCA || !Array.isArray(proyeccionPCA.puntos) || proyeccionPCA.puntos.length === 0) {
    return null;
  }

  const { puntos, centroides } = proyeccionPCA;
  const { puntosNorm, centroidesNorm } = normalizarCoordenadas(puntos, centroides);
  const paleta = obtenerPaletaClusters(cantidadClusters);

  const puntosFiltrados = clusterVisible === null
    ? puntosNorm
    : puntosNorm.filter(p => p.cluster === clusterVisible);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes fadeInDot {
          from { opacity: 0; transform: translate(-50%,-50%) scale(0.3); }
          to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>

      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow mt-4">
        {/* Header */}
        <div
          className="h-14 bg-gray-100 border-b border-gray-200 flex items-center px-4 justify-between cursor-pointer"
          onClick={() => setAbierto(v => !v)}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setAbierto(v => !v); }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 9A.75.75 0 011.75 11h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 11.75zm0 5A.75.75 0 011.75 16h16.5a.75.75 0 010 1.5H1.75A.75.75 0 011 16.75zM1.75 7a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H1.75z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold border border-cyan-200">
                2D
              </span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">
                PCA Projection
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{puntosNorm.length} points</span>
          </div>
        </div>

        {/* Contenido */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${abierto ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-5 flex gap-5">

            {/* Canvas de puntos */}
            <div className="flex-1">
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 380,
                  background: '#f8fafc',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(v => (
                  <React.Fragment key={v}>
                    <div style={{ position: 'absolute', left: `${v * 100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.06)' }} />
                    <div style={{ position: 'absolute', top: `${v * 100}%`, left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                  </React.Fragment>
                ))}

                {/* Ejes principales */}
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.12)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.12)' }} />

                {/* Labels de ejes */}
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, color: 'rgba(100,116,139,0.6)', letterSpacing: 2 }}>PC1</span>
                <span style={{ position: 'absolute', top: 8, left: 12, fontSize: 9, color: 'rgba(100,116,139,0.6)', letterSpacing: 2 }}>PC2</span>

                {/* Puntos */}
                {puntosFiltrados.map((p) => {
                  const color = paleta[(p.cluster ?? 0) % paleta.length];
                  return (
                    <PuntoCluster
                      key={p.idFront}
                      x={p.x} y={p.y}
                      color={color}
                      esCentroide={false}
                      label={`C${p.cluster}`}
                    />
                  );
                })}

                {/* Centroides */}
                {centroidesNorm.map((c) => {
                  if (clusterVisible !== null && c.cluster !== clusterVisible) return null;
                  const color = paleta[(c.cluster ?? 0) % paleta.length];
                  return (
                    <PuntoCluster
                      key={`centroide-${c.cluster}`}
                      x={c.x} y={c.y}
                      color={color}
                      esCentroide
                    />
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-400 mt-2 px-1">
                Incremental 2D PCA projection for visualization only. Clustering runs in the full original feature space.
              </p>
            </div>

            {/* Panel lateral */}
            <div className="w-44 shrink-0">
              <div className="h-[380px] flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Clusters</p>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2">

              {/* Botón todos */}
              <button
                onClick={() => setClusterVisible(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all border ${clusterVisible === null
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                All ({puntosNorm.length})
              </button>

              {/* Un botón por cluster */}
              {paleta.map((color, i) => {
                const count = puntosNorm.filter(p => p.cluster === i).length;
                const activo = clusterVisible === i;
                return (
                  <button
                    key={i}
                    onClick={() => setClusterVisible(activo ? null : i)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all border ${activo
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    style={activo ? { backgroundColor: color, borderColor: color, boxShadow: `0 0 12px ${color}50` } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color, boxShadow: activo ? 'none' : `0 0 4px ${color}60` }}
                        />
                        <span>C{i}</span>
                      </div>
                      <span className={activo ? 'text-white/70' : 'text-gray-400'}>{count}</span>
                    </div>
                  </button>
                );
              })}

                </div>

              {/* Leyenda centroides */}
              <div className="pt-3 border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #1e293b', background: '#94a3b8', boxShadow: '0 0 6px #94a3b840' }} />
                  Centroid
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default VisualizacionClustering;



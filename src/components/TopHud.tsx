import React, { useState } from 'react';
import {
  Check,
  Eye,
  Layers,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Scan,
  Search,
  Split,
  Tag,
  X,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, CHAPTERS } from '../data/anatomyDatabase';
import {
  DissectionMode,
  ImagingMode,
  SystemId,
} from '../types/anatomy';

interface LayerState {
  active: boolean;
  opacity: number;
}

interface TopHudProps {
  scrollProgress: number;
  activeChapter: number;
  dissectionMode: DissectionMode;
  imagingMode: ImagingMode;
  layerStates: Record<SystemId, LayerState>;
  freeOrbit: boolean;
  showPins: boolean;
  isPlaying: boolean;
  heartRateBpm: number;
  onSelectChapter: (idx: number) => void;
  onChangeDissectionMode: (mode: DissectionMode) => void;
  onChangeImagingMode: (mode: ImagingMode) => void;
  onToggleLayer: (id: SystemId) => void;
  onSoloLayer: (id: SystemId) => void;
  onChangeLayerOpacity: (id: SystemId, opacity: number) => void;
  onResetLayers: () => void;
  onToggleOrbit: () => void;
  onTogglePins: () => void;
  onTogglePlay: () => void;
  onOpenSearch: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  scrollProgress,
  activeChapter,
  dissectionMode,
  imagingMode,
  layerStates,
  freeOrbit,
  showPins,
  isPlaying,
  heartRateBpm,
  onSelectChapter,
  onChangeDissectionMode,
  onChangeImagingMode,
  onToggleLayer,
  onSoloLayer,
  onChangeLayerOpacity,
  onResetLayers,
  onToggleOrbit,
  onTogglePins,
  onTogglePlay,
  onOpenSearch,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeLayerCount = Object.values(layerStates).filter((s) => s.active).length;

  const cycleImagingMode = () => {
    const order: ImagingMode[] = ['realistic', 'xray', 'neurovascular'];
    const next = order[(order.indexOf(imagingMode) + 1) % order.length];
    onChangeImagingMode(next);
  };

  const imagingLabel =
    imagingMode === 'realistic'
      ? 'PBR'
      : imagingMode === 'xray'
        ? 'X-Ray'
        : 'Neuro-Vasc';

  return (
    <header className="hud-header">
      <div className="hud-bar">
        {/* Left: Brand & Live Physiological Telemetry */}
        <div className="hud-brand glass-panel">
          <div className="hud-logo-dot" />
          <span className="hud-brand-title">ANATOMA 3D</span>
          <span className="hud-telemetry-pill">
            {Math.round(scrollProgress * 100)}%
          </span>
          <div className="hud-ecg-strip">
            <svg
              width="48"
              height="18"
              viewBox="0 0 48 18"
              aria-hidden="true"
              style={{ overflow: 'hidden', flexShrink: 0 }}
            >
              <g
                className={isPlaying ? 'ecg-wave-track' : ''}
                style={{
                  animationDuration: `${(60 / heartRateBpm).toFixed(2)}s`,
                }}
              >
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,10 8,10 11,8 14,10 17,10 19,13 22,2 25,16 28,10 33,10 36,7 40,10 48,10 56,10 59,8 62,10 65,10 67,13 70,2 73,16 76,10 81,10 84,7 88,10 96,10"
                />
              </g>
            </svg>
            <span>{heartRateBpm} BPM</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ color: '#2dd4bf' }}>16 RPM</span>
          </div>
        </div>

        {/* Center: Chapter Navigation */}
        <nav className="hud-chapter-nav glass-panel" aria-label="Anatomical Chapters">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              className={`chapter-pill ${activeChapter === ch.id ? 'active' : ''}`}
              onClick={() => onSelectChapter(ch.id)}
            >
              {ch.navLabel}
            </button>
          ))}
        </nav>

        {/* Right: Clinical Controls Toolbar */}
        <div className="hud-toolbar glass-panel">
          <button
            type="button"
            className={`tool-btn ${dissectionMode === 'peel' ? 'active' : ''}`}
            onClick={() =>
              onChangeDissectionMode(dissectionMode === 'regional' ? 'peel' : 'regional')
            }
            title="Switch between Regional Scroll Explosion and Layer-by-Layer Lateral Peel"
          >
            <Split size={13} />
            <span>{dissectionMode === 'peel' ? 'Layer Peel' : 'Regional'}</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${imagingMode !== 'realistic' ? 'active' : ''}`}
            onClick={cycleImagingMode}
            title="Cycle Imaging Mode: Realistic PBR / Clinical X-Ray / Neuro-Vascular"
          >
            <Scan size={13} />
            <span>{imagingLabel}</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen((v) => !v)}
            title="Toggle Anatomical Systems & Opacity Drawer"
          >
            <Layers size={13} />
            <span>Layers ({activeLayerCount})</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${showPins ? 'active' : ''}`}
            onClick={onTogglePins}
            title="Toggle 3D Floating Anatomical Pins"
          >
            <Tag size={13} />
            <span>Pins</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${freeOrbit ? 'active' : ''}`}
            onClick={onToggleOrbit}
            title="Toggle Free 360° Camera Orbit"
          >
            <Orbit size={13} />
            <span>Orbit</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${!isPlaying ? 'warn-active' : ''}`}
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause physiological pulse animations' : 'Play physiological pulse animations'}
            title={isPlaying ? 'Pause Heartbeat & Respiration' : 'Resume Heartbeat & Respiration'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={onOpenSearch}
            title="Search Anatomical Atlas (Ctrl+K)"
          >
            <Search size={13} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Floating Layers & Opacity Control Drawer */}
      {drawerOpen && (
        <div className="layers-drawer glass-panel" role="region" aria-label="Anatomical System Layers">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(148,163,184,0.16)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} color="#38bdf8" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                ANATOMICAL LAYERS (শারীরস্থানিক স্তর)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onResetLayers}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={11} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close layers drawer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '58vh',
              overflowY: 'auto',
            }}
          >
            {ANATOMICAL_SYSTEMS.map((sys) => {
              const st = layerStates[sys.id];
              return (
                <div
                  key={sys.id}
                  className={`layer-card ${st.active ? 'active' : ''}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleLayer(sys.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: sys.color,
                          boxShadow: st.active ? `0 0 8px ${sys.color}` : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#f8fafc',
                          }}
                        >
                          {sys.nameEn}{' '}
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              color: '#64748b',
                              fontWeight: 500,
                            }}
                          >
                            ({sys.countLabel})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {sys.nameBn}
                        </div>
                      </div>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onSoloLayer(sys.id)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148,163,184,0.22)',
                          background: 'rgba(30,41,59,0.85)',
                          color: '#cbd5e1',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={10} />
                        Solo
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleLayer(sys.id)}
                        aria-label={`Toggle ${sys.nameEn}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '7px',
                          border: st.active
                            ? '1px solid #38bdf8'
                            : '1px solid rgba(148,163,184,0.22)',
                          background: st.active
                            ? 'rgba(56,189,248,0.22)'
                            : 'rgba(30,41,59,0.7)',
                          color: st.active ? '#38bdf8' : 'transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  </div>

                  {st.active && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(148,163,184,0.1)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: '#94a3b8',
                      }}
                    >
                      <span>OPACITY</span>
                      <input
                        type="range"
                        className="clinical-range"
                        min={0.08}
                        max={1}
                        step={0.04}
                        value={st.opacity}
                        onChange={(e) =>
                          onChangeLayerOpacity(sys.id, parseFloat(e.target.value))
                        }
                      />
                      <span style={{ minWidth: '34px', textAlign: 'right', color: '#e2e8f0' }}>
                        {Math.round(st.opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

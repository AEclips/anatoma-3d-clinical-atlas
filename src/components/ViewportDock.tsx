import React from 'react';
import {
  Eye,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CameraPreset, DissectionMode } from '../types/anatomy';

interface ViewportDockProps {
  dissectionProgress: number;
  dissectionMode: DissectionMode;
  autoDissect: boolean;
  autoSpin: boolean;
  cameraPreset: CameraPreset;
  isFullscreen: boolean;
  hasDrawerOpen: boolean;
  onManualProgress: (val: number) => void;
  onToggleAutoDissect: () => void;
  onChangeDissectionMode: (mode: DissectionMode) => void;
  onSelectPreset: (preset: CameraPreset) => void;
  onZoom: (delta: number) => void;
  onToggleAutoSpin: () => void;
  onExitCinema: () => void;
  onToggleFullscreen: () => void;
}

const PRESETS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'anterior', label: 'Anterior' },
  { id: 'posterior', label: 'Posterior' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'superior', label: 'Top' },
];

export const ViewportDock: React.FC<ViewportDockProps> = ({
  dissectionProgress,
  dissectionMode,
  autoDissect,
  autoSpin,
  cameraPreset,
  isFullscreen,
  hasDrawerOpen,
  onManualProgress,
  onToggleAutoDissect,
  onChangeDissectionMode,
  onSelectPreset,
  onZoom,
  onToggleAutoSpin,
  onExitCinema,
  onToggleFullscreen,
}) => {
  return (
    <div
      className={`viewport-dock glass-panel ${hasDrawerOpen ? 'with-drawer' : ''}`}
      role="region"
      aria-label="3D Workstation Controls"
    >
      {/* Top Row: Dissection Scrubber + Auto-Dissect + Mode */}
      <div className="dock-row">
        <button
          type="button"
          className={`tool-btn ${autoDissect ? 'active' : ''}`}
          onClick={onToggleAutoDissect}
          aria-label={autoDissect ? 'Stop auto-dissect sweep' : 'Play auto-dissect sweep'}
          style={{
            border: '1px solid rgba(56,189,248,0.35)',
            padding: '5px 10px',
          }}
        >
          {autoDissect ? <Pause size={12} /> : <Play size={12} />}
          <span>{autoDissect ? 'Stop' : 'Auto-Dissect'}</span>
        </button>

        <div className="dock-scrubber">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#94a3b8',
              whiteSpace: 'nowrap',
            }}
          >
            DISSECT
          </span>
          <input
            type="range"
            className="clinical-range"
            aria-label="Dissection explosion percentage"
            min={0}
            max={1}
            step={0.005}
            value={dissectionProgress}
            onChange={(e) => onManualProgress(parseFloat(e.target.value))}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#38bdf8',
              minWidth: '34px',
              textAlign: 'right',
            }}
          >
            {Math.round(dissectionProgress * 100)}%
          </span>
        </div>

        <button
          type="button"
          className={`tool-btn ${dissectionMode === 'peel' ? 'active' : ''}`}
          style={{ border: '1px solid rgba(148,163,184,0.2)' }}
          onClick={() =>
            onChangeDissectionMode(dissectionMode === 'regional' ? 'peel' : 'regional')
          }
        >
          <span>{dissectionMode === 'peel' ? 'Peel' : 'Regional'}</span>
        </button>
      </div>

      {/* Bottom Row: Anatomical Camera Angle Presets + Zoom + Spin + Exit/Fullscreen */}
      <div className="dock-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chapter-pill ${cameraPreset === p.id ? 'active' : ''}`}
              style={{ border: '1px solid rgba(148,163,184,0.16)' }}
              onClick={() => onSelectPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className="tool-btn"
            style={{ border: '1px solid rgba(148,163,184,0.18)', padding: '4px 8px' }}
            onClick={() => onSelectPreset('default')}
            title="Reset camera angle"
            aria-label="Reset camera angle"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="tool-btn"
            style={{ border: '1px solid rgba(148,163,184,0.18)', padding: '5px 7px' }}
            onClick={() => onZoom(1)}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            className="tool-btn"
            style={{ border: '1px solid rgba(148,163,184,0.18)', padding: '5px 7px' }}
            onClick={() => onZoom(-1)}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            className={`tool-btn ${autoSpin ? 'active' : ''}`}
            style={{ border: '1px solid rgba(148,163,184,0.18)', padding: '5px 8px' }}
            onClick={onToggleAutoSpin}
            title="Toggle 360° Auto-Spin"
          >
            <RotateCw size={12} />
            <span>Spin</span>
          </button>
          <button
            type="button"
            className="tool-btn"
            style={{ border: '1px solid rgba(148,163,184,0.18)', padding: '5px 8px' }}
            onClick={onExitCinema}
            title="Show story chapter cards (H)"
          >
            <Eye size={12} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            className={`tool-btn ${isFullscreen ? 'active' : ''}`}
            style={{ border: '1px solid rgba(56,189,248,0.35)', padding: '5px 8px' }}
            onClick={onToggleFullscreen}
            title="Toggle Browser Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

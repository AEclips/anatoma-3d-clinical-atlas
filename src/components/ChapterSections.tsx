import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Compass,
  Focus,
  Layers,
  Minimize2,
  Maximize2,
  Orbit,
  RotateCw,
  Search,
} from 'lucide-react';
import {
  ANATOMICAL_SYSTEMS,
  ANATOMY_PARTS,
  CHAPTERS,
  PARTS_BY_ID,
  SYSTEM_MAP,
} from '../data/anatomyDatabase';
import { DissectionMode, SystemId } from '../types/anatomy';

interface LayerState {
  active: boolean;
  opacity: number;
}

interface ChapterSectionsProps {
  scrollProgress: number;
  selectedPartId: string | null;
  dissectionMode: DissectionMode;
  layerStates: Record<SystemId, LayerState>;
  freeOrbit: boolean;
  autoSpin: boolean;
  heartRateBpm: number;
  onSelectChapter: (idx: number) => void;
  onSelectPart: (partId: string) => void;
  onIsolatePart: (partId: string) => void;
  onManualProgress: (val: number) => void;
  onChangeDissectionMode: (mode: DissectionMode) => void;
  onToggleLayer: (id: SystemId) => void;
  onToggleOrbit: () => void;
  onToggleAutoSpin: () => void;
  onChangeHeartRate: (bpm: number) => void;
  onOpenSearch: () => void;
}

export const ChapterSections: React.FC<ChapterSectionsProps> = ({
  scrollProgress,
  selectedPartId,
  dissectionMode,
  layerStates,
  freeOrbit,
  autoSpin,
  heartRateBpm,
  onSelectChapter,
  onSelectPart,
  onIsolatePart,
  onManualProgress,
  onChangeDissectionMode,
  onToggleLayer,
  onToggleOrbit,
  onToggleAutoSpin,
  onChangeHeartRate,
  onOpenSearch,
}) => {
  return (
    <main className="story-main">
      {CHAPTERS.map((ch) => {
        const isHero = ch.id === 0;
        const isLab = ch.id === 6;
        const chapterParts = ch.highlights
          .map((id) => PARTS_BY_ID[id])
          .filter(Boolean);

        return (
          <section
            key={ch.id}
            id={`chapter-sec-${ch.id}`}
            className="story-section"
          >
            <article className="chapter-card glass-panel">
              <div className="chapter-eyebrow">{ch.code}</div>
              <h1
                className="chapter-title-en"
                style={isHero ? { fontSize: 'clamp(32px, 4vw, 48px)' } : undefined}
              >
                {ch.titleEn}
              </h1>
              <div className="chapter-title-bn">{ch.titleBn}</div>
              <p className="chapter-desc-bn">{ch.descriptionBn}</p>

              {/* Quantitative Metrics Grid */}
              <div
                className="metrics-grid"
                style={
                  ch.metrics.length === 3
                    ? { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
                    : undefined
                }
              >
                {ch.metrics.map((m) => (
                  <div key={m.label} className="metric-box">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Hero Actions */}
              {isHero && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(148,163,184,0.14)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      color: '#94a3b8',
                    }}
                  >
                    <ArrowDown size={13} color="#38bdf8" />
                    <span>SCROLL TO DISSECT PART BY PART</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-clinical"
                      onClick={() => onSelectChapter(1)}
                    >
                      <span>Start Cranium</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Regional Interactive Part Chips (Chapters 01–05) */}
              {!isHero && !isLab && chapterParts.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: '#94a3b8',
                      marginBottom: '8px',
                    }}
                  >
                    <span>REGIONAL STRUCTURES ({chapterParts.length} PARTS)</span>
                    <span style={{ color: '#38bdf8' }}>Click = Details • Double-Click = 360°</span>
                  </div>
                  <div className="part-chips-wrap">
                    {chapterParts.map((part) => {
                      const sysColor = SYSTEM_MAP[part.system]?.color ?? '#38bdf8';
                      return (
                        <button
                          key={part.id}
                          type="button"
                          className={`part-chip ${
                            selectedPartId === part.id ? 'selected' : ''
                          }`}
                          onClick={() => onSelectPart(part.id)}
                          onDoubleClick={() => onIsolatePart(part.id)}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: sysColor,
                            }}
                          />
                          <span>{part.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chapter 06: 360° Dissection Lab Controls */}
              {isLab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Dissection Mode Selector */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      className={`tool-btn ${dissectionMode === 'regional' ? 'active' : ''}`}
                      style={{
                        justifyContent: 'center',
                        padding: '8px',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={() => onChangeDissectionMode('regional')}
                    >
                      <Compass size={13} />
                      <span>Regional Explode</span>
                    </button>
                    <button
                      type="button"
                      className={`tool-btn ${dissectionMode === 'peel' ? 'active' : ''}`}
                      style={{
                        justifyContent: 'center',
                        padding: '8px',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={() => onChangeDissectionMode('peel')}
                    >
                      <Layers size={13} />
                      <span>Layer-by-Layer Peel</span>
                    </button>
                  </div>

                  {/* Manual Explosion Displacement Slider */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(15,23,42,0.72)',
                      border: '1px solid rgba(148,163,184,0.14)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
                        DISSECTION DISPLACEMENT
                      </span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {Math.round(scrollProgress * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      className="clinical-range"
                      min={0}
                      max={1}
                      step={0.005}
                      value={scrollProgress}
                      onChange={(e) => onManualProgress(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* Cardiac BPM Simulator */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(15,23,42,0.72)',
                      border: '1px solid rgba(148,163,184,0.14)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ color: '#fda4af', fontWeight: 700 }}>
                        HEART RATE SIMULATION
                      </span>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>
                        {heartRateBpm} BPM
                      </span>
                    </div>
                    <input
                      type="range"
                      className="clinical-range"
                      min={40}
                      max={160}
                      step={2}
                      value={heartRateBpm}
                      onChange={(e) => onChangeHeartRate(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Quick System Toggles */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '6px',
                    }}
                  >
                    {ANATOMICAL_SYSTEMS.map((sys) => {
                      const active = layerStates[sys.id].active;
                      return (
                        <button
                          key={sys.id}
                          type="button"
                          className={`part-chip ${active ? 'selected' : ''}`}
                          style={{ justifyContent: 'space-between' }}
                          onClick={() => onToggleLayer(sys.id)}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: sys.color,
                              }}
                            />
                            <span>{sys.nameEn.split(' ')[0]}</span>
                          </span>
                          <span>{active ? 'ON' : 'OFF'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lab Action Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      className={`tool-btn ${freeOrbit ? 'active' : ''}`}
                      style={{
                        justifyContent: 'center',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={onToggleOrbit}
                    >
                      <Orbit size={12} />
                      <span>Orbit</span>
                    </button>
                    <button
                      type="button"
                      className={`tool-btn ${autoSpin ? 'active' : ''}`}
                      style={{
                        justifyContent: 'center',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={onToggleAutoSpin}
                    >
                      <RotateCw size={12} />
                      <span>Spin</span>
                    </button>
                    <button
                      type="button"
                      className="tool-btn"
                      style={{
                        justifyContent: 'center',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={() => onSelectChapter(0)}
                    >
                      <Minimize2 size={12} />
                      <span>Assemble</span>
                    </button>
                    <button
                      type="button"
                      className="tool-btn"
                      style={{
                        justifyContent: 'center',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                      onClick={onOpenSearch}
                    >
                      <Search size={12} />
                      <span>Index ({ANATOMY_PARTS.length})</span>
                    </button>
                  </div>

                  {/* Direct Part Dropdown */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={selectedPartId ?? ''}
                      onChange={(e) => {
                        if (e.target.value) onSelectPart(e.target.value);
                      }}
                      aria-label="Choose anatomical assembly to inspect"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(56,189,248,0.35)',
                        color: '#f8fafc',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                      }}
                    >
                      <option value="">
                        -- Select Structure to Inspect ({ANATOMY_PARTS.length}) --
                      </option>
                      {ANATOMY_PARTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shortLabel} — {p.nameEn}
                        </option>
                      ))}
                    </select>
                    {selectedPartId && (
                      <button
                        type="button"
                        className="btn-clinical"
                        style={{ padding: '8px 12px' }}
                        onClick={() => onIsolatePart(selectedPartId)}
                        title="Isolate selected part in 360°"
                      >
                        <Focus size={14} />
                      </button>
                    )}
                    {!selectedPartId && (
                      <button
                        type="button"
                        className="btn-clinical"
                        style={{ padding: '8px 12px' }}
                        onClick={() => onSelectChapter(6)}
                        title="Full Dissection View"
                      >
                        <Maximize2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          </section>
        );
      })}
    </main>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Focus, X } from 'lucide-react';
import { AnatomyCanvas } from './components/AnatomyCanvas';
import { AtlasSearchDialog } from './components/AtlasSearchDialog';
import { ChapterSections } from './components/ChapterSections';
import { ClinicalInspector } from './components/ClinicalInspector';
import { TopHud } from './components/TopHud';
import { ViewportDock } from './components/ViewportDock';
import {
  ANATOMICAL_SYSTEMS,
  CHAPTERS,
  PARTS_BY_ID,
} from './data/anatomyDatabase';
import {
  CameraPreset,
  DissectionMode,
  ImagingMode,
  SystemId,
} from './types/anatomy';

interface LayerState {
  active: boolean;
  opacity: number;
}

function buildInitialLayerStates(): Record<SystemId, LayerState> {
  return ANATOMICAL_SYSTEMS.reduce(
    (acc, sys) => {
      acc[sys.id] = { active: sys.defaultActive, opacity: sys.defaultOpacity };
      return acc;
    },
    {} as Record<SystemId, LayerState>
  );
}

export const App: React.FC = () => {
  const [modelLoadedCount, setModelLoadedCount] = useState<number | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [manualProgress, setManualProgress] = useState<number | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);

  const [dissectionMode, setDissectionMode] = useState<DissectionMode>('regional');
  const [imagingMode, setImagingMode] = useState<ImagingMode>('realistic');
  const [layerStates, setLayerStates] = useState<Record<SystemId, LayerState>>(
    buildInitialLayerStates
  );

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);
  const [isolationGhostContext, setIsolationGhostContext] = useState(true);

  const [freeOrbit, setFreeOrbit] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoDissect, setAutoDissect] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [cameraPresetTick, setCameraPresetTick] = useState(0);
  const [zoomCommand, setZoomCommand] = useState<{ delta: number; tick: number } | null>(null);
  const [heartRateBpm, setHeartRateBpm] = useState(72);
  const [searchOpen, setSearchOpen] = useState(false);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const lastScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);

  const getChapterForProgress = useCallback((p: number) => {
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (p >= CHAPTERS[i].range[0]) return i;
    }
    return 0;
  }, []);

  /* -------------------- SCROLL PROGRESS & FALLBACK -------------------- */
  useEffect(() => {
    const supportsNativeTimeline =
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline', 'scroll()');

    const handleScroll = () => {
      const curY = window.scrollY;
      const movedIntentionally = Math.abs(curY - lastScrollYRef.current) > 12;
      lastScrollYRef.current = curY;

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const p =
        maxScroll > 0
          ? Math.max(0, Math.min(1, curY / maxScroll))
          : 0;

      if (movedIntentionally) {
        setManualProgress(null);
        setAutoDissect(false);
        setScrollProgress(p);
      }
      setActiveChapter(getChapterForProgress(p));

      if (!supportsNativeTimeline && progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${p})`;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [getChapterForProgress]);

  const effectiveProgress =
    manualProgress !== null ? manualProgress : scrollProgress;

  const handleManualProgress = useCallback((val: number) => {
    setAutoDissect(false);
    setManualProgress(val);
    if (progressBarRef.current && !CSS.supports('animation-timeline', 'scroll()')) {
      progressBarRef.current.style.transform = `scaleX(${val})`;
    }
  }, []);

  /* -------------------- AUTO-DISSECT SWEEP & FULLSCREEN API -------------------- */
  useEffect(() => {
    if (!autoDissect) return;
    let rafId = 0;
    let lastTime = performance.now();
    let currentVal = manualProgress !== null ? manualProgress : scrollProgress;
    if (currentVal >= 0.99) currentVal = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      currentVal = Math.min(1, currentVal + dt * 0.14);
      setManualProgress(currentVal);
      if (currentVal >= 1) {
        setAutoDissect(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoDissect]);

  useEffect(() => {
    const onFsChange = () => {
      const fsActive = Boolean(document.fullscreenElement);
      setIsFullscreen(fsActive);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        setCinemaMode(true);
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Graceful fallback when headless/restricted iframe blocks requestFullscreen
      setCinemaMode((v) => !v);
    }
  }, []);

  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setCameraPresetTick((t) => t + 1);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoomCommand((prev) => ({ delta, tick: (prev?.tick ?? 0) + 1 }));
  }, []);

  /* -------------------- NAVIGATION & SELECTION ACTIONS -------------------- */
  const handleSelectChapter = useCallback((idx: number) => {
    setManualProgress(null);
    setIsolatedPartId(null);
    const el = document.getElementById(`chapter-sec-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const ensureSystemActive = useCallback((partId: string) => {
    const part = PARTS_BY_ID[partId];
    if (!part) return;
    setLayerStates((prev) => {
      if (prev[part.system]?.active) return prev;
      return {
        ...prev,
        [part.system]: { ...prev[part.system], active: true },
      };
    });
  }, []);

  const handleSelectPart = useCallback(
    (partId: string | null) => {
      if (partId) {
        ensureSystemActive(partId);
      }
      setSelectedPartId(partId);
    },
    [ensureSystemActive]
  );

  const handleIsolatePart = useCallback(
    (partId: string) => {
      ensureSystemActive(partId);
      setSelectedPartId(partId);
      setIsolatedPartId((prev) => (prev === partId ? null : partId));
    },
    [ensureSystemActive]
  );

  const handleChangeDissectionMode = useCallback((mode: DissectionMode) => {
    setDissectionMode(mode);
    if (mode === 'peel') {
      // Reveal all 6 layers during Layer-by-Layer Lateral Peel so user sees full stack
      setLayerStates((prev) => ({
        ...prev,
        skeletal: { ...prev.skeletal, active: true },
        organs: { ...prev.organs, active: true },
        nervous: { ...prev.nervous, active: true },
        vascular: { ...prev.vascular, active: true },
        muscular: { ...prev.muscular, active: true },
        skin: { ...prev.skin, active: true },
      }));
    }
  }, []);

  const handleToggleLayer = useCallback((id: SystemId) => {
    setLayerStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], active: !prev[id].active },
    }));
  }, []);

  const handleSoloLayer = useCallback((id: SystemId) => {
    setLayerStates((prev) => {
      const alreadySolo = ANATOMICAL_SYSTEMS.every((s) =>
        s.id === id ? prev[s.id].active : !prev[s.id].active
      );
      if (alreadySolo) {
        return buildInitialLayerStates();
      }
      const next = { ...prev };
      ANATOMICAL_SYSTEMS.forEach((s) => {
        next[s.id] = { ...prev[s.id], active: s.id === id };
      });
      return next;
    });
  }, []);

  const handleChangeLayerOpacity = useCallback((id: SystemId, opacity: number) => {
    setLayerStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], opacity },
    }));
  }, []);

  const handleResetLayers = useCallback(() => {
    setLayerStates(buildInitialLayerStates());
  }, []);

  /* -------------------- KEYBOARD SHORTCUTS -------------------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '/' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && !searchOpen && isolatedPartId) {
        setIsolatedPartId(null);
      } else if (e.key >= '1' && e.key <= '7') {
        handleSelectChapter(parseInt(e.key, 10) - 1);
      } else if (e.key.toLowerCase() === 'o') {
        setFreeOrbit((v) => !v);
      } else if (e.key.toLowerCase() === 'p') {
        setShowPins((v) => !v);
      } else if (e.key.toLowerCase() === 'h') {
        setCinemaMode((v) => !v);
      } else if (e.key.toLowerCase() === 'f') {
        handleToggleFullscreen();
      } else if (e.key.toLowerCase() === 'x') {
        setImagingMode((m) =>
          m === 'realistic' ? 'xray' : m === 'xray' ? 'neurovascular' : 'realistic'
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectChapter, handleToggleFullscreen, isolatedPartId, searchOpen]);

  const handleModelReady = useCallback((count: number) => {
    setModelLoadedCount(count);
  }, []);

  const handleModelError = useCallback((msg: string) => {
    setModelError(msg);
  }, []);

  const isolatedPart = isolatedPartId ? PARTS_BY_ID[isolatedPartId] : null;

  return (
    <>
      {/* Native CSS Scroll-Driven Top Progress Bar */}
      <div id="scroll-progress" ref={progressBarRef} aria-hidden="true" />

      {/* Initial Loading / Error Overlay */}
      {modelLoadedCount === null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: '#040814',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          {modelError ? (
            <>
              <div style={{ color: '#f43f5e', fontWeight: 700, fontSize: '18px' }}>
                3D Anatomy Engine Error
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '420px' }}>
                {modelError}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '3px solid rgba(56,189,248,0.18)',
                  borderTopColor: '#38bdf8',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: '#fff',
                }}
              >
                মানবদেহ ৩ডি // MANOBDEHO 3D
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                রিয়েল ৩ডি কঙ্কাল, অভ্যন্তরীণ অঙ্গ, পেশী ও স্নায়ুতন্ত্র লোড হচ্ছে...
              </div>
            </>
          )}
        </div>
      )}

      {/* Fullscreen Three.js 3D Viewport */}
      <AnatomyCanvas
        scrollProgress={effectiveProgress}
        activeChapter={activeChapter}
        dissectionMode={dissectionMode}
        imagingMode={imagingMode}
        layerStates={layerStates}
        selectedPartId={selectedPartId}
        isolatedPartId={isolatedPartId}
        isolationGhostContext={isolationGhostContext}
        freeOrbit={freeOrbit}
        autoSpin={autoSpin}
        showPins={showPins}
        isPlaying={isPlaying}
        cinemaMode={cinemaMode}
        heartRateBpm={heartRateBpm}
        cameraPreset={cameraPreset}
        cameraPresetTick={cameraPresetTick}
        zoomCommand={zoomCommand}
        onSelectPart={handleSelectPart}
        onIsolatePart={handleIsolatePart}
        onModelReady={handleModelReady}
        onModelError={handleModelError}
      />

      {/* Persistent Top Clinical HUD */}
      <TopHud
        scrollProgress={effectiveProgress}
        activeChapter={activeChapter}
        dissectionMode={dissectionMode}
        imagingMode={imagingMode}
        layerStates={layerStates}
        freeOrbit={freeOrbit}
        showPins={showPins}
        isPlaying={isPlaying}
        cinemaMode={cinemaMode}
        isFullscreen={isFullscreen}
        heartRateBpm={heartRateBpm}
        onSelectChapter={(idx) => {
          setCinemaMode(false);
          setCameraPreset('default');
          handleSelectChapter(idx);
        }}
        onChangeDissectionMode={handleChangeDissectionMode}
        onChangeImagingMode={setImagingMode}
        onToggleLayer={handleToggleLayer}
        onSoloLayer={handleSoloLayer}
        onChangeLayerOpacity={handleChangeLayerOpacity}
        onResetLayers={handleResetLayers}
        onToggleOrbit={() => setFreeOrbit((v) => !v)}
        onTogglePins={() => setShowPins((v) => !v)}
        onTogglePlay={() => setIsPlaying((v) => !v)}
        onToggleCinema={() => setCinemaMode((v) => !v)}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Scrollytelling Narrative Chapters (hidden in Pure 3D Cinema Mode) */}
      {!cinemaMode && (
        <ChapterSections
          scrollProgress={effectiveProgress}
          selectedPartId={selectedPartId}
          dissectionMode={dissectionMode}
          layerStates={layerStates}
          freeOrbit={freeOrbit}
          autoSpin={autoSpin}
          heartRateBpm={heartRateBpm}
          onSelectChapter={handleSelectChapter}
          onSelectPart={(id) => handleSelectPart(id)}
          onIsolatePart={handleIsolatePart}
          onManualProgress={handleManualProgress}
          onChangeDissectionMode={handleChangeDissectionMode}
          onToggleLayer={handleToggleLayer}
          onToggleOrbit={() => setFreeOrbit((v) => !v)}
          onToggleAutoSpin={() => setAutoSpin((v) => !v)}
          onChangeHeartRate={setHeartRateBpm}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      {/* Floating 3D Workstation Dock in Pure 3D Cinema / Fullscreen Mode */}
      {cinemaMode && (
        <ViewportDock
          dissectionProgress={effectiveProgress}
          dissectionMode={dissectionMode}
          autoDissect={autoDissect}
          autoSpin={autoSpin}
          cameraPreset={cameraPreset}
          isFullscreen={isFullscreen}
          hasDrawerOpen={Boolean(selectedPartId)}
          onManualProgress={handleManualProgress}
          onToggleAutoDissect={() => setAutoDissect((v) => !v)}
          onChangeDissectionMode={handleChangeDissectionMode}
          onSelectPreset={handleSelectPreset}
          onZoom={handleZoom}
          onToggleAutoSpin={() => setAutoSpin((v) => !v)}
          onExitCinema={() => setCinemaMode(false)}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Right Clinical Profile Inspector Drawer */}
      <ClinicalInspector
        partId={selectedPartId}
        isolatedPartId={isolatedPartId}
        isolationGhostContext={isolationGhostContext}
        onClose={() => {
          setSelectedPartId(null);
          setIsolatedPartId(null);
        }}
        onSelectPart={(id) => {
          ensureSystemActive(id);
          setSelectedPartId(id);
          if (isolatedPartId) {
            setIsolatedPartId(id);
          }
        }}
        onToggleIsolate={handleIsolatePart}
        onToggleGhostContext={() => setIsolationGhostContext((v) => !v)}
      />

      {/* Bottom 360° Isolation Mode Controls Pill */}
      {isolatedPart && (
        <div
          className={`isolation-banner glass-panel ${
            selectedPartId ? 'with-drawer' : ''
          } ${cinemaMode ? 'above-dock' : ''}`}
        >
          <Focus size={15} color="#2dd4bf" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            360° ISOLATION: {isolatedPart.shortLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#94a3b8',
            }}
          >
            Drag to rotate • Scroll to zoom
          </span>
          <button
            type="button"
            className="tool-btn active"
            style={{ padding: '4px 9px' }}
            onClick={() => setIsolationGhostContext((v) => !v)}
          >
            {isolationGhostContext ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>{isolationGhostContext ? 'Ghost On' : 'Ghost Off'}</span>
          </button>
          <button
            type="button"
            className="tool-btn warn-active"
            style={{ padding: '4px 10px' }}
            onClick={() => setIsolatedPartId(null)}
          >
            <X size={12} />
            <span>Exit 360°</span>
          </button>
        </div>
      )}

      {/* Native <dialog> Anatomical Atlas Search Modal */}
      <AtlasSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPart={(id) => handleSelectPart(id)}
        onIsolatePart={handleIsolatePart}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default App;

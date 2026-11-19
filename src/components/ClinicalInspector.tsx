import React from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Eye,
  EyeOff,
  Focus,
  Gauge,
  Stethoscope,
  X,
  Zap,
} from 'lucide-react';
import { ANATOMY_PARTS, PARTS_BY_ID, SYSTEM_MAP } from '../data/anatomyDatabase';

interface ClinicalInspectorProps {
  partId: string | null;
  isolatedPartId: string | null;
  isolationGhostContext: boolean;
  onClose: () => void;
  onSelectPart: (partId: string) => void;
  onToggleIsolate: (partId: string) => void;
  onToggleGhostContext: () => void;
}

export const ClinicalInspector: React.FC<ClinicalInspectorProps> = ({
  partId,
  isolatedPartId,
  isolationGhostContext,
  onClose,
  onSelectPart,
  onToggleIsolate,
  onToggleGhostContext,
}) => {
  if (!partId) return null;
  const part = PARTS_BY_ID[partId];
  if (!part) return null;

  const sys = SYSTEM_MAP[part.system];
  const isIsolated = isolatedPartId === part.id;

  const curIdx = ANATOMY_PARTS.findIndex((p) => p.id === part.id);
  const prevPart =
    ANATOMY_PARTS[(curIdx - 1 + ANATOMY_PARTS.length) % ANATOMY_PARTS.length];
  const nextPart = ANATOMY_PARTS[(curIdx + 1) % ANATOMY_PARTS.length];

  return (
    <aside
      className="inspector-drawer glass-panel"
      aria-label={`Clinical profile for ${part.nameEn}`}
    >
      {/* Fixed Drawer Header */}
      <div
        style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(148,163,184,0.16)',
          background: 'rgba(6, 12, 26, 0.75)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 9px',
                borderRadius: '999px',
                background: 'rgba(56,189,248,0.12)',
                border: `1px solid ${sys?.color ?? '#38bdf8'}55`,
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: sys?.color ?? '#38bdf8',
                marginBottom: '6px',
              }}
            >
              <span>{sys?.nameEn}</span>
              <span style={{ color: '#64748b' }}>•</span>
              <span>{part.systemSublabel}</span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#fff',
              }}
            >
              {part.nameEn}
            </h2>
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: 600,
                color: '#2dd4bf',
                marginTop: '2px',
              }}
            >
              {part.nameBn}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontStyle: 'italic',
                color: '#94a3b8',
                marginTop: '3px',
              }}
            >
              Terminologia Anatomica: {part.latinName}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close clinical inspector"
            style={{
              background: 'rgba(30,41,59,0.7)',
              border: '1px solid rgba(148,163,184,0.2)',
              color: '#cbd5e1',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 360° Isolation & Prev/Next Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          <button
            type="button"
            className="btn-clinical"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '11.5px',
              borderColor: isIsolated ? '#2dd4bf' : undefined,
              background: isIsolated
                ? 'linear-gradient(135deg, rgba(45,212,191,0.36), rgba(56,189,248,0.28))'
                : undefined,
            }}
            onClick={() => onToggleIsolate(part.id)}
          >
            <Focus size={14} />
            <span>
              {isIsolated
                ? 'Exit 360° Isolation'
                : '360° Isolate Part (একক অঙ্গ ভিউ)'}
            </span>
          </button>

          {isIsolated && (
            <button
              type="button"
              className={`tool-btn ${isolationGhostContext ? 'active' : ''}`}
              style={{
                border: '1px solid rgba(148,163,184,0.24)',
                padding: '7px 10px',
              }}
              onClick={onToggleGhostContext}
              title="Toggle ghosted surrounding anatomy silhouette"
            >
              {isolationGhostContext ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isolationGhostContext ? 'Ghost' : 'Solo'}</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="tool-btn"
              style={{
                border: '1px solid rgba(148,163,184,0.2)',
                padding: '7px',
              }}
              onClick={() => onSelectPart(prevPart.id)}
              title={`Previous: ${prevPart.shortLabel}`}
              aria-label={`Previous part: ${prevPart.nameEn}`}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="tool-btn"
              style={{
                border: '1px solid rgba(148,163,184,0.2)',
                padding: '7px',
              }}
              onClick={() => onSelectPart(nextPart.id)}
              title={`Next: ${nextPart.shortLabel}`}
              aria-label={`Next part: ${nextPart.nameEn}`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Clinical Content */}
      <div className="inspector-scroll">
        {/* 1. Bilingual Anatomical Overview */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(15,23,42,0.72)',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#38bdf8',
              marginBottom: '8px',
            }}
          >
            <Stethoscope size={13} />
            <span>MORPHOLOGY & OVERVIEW (গঠন ও পরিচিতি)</span>
          </div>
          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.65,
              color: '#f1f5f9',
              marginBottom: '8px',
            }}
          >
            {part.summaryBn}
          </p>
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.55,
              color: '#94a3b8',
            }}
          >
            {part.summaryEn}
          </p>
        </div>

        {/* 2. Physiological Functions */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(15,23,42,0.72)',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#2dd4bf',
              marginBottom: '8px',
            }}
          >
            <Activity size={13} />
            <span>PHYSIOLOGICAL FUNCTIONS (শারীরবৃত্তীয় কাজ)</span>
          </div>
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
            }}
          >
            {part.functions.map((fn, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  color: '#cbd5e1',
                }}
              >
                <span style={{ color: '#2dd4bf', fontWeight: 700 }}>▸</span>
                <span>{fn}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Blood & Nerve Supply */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(15,23,42,0.72)',
            border: '1px solid rgba(148,163,184,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#fb7185',
            }}
          >
            <Droplets size={13} />
            <span>NEUROVASCULAR SUPPLY (রক্ত ও স্নায়ু সংযোগ)</span>
          </div>

          <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#f43f5e',
                fontWeight: 700,
              }}
            >
              ARTERIAL SUPPLY:
            </div>
            <div style={{ color: '#e2e8f0' }}>{part.bloodSupply.arterial}</div>
          </div>

          <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 700,
              }}
            >
              VENOUS DRAINAGE:
            </div>
            <div style={{ color: '#e2e8f0' }}>{part.bloodSupply.venous}</div>
          </div>

          <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#fbbf24',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={10} />
              INNERVATION:
            </div>
            <div style={{ color: '#e2e8f0' }}>{part.innervation}</div>
          </div>
        </div>

        {/* 4. Biomechanical & Clinical Quantitative Specs */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(15,23,42,0.72)',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#38bdf8',
              marginBottom: '10px',
            }}
          >
            <Gauge size={13} />
            <span>QUANTITATIVE CLINICAL SPECS (বাস্তব পরিমাপ)</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
            }}
          >
            {Object.entries(part.specs).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(148,163,184,0.1)',
                }}
              >
                <span style={{ color: '#94a3b8' }}>{k}</span>
                <span style={{ color: '#f8fafc', fontWeight: 700, textAlign: 'right' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Clinical Pathology & Surgical Landmarks */}
        <div
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: 'rgba(69, 10, 10, 0.22)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#fda4af',
              marginBottom: '8px',
            }}
          >
            <AlertTriangle size={13} />
            <span>CLINICAL PATHOLOGY & LANDMARKS (রোগ ও ইনজুরি)</span>
          </div>
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {part.clinicalPathology.map((path, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: '#fecdd3',
                  display: 'flex',
                  gap: '7px',
                }}
              >
                <span>•</span>
                <span>{path}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

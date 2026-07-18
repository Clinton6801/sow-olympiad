'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IconCheck, IconStar, IconDownload, IconClipboardList, IconMedal } from '@tabler/icons-react';
import { getCertificate, getSection } from '@/lib/db';
import type { Certificate, Section } from '@/lib/db';

// NOTE: `rank` and `max_score` are not yet columns on the certificates table.
// To fully finish the rank-badge and score-denominator fixes below, add:
//   ALTER TABLE certificates ADD COLUMN rank INTEGER;
//   ALTER TABLE certificates ADD COLUMN max_score INTEGER;
// and populate `rank` from the room leaderboard position when a competition
// certificate is created, and `max_score` from the actual question count of
// that session (20 for practice, 25 for a grid room, etc.) at creation time
// wherever certificates currently get inserted. Until that's added, this page
// degrades gracefully: no rank column -> shows "Participant"; no max_score ->
// shows the raw score with no denominator.
type CertificateWithExtras = Certificate & {
  rank?: number | null;
  max_score?: number | null;
};

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;

  const [certificate, setCertificate] = useState<CertificateWithExtras | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadCertificate = async () => {
      const cert = await getCertificate(id);
      if (!cert) {
        setError('Certificate not found');
        setLoading(false);
        return;
      }

      setCertificate(cert as CertificateWithExtras);
      const sectionData = await getSection(cert.section_id);
      setSection(sectionData);
      setLoading(false);
    };

    loadCertificate();
  }, [id]);

  const handleDownload = async () => {
    if (!certificate) return;

    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const element = document.getElementById('certificatePreview');
      if (!element) {
        setError('Failed to render certificate');
        setDownloading(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        logging: false,
        imageTimeout: 0,
        windowWidth: 1200,
        windowHeight: 800,
      } as any);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Failed to generate image');
          setDownloading(false);
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate-${certificate.recipient_name
          .replace(/\s+/g, '-')
          .toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloading(false);
      }, 'image/png');
    } catch (err) {
      setError('Failed to download certificate. Please try again.');
      setDownloading(false);
      console.error('Certificate download error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading certificate…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-coral mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back home
          </Link>
        </main>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Live, visible certificate preview — scaled to fit the viewport,
            this is the SAME element html2canvas captures on download, so
            what the student sees is exactly what they get. */}
        <div className="w-full overflow-x-auto mb-8">
          <div
            style={{
              width: '1200px',
              transform: 'scale(var(--cert-scale, 0.5))',
              transformOrigin: 'top left',
              marginBottom: 'calc(-800px * (1 - var(--cert-scale, 0.5)))',
            }}
            className="mx-auto [--cert-scale:0.32] sm:[--cert-scale:0.5] md:[--cert-scale:0.62] lg:[--cert-scale:0.78] xl:[--cert-scale:1]"
          >
            <div id="certificatePreview">
              <CertificateTemplate certificate={certificate} section={section} />
            </div>
          </div>
        </div>

        {/* Download button */}
        <div className="text-center mb-8">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-8 py-4 bg-marigold text-white font-space-grotesk font-bold text-lg rounded-lg hover:opacity-90 disabled:opacity-50 transition inline-flex items-center gap-2 mx-auto"
          >
            <IconDownload size={20} aria-hidden="true" />
            {downloading ? 'Generating image…' : 'Download as image'}
          </button>
        </div>

        {/* Preview info */}
        <div className="text-center text-ink-slate text-sm bg-blue-50 rounded-lg p-4 flex items-center justify-center gap-2">
          <IconClipboardList size={18} aria-hidden="true" />
          <p>Downloads as a high-quality PNG image (1200×800px, print-ready).</p>
        </div>
      </main>
    </div>
  );
}

function SiteHeader() {
  // NOTE: if a shared <Header /> component already exists elsewhere in the
  // codebase (used on the homepage), import and use that instead of this —
  // this is a stand-in that matches the same branding so every page is
  // visually consistent while that shared component is confirmed/extracted.
  return (
    <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <img
            src="/logo.jpg"
            alt="Seat of Wisdom Group of Schools logo"
            style={{ width: 40, height: 40, borderRadius: '50%' }}
          />
          <span>
            <span className="block font-space-grotesk font-bold text-sm leading-tight">
              Seat of Wisdom
            </span>
            <span className="block font-inter text-xs text-gray-300 leading-tight">
              Math Olympiad
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-inter">
          <Link href="/" className="hover:opacity-80 transition">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CertificateTemplate({
  certificate,
  section,
}: {
  certificate: CertificateWithExtras;
  section: Section | null;
}) {
  const sectionName = section?.name || 'Math Olympiad';
  // Pulled directly from the database, no hardcoded per-name lookup that can
  // drift out of sync when sections change.
  const tierColor = section?.tier_color || '#14213D';

  const getRankDisplay = (): { label: string; Icon: typeof IconCheck } => {
    if (certificate.mode === 'practice') {
      return { label: 'Practice complete', Icon: IconCheck };
    }
    if (certificate.rank === 1) return { label: '1st place', Icon: IconMedal };
    if (certificate.rank === 2) return { label: '2nd place', Icon: IconMedal };
    if (certificate.rank === 3) return { label: '3rd place', Icon: IconMedal };
    return { label: 'Participant', Icon: IconStar };
  };

  const rank = getRankDisplay();
  const RankIcon = rank.Icon;

  const roundTypeDisplay =
    certificate.round_type === 'grid'
      ? 'Grid Round'
      : certificate.round_type === 'tiered'
        ? 'Tiered Round'
        : 'Speed Sprint';

  const issueDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const scoreDisplay = certificate.max_score
    ? `${certificate.score}/${certificate.max_score}`
    : `${certificate.score}`;

  return (
    <div
      style={{
        width: '1200px',
        height: '800px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        position: 'relative',
        color: '#14213D',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          right: '18px',
          bottom: '18px',
          border: '8px solid #14213D',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '26px',
          left: '26px',
          right: '26px',
          bottom: '26px',
          border: '2px solid #F4A73B',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />

      {/* Real school logo seals, not text placeholders */}
      <img
        src="/logo.jpg"
        alt=""
        loading="eager"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          top: '36px',
          left: '36px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid #F4A73B',
          objectFit: 'cover',
          zIndex: 10,
        }}
      />
      <img
        src="/logo.jpg"
        alt=""
        loading="eager"
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          top: '36px',
          right: '36px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid #F4A73B',
          objectFit: 'cover',
          zIndex: 10,
        }}
      />

      <div style={{ textAlign: 'center', paddingTop: '42px', paddingBottom: '12px', position: 'relative', zIndex: 5 }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14213D', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>
          SEAT OF WISDOM GROUP OF SCHOOLS
        </div>
        <div style={{ fontSize: '12px', color: '#999', letterSpacing: '1px', fontFamily: 'Arial, sans-serif' }}>
          EXCELLENCE · KNOWLEDGE · CHARACTER
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingLeft: '60px', paddingRight: '60px', marginBottom: '10px', position: 'relative', zIndex: 5 }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#14213D' }} />
        <div style={{ width: '9px', height: '9px', backgroundColor: '#F4A73B', transform: 'rotate(45deg)' }} />
        <div style={{ flex: 1, height: '1px', backgroundColor: '#14213D' }} />
      </div>

      <div style={{ height: '4px', background: 'linear-gradient(to right, #4CAF7D, #6C4EE3, #FF6B5B, #F4A73B)', marginBottom: '14px', position: 'relative', zIndex: 5 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '80px', paddingRight: '80px', textAlign: 'center', position: 'relative', zIndex: 5, overflow: 'hidden' }}>
        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#14213D', marginBottom: '6px', maxWidth: '100%', wordWrap: 'break-word', lineHeight: '1.15', fontFamily: 'Georgia, serif' }}>
          CERTIFICATE OF ACHIEVEMENT
        </div>

        <div style={{ fontSize: '16px', color: '#14213D', marginBottom: '12px', fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
          MATH OLYMPIAD — {sectionName.toUpperCase()}
        </div>

        <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#666', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>
          This is to certify that
        </div>

        <div style={{ fontSize: '38px', fontWeight: 'bold', color: tierColor, marginBottom: '12px', maxWidth: '100%', wordWrap: 'break-word', fontFamily: 'Georgia, serif' }}>
          {certificate.recipient_name}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: `${tierColor}20`, border: `2px solid ${tierColor}`, borderRadius: '20px', padding: '6px 14px', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: tierColor, fontFamily: 'Arial, sans-serif' }}>
          <RankIcon size={16} aria-hidden="true" />
          <span>{rank.label}</span>
        </div>

        <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
          has demonstrated outstanding mathematical skill and achieved
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#14213D', fontFamily: 'monospace' }}>
            {scoreDisplay}
          </div>
          <div style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>points</div>
        </div>

        <div style={{ fontSize: '13px', color: '#666', fontFamily: 'Arial, sans-serif' }}>
          in the <span style={{ fontWeight: 'bold', color: '#14213D' }}>{roundTypeDisplay}</span> Round
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#14213D', marginLeft: '80px', marginRight: '80px', position: 'relative', zIndex: 5 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px', padding: '16px 80px', position: 'relative', zIndex: 5 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '1px', backgroundColor: '#14213D', marginBottom: '4px' }} />
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial, sans-serif' }}>Host / Teacher</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#14213D', marginBottom: '4px', fontFamily: 'monospace' }}>{issueDate}</div>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial, sans-serif' }}>Date</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '1px', backgroundColor: '#14213D', marginBottom: '4px' }} />
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial, sans-serif' }}>Principal</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '10px', position: 'relative', zIndex: 5 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#F4A73B', borderRadius: '50%' }} />
        ))}
      </div>
    </div>
  );
}
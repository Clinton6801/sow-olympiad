'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCertificate, getSection } from '@/lib/db';
import type { Certificate, Section } from '@/lib/db';

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
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

      setCertificate(cert);
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
      // Use html2canvas to capture the certificate template
      const { default: html2canvas } = await import('html2canvas');
      
      const element = document.getElementById('certificatePreview');
      if (!element) {
        setError('Failed to render certificate');
        setDownloading(false);
        return;
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 1,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        logging: false,
      } as any);

      // Download the PNG
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
      });
    } catch (err) {
      setError('Failed to download certificate');
      setDownloading(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-slate">Loading certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-white hover:opacity-80 transition">
              ← Back Home
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-coral mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-sage text-white font-space-grotesk font-bold rounded-lg hover:opacity-90 transition"
          >
            Back Home
          </Link>
        </main>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-ink-navy text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-80 transition">
            ← Back Home
          </Link>
          <h1 className="text-2xl font-space-grotesk font-bold">Certificate</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Certificate Info */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-ink-slate font-inter mb-1">Recipient</p>
              <p className="text-3xl font-space-grotesk font-bold text-ink-navy mb-6">
                {certificate.recipient_name}
              </p>

              <p className="text-sm text-ink-slate font-inter mb-1">Section</p>
              <p className="text-xl font-space-grotesk font-bold text-ink-navy mb-6">
                {section?.name || 'Math Olympiad'}
              </p>

              <p className="text-sm text-ink-slate font-inter mb-1">Round Type</p>
              <p className="text-xl font-space-grotesk font-bold text-ink-navy mb-6">
                {certificate.round_type === 'grid'
                  ? 'Grid Round'
                  : certificate.round_type === 'tiered'
                    ? 'Tiered Round'
                    : 'Speed Sprint'}
              </p>
            </div>

            <div>
              <p className="text-sm text-ink-slate font-inter mb-1">Mode</p>
              <p className="text-xl font-space-grotesk font-bold text-sage mb-6 capitalize">
                {certificate.mode} Mode
              </p>

              <p className="text-sm text-ink-slate font-inter mb-1">Score</p>
              <p className="text-4xl font-space-grotesk font-bold text-marigold mb-6">
                {certificate.score}
              </p>

              <p className="text-sm text-ink-slate font-inter mb-1">Issued</p>
              <p className="text-lg font-inter text-ink-navy">
                {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Preview (hidden, used for PNG generation) */}
        <div id="certificatePreview" style={{ display: 'none' }}>
          <CertificateTemplate certificate={certificate} section={section} />
        </div>

        {/* Download Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-8 py-4 bg-marigold text-white font-space-grotesk font-bold text-lg rounded-lg hover:opacity-90 disabled:opacity-50 transition inline-block"
          >
            {downloading ? '⬇ Generating PNG...' : '⬇ Download as PNG'}
          </button>
        </div>

        {/* Preview Info */}
        <div className="text-center text-ink-slate text-sm bg-blue-50 rounded-lg p-4">
          <p className="mb-2">📋 Certificate Preview</p>
          <p>Your certificate will be downloaded as a high-quality PNG image (1200×800px, print-ready at 150 DPI).</p>
        </div>
      </main>
    </div>
  );
}

// Certificate template component
function CertificateTemplate({
  certificate,
  section,
}: {
  certificate: Certificate;
  section: Section | null;
}) {
  return (
    <div
      style={{
        width: '1200px',
        height: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'relative',
        padding: '0',
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        color: '#1a1d2e',
      }}
    >
      {/* Outer border */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          border: '20px solid #1a1d2e',
        }}
      />

      {/* Inner border */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          right: '30px',
          bottom: '30px',
          border: '6px solid #f5a623',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '60px', fontWeight: 'bold', fontFamily: "'Space Grotesk'" }}>
          Certificate of Achievement
        </div>

        <div style={{ fontSize: '20px', fontFamily: "'Inter'", color: '#3d3f4d' }}>
          {certificate.mode === 'practice' ? 'Practice Mode' : 'Competition Mode'}
        </div>

        <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: "'Space Grotesk'" }}>
          {section?.name || 'Math Olympiad'}
        </div>

        <div style={{ fontSize: '18px', fontFamily: "'Inter'", color: '#3d3f4d' }}>
          {certificate.round_type === 'grid'
            ? 'Grid Round'
            : certificate.round_type === 'tiered'
              ? 'Tiered Round'
              : 'Speed Sprint'}
        </div>

        <div style={{ fontSize: '18px', fontFamily: "'Inter'", marginTop: '20px' }}>
          This certificate is proudly presented to
        </div>

        <div style={{ fontSize: '54px', fontWeight: 'bold', fontFamily: "'Space Grotesk'", marginTop: '10px' }}>
          {certificate.recipient_name}
        </div>

        <div style={{ fontSize: '16px', fontFamily: "'Inter'", color: '#3d3f4d', marginTop: '15px' }}>
          for demonstrating exceptional mathematical skill and perseverance
        </div>

        <div
          style={{
            fontSize: '44px',
            fontWeight: 'bold',
            fontFamily: "'Space Grotesk'",
            color: '#7cb342',
            marginTop: '20px',
          }}
        >
          Score: {certificate.score}
        </div>

        <div style={{ fontSize: '16px', fontFamily: "'Inter'", color: '#3d3f4d', marginTop: '15px' }}>
          Issued:{' '}
          {new Date(certificate.issued_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Seal */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: '#1a1d2e',
          border: '3px solid #f5a623',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          fontFamily: "'Space Grotesk'",
          color: '#ffffff',
        }}
      >
        SW
      </div>

      {/* Footer line */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '100px',
          right: '100px',
          height: '2px',
          backgroundColor: '#1a1d2e',
        }}
      />

      {/* Footer text */}
      <div
        style={{
          position: 'absolute',
          bottom: '15px',
          left: '0',
          right: '0',
          fontSize: '14px',
          fontFamily: "'Inter'",
          color: '#3d3f4d',
          textAlign: 'center',
        }}
      >
        © 2026 Seat of Wisdom Math Olympiad • www.seatofwisdom.edu
      </div>
    </div>
  );
}

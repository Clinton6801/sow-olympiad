import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

// Cache for font buffers (loaded once, reused for all requests)
let fontCache: Record<string, ArrayBuffer> = {};

async function getFontBuffer(fontUrl: string): Promise<ArrayBuffer> {
  if (fontCache[fontUrl]) {
    return fontCache[fontUrl];
  }

  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${fontUrl}`);
  }

  const buffer = await response.arrayBuffer();
  fontCache[fontUrl] = buffer;
  return buffer;
}

async function getLogoAsDataURI(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64 = logoBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.warn('Could not load logo image:', err);
    return ''; // Fallback: render without logo
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      recipient_name,
      section_name,
      tier_color,
      round_type,
      score,
      max_score,
      rank,
      issue_date,
      mode,
    } = body;

    // Fetch Google Fonts (cached after first request)
    const serifFontBuffer = await getFontBuffer(
      'https://fonts.gstatic.com/s/lora/v35/0QIAJa1_720pBPzIAsiIhXyXzZOvbVL2BkWLKtFdWns.ttf'
    );
    const sansFontBuffer = await getFontBuffer(
      'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxK.ttf'
    );

    // Get logo as data URI
    const logoDataURI = await getLogoAsDataURI();

    const getRankDisplay = (): string => {
      if (mode === 'practice') return 'Practice complete';
      if (rank === 1) return '1st place';
      if (rank === 2) return '2nd place';
      if (rank === 3) return '3rd place';
      return 'Participant';
    };

    const roundTypeDisplay =
      round_type === 'grid'
        ? 'Grid Round'
        : round_type === 'tiered'
          ? 'Tiered Round'
          : 'Speed Sprint';

    const scoreDisplay = max_score ? `${score}/${max_score}` : `${score}`;

    const issueDateFormatted = new Date(issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build JSX-like object tree for satori
    const certificateDesign = {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '800px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          position: 'relative',
          color: '#14213D',
          boxSizing: 'border-box',
          fontFamily: 'Lora, serif',
          padding: '0px',
          margin: '0px',
        },
        children: [
          // Outer dark border
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '18px',
                left: '18px',
                right: '18px',
                bottom: '18px',
                border: '8px solid #14213D',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              },
            },
          },
          // Inner gold border
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '26px',
                left: '26px',
                right: '26px',
                bottom: '26px',
                border: '2px solid #F4A73B',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              },
            },
          },
          // Left logo seal
          ...(logoDataURI
            ? [
                {
                  type: 'img',
                  props: {
                    src: logoDataURI,
                    alt: '',
                    style: {
                      position: 'absolute',
                      top: '36px',
                      left: '36px',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid #F4A73B',
                      objectFit: 'cover',
                      zIndex: 10,
                    },
                  },
                },
              ]
            : []),
          // Right logo seal
          ...(logoDataURI
            ? [
                {
                  type: 'img',
                  props: {
                    src: logoDataURI,
                    alt: '',
                    style: {
                      position: 'absolute',
                      top: '36px',
                      right: '36px',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid #F4A73B',
                      objectFit: 'cover',
                      zIndex: 10,
                    },
                  },
                },
              ]
            : []),
          // Header section
          {
            type: 'div',
            props: {
              style: {
                textAlign: 'center',
                paddingTop: '48px',
                paddingBottom: '12px',
                position: 'relative',
                zIndex: 5,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#14213D',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                      fontFamily: 'Lora, serif',
                      lineHeight: '1.2',
                    },
                    children: 'SEAT OF WISDOM GROUP OF SCHOOLS',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '12px',
                      color: '#999',
                      letterSpacing: '1px',
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.2',
                    },
                    children: 'EXCELLENCE · KNOWLEDGE · CHARACTER',
                  },
                },
              ],
            },
          },
          // Divider line with diamond
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                paddingLeft: '60px',
                paddingRight: '60px',
                marginBottom: '10px',
                position: 'relative',
                zIndex: 5,
              },
              children: [
                { type: 'div', props: { style: { flex: 1, height: '1px', backgroundColor: '#14213D' } } },
                { type: 'div', props: { style: { width: '9px', height: '9px', backgroundColor: '#F4A73B', transform: 'rotate(45deg)' } } },
                { type: 'div', props: { style: { flex: 1, height: '1px', backgroundColor: '#14213D' } } },
              ],
            },
          },
          // Gradient bar (4px thin line)
          {
            type: 'div',
            props: {
              style: {
                height: '4px',
                background: 'linear-gradient(to right, #4CAF7D, #6C4EE3, #FF6B5B, #F4A73B)',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 5,
              },
            },
          },
          // Main content area
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '80px',
                paddingRight: '80px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 5,
                overflow: 'hidden',
              },
              children: [
                // Certificate title
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '40px',
                      fontWeight: 'bold',
                      color: '#14213D',
                      marginBottom: '6px',
                      fontFamily: 'Lora, serif',
                      lineHeight: '1.2',
                    },
                    children: 'CERTIFICATE OF ACHIEVEMENT',
                  },
                },
                // Subtitle
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '16px',
                      color: '#14213D',
                      marginBottom: '12px',
                      fontWeight: 600,
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.2',
                    },
                    children: `MATH OLYMPIAD — ${section_name.toUpperCase()}`,
                  },
                },
                // Intro text
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: '#666',
                      marginBottom: '10px',
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.2',
                    },
                    children: 'This is to certify that',
                  },
                },
                // Recipient name
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '38px',
                      fontWeight: 'bold',
                      color: tier_color,
                      marginBottom: '12px',
                      fontFamily: 'Lora, serif',
                      lineHeight: '1.2',
                    },
                    children: recipient_name,
                  },
                },
                // Rank badge
                {
                  type: 'div',
                  props: {
                    style: {
                      backgroundColor: `${tier_color}20`,
                      border: `2px solid ${tier_color}`,
                      borderRadius: '20px',
                      padding: '6px 14px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: tier_color,
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.2',
                    },
                    children: getRankDisplay(),
                  },
                },
                // Achievement text
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '6px',
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.3',
                    },
                    children: 'has demonstrated outstanding mathematical skill and achieved',
                  },
                },
                // Score display
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '42px',
                            fontWeight: 'bold',
                            color: '#14213D',
                            fontFamily: 'monospace',
                            lineHeight: '1',
                          },
                          children: scoreDisplay,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '13px',
                            color: '#666',
                            fontFamily: 'monospace',
                            lineHeight: '1.2',
                          },
                          children: 'points',
                        },
                      },
                    ],
                  },
                },
                // Round type
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '13px',
                      color: '#666',
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: '1.2',
                    },
                    children: `in the ${roundTypeDisplay} Round`,
                  },
                },
              ],
            },
          },
          // Separator line
          {
            type: 'div',
            props: {
              style: {
                height: '1px',
                backgroundColor: '#14213D',
                marginLeft: '80px',
                marginRight: '80px',
                position: 'relative',
                zIndex: 5,
              },
            },
          },
          // Signature section (3-column grid)
          {
            type: 'div',
            props: {
              style: {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '40px',
                padding: '16px 80px',
                position: 'relative',
                zIndex: 5,
              },
              children: [
                // Left: signature line
                {
                  type: 'div',
                  props: {
                    style: { textAlign: 'center' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            height: '1px',
                            backgroundColor: '#14213D',
                            marginBottom: '4px',
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '11px',
                            color: '#666',
                            fontFamily: 'Roboto, sans-serif',
                            lineHeight: '1.2',
                          },
                          children: 'Host / Teacher',
                        },
                      },
                    ],
                  },
                },
                // Center: date
                {
                  type: 'div',
                  props: {
                    style: { textAlign: 'center' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '12px',
                            color: '#14213D',
                            marginBottom: '4px',
                            fontFamily: 'monospace',
                            lineHeight: '1.2',
                          },
                          children: issueDateFormatted,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '11px',
                            color: '#666',
                            fontFamily: 'Roboto, sans-serif',
                            lineHeight: '1.2',
                          },
                          children: 'Date',
                        },
                      },
                    ],
                  },
                },
                // Right: signature line
                {
                  type: 'div',
                  props: {
                    style: { textAlign: 'center' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            height: '1px',
                            backgroundColor: '#14213D',
                            marginBottom: '4px',
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '11px',
                            color: '#666',
                            fontFamily: 'Roboto, sans-serif',
                            lineHeight: '1.2',
                          },
                          children: 'Principal',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Decorative dots at bottom
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                paddingBottom: '10px',
                position: 'relative',
                zIndex: 5,
              },
              children: [0, 1, 2, 3, 4].map(() => ({
                type: 'div',
                props: {
                  style: {
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#F4A73B',
                    borderRadius: '50%',
                  },
                },
              })),
            },
          },
        ],
      },
    };

    // Render to SVG using satori with real fonts
    const svg = await satori(certificateDesign as any, {
      width: 1200,
      height: 800,
      fonts: [
        {
          name: 'Lora',
          data: serifFontBuffer,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Roboto',
          data: sansFontBuffer,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'monospace',
          data: sansFontBuffer,
          weight: 400,
          style: 'normal',
        },
      ],
    });

    // Convert SVG to PNG using resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'original',
      },
      dpi: 96,
    });

    const pngBuffer = resvg.render().asPng();

    // Return PNG buffer as response
    return new NextResponse(pngBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="certificate.png"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Certificate render error:', err);
    return NextResponse.json(
      {
        error: 'Failed to render certificate',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Every solid colour the canvas scenes draw, as 6-digit hex. The draw code applies alpha to these
// but never uses a colour that is not here. Values start from the preview's SCENES and are
// darkened (RGB scaled toward black, hue kept) wherever tests/contrast.test.ts needed it.
export const COLORS = {
  sky: {
    top0: '#7E9FBE', top1: '#3A3A66', top2: '#151325', top3: '#0D0B14',
    mid0: '#D2B994', mid1: '#C0687A', mid2: '#3A2340', mid3: '#1C1424',
    bot0: '#EDAF76', bot1: '#F08A55', bot2: '#6E3A3A', bot3: '#2E1F27',
    sunGlow: '#E5B37D', sunCore: '#CABB9E', star: '#C1BCB2',
    sil0: '#6A5A6A', sil1: '#2E2333', sil2: '#090708',
    winA: '#EDB06F', winB: '#D1BB62', haze: '#171313',
  },
  lagos: {
    g0: '#2A1C30', g1: '#9A4D4A', g2: '#E18A52', g3: '#3A2422', g4: '#1B1110',
    glow: '#FDA963', lightA: '#E5B374', lightB: '#FCA86C', lightC: '#CEBA99',
    street: '#120B0A',
  },
  rain: {
    g0: '#161C27', g1: '#25202B', cool: '#8CAAD7', warm: '#E6A56E',
    drop: '#B5BDCA', runHead: '#B6BDC6',
  },
} as const;

export const PALETTE: Record<'sky' | 'lagos' | 'rain', readonly string[]> = {
  sky: Object.values(COLORS.sky),
  lagos: Object.values(COLORS.lagos),
  rain: Object.values(COLORS.rain),
};

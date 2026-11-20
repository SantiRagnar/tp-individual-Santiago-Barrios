/**
 * Tokens del design system de AI Ticket It.
 * Fuente: "Diseño de AI Ticket It/design-system.md". Un solo tema, oscuro.
 * No usar colores, medidas ni radios sueltos que ya existan acá.
 */

export const color = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  textLabel: '#aeaeb5',
  textMuted: '#909199',
  accent: '#9184d9',
  divider: 'rgba(233,233,237,0.16)',
  scrim: 'rgba(41,43,49,0.5)',
  scrimStrong: 'rgba(41,43,49,0.6)',
  neutral100: '#f3f5fe',
  neutral200: '#e4e7f5',
  neutral300: '#cfd3e5',
  neutral400: '#b2b6ca',
  neutral500: '#9397ab',
  neutral600: '#75798c',
  neutral700: '#595d6c',
  neutral800: '#3f424d',
  neutral900: '#292b31',
  accent100: '#f5f4ff',
  accent200: '#e7e5fe',
  accent300: '#d2cefd',
  accent400: '#b5abfc',
  accent500: '#968ae0',
  accent600: '#796cbf',
  accent700: '#5d5294',
  accent800: '#423a6a',
  accent900: '#2b2741',
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
} as const;

type EstiloTexto = {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

function estilo(tamano: number, interlinea: number, peso: 400 | 500, tracking = 0): EstiloTexto {
  return {
    fontSize: tamano,
    lineHeight: Math.round(tamano * interlinea),
    fontFamily: peso === 500 ? fontFamily.medium : fontFamily.regular,
    ...(tracking ? { letterSpacing: tamano * tracking } : {}),
  };
}

export const type = {
  wordmark: estilo(30, 1.1, 500, -0.02),
  wordmarkDesktop: estilo(26, 1.1, 500, -0.02),
  h3: estilo(25, 1.12, 500),
  h4: estilo(20, 1.12, 500),
  h5: estilo(16, 1.12, 500),
  screenTitle: estilo(17, 1.25, 500),
  cardTitle: estilo(17, 1.2, 500),
  body: estilo(15, 1.55, 400),
  bodySm: estilo(14, 1.5, 400),
  caption: estilo(13, 1.45, 400),
  label: estilo(12, 1.4, 400),
  meta: estilo(11, 1.4, 400),
  overline: { ...estilo(13, 1.12, 500, 0.08), textTransform: 'uppercase' as const },
  kicker: { ...estilo(10, 1.4, 400, 0.1), textTransform: 'uppercase' as const },
} as const;

export const space = {
  s1: 2.8,
  s2: 5.6,
  s3: 8.4,
  s4: 11.2,
  s6: 16.8,
  s8: 22.4,
  gapTight: 6,
  gapStack: 10,
  gapSection: 14,
  gapGrid: 20,
  padCard: 14,
  padScreenX: 20,
  padFooterBottom: 30,
  padPageDesktop: 32,
} as const;

export const size = {
  touchTarget: 44,
  ctaHeight: 46,
  controlHeight: 36,
  chipHeight: 34,
  tabHeight: 48,
  avatarLg: 52,
  avatarMd: 44,
  avatarSm: 36,
  frameMobileW: 390,
  frameDesktopW: 1280,
} as const;

export const radius = {
  sm: 4,
  tag: 6,
  md: 8,
  lg: 14,
  sheet: 28,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 0 0 1px #3f424d',
  md: '0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)',
  lg: '0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)',
} as const;

/** Opacidad de lo deshabilitado: se ve, no se esconde. */
export const opacidadDeshabilitado = 0.45;

export const iconSize = {
  barra: 20,
  pestana: 22,
  enLinea: 16,
} as const;

/** Tintes de interacción (design-system § Estados): hover 7–12%, presionado 14–22%. */
export const tinte = {
  acentoHover: 'rgba(145,132,217,0.10)',
  acentoPresionado: 'rgba(145,132,217,0.18)',
  textoHover: 'rgba(233,233,237,0.08)',
  textoPresionado: 'rgba(233,233,237,0.16)',
} as const;

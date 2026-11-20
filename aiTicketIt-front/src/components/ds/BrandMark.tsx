import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { color, radius, space, type } from '@/theme/tokens';

type Props = {
  /** `compacto` = 150px (login desktop); por defecto 200px (login mobile). */
  compacto?: boolean;
};

/**
 * Marca de las pantallas de ingreso: escenario con telón, festón y dos haces de luz
 * dibujado con la rampa de acento, y el wordmark "AI Ticket It" con brillo accent-500.
 */
export function BrandMark({ compacto = false }: Props) {
  const ancho = compacto ? 150 : 200;
  const alto = Math.round(ancho * 0.6);

  return (
    <View style={styles.contenedor} accessibilityRole="header" accessibilityLabel="AI Ticket It">
      <Svg width={ancho} height={alto} viewBox="0 0 200 120" accessibilityElementsHidden>
        <Defs>
          <LinearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color.accent400} stopOpacity="0.55" />
            <Stop offset="1" stopColor={color.accent400} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="telon" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color.accent800} />
            <Stop offset="1" stopColor={color.accent700} />
          </LinearGradient>
        </Defs>
        {/* Sala */}
        <Rect x="0" y="0" width="200" height="120" rx={radius.lg} fill={color.accent900} />
        {/* Piso del escenario */}
        <Ellipse cx="100" cy="108" rx="70" ry="8" fill={color.accent800} />
        {/* Haces de luz */}
        <Path d="M38 14 L118 106 L84 106 Z" fill="url(#haz)" />
        <Path d="M162 14 L82 106 L116 106 Z" fill="url(#haz)" />
        {/* Telones laterales */}
        <Path d="M0 14 L30 14 C26 50 34 80 22 116 L0 116 Z" fill="url(#telon)" />
        <Path d="M200 14 L170 14 C174 50 166 80 178 116 L200 116 Z" fill="url(#telon)" />
        {/* Festón */}
        <Path
          d="M0 0 H200 V14 Q187 28 175 14 Q162 28 150 14 Q137 28 125 14 Q112 28 100 14 Q87 28 75 14 Q62 28 50 14 Q37 28 25 14 Q12 28 0 14 Z"
          fill={color.accent600}
        />
      </Svg>
      <Text
        style={[
          compacto ? type.wordmarkDesktop : type.wordmark,
          styles.wordmark,
        ]}>
        AI Ticket It
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // El wordmark es lo único centrado del sistema.
  contenedor: { alignItems: 'center', gap: space.s3 },
  wordmark: {
    color: color.text,
    textAlign: 'center',
    textShadowColor: color.accent500,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
});

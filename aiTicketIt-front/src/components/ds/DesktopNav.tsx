import { Ticket } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ds/Avatar';
import { color, iconSize, size, space, type } from '@/theme/tokens';

type Props = {
  /** Nombre de la compañía del organizador con sesión. */
  compania: string;
};

/** Header de las pantallas de Organizadores: marca, link "Mis eventos" (actual) y compañía + avatar. */
export function DesktopNav({ compania }: Props) {
  return (
    <View style={styles.nav} accessibilityRole="header">
      <View style={styles.izquierda}>
        <View style={styles.marca}>
          <Ticket size={iconSize.barra} color={color.accent} weight="fill" />
          <Text style={[type.h5, { color: color.text }]}>AI Ticket It</Text>
        </View>
        <Text style={[type.bodySm, { color: color.accent }]} accessibilityRole="link" aria-current="page">
          Mis eventos
        </Text>
      </View>
      <View style={styles.derecha}>
        <Text style={[type.bodySm, { color: color.text }]} numberOfLines={1}>
          {compania}
        </Text>
        <Avatar nombre={compania} tamano={size.avatarSm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s6,
    paddingHorizontal: space.padPageDesktop,
    paddingVertical: space.s4,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  izquierda: { flexDirection: 'row', alignItems: 'center', gap: space.s8, flexShrink: 1 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: space.gapTight },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: space.s3, flexShrink: 1 },
});

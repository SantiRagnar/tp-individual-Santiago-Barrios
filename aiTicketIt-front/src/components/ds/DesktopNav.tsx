import { Link, usePathname } from 'expo-router';
import { CaretDown, SignOut, Ticket } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ds/Avatar';
import { useSesion } from '@/sesion/SesionProvider';
import { color, iconSize, radius, shadow, size, space, tinte, type } from '@/theme/tokens';

type Props = {
  /** Nombre de la compañía del organizador con sesión. */
  compania: string;
};

const MIS_EVENTOS = '/organizadores/mis-eventos';
const ANCHO_MENU = 240;

type EstadoInteraccion = { pressed: boolean; hovered?: boolean; focused?: boolean };

/**
 * Header de las pantallas de Organizadores: marca, link "Mis eventos" y compañía + avatar, que abre el menú
 * de la cuenta con Cerrar sesión (design-system.md § DesktopNav).
 */
export function DesktopNav({ compania }: Props) {
  const actual = usePathname() === MIS_EVENTOS;
  const { organizador, cerrarSesion } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const [altoNav, setAltoNav] = useState(0);

  const salir = () => {
    setAbierto(false);
    // Al borrarse la sesión, el Stack.Protected del layout lleva al Ingreso del panel.
    void cerrarSesion('organizador');
  };

  return (
    <View style={styles.nav} accessibilityRole="header" onLayout={(e) => setAltoNav(e.nativeEvent.layout.height)}>
      <View style={styles.izquierda}>
        <View style={styles.marca}>
          <Ticket size={iconSize.barra} color={color.accent} weight="fill" />
          <Text style={[type.h5, { color: color.text }]}>AI Ticket It</Text>
        </View>
        <Link href={MIS_EVENTOS} aria-current={actual ? 'page' : undefined}>
          <Text style={[type.bodySm, { color: actual ? color.accent : color.text }]}>Mis eventos</Text>
        </Link>
      </View>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel="Menú de la cuenta"
        aria-expanded={abierto}
        style={({ pressed, hovered, focused }: EstadoInteraccion) => [
          styles.derecha,
          hovered && { backgroundColor: tinte.textoHover },
          pressed && { backgroundColor: tinte.textoPresionado },
          focused && Platform.OS === 'web' && styles.foco,
        ]}>
        <Text style={[type.bodySm, { color: color.text }]} numberOfLines={1}>
          {compania}
        </Text>
        <Avatar nombre={compania} tamano={size.avatarSm} />
        <CaretDown size={iconSize.enLinea} color={color.textMuted} />
      </Pressable>

      <Modal transparent visible={abierto} animationType="none" onRequestClose={() => setAbierto(false)}>
        {/* Clic afuera cierra el menú. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} accessibilityLabel="Cerrar menú" />
        <View style={[styles.menu, { top: altoNav - space.s2 }]} accessibilityRole="menu">
          <View style={styles.cuenta}>
            <Text style={[type.bodySm, styles.nombre]} numberOfLines={1}>
              {compania}
            </Text>
            {organizador ? (
              <Text style={[type.caption, { color: color.textMuted }]} numberOfLines={1}>
                {organizador.organizador.email}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={salir}
            accessibilityRole="menuitem"
            style={({ pressed, hovered, focused }: EstadoInteraccion) => [
              styles.opcion,
              hovered && { backgroundColor: tinte.textoHover },
              pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <SignOut size={iconSize.barra} color={color.textLabel} />
            <Text style={[type.bodySm, { color: color.text }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </Modal>
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
  derecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    flexShrink: 1,
    paddingVertical: space.s1,
    paddingLeft: space.s3,
    paddingRight: space.s2,
    borderRadius: radius.pill,
  },
  menu: {
    position: 'absolute',
    right: space.padPageDesktop,
    width: ANCHO_MENU,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    boxShadow: shadow.md,
    paddingVertical: space.s2,
  },
  cuenta: {
    paddingHorizontal: space.s4,
    paddingTop: space.s2,
    paddingBottom: space.s3,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
    gap: space.s1,
  },
  nombre: { color: color.text, fontWeight: '500' },
  opcion: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingHorizontal: space.s4,
    marginTop: space.s2,
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});

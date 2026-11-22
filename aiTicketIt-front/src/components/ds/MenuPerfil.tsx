import { CaretRight, Heart, Receipt, UserCircle, type IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ds/Avatar';
import { Button } from '@/components/ds/Button';
import { color, iconSize, size, space, tinte, type } from '@/theme/tokens';

type Props = {
  nombreCompleto: string;
  onMisCompras: () => void;
  onFavoritos: () => void;
  onCerrarSesion: () => void;
};

/**
 * Contenido de Compradores 03 · Menú de perfil (va dentro de un BottomSheet). Datos personales todavía no
 * tiene pantalla: se ve pero no hace nada hasta su feature (FR-029).
 */
export function MenuPerfil({ nombreCompleto, onMisCompras, onFavoritos, onCerrarSesion }: Props) {
  return (
    <View style={styles.menu}>
      <View style={styles.encabezado}>
        <Avatar nombre={nombreCompleto} tamano={size.avatarLg} />
        <View>
          <Text style={[type.h5, { color: color.text }]}>{nombreCompleto}</Text>
          <Text style={[type.caption, { color: color.textMuted }]}>Mi perfil</Text>
        </View>
      </View>
      <View>
        <Fila Icono={Receipt} texto="Mis compras" onPress={onMisCompras} />
        <Fila Icono={Heart} texto="Favoritos" onPress={onFavoritos} />
        {/* Sin acción hasta la feature de datos personales (FR-029). */}
        <Fila Icono={UserCircle} texto="Datos personales" onPress={() => {}} />
      </View>
      <Button variante="ghost" onPress={onCerrarSesion}>
        Cerrar sesión
      </Button>
    </View>
  );
}

function Fila({ Icono, texto, onPress }: { Icono: ComponentType<IconProps>; texto: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.fila,
        hovered && { backgroundColor: tinte.textoHover },
        pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <Icono size={iconSize.barra} color={color.textLabel} />
      <Text style={[type.body, styles.texto]}>{texto}</Text>
      <CaretRight size={iconSize.enLinea} color={color.textMuted} />
    </Pressable>
  );
}

const FILA = 48;

const styles = StyleSheet.create({
  menu: { gap: space.s6 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  fila: { minHeight: FILA, flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  texto: { flex: 1, color: color.text },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});

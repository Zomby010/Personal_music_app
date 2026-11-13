import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

const HUES = ['#8B7CFF', '#FF7C9C', '#4FC3A1', '#F2A65A', '#5AB0F2', '#C77CFF'];

/** Placeholder cover whose colour is picked from the seed, so each song keeps its colour. */
export function CoverArt({ seed, size = 48 }: { seed: string; size?: number }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const color = HUES[hash % HUES.length];
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 6, backgroundColor: color + '33' },
      ]}>
      <Ionicons name="musical-notes" size={size * 0.45} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});

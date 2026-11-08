import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../providers/theme';

// Shared forest-green header with quiet light effects; content scrolls above it.
export function TopFade({ height = 300 }: { height?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height, overflow: 'hidden' }}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['#004C3F', '#003D32', '#C9F5E8', colors.bg]}
        locations={[0, 0.44, 0.82, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <RadialGradient id="topFadeGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#00D6A0" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#00D6A0" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="100%" cy="6%" r="150" fill="url(#topFadeGlow)" />
        <Circle cx="8%" cy="0%" r="95" fill="url(#topFadeGlow)" />
      </Svg>
    </View>
  );
}

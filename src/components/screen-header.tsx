import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={back}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
          marginRight: 12,
        }}
      >
        <ArrowLeft size={19} color="#FFFFFF" strokeWidth={2.3} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800', letterSpacing: -0.35 }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, color: 'rgba(255,255,255,0.68)', fontSize: 12 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </View>
  );
}

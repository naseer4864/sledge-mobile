import { useState, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, View, Text } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useTheme } from '../../providers/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './button';

export type FeedbackKind = 'success' | 'error';

/** Bottom sheet for concise success/error feedback. */
export function FeedbackModal({ visible, kind, title, message, buttonLabel = 'Done', onClose }: {
  visible: boolean; kind: FeedbackKind; title: string; message?: string;
  buttonLabel?: string; onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(420));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const closing = useRef(false);
  const color = kind === 'success' ? '#12B76A' : '#F04438';
  const Icon = kind === 'success' ? CheckCircle2 : XCircle;

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    translateY.setValue(420);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 250, mass: 0.9, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, backdropOpacity]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 420, duration: 210, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
      closing.current = false;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7,23,20,0.55)', opacity: backdropOpacity }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={close} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <Animated.View accessibilityViewIsModal style={{
          width: '100%',
          maxHeight: '78%',
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 24,
          paddingTop: 11,
          paddingBottom: Math.max(insets.bottom, 16) + 14,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#071714',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 20,
          transform: [{ translateY }],
        }}>
          <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 22 }} />
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: `${color}14`, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={34} color={color} strokeWidth={2.2} />
            </View>
            <Text style={{ marginTop: 16, fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.3 }}>{title}</Text>
            {message ? <Text style={{ marginTop: 8, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 }}>{message}</Text> : null}
          </View>
          <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
            <Button label={buttonLabel} size="lg" onPress={close} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export interface FeedbackState { kind: FeedbackKind; title: string; message?: string; onDismiss?: () => void }

/** `const { feedback, show, hide, modal } = useFeedback()` then render `{modal}`. */
export function useFeedback() {
  const [state, setState] = useState<FeedbackState | null>(null);
  const show = useCallback((f: FeedbackState) => setState(f), []);
  const hide = useCallback(() => {
    const onDismiss = state?.onDismiss;
    setState(null);
    onDismiss?.();
  }, [state]);
  const modal = (
    <FeedbackModal
      visible={state !== null}
      kind={state?.kind ?? 'success'}
      title={state?.title ?? ''}
      message={state?.message}
      onClose={hide}
    />
  );
  return { feedback: state, show, hide, modal };
}

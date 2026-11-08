import { Modal, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../providers/theme';
import { Button } from './button';

/**
 * Bottom-sheet confirmation modal — slides up over a dimmed backdrop.
 */
export function ConfirmSheet({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, onConfirm, onCancel }: {
  visible: boolean; title: string; message?: string;
  confirmLabel?: string; cancelLabel?: string; destructive?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,20,18,0.5)' }} onPress={onCancel} accessibilityLabel="Dismiss" />
        <View style={{
          backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34,
        }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 20 }} />
          <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>{title}</Text>
          {message ? <Text style={{ marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 21 }}>{message}</Text> : null}
          <View style={{ marginTop: 24, gap: 12 }}>
            <Button label={confirmLabel} size="lg" variant={destructive ? 'destructive' : 'default'} onPress={onConfirm} />
            <Button label={cancelLabel} size="lg" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

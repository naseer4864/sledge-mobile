import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, BellOff, Smartphone, ExternalLink } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../src/providers/theme';
import { usePushDevices, getPushPrefs, setPushPrefs, registerForPush } from '../src/services/push';
import { Button } from '../src/components/ui/button';
import { ApiError } from '../src/services/api';
import { LoadingState, ErrorState } from '../src/components/states';
import { TopFade } from '../src/components/top-fade';
import { useFeedback } from '../src/components/ui/feedback-modal';

type Perm = 'unknown' | 'granted' | 'denied';

export default function PushSettings() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [perm, setPerm] = useState<Perm>('unknown');
  const [explained, setExplained] = useState(false);
  const { show, modal } = useFeedback();
  const devices = usePushDevices();
  const prefs = useQuery({ queryKey: ['push-prefs'], queryFn: getPushPrefs });
  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({});

  const ask = useMutation({
    mutationFn: registerForPush,
    onSuccess: (r) => {
      setPerm(r.ok ? 'granted' : r.reason === 'denied' ? 'denied' : 'unknown');
      if (r.ok) qc.invalidateQueries({ queryKey: ['push-devices'] });
      show(r.ok
        ? { kind: 'success', title: 'Notifications enabled', message: 'This device can now receive important account updates.' }
        : { kind: 'error', title: r.reason === 'denied' ? 'Permission denied' : 'Push unavailable', message: r.reason === 'denied' ? 'Allow notifications in your device settings to receive alerts.' : 'Push notifications are unavailable in this build.' });
    },
    onError: () => show({ kind: 'error', title: 'Could not enable notifications', message: 'Please try again or check your device settings.' }),
  });
  const save = useMutation({
    mutationFn: () => setPushPrefs(localPrefs),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['push-prefs'] }); show({ kind: 'success', title: 'Preferences saved', message: 'Your notification preferences have been updated.' }); },
    onError: (e) => show({ kind: 'error', title: 'Preferences not saved', message: e instanceof ApiError ? e.message : 'Please try saving again.' }),
  });

  const prefObj = (prefs.data ?? {}) as Record<string, unknown>;
  const prefKeys = Object.keys(prefObj).filter((k) => typeof prefObj[k] === 'boolean');
  const registered = devices.data?.length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* OS permission — distinct from backend prefs */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {perm === 'granted' ? <Bell size={18} color="#00B887" /> : perm === 'denied' ? <BellOff size={18} color="#F04438" /> : <Bell size={18} color={colors.textMuted} />}
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}>Device notifications</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: perm === 'granted' ? '#00B887' : perm === 'denied' ? '#F04438' : colors.textMuted }}>
              {perm === 'granted' ? 'Enabled' : perm === 'denied' ? 'Denied' : 'Not set'}
            </Text>
          </View>
          {!explained && perm === 'unknown' ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
                Get notified about deposits, withdrawals, orders and important account updates. You can turn this off anytime in Settings.
              </Text>
              <Button label="Enable notifications" size="sm" style={{ marginTop: 10 }} loading={ask.isPending} onPress={() => { setExplained(true); ask.mutate(); }} />
              <Pressable onPress={() => setExplained(true)} style={{ marginTop: 8, alignSelf: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Not now</Text>
              </Pressable>
            </View>
          ) : perm === 'denied' ? (
            <Pressable onPress={() => Linking.openSettings()} accessibilityLabel="Open settings"
              style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F0443812' }}>
              <ExternalLink size={14} color="#F04438" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#F04438' }}>Open device settings</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Device registration — distinct from OS permission */}
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
          <Smartphone size={18} color={registered ? '#00B887' : colors.textMuted} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text }}>Device registered</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: registered ? '#00B887' : colors.textMuted }}>{registered ? `${registered} device${registered > 1 ? 's' : ''}` : 'Not registered'}</Text>
        </View>

        {/* Backend push preferences */}
        {prefs.isLoading ? <LoadingState /> : prefs.error ? <ErrorState description="Could not load preferences." onRetry={prefs.refetch} /> : prefKeys.length ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Push preferences</Text>
            <View style={{ marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              {prefKeys.map((k) => (
                <Pressable key={k} onPress={() => setLocalPrefs({ ...localPrefs, [k]: !(localPrefs[k] ?? prefObj[k]) })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: k === prefKeys[prefKeys.length - 1] ? 0 : 1, borderBottomColor: colors.border }}>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.text, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</Text>
                  <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: (localPrefs[k] ?? prefObj[k]) ? '#00B887' : colors.border, justifyContent: 'center', paddingHorizontal: 3 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignSelf: (localPrefs[k] ?? prefObj[k]) ? 'flex-end' : 'flex-start' }} />
                  </View>
                </Pressable>
              ))}
            </View>
            <Button label="Save preferences" size="sm" style={{ marginTop: 12 }} loading={save.isPending} disabled={Object.keys(localPrefs).length === 0 || save.isPending} onPress={() => save.mutate()} />
          </View>
        ) : (
          <View style={{ marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>No push preferences are exposed by the backend.</Text>
          </View>
        )}

      </ScrollView>
      {modal}
    </SafeAreaView>
  );
}

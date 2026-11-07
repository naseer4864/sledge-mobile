import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, LifeBuoy, Plus } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useTickets, createTicket, TICKET_STATUS } from '../../src/services/support';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

// Must match backend SUPPORT_CATEGORIES — invalid categories are rejected.
const CATS = ['account', 'deposits', 'withdrawals', 'trading', 'kyc', 'savings', 'gift_cards', 'security', 'other'];

export default function Support() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const d = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cat, setCat] = useState('other');
  const [err, setErr] = useState('');
  const [idem] = useState(() => Crypto.randomUUID());
  const create = useMutation({
    mutationFn: () => createTicket(subject, body, cat, idem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['support-tickets'] }); setShowForm(false); setSubject(''); setBody(''); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not create ticket'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', flex: 1 }}>Support</Text>
          <Pressable onPress={() => setShowForm(!showForm)} accessibilityLabel="New ticket" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Plus size={15} color="#00E0A4" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#00E0A4' }}>New</Text>
          </Pressable>
        </View>
        <ScrollView refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={async () => { await d.refetch(); }} tintColor="#00B894" />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {showForm ? (
            <View style={{ gap: 10, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
              <Input label="Subject" placeholder="What's the issue?" value={subject} onChangeText={setSubject} />
              <Input label="Description" placeholder="Tell us what happened…" value={body} onChangeText={setBody} multiline numberOfLines={4} style={{ height: 90, textAlignVertical: 'top' }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {CATS.map((c) => (
                  <Pressable key={c} onPress={() => setCat(c)} accessibilityState={{ selected: cat === c }}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: cat === c ? '#00B894' : colors.surfaceMuted, borderWidth: 1, borderColor: cat === c ? '#00B894' : colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: cat === c ? '#fff' : colors.text, textTransform: 'capitalize' }}>{c}</Text>
                  </Pressable>
                ))}
              </View>
              {err ? <Text style={{ color: '#F04438', fontSize: 13 }}>{err}</Text> : null}
              <Button label="Submit ticket" loading={create.isPending} disabled={!subject || body.length < 10 || create.isPending} onPress={() => { setErr(''); create.mutate(); }} />
            </View>
          ) : null}
          {d.isLoading ? <LoadingState /> : d.error ? <ErrorState description="Could not load tickets." onRetry={d.refetch} /> :
            d.data?.length ? d.data.map((t) => {
              const s = TICKET_STATUS[t.status] ?? { label: t.status, color: colors.textMuted };
              return (
                <Pressable key={t.ticketId} onPress={() => router.push(`/support/${t.ticketId}` as never)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#00B89414', alignItems: 'center', justifyContent: 'center' }}>
                    <LifeBuoy size={18} color="#00B894" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{t.subject}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' }}>{t.category ?? 'support'} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: s.color }}>{s.label}</Text>
                </Pressable>
              );
            }) : <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><EmptyState icon={<LifeBuoy size={36} color={colors.textMuted} />} title="No tickets" description="Get in touch and we'll help out." /></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../src/providers/theme';
import { useGiftPurchase, revealCredentials, inquire, refundPurchase, GC_STATUS } from '../../../src/services/giftcards';
import { formatAtomic } from '../../../src/lib/money';
import { Button } from '../../../src/components/ui/button';
import { ApiError } from '../../../src/services/api';
import { LoadingState, ErrorState } from '../../../src/components/states';
import { TopFade } from '../../../src/components/top-fade';

const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');
const money = (s?: string | null) => (s ? `₦${formatAtomic(s, 2)}` : '—');

export default function PurchaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const p = useGiftPurchase(id);
  const [cred, setCred] = useState<{ code: string; pin?: string | null } | null>(null);
  const [credErr, setCredErr] = useState('');
  const [inquiry, setInquiry] = useState<{ type: string; supported: boolean; inquiry?: Record<string, unknown> } | null>(null);
  const [idemRefund] = useState(() => Crypto.randomUUID());
  const d = p.data;

  const reveal = useMutation({
    mutationFn: () => revealCredentials(id!),
    onSuccess: (c) => { setCred({ code: c.code, pin: c.pin }); setCredErr(''); },
    onError: (e) => setCredErr(e instanceof ApiError ? e.message : 'Could not reveal'),
  });
  const inq = useMutation({
    mutationFn: (type: 'balance' | 'redemption') => inquire(id!, type),
    onSuccess: (r, type) => setInquiry({ type, supported: r.supported !== false, inquiry: r.inquiry }),
    onError: (e) => setCredErr(e instanceof ApiError ? e.message : 'Inquiry failed'),
  });
  const refund = useMutation({
    mutationFn: () => refundPurchase(id!, idemRefund),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-purchase', id] }); qc.invalidateQueries({ queryKey: ['gift-purchases'] }); },
    onError: (e) => setCredErr(e instanceof ApiError ? e.message : 'Refund failed'),
  });

  if (p.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (p.error || !d) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Purchase not found." onRetry={p.refetch} /></SafeAreaView>;

  const s = GC_STATUS[d.status] ?? { label: d.status, color: colors.textMuted };
  const refundable = d.status === 'completed' && !['pending_approval', 'pending', 'completed'].includes(d.refundStatus ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/gift-cards' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', flex: 1 }}>Purchase</Text>
        <Pressable accessibilityLabel="Refresh" onPress={() => p.refetch()} hitSlop={8}><RefreshCw size={18} color="rgba(255,255,255,0.7)" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Status + amounts */}
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Status</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: s.color, textTransform: 'capitalize' }}>{s.label}</Text>
          </View>
          {([
            ['Card value', money(d.cardAmountAtomic ?? d.amountAtomic)],
            ...(d.paymentAtomic ? [['Paid', money(d.paymentAtomic)] as [string, string]] : []),
            ['Requested', fmt(d.createdAt)], ['Completed', fmt(d.completedAt)],
            ...(d.refundStatus ? [['Refund', d.refundStatus.replace(/_/g, ' ')] as [string, string]] : []),
          ]).map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Credential reveal — explicit, transient, never cached */}
        {d.status === 'completed' ? (
          <View style={{ marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Gift card code</Text>
            {cred ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: 1 }} selectable>{cred.code}</Text>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Pressable accessibilityLabel="Copy code" onPress={() => Clipboard.setStringAsync(cred.code)} hitSlop={8}><Copy size={18} color="#00B894" /></Pressable>
                    <Pressable accessibilityLabel="Hide" onPress={() => setCred(null)} hitSlop={8}><EyeOff size={18} color={colors.textMuted} /></Pressable>
                  </View>
                </View>
                {cred.pin ? <Text style={{ fontSize: 13, color: colors.textMuted }} selectable>PIN: {cred.pin}</Text> : null}
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Pressable accessibilityLabel="Reveal code" onPress={() => reveal.mutate()} disabled={reveal.isPending}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#00B89414' }}>
                  <Eye size={16} color="#00B894" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#00B894' }}>{reveal.isPending ? 'Revealing…' : 'Tap to reveal'}</Text>
                </Pressable>
                {credErr ? <Text style={{ marginTop: 8, fontSize: 12, color: '#F04438' }}>{credErr}</Text> : null}
              </View>
            )}
          </View>
        ) : null}

        {/* Inquiries */}
        {d.status === 'completed' ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Button label="Check balance" variant="outline" size="sm" style={{ flex: 1 }} loading={inq.isPending} disabled={inq.isPending} onPress={() => inq.mutate('balance')} />
            <Button label="Redemption status" variant="outline" size="sm" style={{ flex: 1 }} loading={inq.isPending} disabled={inq.isPending} onPress={() => inq.mutate('redemption')} />
          </View>
        ) : null}
        {inquiry ? (
          <View style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>{inquiry.type} inquiry</Text>
            {inquiry.supported ? (
              <Text style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }}>
                {Object.entries(inquiry.inquiry ?? {}).filter(([k]) => !['purchaseId', 'customerId', 'provider'].includes(k)).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') || 'No data'}
              </Text>
            ) : (
              <Text style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }}>This inquiry is not supported by the provider.</Text>
            )}
          </View>
        ) : null}

        {/* Refund */}
        {refundable ? (
          <Pressable onPress={() => Alert.alert('Request refund', 'Refund requests require review and may take time.', [
            { text: 'Cancel', style: 'cancel' }, { text: 'Request refund', onPress: () => refund.mutate() }])}
            disabled={refund.isPending} accessibilityLabel="Request refund"
            style={{ marginTop: 14, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F04438', opacity: refund.isPending ? 0.6 : 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#F04438' }}>{refund.isPending ? 'Requesting…' : 'Request refund'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

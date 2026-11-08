import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Copy, RefreshCw, Gift, ShieldCheck, ArrowUpRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ConfirmSheet } from '../../../src/components/ui/confirm-sheet';
import { useFeedback } from '../../../src/components/ui/feedback-modal';
import { elevation } from '../../../src/theme/elevation';
import { ScreenHeader } from '../../../src/components/screen-header';

const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');
const money = (s?: string | null) => (s ? `₦${formatAtomic(s, 2)}` : '—');

export default function PurchaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const p = useGiftPurchase(id);
  const [cred, setCred] = useState<{ code: string; pin?: string | null } | null>(null);
  const [inquiry, setInquiry] = useState<{ type: string; supported: boolean; inquiry?: Record<string, unknown> } | null>(null);
  const [idemRefund] = useState(() => Crypto.randomUUID());
  const [refundConfirm, setRefundConfirm] = useState(false);
  const { show, modal } = useFeedback();
  const d = p.data;

  const reveal = useMutation({
    mutationFn: () => revealCredentials(id!),
    onSuccess: (c) => {
      setCred({ code: c.code, pin: c.pin });
      show({ kind: 'success', title: 'Card code revealed', message: 'Keep these details private. Hide them when you’re finished.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Could not reveal code', message: e instanceof ApiError ? e.message : 'Please try again.' }),
  });
  const inq = useMutation({
    mutationFn: (type: 'balance' | 'redemption') => inquire(id!, type),
    onSuccess: (r, type) => {
      setInquiry({ type, supported: r.supported !== false, inquiry: r.inquiry });
      show({ kind: r.supported === false ? 'error' : 'success', title: r.supported === false ? 'Inquiry unavailable' : 'Inquiry complete', message: r.supported === false ? 'This gift-card provider does not support this inquiry.' : 'The latest inquiry result is shown below.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Inquiry failed', message: e instanceof ApiError ? e.message : 'Could not complete this inquiry. Please try again.' }),
  });
  const refund = useMutation({
    mutationFn: () => refundPurchase(id!, idemRefund),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gift-purchase', id] });
      qc.invalidateQueries({ queryKey: ['gift-purchases'] });
      show({ kind: 'success', title: 'Refund requested', message: 'Your request has been sent for review.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Refund failed', message: e instanceof ApiError ? e.message : 'Please try again.' }),
  });

  if (p.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (p.error || !d) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Purchase not found." onRetry={p.refetch} /></SafeAreaView>;

  const s = GC_STATUS[d.status] ?? { label: d.status, color: colors.textMuted };
  const refundable = d.status === 'completed' && !['pending_approval', 'pending', 'completed'].includes(d.refundStatus ?? '');
  const card = { borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <ScreenHeader
        title="Purchase details"
        subtitle={s.label}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/gift-cards' as never))}
        right={<Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={() => p.refetch()} hitSlop={8}><RefreshCw size={18} color="#FFFFFF" /></Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 15, overflow: 'hidden', ...elevation.raised }}>
          <View style={{ position: 'absolute', right: -26, top: -38, width: 145, height: 145, borderRadius: 73, backgroundColor: 'rgba(201,245,232,0.07)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.14)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(201,245,232,0.16)', borderWidth: 1, borderColor: 'rgba(201,245,232,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={22} color="#C9F5E8" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: 'rgba(244,250,247,0.68)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>PURCHASE STATUS</Text>
              <Text style={{ color: '#F4FAF7', fontSize: 18, fontWeight: '800', marginTop: 3 }}>{s.label}</Text>
            </View>
            <View style={{ borderRadius: 999, backgroundColor: 'rgba(201,245,232,0.15)', paddingHorizontal: 9, paddingVertical: 6 }}>
              <Text style={{ color: '#C9F5E8', fontSize: 9, fontWeight: '800' }}>ORDER</Text>
            </View>
          </View>
          <Text style={{ color: '#C9F5E8', fontSize: 11, fontWeight: '700', marginTop: 15 }}>Gift card value</Text>
          <Text style={{ color: '#F4FAF7', fontSize: 27, fontWeight: '800', marginTop: 3 }}>{money(d.cardAmountAtomic ?? d.amountAtomic)}</Text>
        </LinearGradient>

        <View style={card}>
          <View style={{ padding: 17, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceMuted }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Order summary</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>Purchase and payment details</Text>
          </View>
          <View style={{ padding: 17, gap: 14 }}>
            {([
              ...(d.paymentAtomic ? [['Paid', money(d.paymentAtomic)] as [string, string]] : []),
              ['Requested', fmt(d.createdAt)], ['Completed', fmt(d.completedAt)],
              ...(d.refundStatus ? [['Refund', d.refundStatus.replace(/_/g, ' ')] as [string, string]] : []),
            ]).map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{k}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'right' }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Credential reveal — explicit, transient, never cached */}
        {d.status === 'completed' ? (
          <View style={[{ marginTop: 14, padding: 17 }, card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={17} color="#004C3F" />
              </View>
              <View style={{ marginLeft: 9 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>Your gift card code</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Reveal only when you’re ready to use it</Text>
              </View>
            </View>
            {cred ? (
              <View style={{ marginTop: 14, borderRadius: 16, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 1 }} selectable>{cred.code}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable accessibilityLabel="Copy code" onPress={() => Clipboard.setStringAsync(cred.code)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C9F5E8' }}><Copy size={16} color="#004C3F" /></Pressable>
                    <Pressable accessibilityLabel="Hide" onPress={() => setCred(null)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 7 }}><EyeOff size={17} color={colors.textMuted} /></Pressable>
                  </View>
                </View>
                {cred.pin ? <Text style={{ fontSize: 12, color: colors.textMuted }} selectable>PIN: {cred.pin}</Text> : null}
              </View>
            ) : (
              <View style={{ marginTop: 13 }}>
                <Pressable accessibilityLabel="Reveal code" onPress={() => reveal.mutate()} disabled={reveal.isPending}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 15, backgroundColor: '#C9F5E8', borderWidth: 1, borderColor: '#A8E9D5', opacity: reveal.isPending ? 0.65 : 1 }}>
                  <Eye size={17} color="#004C3F" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#004C3F', marginLeft: 8 }}>{reveal.isPending ? 'Revealing securely…' : 'Reveal gift card code'}</Text>
                  <ArrowUpRight size={15} color="#004C3F" style={{ marginLeft: 'auto' }} />
                </Pressable>
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
          <View style={[{ marginTop: 10, padding: 16 }, card]}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'capitalize' }}>{inquiry.type} inquiry</Text>
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
          <Pressable onPress={() => setRefundConfirm(true)}
            disabled={refund.isPending} accessibilityLabel="Request refund"
            style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, borderWidth: 1, borderColor: '#FECDCA', backgroundColor: '#FEF3F2', opacity: refund.isPending ? 0.6 : 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#B42318' }}>{refund.isPending ? 'Requesting…' : 'Request a refund'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <ConfirmSheet
        visible={refundConfirm}
        title="Request a refund?"
        message="Refund requests require review and may take time. Submitting does not guarantee approval."
        confirmLabel="Request refund"
        onConfirm={() => { setRefundConfirm(false); refund.mutate(); }}
        onCancel={() => setRefundConfirm(false)}
      />
      {modal}
    </SafeAreaView>
  );
}

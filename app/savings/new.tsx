import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PiggyBank, Clock3 } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useProducts, createPlan } from '../../src/services/savings';
import { useAssets } from '../../src/services/wallets';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, EmptyState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { elevation } from '../../src/theme/elevation';
import { ScreenHeader } from '../../src/components/screen-header';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function NewPlan() {
  const { product: pre } = useLocalSearchParams<{ product?: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const p = useProducts();
  const a = useAssets();
  const { show, modal } = useFeedback();
  const [sel, setSel] = useState(pre ?? '');
  const [term, setTerm] = useState(30);
  const [idem] = useState(() => Crypto.randomUUID());
  const assetOf = (id: string) => a.data?.find((x) => x.assetId === id);
  const product = p.data?.find((x) => x.productId === sel);

  const create = useMutation({
    mutationFn: () => createPlan(sel, product?.type === 'fixed_term' ? term : undefined, idem),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['savings-plans'] });
      show({ kind: 'success', title: 'Savings plan created', message: 'Your new plan is ready. Open it to review the balance and manage contributions.', onDismiss: () => router.replace(`/savings/${plan.planId}` as never) });
    },
    onError: (e) => show({ kind: 'error', title: 'Could not create plan', message: e instanceof ApiError ? e.message : 'Please try again.' }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader title="New savings plan" subtitle="Choose a plan that fits your goal" />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          {p.isLoading ? <LoadingState /> : (p.data ?? []).length === 0 ? <EmptyState title="No products" description="No savings products are available." /> : (
            <View style={{ gap: 10 }}>
              {(p.data ?? []).map((x) => {
                const asset = assetOf(x.assetId); const active = sel === x.productId;
                return (
                  <Pressable key={x.productId} onPress={() => { setSel(x.productId); setTerm(x.termDays ?? 30); }} accessibilityState={{ selected: active }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1.5, borderColor: active ? '#00B887' : '#FFFFFF', backgroundColor: active ? '#00B8870D' : colors.surface, padding: 16, ...elevation.surface }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B88714', alignItems: 'center', justifyContent: 'center' }}>
                      <PiggyBank size={20} color="#00B887" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{x.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>{x.type.replace('_', ' ')} · {asset?.symbol ?? x.assetId}{x.termDays ? ` · ${x.termDays}d` : ''}</Text>
                    </View>
                    {x.type === 'fixed_term' ? <Clock3 size={16} color={colors.textMuted} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
          {product?.type === 'fixed_term' && product.maturityAt === undefined ? (
            <Text style={{ marginTop: 12, fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
              Fixed-term plans lock funds until maturity{product.termDays ? ` (${product.termDays} days)` : ''}. Early break is allowed but may affect your funds — review carefully on the plan screen.
            </Text>
          ) : null}
          <Button label="Create plan" size="lg" style={{ marginTop: 18 }} loading={create.isPending} disabled={!sel || create.isPending} onPress={() => create.mutate()} />
        </ScrollView>
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}

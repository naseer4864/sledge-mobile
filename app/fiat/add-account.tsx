import { TopFade } from '../../src/components/top-fade';
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, ChevronRight, Clock3, Search, XCircle } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useBanks, resolveAccount, saveAccount, type Bank, type Resolution } from '../../src/services/fiat';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { ApiError } from '../../src/services/api';
import { ScreenHeader } from '../../src/components/screen-header';
import { useFeedback } from '../../src/components/ui/feedback-modal';

type Step = 'bank' | 'number' | 'confirm' | 'done';

export default function AddBankAccount() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const banks = useBanks();
  const [step, setStep] = useState<Step>('bank');
  const [query, setQuery] = useState('');
  const [bank, setBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [savedStatus, setSavedStatus] = useState('');
  const [err, setErr] = useState('');
  const [idem] = useState(() => Crypto.randomUUID()); // one idempotency key per flow instance — safe retries, no double-save
  const { show, modal } = useFeedback();

  const resolve = useMutation({
    mutationFn: () => resolveAccount(bank!.code, accountNumber),
    onSuccess: (r) => { setResolution(r); setStep('confirm'); },
    onError: (e) => show({ kind: 'error', title: 'Account lookup failed', message: e instanceof ApiError ? e.message : 'Could not look up the account name. Check the details and try again.' }),
  });
  const save = useMutation({
    mutationFn: () => saveAccount({ resolutionId: resolution!.resolutionId, confirmedAccountName: resolution!.accountName, idempotencyKey: idem }),
    onSuccess: (a) => {
      setSavedStatus(a.status); setStep('done'); qc.invalidateQueries({ queryKey: ['saved-bank-accounts'] });
      show({ kind: a.status === 'verification_failed' ? 'error' : 'success', title: a.status === 'verified' ? 'Bank account verified' : a.status === 'verification_failed' ? 'Verification failed' : 'Account submitted', message: a.status === 'verified' ? 'You can now use this account for NGN withdrawals.' : a.status === 'verification_failed' ? 'We could not verify this account. Check the details before trying again.' : 'Your account is saved and undergoing verification.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Account not saved', message: e instanceof ApiError ? e.message : 'Could not save the account. Please try again.' }),
  });

  const isExpired = () => !!resolution && new Date(resolution.expiresAt).getTime() <= Date.now(); // checked at press-time, not render (impure-call rule)
  const filtered = (banks.data ?? []).filter((b) =>
    (!query || b.name.toLowerCase().includes(query.toLowerCase())) && b.active !== false);

  const header = (
    <ScreenHeader
      title={step === 'bank' ? 'Add bank account' : step === 'number' ? 'Account number' : 'Confirm account'}
      subtitle={step === 'bank' ? 'Choose your bank' : step === 'number' ? 'Enter your NUBAN account number' : 'Check the details before saving'}
      onBack={() => {
        if (step === 'number') { setStep('bank'); setErr(''); return; }
        if (step === 'confirm') { setStep('number'); setResolution(null); setErr(''); return; }
        if (router.canGoBack()) router.back(); else router.replace('/fiat/accounts' as never);
      }}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {header}

        {step === 'bank' && (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>Select the bank this account belongs to.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, marginBottom: 10 }}>
              <Search size={16} color={colors.textMuted} />
              <Input placeholder="Search banks" value={query} onChangeText={setQuery} style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent', marginVertical: 0 }} />
            </View>
            {banks.isLoading ? <LoadingState /> : banks.error ? <ErrorState description="Could not load the bank list." onRetry={banks.refetch} /> :
              <FlatList data={filtered} keyExtractor={(b) => b.code} keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<EmptyState title="No banks found" description="Try a different search." />}
                renderItem={({ item }) => (
                  <Pressable accessibilityLabel={`Select ${item.name}`} onPress={() => { setBank(item); setStep('number'); setErr(''); }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, marginBottom: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{item.name}</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </Pressable>
                )} />}
          </View>
        )}

        {step === 'number' && bank && (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}>
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Bank</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 }}>{bank.name}</Text>
            </View>
            <Input label="Account number" placeholder="10-digit NUBAN" keyboardType="number-pad" maxLength={10}
              value={accountNumber} onChangeText={setAccountNumber} accessibilityLabel="Account number" />
            {err ? <Text style={{ fontSize: 13, color: '#F04438' }}>{err}</Text> : null}
            <Button label="Look up account" size="lg" loading={resolve.isPending}
              disabled={accountNumber.length !== 10 || resolve.isPending}
              onPress={() => { setErr(''); resolve.mutate(); }} />
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
              We will check the account name registered at {bank.name} so you can confirm it is yours before saving.
            </Text>
          </ScrollView>
        )}

        {step === 'confirm' && resolution && (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}>
            <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
              {[['Bank', resolution.bankName], ['Account number', resolution.accountNumberMasked], ['Account name', resolution.accountName]].map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{k}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right', flexShrink: 1 }}>{v}</Text>
                </View>
              ))}
            </View>
            {err ? <Text style={{ fontSize: 13, color: '#F04438' }}>{err}</Text> : null}
            <Button label="This is my account — save" size="lg" loading={save.isPending}
              disabled={save.isPending}
              onPress={() => {
                if (isExpired()) { setErr('This lookup expired — go back and look up the account again.'); return; }
                setErr(''); save.mutate();
              }} />
            <Button label="Start over" variant="outline" size="lg" onPress={() => { setStep('number'); setResolution(null); }} />
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
              Only save accounts that belong to you. The bank will verify the name before withdrawals are enabled.
            </Text>
          </ScrollView>
        )}

        {step === 'done' && (
          <View style={{ alignItems: 'center', gap: 14, paddingTop: 32, paddingHorizontal: 24 }}>
            {savedStatus === 'verified' ? <CheckCircle2 size={48} color="#12B76A" /> :
             savedStatus === 'verification_failed' ? <XCircle size={48} color="#F04438" /> :
             <Clock3 size={48} color="#F79009" />}
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              {savedStatus === 'verified' ? 'Account verified' :
               savedStatus === 'under_review' ? 'Under review' :
               savedStatus === 'verification_failed' ? 'Verification failed' : 'Verification pending'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 }}>
              {savedStatus === 'verified' ? 'You can now withdraw NGN to this account.' :
               savedStatus === 'under_review' ? 'This account needs additional review before withdrawals are enabled.' :
               savedStatus === 'verification_failed' ? 'We could not verify this account. Check the details and try again.' :
               'Verification is in progress. You can withdraw once it completes.'}
            </Text>
            <Button label="Done" size="lg" onPress={() => router.replace('/fiat/accounts' as never)} />
          </View>
        )}
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}

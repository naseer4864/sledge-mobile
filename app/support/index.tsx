import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, Clock3, FileText, LifeBuoy, MessageCircle, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/providers/theme';
import { useTickets, createTicket, TICKET_STATUS } from '../../src/services/support';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

// Keep in sync with backend SUPPORT_CATEGORIES.
const CATS = ['account', 'deposits', 'withdrawals', 'trading', 'kyc', 'savings', 'gift_cards', 'security', 'other'];

export default function Support() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const tickets = useTickets();
  const { show, modal } = useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('other');
  const [idempotencyKey] = useState(() => Crypto.randomUUID());

  const create = useMutation({
    mutationFn: () => createTicket(subject, body, category, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowForm(false);
      setSubject('');
      setBody('');
      setCategory('other');
      show({ kind: 'success', title: 'Support ticket created', message: 'Your request is in your support history. We’ll reply in that conversation.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Ticket not created', message: e instanceof ApiError ? e.message : 'Could not create your support ticket. Please try again.' }),
  });

  const panel = { borderRadius: 21, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, ...elevation.surface } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader
          title="Help & support"
          subtitle="We’re here to help with your account"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showForm ? 'Close new ticket form' : 'Create a new ticket'}
              onPress={() => setShowForm((value) => !value)}
              style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={20} color="#FFFFFF" />
            </Pressable>
          }
        />
        <ScrollView
          refreshControl={<RefreshControl refreshing={tickets.isRefetching} onRefresh={async () => { await tickets.refetch(); }} tintColor="#00B887" />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={['#004C3F', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 23, padding: 19, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', ...elevation.raised }}>
            <View style={{ position: 'absolute', right: -32, top: -52, width: 150, height: 150, borderRadius: 75, borderWidth: 22, borderColor: 'rgba(255,255,255,0.07)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <LifeBuoy size={23} color="#C9F5E8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>How can we help?</Text>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 18, marginTop: 3 }}>Create a ticket or continue a conversation with our team.</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/chat' as never)}
              style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: '#C9F5E8', paddingHorizontal: 13, paddingVertical: 8, marginTop: 16 }}
            >
              <MessageCircle size={14} color="#003D32" />
              <Text style={{ color: '#003D32', fontSize: 12, fontWeight: '800', marginLeft: 7 }}>Open live chat</Text>
            </Pressable>
          </LinearGradient>

          {showForm ? (
            <View style={[{ padding: 17, marginTop: 18 }, panel]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <FileText size={17} color="#003D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>New support ticket</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Include details so we can understand the issue.</Text>
                </View>
              </View>
              <Input label="Subject" placeholder="Briefly describe the issue" value={subject} onChangeText={setSubject} />
              <View style={{ marginTop: 12 }}>
                <Input label="Description" placeholder="What happened?" value={body} onChangeText={setBody} multiline numberOfLines={4} style={{ minHeight: 104, textAlignVertical: 'top' }} />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 15, marginBottom: 9 }}>Choose a topic</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
                {CATS.map((item) => {
                  const selected = category === item;
                  return (
                    <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setCategory(item)}
                      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 3, marginBottom: 7, backgroundColor: selected ? '#003D32' : colors.surfaceMuted, borderWidth: 1, borderColor: selected ? '#003D32' : colors.border }}>
                      <Text style={{ color: selected ? '#FFFFFF' : colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{item.replace(/_/g, ' ')}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button label="Send support request" size="lg" loading={create.isPending} disabled={!subject.trim() || body.trim().length < 10 || create.isPending}
                onPress={() => create.mutate()} style={{ marginTop: 8 }} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 23, marginBottom: 10 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>Your conversations</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Updates and replies appear here</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>{tickets.data?.length ?? 0} total</Text>
          </View>

          {tickets.isLoading ? <View style={panel}><LoadingState /></View>
            : tickets.error ? <View style={panel}><ErrorState description="Could not load tickets." onRetry={tickets.refetch} /></View>
              : tickets.data?.length ? (
                <View style={[panel, { overflow: 'hidden' }]}>
                  {tickets.data.map((ticket, index) => {
                    const status = TICKET_STATUS[ticket.status] ?? { label: ticket.status, color: colors.textMuted };
                    return (
                      <View key={ticket.ticketId}>
                        {index > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 66 }} /> : null}
                        <Pressable accessibilityRole="button" accessibilityLabel={`Open ticket: ${ticket.subject}`} onPress={() => router.push(`/support/${ticket.ticketId}` as never)}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <LifeBuoy size={19} color="#003D32" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{ticket.subject}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Clock3 size={11} color={colors.textMuted} />
                              <Text style={{ color: colors.textMuted, fontSize: 10, marginLeft: 4, textTransform: 'capitalize' }}>
                                {(ticket.category ?? 'support').replace(/_/g, ' ')} · {ticket.lastActivityAt ? new Date(ticket.lastActivityAt).toLocaleDateString() : ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recently'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ borderRadius: 999, backgroundColor: `${status.color}18`, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 6 }}>
                            <Text style={{ color: status.color, fontSize: 9, fontWeight: '800' }}>{status.label}</Text>
                          </View>
                          <ChevronRight size={15} color={colors.textMuted} style={{ marginLeft: 5 }} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={panel}>
                  <EmptyState icon={<LifeBuoy size={28} color="#003D32" />} title="No conversations yet" description="Start a ticket or open live chat and your support history will appear here." />
                  {!showForm ? <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}><Button label="Create a ticket" size="lg" onPress={() => setShowForm(true)} /></View> : null}
                </View>
              )}
        </ScrollView>
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}

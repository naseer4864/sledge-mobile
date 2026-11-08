import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LifeBuoy, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useTicket, useTicketMessages, replyTicket, closeTicket, reopenTicket, TICKET_STATUS } from '../../src/services/support';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const ticket = useTicket(id);
  const messages = useTicketMessages(id);
  const { show, modal } = useFeedback();
  const [reply, setReply] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const data = ticket.data;
  const isOpen = data ? !['closed', 'resolved'].includes(data.status) : false;

  const send = useMutation({
    mutationFn: () => replyTicket(id!, reply.trim()),
    onSuccess: () => {
      setReply('');
      qc.invalidateQueries({ queryKey: ['support-messages', id] });
      qc.invalidateQueries({ queryKey: ['support-ticket', id] });
    },
    onError: (e) => show({ kind: 'error', title: 'Reply not sent', message: e instanceof ApiError ? e.message : 'Could not send your reply. Please try again.' }),
  });
  const act = useMutation({
    mutationFn: (kind: 'close' | 'reopen') => kind === 'close' ? closeTicket(id!) : reopenTicket(id!),
    onSuccess: (_result, kind) => {
      qc.invalidateQueries({ queryKey: ['support-ticket', id] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      show({ kind: 'success', title: kind === 'close' ? 'Ticket closed' : 'Ticket reopened', message: kind === 'close' ? 'You can reopen this conversation later if you need more help.' : 'You can continue replying in this conversation.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Ticket not updated', message: e instanceof ApiError ? e.message : 'Could not update this ticket. Please try again.' }),
  });

  if (ticket.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><TopFade /><LoadingState message="Opening your conversation…" /></SafeAreaView>;
  if (ticket.error || !data) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><TopFade /><ErrorState description="Ticket not found." onRetry={ticket.refetch} /></SafeAreaView>;

  const status = TICKET_STATUS[data.status] ?? { label: data.status, color: colors.textMuted };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader
          title={data.subject}
          subtitle={`Support ticket · ${status.label}`}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/support' as never))}
          right={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: status.color, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' }} />}
        />

        <View style={{ marginHorizontal: 20, marginTop: 2, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#FFFFFF', padding: 12, ...elevation.surface }}>
          <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#C9F5E8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <LifeBuoy size={17} color="#003D32" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{data.category?.replace(/_/g, ' ') ?? 'Customer support'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>Created {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'recently'}</Text>
          </View>
          <Text style={{ color: status.color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{status.label}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.isLoading ? <LoadingState message="Loading messages…" />
            : messages.error ? <ErrorState description="Could not load replies." onRetry={messages.refetch} />
              : (messages.data ?? []).length ? (messages.data ?? []).map((message, index) => {
                const mine = message.role === 'customer' || message.sender === 'customer';
                return (
                  <View key={message.messageId ?? index} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', marginTop: 11 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 5, marginLeft: mine ? 0 : 4, textAlign: mine ? 'right' : 'left' }}>{mine ? 'You' : 'Support team'}</Text>
                    {mine ? (
                      <LinearGradient colors={['#00B887', '#003D32']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 11, ...elevation.surface }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 19 }}>{message.body}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 9, marginTop: 5, textAlign: 'right' }}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 11, ...elevation.surface }}>
                        <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>{message.body}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 5 }}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                      </View>
                    )}
                  </View>
                );
              }) : (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#FFFFFF', ...elevation.surface }}>
                    <EmptyState icon={<LifeBuoy size={27} color="#003D32" />} title="Conversation started" description="Send a message and the support team will reply in this thread." />
                  </View>
                </View>
              )}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          {isOpen ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <Input placeholder="Write a reply…" value={reply} onChangeText={setReply} multiline style={{ minHeight: 48, maxHeight: 100 }} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send reply"
                  onPress={() => { if (reply.trim()) send.mutate(); }}
                  disabled={!reply.trim() || send.isPending}
                  style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center', marginLeft: 9, opacity: !reply.trim() || send.isPending ? 0.48 : 1, ...elevation.floating }}
                >
                  <Send size={19} color="#FFFFFF" />
                </Pressable>
              </View>
              <Button label="Close ticket" variant="ghost" size="sm" onPress={() => act.mutate('close')} loading={act.isPending} style={{ alignSelf: 'center', marginTop: 6 }} />
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12 }}>This ticket is {status.label.toLowerCase()}.</Text>
              <Button label="Reopen" variant="outline" size="sm" loading={act.isPending} onPress={() => act.mutate('reopen')} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}

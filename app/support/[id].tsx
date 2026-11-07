import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { useTicket, useTicketMessages, replyTicket, closeTicket, reopenTicket, TICKET_STATUS } from '../../src/services/support';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { ApiError } from '../../src/services/api';
import { LoadingState, ErrorState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const t = useTicket(id);
  const m = useTicketMessages(id);
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');
  const d = t.data;
  const open = d ? !['closed', 'resolved'].includes(d.status) : false;

  const send = useMutation({
    mutationFn: () => replyTicket(id!, reply),
    onSuccess: () => { setReply(''); qc.invalidateQueries({ queryKey: ['support-messages', id] }); qc.invalidateQueries({ queryKey: ['support-ticket', id] }); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Reply failed'),
  });
  const act = useMutation({
    mutationFn: (kind: 'close' | 'reopen') => (kind === 'close' ? closeTicket(id!) : reopenTicket(id!)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-ticket', id] }),
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Failed'),
  });

  if (t.isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></SafeAreaView>;
  if (t.error || !d) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><ErrorState description="Ticket not found." onRetry={t.refetch} /></SafeAreaView>;
  const s = TICKET_STATUS[d.status] ?? { label: d.status, color: colors.textMuted };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/support' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }} numberOfLines={1}>{d.subject}</Text>
            <Text style={{ fontSize: 12, color: s.color, fontWeight: '600' }}>{s.label}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {(m.data ?? []).map((msg, i) => {
            const mine = msg.role === 'customer' || msg.sender === 'customer';
            return (
              <View key={msg.messageId ?? i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', marginTop: 10, borderRadius: 14, padding: 12, backgroundColor: mine ? '#00B894' : colors.surface, borderWidth: mine ? 0 : 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, color: mine ? '#fff' : colors.text, lineHeight: 19 }}>{msg.body}</Text>
                <Text style={{ marginTop: 4, fontSize: 10, color: mine ? 'rgba(255,255,255,0.65)' : colors.textMuted }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</Text>
              </View>
            );
          })}
          {!m.data?.length && !m.isLoading ? <Text style={{ marginTop: 16, fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>No replies yet — send the first message.</Text> : null}
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {open ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}><Input placeholder="Reply…" value={reply} onChangeText={setReply} multiline style={{ height: 44 }} /></View>
                <Pressable onPress={() => reply.trim() && send.mutate()} disabled={!reply.trim() || send.isPending} accessibilityLabel="Send"
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center', opacity: !reply.trim() || send.isPending ? 0.5 : 1 }}>
                  <Send size={18} color="#fff" />
                </Pressable>
              </View>
              {err ? <Text style={{ color: '#F04438', fontSize: 12 }}>{err}</Text> : null}
              <Button label="Close ticket" variant="ghost" size="sm" onPress={() => act.mutate('close')} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>This ticket is {s.label.toLowerCase()}.</Text>
              <Button label="Reopen" variant="outline" size="sm" loading={act.isPending} onPress={() => act.mutate('reopen')} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

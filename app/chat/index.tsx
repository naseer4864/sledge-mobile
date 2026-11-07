import { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { conversations, openConversation, messages, sendMessage, markRead } from '../../src/services/chat';
import { Input } from '../../src/components/ui/input';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';

export default function Chat() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const convs = useQuery({ queryKey: ['chat-conversations'], queryFn: conversations });
  const conv = convs.data?.find((c) => c.status === 'open') ?? convs.data?.[0];
  const msgs = useQuery({ queryKey: ['chat-messages', conv?.conversationId], queryFn: () => messages(conv!.conversationId), enabled: !!conv, refetchInterval: 10_000 });
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  const start = useMutation({ mutationFn: openConversation, onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-conversations'] }) });
  const send = useMutation({
    mutationFn: () => sendMessage(conv!.conversationId, text),
    onSuccess: () => { setText(''); markRead(conv!.conversationId); qc.invalidateQueries({ queryKey: ['chat-messages', conv!.conversationId] }); },
    onError: (e) => setErr(e.message ?? 'Send failed'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} style={{ padding: 6 }}><ArrowLeft size={20} color="#fff" /></Pressable>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Live chat</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{conv?.status === 'open' ? 'Support agent' : 'Start a conversation'}</Text>
          </View>
        </View>
        {convs.isLoading ? <LoadingState /> : !conv ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState title="No conversation" description="Start a chat with our support team." />
            <Pressable onPress={() => start.mutate()} disabled={start.isPending} accessibilityLabel="Start chat"
              style={{ alignSelf: 'center', marginTop: 8, backgroundColor: '#00B894', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Start chat</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }} ref={(r) => r?.scrollToEnd({ animated: false })}>
              {msgs.isLoading ? <LoadingState /> : msgs.error ? <ErrorState description="Could not load messages." onRetry={msgs.refetch} /> :
                (msgs.data ?? []).map((m, i) => {
                  const mine = m.role === 'customer' || m.sender === 'customer';
                  return (
                    <View key={m.messageId ?? i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', marginTop: 10, borderRadius: 16, padding: 12, backgroundColor: mine ? '#00B894' : colors.surface, borderWidth: mine ? 0 : 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 13, color: mine ? '#fff' : colors.text, lineHeight: 19 }}>{m.body}</Text>
                      <Text style={{ marginTop: 4, fontSize: 10, color: mine ? 'rgba(255,255,255,0.65)' : colors.textMuted }}>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</Text>
                    </View>
                  );
                })}
            </ScrollView>
            {conv.status === 'open' ? (
              <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}><Input placeholder="Message…" value={text} onChangeText={setText} style={{ height: 44 }} /></View>
                  <Pressable onPress={() => text.trim() && send.mutate()} disabled={!text.trim() || send.isPending} accessibilityLabel="Send"
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || send.isPending ? 0.5 : 1 }}>
                    <Send size={18} color="#fff" />
                  </Pressable>
                </View>
                {err ? <Text style={{ marginTop: 6, color: '#F04438', fontSize: 12 }}>{err}</Text> : null}
              </View>
            ) : (
              <Text style={{ padding: 20, textAlign: 'center', fontSize: 13, color: colors.textMuted }}>This conversation is closed.</Text>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

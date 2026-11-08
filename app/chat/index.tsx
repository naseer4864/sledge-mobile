import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LifeBuoy, MessageCircle, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/providers/theme';
import { conversations, openConversation, messages, sendMessage, markRead } from '../../src/services/chat';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/states';
import { TopFade } from '../../src/components/top-fade';
import { ScreenHeader } from '../../src/components/screen-header';
import { elevation } from '../../src/theme/elevation';
import { useFeedback } from '../../src/components/ui/feedback-modal';

export default function Chat() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { show, modal } = useFeedback();
  const conversationQuery = useQuery({ queryKey: ['chat-conversations'], queryFn: conversations });
  const TERMINAL = new Set(['resolved', 'closed']);
  const conversation = conversationQuery.data?.find((item) => !TERMINAL.has(item.status)) ?? conversationQuery.data?.[0];
  const isOpen = conversation ? !TERMINAL.has(conversation.status) : false;
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', conversation?.conversationId],
    queryFn: () => messages(conversation!.conversationId),
    enabled: !!conversation,
    refetchInterval: 10_000,
  });
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const panel = { borderRadius: 21, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: colors.surface, ...elevation.surface } as const;

  const start = useMutation({
    mutationFn: openConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      show({ kind: 'success', title: 'Live chat started', message: 'Your conversation is ready. Send a message whenever you need help.' });
    },
    onError: (e) => show({ kind: 'error', title: 'Could not start chat', message: e instanceof Error ? e.message : 'Please try opening live chat again.' }),
  });
  const send = useMutation({
    mutationFn: () => sendMessage(conversation!.conversationId, text.trim()),
    onSuccess: () => {
      setText('');
      markRead(conversation!.conversationId);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversation!.conversationId] });
    },
    onError: (e) => show({ kind: 'error', title: 'Message not sent', message: e instanceof Error ? e.message : 'Could not send your message. Please try again.' }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopFade />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader
          title="Live chat"
          subtitle={isOpen ? 'Your support conversation' : 'Message the support team'}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
          right={isOpen ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: 'rgba(201,245,232,0.16)', paddingHorizontal: 10, paddingVertical: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D6A0', marginRight: 6 }} />
              <Text style={{ color: '#C9F5E8', fontSize: 10, fontWeight: '700' }}>Open</Text>
            </View>
          ) : null}
        />

        {conversationQuery.isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}><LoadingState message="Loading your conversations…" /></View>
        ) : conversationQuery.error ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}><ErrorState description="Could not load live chat." onRetry={conversationQuery.refetch} /></View>
        ) : !conversation ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 30 }}>
            <View style={[{ alignItems: 'center', padding: 24 }, panel]}>
              <LinearGradient colors={['#00D6A0', '#00B887']} style={{ width: 76, height: 76, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF', ...elevation.raised }}>
                <MessageCircle size={34} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 18, textAlign: 'center' }}>Let’s talk</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' }}>
                Start a secure conversation with our support team. Your messages will stay here so you can follow the thread.
              </Text>
              <Button label="Start live chat" size="lg" loading={start.isPending} onPress={() => start.mutate()} style={{ alignSelf: 'stretch', marginTop: 20 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
              <LifeBuoy size={13} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>For an issue that needs tracking, create a support ticket.</Text>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messagesQuery.isLoading ? <LoadingState message="Loading messages…" />
                : messagesQuery.error ? <ErrorState description="Could not load messages." onRetry={messagesQuery.refetch} />
                  : (messagesQuery.data ?? []).length ? (messagesQuery.data ?? []).map((message, index) => {
                    const mine = message.role === 'customer' || message.sender === 'customer';
                    return (
                      <View key={message.messageId ?? index} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', marginTop: 10 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 4, textAlign: mine ? 'right' : 'left' }}>{mine ? 'You' : 'Support team'}</Text>
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
                      <View style={panel}>
                        <EmptyState icon={<MessageCircle size={26} color="#003D32" />} title="Conversation started" description="Send a message to begin. Replies will appear in this thread." />
                      </View>
                    </View>
                  )}
            </ScrollView>

            {isOpen ? (
              <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <Input placeholder="Write a message…" value={text} onChangeText={setText} multiline style={{ minHeight: 48, maxHeight: 100 }} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    onPress={() => { if (text.trim()) send.mutate(); }}
                    disabled={!text.trim() || send.isPending}
                    style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: '#00B887', alignItems: 'center', justifyContent: 'center', marginLeft: 9, opacity: !text.trim() || send.isPending ? 0.48 : 1, ...elevation.floating }}
                  >
                    <Send size={19} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>This conversation is closed.</Text>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
      {modal}
    </SafeAreaView>
  );
}

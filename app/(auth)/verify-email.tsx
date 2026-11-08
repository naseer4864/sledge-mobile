import { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '../../src/components/auth/screen';
import { AuthBackLink } from '../../src/components/auth/back-link';
import { Input } from '../../src/components/ui/input';
import { Button } from '../../src/components/ui/button';
import { api, ApiError } from '../../src/services/api';
import { z } from 'zod';
import { useFeedback } from '../../src/components/ui/feedback-modal';
import { useSession } from '../../src/providers/session';

export default function VerifyEmail() {
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const { completeEmailVerification, state } = useSession();
  const { show, modal } = useFeedback();
  const [mode, setMode] = useState<'verify' | 'resend'>('verify');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [token, setToken] = useState('');
  const [codeFocused, setCodeFocused] = useState(false);
  const codeInput = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const verify = async () => {
    if (!z.string().regex(/^\d{6}$/).safeParse(token).success) { setErr('Enter the 6-digit code from your email'); return; }
    setErr(''); setMsg(''); setBusy(true);
    try {
      await completeEmailVerification(token);
      setMsg('Email verified — let’s complete your profile.');
      router.replace('/(auth)/onboarding' as never);
    }
    catch (e) { show({ kind: 'error', title: 'Verification failed', message: e instanceof ApiError ? e.message : 'Please check the code and try again.' }); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    if (!z.string().email().safeParse(email).success) { setErr('Enter your email to resend'); return; }
    setErr(''); setMsg(''); setBusy(true);
    try {
      await api('/api/v1/auth/email/resend', { method: 'POST', body: { email }, skipAuth: true });
      setMsg('Verification email resent — check your inbox.');
      show({ kind: 'success', title: 'Verification email sent', message: 'Check your inbox for a new verification code.' });
    }
    catch (e) { show({ kind: 'error', title: 'Could not resend code', message: e instanceof ApiError ? e.message : 'Please try again.' }); }
    finally { setBusy(false); }
  };

  return (
    <AuthScreen
      title={mode === 'verify' ? 'Verify your email' : 'Resend verification code'}
      subtitle={mode === 'verify' ? 'Enter the verification code sent to your inbox.' : 'We’ll send a fresh verification code to your email.'}
    >
      <View style={{ gap: 16 }}>
        {mode === 'verify' ? (
          <>
            <View style={{ borderRadius: 15, borderWidth: 1, borderColor: '#B6E8D8', backgroundColor: '#F0FBF7', padding: 13 }}>
              <Text style={{ color: '#004C3F', fontSize: 12, lineHeight: 18 }}>
                Check your inbox for the verification code{email ? ` sent to ${email}` : ''}. You can request a new code if you can’t find it.
              </Text>
            </View>
            <View style={{ gap: 9 }}>
              <Text style={{ color: '#14231F', fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>
                6-digit verification code
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Verification code, ${token.length} of 6 digits entered`}
                onPress={() => codeInput.current?.focus()}
                style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}
              >
                {Array.from({ length: 6 }, (_, index) => {
                  const digit = token[index] ?? '';
                  const active = index === token.length && codeFocused;
                  return (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        height: 58,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: err ? '#D7473D' : active ? '#00B887' : '#DCE8E3',
                        backgroundColor: active ? '#F4FFFB' : '#F7FAF9',
                        shadowColor: active ? '#00B887' : '#003D32',
                        shadowOffset: { width: 0, height: active ? 3 : 1 },
                        shadowOpacity: active ? 0.12 : 0.025,
                        shadowRadius: active ? 8 : 3,
                        elevation: active ? 2 : 0,
                      }}
                    >
                      <Text style={{ color: '#14231F', fontSize: 24, fontWeight: '700' }}>
                        {digit || (active ? '|' : '')}
                      </Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={codeInput}
                  value={token}
                  onChangeText={(value) => { setToken(value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  accessibilityLabel="Enter the 6-digit verification code"
                  caretHidden
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                />
              </Pressable>
              {err ? <Text style={{ fontSize: 12, color: '#F04438' }}>{err}</Text> : null}
            </View>
            <Button label="Verify email" size="lg" loading={busy} disabled={busy} onPress={verify} />
            <Pressable accessibilityRole="button" onPress={() => { setMode('resend'); setErr(''); setMsg(''); }} style={{ alignSelf: 'center', paddingVertical: 4 }}>
              <Text style={{ color: '#00B887', fontSize: 13, fontWeight: '700' }}>Didn’t receive a code? Resend it</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={{ borderRadius: 15, borderWidth: 1, borderColor: '#E1EBE7', backgroundColor: '#F4F8F7', padding: 13 }}>
              <Text style={{ color: '#52645E', fontSize: 12, lineHeight: 18 }}>
                Enter the email address you used to create your account. We’ll send a new verification code.
              </Text>
            </View>
            <Input
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={(value) => { setEmail(value); setErr(''); setMsg(''); }}
              error={err || undefined}
            />
            {msg ? <Text style={{ color: '#12B76A', fontSize: 12, lineHeight: 18 }}>{msg}</Text> : null}
            <Button label="Send new code" size="lg" loading={busy} disabled={busy} onPress={resend} />
            <Pressable accessibilityRole="button" onPress={() => { setMode('verify'); setErr(''); setMsg(''); }} style={{ alignSelf: 'center', paddingVertical: 4 }}>
              <Text style={{ color: '#00B887', fontSize: 13, fontWeight: '700' }}>I already have a code</Text>
            </Pressable>
          </>
        )}
        {state.kind !== 'authenticated' ? (
          <AuthBackLink label="Back to sign in" onPress={() => router.replace('/(auth)/login' as never)} />
        ) : null}
        {modal}
      </View>
    </AuthScreen>
  );
}

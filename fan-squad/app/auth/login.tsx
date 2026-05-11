import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { authenticateCognitoUser } from '../../services/awsStubs';

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg: '#0c1511',
  surfaceInput: '#121212',
  accent: '#00ffc2',
  onAccent: '#003828',
  onSurface: '#dbe5de',
  onVariant: '#b9cbc1',
  outline: '#83958c',
  outlineVariant: 'rgba(58,74,67,0.5)',
  glass: 'rgba(26,26,26,0.75)',
  glassBorder: 'rgba(0,255,194,0.15)',
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    void authenticateCognitoUser().catch(console.error);
    login();
    router.replace('/(app)/hub');
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#14211d', '#0c1511']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Decorative glows */}
      <View style={s.glowTopLeft} pointerEvents="none" />
      <View style={s.glowBottomRight} pointerEvents="none" />

      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back button */}
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={s.backArrow}>←</Text>
            </TouchableOpacity>

            {/* Brand header */}
            <View style={s.brandHeader}>
              <Text style={s.brandWordmark}>
                <Text style={s.brandFan}>FAN </Text>
                <Text style={s.brandSquad}>SQUAD</Text>
              </Text>
            </View>

            {/* Glass card */}
            <View style={s.glassCard}>
              <View style={s.welcomeSection}>
                <Text style={s.welcomeTitle}>Welcome Back</Text>
                <Text style={s.welcomeSubtitle}>Log in to your squad account</Text>
              </View>

              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={D.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                />
              </View>

              {/* Password */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={D.outline}
                  secureTextEntry
                  accessibilityLabel="Password"
                />
                <TouchableOpacity style={s.forgotWrap} activeOpacity={0.7}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={s.loginBtn}
                onPress={handleLogin}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Login"
              >
                <Text style={s.loginBtnText}>LOGIN</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>OR CONTINUE WITH</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Social buttons */}
              <View style={s.socialGroup}>
                <TouchableOpacity style={s.socialBtn} onPress={handleLogin} activeOpacity={0.8} accessibilityLabel="Sign in with Google">
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
                  <Text style={s.socialBtnText}>Sign in with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.socialBtn} onPress={handleLogin} activeOpacity={0.8} accessibilityLabel="Sign in with Apple">
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}></Text>
                  <Text style={s.socialBtnText}>Sign in with Apple</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={s.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/auth/signup')} activeOpacity={0.7}>
                <Text style={s.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  glowTopLeft: {
    position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
    borderRadius: 9999, backgroundColor: D.accent, opacity: 0.03,
  },
  glowBottomRight: {
    position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%',
    borderRadius: 9999, backgroundColor: D.accent, opacity: 0.02,
  },
  backBtn: { position: 'absolute', top: 0, left: 0, padding: 8, zIndex: 10 },
  backArrow: { fontSize: 24, color: D.onSurface, fontWeight: '300' },
  brandHeader: { alignItems: 'center', marginBottom: 32 },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  brandFan:   { color: '#FFFFFF' },
  brandSquad: { color: '#00FFC2' },
  glassCard: {
    backgroundColor: D.glass, borderWidth: 1, borderColor: D.glassBorder,
    borderRadius: 20, padding: 24,
    shadowColor: D.accent, shadowOpacity: 0.05, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  welcomeSection: { alignItems: 'center', marginBottom: 24 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: D.onSurface, marginBottom: 4 },
  welcomeSubtitle: { fontSize: 15, color: D.onVariant },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: D.outline, letterSpacing: 2,
    marginBottom: 8, marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  input: {
    width: '100%', height: 56, backgroundColor: D.surfaceInput,
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 16, color: '#FFFFFF',
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: {
    fontSize: 12, color: D.outline, letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginBtn: {
    width: '100%', height: 56, borderRadius: 9999, backgroundColor: D.accent,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: D.accent, shadowOpacity: 0.4, shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  loginBtnText: { fontSize: 18, fontWeight: '800', color: D.onAccent, letterSpacing: 3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: D.outlineVariant },
  dividerText: {
    fontSize: 10, fontWeight: '700', color: D.outline, letterSpacing: 2, marginHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  socialGroup: { gap: 12 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', height: 56, backgroundColor: D.surfaceInput,
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 12,
  },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 15, color: D.onVariant },
  footerLink: { fontSize: 15, fontWeight: '700', color: D.accent },
});

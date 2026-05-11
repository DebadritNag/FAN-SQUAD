import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, Platform, KeyboardAvoidingView, ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { authenticateCognitoUser } from '../../services/awsStubs';

// ── Design tokens (from HTML spec) ───────────────────────────────────────────
const D = {
  bg: '#07100c',
  surfaceInput: '#121212',
  cardBg: 'rgba(26,26,26,0.70)',
  accent: '#00e1ab',
  accentBright: '#00ffc2',
  onAccent: '#003828',
  onSurface: '#dbe5de',
  onVariant: '#b9cbc1',
  outline: '#83958c',
  outlineVariant: 'rgba(58,74,67,0.30)',
  glassBorder: 'rgba(0,225,171,0.20)',
};

const STADIUM_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC6P9sibB3pzEMJyREl3VA3Zwy-zyNN8X7xfSLCpTrCJ0CuJ9H3eRrvQAJcSZEJ9BpLZhWiTARSKh83soP8LwZqZfUleP_o7uoGcKKonheYUXctqiWOiBcN4U7tPJolgWBdtzw6gM4GGiDATAy5GItFCsfj2VLelmmo8lAY-LkFuyFTMP5vcCgloJ0WeqBGpDPfdPHdVkLzY2_Q3iX-VFLOxw2YbsTB7lWbpBEpnv7Q_o2trzojEyisTMkF4tbWyRKLedUirRRL3oU';

export default function SignUpScreen() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    void authenticateCognitoUser().catch(console.error);
    login();
    router.replace('/onboarding');
  };

  return (
    <View style={s.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#07100c', '#0c1511', '#002116']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bottom stadium image */}
      <View style={s.stadiumWrap} pointerEvents="none">
        <Image
          source={{ uri: STADIUM_BG }}
          style={s.stadiumImg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['#07100c', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

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

            {/* Auth card */}
            <View style={s.card}>
              {/* Top accent line */}
              <View style={s.accentLine} />

              {/* Heading */}
              <View style={s.headingSection}>
                <Text style={s.headingTitle}>Join the Elite</Text>
                <Text style={s.headingSubtitle}>Create your account to start competing</Text>
              </View>

              {/* Full Name */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={s.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Doe"
                  placeholderTextColor={'rgba(185,203,193,0.4)'}
                  autoCapitalize="words"
                  accessibilityLabel="Full name"
                />
              </View>

              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="squad@example.com"
                  placeholderTextColor={'rgba(185,203,193,0.4)'}
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
                  placeholder="••••••••"
                  placeholderTextColor={'rgba(185,203,193,0.4)'}
                  secureTextEntry
                  accessibilityLabel="Password"
                />
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={s.ctaBtn}
                onPress={handleSignUp}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Join the squad"
              >
                <Text style={s.ctaBtnText}>JOIN THE SQUAD</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>OR CONNECT WITH</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Social buttons */}
              <View style={s.socialGroup}>
                <TouchableOpacity style={s.socialBtn} onPress={handleSignUp} activeOpacity={0.8} accessibilityLabel="Sign in with Google">
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
                  <Text style={s.socialBtnText}>Sign in with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.socialBtn} onPress={handleSignUp} activeOpacity={0.8} accessibilityLabel="Sign in with Apple">
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}></Text>
                  <Text style={s.socialBtnText}>Sign in with Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Footer toggle */}
              <View style={s.footer}>
                <Text style={s.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
                  <Text style={s.footerLink}>Login</Text>
                </TouchableOpacity>
              </View>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },

  // Stadium background
  stadiumWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 265, opacity: 0.2,
  },
  stadiumImg: { width: '100%', height: '100%' },

  // Back button
  backBtn: { position: 'absolute', top: 0, left: 0, padding: 8, zIndex: 10 },
  backArrow: { fontSize: 24, color: D.onSurface, fontWeight: '300' },

  // Brand
  brandHeader: { alignItems: 'center', marginBottom: 24 },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  brandFan:   { color: '#FFFFFF' },
  brandSquad: { color: '#00FFC2' },

  // Card
  card: {
    backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.glassBorder,
    borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden',
    shadowColor: 'rgba(0,225,171,0.1)', shadowOpacity: 1, shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  accentLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: D.accent, opacity: 0.5,
  },

  // Heading
  headingSection: { alignItems: 'center', marginBottom: 24 },
  headingTitle: { fontSize: 24, fontWeight: '700', color: D.accent, marginBottom: 4 },
  headingSubtitle: { fontSize: 15, color: D.onVariant },

  // Fields
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '500', color: D.accent, letterSpacing: 1,
    marginBottom: 6, marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  input: {
    width: '100%', height: 48, backgroundColor: D.surfaceInput,
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 10,
    paddingHorizontal: 16, fontSize: 16, color: D.onSurface,
  },

  // CTA
  ctaBtn: {
    width: '100%', height: 56, borderRadius: 25, backgroundColor: D.accent,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: 'rgba(0,225,171,0.3)', shadowOpacity: 1, shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: D.onAccent, letterSpacing: 3 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: D.outlineVariant },
  dividerText: {
    fontSize: 10, fontWeight: '500', color: 'rgba(185,203,193,0.6)',
    letterSpacing: 1.5, marginHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Social
  socialGroup: { gap: 10 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    width: '100%', height: 48, backgroundColor: D.surfaceInput,
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 12,
  },
  socialBtnText: { fontSize: 15, fontWeight: '500', color: D.onSurface },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 15, color: D.onVariant },
  footerLink: { fontSize: 15, fontWeight: '700', color: D.accent, marginLeft: 4 },
});

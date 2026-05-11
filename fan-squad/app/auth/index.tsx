import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Image, Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: SW, height: SH } = Dimensions.get('window');

const D = {
  bg: '#10141a',
  accent: '#00ffc2',
  accentGlow: 'rgba(0,255,194,0.30)',
  onAccent: '#002116',
  onSurface: '#dfe2eb',
  onVariant: '#b9cbc1',
  onMuted: '#83958c',
  glass: 'rgba(26,33,43,0.70)',
  glassBorder: 'rgba(255,255,255,0.10)',
};

const HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuATJWtA1zuEmeqxmq-rC2buvGJh7QLF_VvIWjygT09bCtB7t4H23A0iz_0hTHepmClfmQAdwNR5LaK_ITbgZw80P4I9PZGBv_GVzWsQPGhCoLCXdtfw99PeBRn-JnuO3F48y_MMi0fRaSip_dQM2g5ICmU73L1FRs4PPcVEdQL8XpTn5uBms1g34rXvSjvVBiwwhNkOMA9-mdxJoZtdRMJ9OFtlK22A5Qsqp1r9X3D40wRJOpgiG-mByDO7gAH_D6PsqsKlzPFa6A';

export default function AuthLandingScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['rgba(16,20,26,0.4)', '#0a0e14']}
        locations={[0, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.radialGlow} pointerEvents="none" />

      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <Animated.View
          style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Branding */}
          <View style={s.brandPanel}>
            <Text style={s.brandWordmark}>
              <Text style={s.brandFan}>FAN </Text>
              <Text style={s.brandSquad}>SQUAD</Text>
            </Text>
            <View style={s.brandDivider} />
            <Text style={s.brandTagline}>LIVE THE GAME</Text>
          </View>

          {/* Hero Image */}
          <View style={s.heroWrap}>
            <Image
              source={{ uri: HERO_URI }}
              style={s.heroImage}
              resizeMode="cover"
              accessibilityLabel="Stadium athletes"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10,14,20,0.85)']}
              locations={[0.5, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>

          {/* CTA Section */}
          <View style={s.ctaSection}>
            <Text style={s.ctaLabel}>GET INTO THE ACTION</Text>

            <TouchableOpacity
              style={s.signUpBtn}
              onPress={() => router.push('/auth/signup')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              <Text style={s.signUpText}>SIGN UP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.logInBtn}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Text style={s.logInText}>LOG IN</Text>
            </TouchableOpacity>

            <View style={s.utilRow}>
              <Text style={s.utilLink}>Terms</Text>
              <View style={s.utilDot} />
              <Text style={s.utilLink}>Privacy</Text>
              <View style={s.utilDot} />
              <Text style={s.utilLink}>Help</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const HERO_W = SW - 40;
const HERO_H = HERO_W * (4 / 3);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  safeArea: { flex: 1 },
  radialGlow: {
    position: 'absolute', top: SH * 0.15, left: '50%',
    width: SW * 1.2, height: SW * 1.2, borderRadius: SW * 0.6,
    backgroundColor: 'transparent', marginLeft: -(SW * 0.6),
    shadowColor: D.accent, shadowOpacity: 0.15, shadowRadius: 120,
    shadowOffset: { width: 0, height: 0 },
    ...Platform.select({ android: { backgroundColor: 'rgba(0,225,171,0.04)' } }),
  },
  content: {
    flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    justifyContent: 'space-between', alignItems: 'center',
  },
  brandPanel: {
    width: '100%', backgroundColor: D.glass, borderWidth: 1,
    borderColor: D.glassBorder, borderRadius: 12,
    paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center',
    shadowColor: D.accent, shadowOpacity: 0.08, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  brandWordmark: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  brandFan:   { color: '#FFFFFF' },
  brandSquad: { color: '#00FFC2' },
  brandDivider: { width: 48, height: 1, backgroundColor: D.accent, opacity: 0.5, marginVertical: 12 },
  brandTagline: {
    fontSize: 13, fontWeight: '700', color: D.accent, letterSpacing: 6, textTransform: 'uppercase',
    textShadowColor: D.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  heroWrap: {
    width: HERO_W, height: HERO_H, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 12, marginVertical: 8,
  },
  heroImage: { width: '100%', height: '100%' },
  ctaSection: { width: '100%', gap: 10, alignItems: 'center', paddingBottom: 4 },
  ctaLabel: { fontSize: 11, fontWeight: '700', color: D.onVariant, letterSpacing: 3.5, opacity: 0.7, marginBottom: 4 },
  signUpBtn: {
    width: '100%', height: 56, borderRadius: 8, backgroundColor: D.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.accent, shadowOpacity: 0.45, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  signUpText: { fontSize: 17, fontWeight: '800', color: D.onAccent, letterSpacing: 2.5 },
  logInBtn: {
    width: '100%', height: 56, borderRadius: 8, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  logInText: { fontSize: 17, fontWeight: '700', color: D.onSurface, letterSpacing: 2.5 },
  utilRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  utilLink: { fontSize: 13, color: D.onVariant, textDecorationLine: 'underline' },
  utilDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.onMuted },
});

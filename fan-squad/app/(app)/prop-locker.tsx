import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, Dimensions,
  TouchableOpacity, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { getPlayerImage } from '../../constants/PlayerAssets';

const { width: SW } = Dimensions.get('window'); // kept for potential future use

// ── Gradient helper ───────────────────────────────────────────────────────────
function getScreenGradient(clubId: string | null) {
  if (clubId === 'fcb') return { colors: ['#DC052D', '#5C0012', '#121212', '#121212'] as const, locations: [0, 0.4, 0.75, 1] as const };
  if (clubId === 'bvb') return { colors: ['#FDE100', '#4A4200', '#000000', '#000000'] as const, locations: [0, 0.35, 0.7, 1] as const };
  if (clubId === 'svw') return { colors: ['#139B48', '#0A4A22', '#000000', '#000000'] as const, locations: [0, 0.35, 0.7, 1] as const };
  return { colors: ['#1A1A1A', '#121212', '#121212', '#121212'] as const, locations: [0, 0.3, 0.7, 1] as const };
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  surfaceHigh:    '#252525',
  surfaceHighest: '#2E2E2E',
  onSurface:      '#FFFFFF',
  onVariant:      '#A0A8B0',
  onMuted:        '#5A6370',
  outline:        'rgba(255,255,255,0.07)',
};

// ── Question data model ───────────────────────────────────────────────────────
type QuestionType = 'slider' | 'binary' | 'options';

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  min?: number;
  max?: number;
  default?: number;
  leftOption?: string;
  rightOption?: string;
  options?: string[];
}

// ── Club-specific question sets ───────────────────────────────────────────────
const FCB_QUESTIONS: Question[] = [
  { id: 'q1', type: 'slider',  title: 'How many corners will Bayern win?',  min: 0,  max: 15, default: 8 },
  { id: 'q2', type: 'binary',  title: 'Next Goal Scorer?',                  leftOption: 'Sane',      rightOption: 'Kane' },
  { id: 'q3', type: 'options', title: 'Final Match Result?',                options: ['Bayern Win', 'Draw', 'BVB Win'] },
  { id: 'q4', type: 'binary',  title: 'Total Match Goals?',                 leftOption: 'Under 2.5', rightOption: 'Over 2.5' },
  { id: 'q5', type: 'slider',  title: 'Bayern Possession %?',               min: 30, max: 80, default: 55 },
];

const BVB_QUESTIONS: Question[] = [
  { id: 'q1', type: 'slider',  title: 'How many corners will Dortmund win?', min: 0,  max: 15, default: 6 },
  { id: 'q2', type: 'binary',  title: 'Next Goal Scorer?',                   leftOption: 'Malen',     rightOption: 'Fullkrug' },
  { id: 'q3', type: 'options', title: 'Final Match Result?',                 options: ['BVB Win', 'Draw', 'Bayern Win'] },
  { id: 'q4', type: 'binary',  title: 'Total Match Goals?',                  leftOption: 'Under 2.5', rightOption: 'Over 2.5' },
  { id: 'q5', type: 'slider',  title: 'Dortmund Possession %?',              min: 30, max: 80, default: 45 },
];

const SVW_QUESTIONS: Question[] = [
  { id: 'q1', type: 'slider',  title: 'How many shots on target for Werder?', min: 0,  max: 12, default: 4 },
  { id: 'q2', type: 'binary',  title: 'Next Goal Scorer?',                    leftOption: 'Ducksch', rightOption: 'Weiser' },
  { id: 'q3', type: 'options', title: 'Match Result?',                        options: ['SVW Win', 'Draw', 'Loss'] },
  { id: 'q4', type: 'binary',  title: 'Clean Sheet for Bremen?',              leftOption: 'Yes',     rightOption: 'No' },
  { id: 'q5', type: 'slider',  title: 'Werder Possession %?',                 min: 30, max: 70, default: 48 },
];

function getQuestions(clubId: string | null): Question[] {
  if (clubId === 'bvb') return BVB_QUESTIONS;
  if (clubId === 'svw') return SVW_QUESTIONS;
  return FCB_QUESTIONS; // default / fcb
}

// ── Slider sub-component ──────────────────────────────────────────────────────
function SliderInput({
  question, value, onChange, accent,
}: {
  question: Question; value: number; onChange: (v: number) => void; accent: string;
}) {
  const min = question.min ?? 0;
  const max = question.max ?? 100;
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<View>(null);
  const trackX   = useRef(0);
  const trackW   = useRef(0);

  const handleMove = (pageX: number) => {
    const raw     = (pageX - trackX.current) / trackW.current;
    const clamped = Math.max(0, Math.min(1, raw));
    const newVal  = Math.round(min + clamped * (max - min));
    if (newVal !== value) { onChange(newVal); Haptics.selectionAsync(); }
  };

  return (
    <View style={sl.wrap}>
      {/* Big value display */}
      <View style={sl.valueRow}>
        <Text style={sl.minMax}>MIN: {min}</Text>
        <Text style={[sl.bigValue, { color: accent }]}>{value}</Text>
        <Text style={sl.minMax}>MAX: {max}+</Text>
      </View>

      {/* Touch-driven track */}
      <View
        ref={trackRef}
        style={sl.trackWrap}
        onLayout={e => { trackW.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => {
          trackRef.current?.measure((_x, _y, _w, _h, px) => { trackX.current = px; });
          handleMove(e.nativeEvent.pageX);
        }}
        onResponderMove={e => handleMove(e.nativeEvent.pageX)}
      >
        <View style={sl.track} />
        <View style={[sl.fill, { width: `${pct}%` as any, backgroundColor: accent, shadowColor: accent }]} />
        <View style={[sl.thumb, { left: `${pct}%` as any, borderColor: accent, shadowColor: accent }]} />
      </View>

      {/* Tick marks */}
      <View style={sl.ticks}>
        {[min, Math.round((min + max) / 2), max].map((tick, i) => (
          <View key={i} style={sl.tickCol}>
            <View style={[sl.tickLine, {
              backgroundColor: tick === value ? accent : 'rgba(255,255,255,0.2)',
              height: tick === value ? 12 : 8,
            }]} />
            <Text style={[sl.tickLabel, { color: tick === value ? accent : D.onMuted }]}>{tick}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:      { paddingHorizontal: 4, paddingTop: 8 },
  valueRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  minMax:    { fontSize: 11, fontWeight: '700', color: D.onMuted, letterSpacing: 0.8 },
  bigValue:  { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  trackWrap: { height: 40, justifyContent: 'center', position: 'relative' },
  track:     { position: 'absolute', left: 0, right: 0, height: 6, backgroundColor: D.surfaceHighest, borderRadius: 3 },
  fill:      { position: 'absolute', left: 0, height: 6, borderRadius: 3, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  thumb:     {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFFFFF', borderWidth: 3, marginLeft: -13, top: 7,
    shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  ticks:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  tickCol:   { alignItems: 'center', gap: 4 },
  tickLine:  { width: 2, borderRadius: 1 },
  tickLabel: { fontSize: 10, fontWeight: '700' },
});

// ── Binary sub-component ──────────────────────────────────────────────────────
function BinaryInput({
  question, value, onChange, accent,
}: {
  question: Question; value: string | undefined; onChange: (v: string) => void; accent: string;
}) {
  const left  = question.leftOption!;
  const right = question.rightOption!;

  const renderSide = (option: string, dir: 'left' | 'right') => {
    const selected = value === option;
    return (
      <TouchableOpacity
        style={[
          bin.card,
          selected && {
            borderColor: accent,
            backgroundColor: accent + '22',
            shadowColor: accent, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
          },
        ]}
        onPress={() => { onChange(option); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        activeOpacity={0.75}
      >
        <Text style={[bin.arrow, { color: selected ? accent : D.onMuted }]}>
          {dir === 'left' ? '\u2190' : '\u2192'}
        </Text>
        {getPlayerImage(option) && (
          <Image
            source={getPlayerImage(option)}
            style={[bin.avatar, selected && { borderColor: accent }]}
          />
        )}
        <Text
          style={[bin.name, selected && { color: accent }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {option}
        </Text>
        {selected && <View style={[bin.selectedDot, { backgroundColor: accent }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={bin.row}>
      {renderSide(left, 'left')}
      <View style={bin.vs}>
        <Text style={[bin.vsText, { color: accent }]}>VS</Text>
      </View>
      {renderSide(right, 'right')}
    </View>
  );
}

const bin = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  card: {
    flex: 1, minHeight: 130, backgroundColor: '#222222',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8,
  },
  arrow:       { fontSize: 22, fontWeight: '300' },
  avatar:      { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  name:        { fontSize: 15, fontWeight: '800', color: D.onSurface, textAlign: 'center' },
  selectedDot: { width: 6, height: 6, borderRadius: 3 },
  vs:          { width: 36, alignItems: 'center', justifyContent: 'center' },
  vsText:      { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});

// ── Options sub-component ─────────────────────────────────────────────────────
function OptionsInput({
  question, value, onChange, accent, onAccent,
}: {
  question: Question; value: string | undefined; onChange: (v: string) => void; accent: string; onAccent: string;
}) {
  return (
    <View style={opt.stack}>
      {question.options!.map(option => {
        const selected = value === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              opt.btn,
              selected && {
                backgroundColor: accent, borderColor: accent,
                shadowColor: accent, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
              },
            ]}
            onPress={() => { onChange(option); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            activeOpacity={0.75}
          >
            <Text style={[opt.label, selected && { color: onAccent }]}>{option}</Text>
            {selected && (
              <View style={[opt.checkWrap, { backgroundColor: onAccent + '33' }]}>
                <Text style={[opt.check, { color: onAccent }]}>{'\u2713'}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const opt = StyleSheet.create({
  stack: { gap: 10, marginVertical: 8 },
  btn:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A1A1A', borderRadius: 10, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 20, paddingVertical: 18,
  },
  label:     { fontSize: 16, fontWeight: '700', color: D.onSurface },
  checkWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  check: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PropLockerScreen() {
  const theme        = useTheme();
  const selectedClub = useAppStore(s => s.selectedClub);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted]       = useState(false);

  const accent     = theme.club.primary;
  const onAccent   = theme.club.onPrimary;
  const cardRadius = theme.club.cardRadius;

  const gradient        = getScreenGradient(selectedClub);
  const isBVB           = selectedClub === 'bvb';
  const headerTextColor = isBVB ? '#000000' : '#FFFFFF';

  const QUESTIONS = getQuestions(selectedClub);
  const question    = QUESTIONS[currentIndex];
  const isLast      = currentIndex === QUESTIONS.length - 1;
  const progressPct = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const currentAnswer = answers[question.id];
  // Sliders always have a value (default), so they are always "answered"
  const sliderValue   = currentAnswer !== undefined
    ? (currentAnswer as number)
    : (question.default ?? question.min ?? 0);
  const hasAnswer     = question.type === 'slider' || currentAnswer !== undefined;

  const setAnswer = (val: string | number) => {
    setAnswers(prev => ({ ...prev, [question.id]: val }));
  };

  const handleLockNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isLast) {
      setSubmitted(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  // ── Success / submitted state ─────────────────────────────────────────────
  if (submitted) {
    return (
      <LinearGradient colors={gradient.colors} locations={gradient.locations} style={{ flex: 1 }}>
        <SafeAreaView style={s.root} edges={['top', 'bottom']}>
          <View style={s.emptyWrap}>
            <View style={[s.successIcon, { borderColor: accent }]}>
              <Text style={[s.successCheck, { color: accent }]}>{'\u2713'}</Text>
            </View>
            <Text style={s.emptyTitle}>Predictions Locked!</Text>
            <Text style={s.emptySub}>
              {QUESTIONS.length} predictions submitted.{'\n'}
              Check back after the match to see your score.
            </Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: accent, borderRadius: cardRadius || 8 }]}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={[s.emptyBtnText, { color: onAccent }]}>Back to Hub</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Render question content via switch ────────────────────────────────────
  const renderQuestionContent = (q: Question) => {
    switch (q.type) {
      case 'slider':
        return (
          <SliderInput
            question={q}
            value={sliderValue as number}
            onChange={v => setAnswer(v)}
            accent={accent}
          />
        );
      case 'binary':
        return (
          <BinaryInput
            question={q}
            value={currentAnswer as string | undefined}
            onChange={v => setAnswer(v)}
            accent={accent}
          />
        );
      case 'options':
        return (
          <OptionsInput
            question={q}
            value={currentAnswer as string | undefined}
            onChange={v => setAnswer(v)}
            accent={accent}
            onAccent={onAccent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={gradient.colors} locations={gradient.locations} style={{ flex: 1 }}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[s.backArrow, { color: headerTextColor }]}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: headerTextColor }]}>PREDICTIONS</Text>
          <View style={s.counterPill}>
            <Text style={[s.counterCurrent, { color: accent }]}>{currentIndex + 1}</Text>
            <Text style={s.counterSep}> / </Text>
            <Text style={s.counterTotal}>{QUESTIONS.length}</Text>
          </View>
        </View>

        {/* ── PROGRESS BAR ────────────────────────────────────────────────── */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>
              QUESTION {currentIndex + 1} OF {QUESTIONS.length}
            </Text>
            <Text style={[s.progressPct, { color: accent }]}>
              {Math.round(progressPct)}%
            </Text>
          </View>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${progressPct}%` as any, backgroundColor: accent, shadowColor: accent },
              ]}
            />
          </View>
          {/* Step dots */}
          <View style={s.dots}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i < currentIndex  && { backgroundColor: accent, opacity: 0.4 },
                  i === currentIndex && { backgroundColor: accent, width: 20 },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── CARD ────────────────────────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.card, { borderRadius: cardRadius || 4, borderColor: accent + '28', shadowColor: accent }]}>
            {/* Card gradient background */}
            <LinearGradient
              colors={['#1E1E1E', '#161616']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: cardRadius || 4 }]}
            />

            {/* Stadium hero image */}
            <View style={s.heroWrap}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrVx2WviHSftMy5L2-2MBgDvnja0zkwBHdgSmSa-sAKIncUEDb5x1U_wrXm3kTWHs8orx8zMIffGrGfx86t95hD3Y8UjJJmkLp2NyPDnqr3zAnjODcMx7tEk632n0HwWjpVfqDUVvl0q9WE6X1B3WDaWDhwzFeW-nWgsSt3fa4JtWHuBbuDfqVDz-2kZ4wLGHPiv3G762_6UdibQair7c9LE6BvgSE7GGlFN46YY6l4Pm8lWXvK3yKVGjKSYWFuBmT1ks03uTiL9U' }}
                style={s.heroImage}
                resizeMode="cover"
              />
              <LinearGradient colors={['transparent', '#1E1E1E']} style={StyleSheet.absoluteFill} />
              <View style={s.heroBadgeRow}>
                <View style={[s.liveBadge, { backgroundColor: accent }]}>
                  <Text style={[s.liveBadgeText, { color: onAccent }]}>LIVE ODDS</Text>
                </View>
                <Text style={s.heroSubtitle}>UCL Quarter Final</Text>
              </View>
            </View>

            {/* Question title */}
            <Text style={s.questionTitle}>{question.title}</Text>

            {/* Dynamic content area */}
            <View style={s.contentWrap}>
              {renderQuestionContent(question)}
            </View>

            {/* Contextual hint */}
            <Text style={s.hintText}>
              {question.type === 'slider'
                ? 'Drag the slider to set your prediction'
                : 'Tap to select your answer'}
            </Text>
          </View>
        </ScrollView>

        {/* ── FOOTER CTA ──────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[
              s.ctaBtn,
              { backgroundColor: accent, borderRadius: 999, shadowColor: accent },
              !hasAnswer && s.ctaBtnDisabled,
            ]}
            onPress={handleLockNext}
            disabled={!hasAnswer}
            activeOpacity={0.85}
          >
            <Text style={[s.ctaText, { color: onAccent }]}>
              {isLast ? 'SUBMIT PREDICTIONS' : 'LOCK & NEXT'}
            </Text>
            {!isLast && (
              <Text style={[s.ctaArrow, { color: onAccent }]}>{'\u203a'}</Text>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow:      { fontSize: 24, fontWeight: '300' },
  headerTitle:    { fontSize: 15, fontWeight: '900', letterSpacing: 2.5 },
  counterPill:    {
    flexDirection: 'row', alignItems: 'baseline',
    backgroundColor: D.surfaceHigh,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: D.outline,
  },
  counterCurrent: { fontSize: 14, fontWeight: '800' },
  counterSep:     { fontSize: 12, color: D.onMuted },
  counterTotal:   { fontSize: 14, fontWeight: '600', color: D.onVariant },

  // Progress
  progressWrap:  { paddingHorizontal: 20, paddingBottom: 8 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: D.onMuted, letterSpacing: 1.5 },
  progressPct:   { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: D.surfaceHighest, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: 4, borderRadius: 2, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },

  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: D.surfaceHighest },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },

  // Card
  card: {
    width: '100%', overflow: 'hidden', borderWidth: 1,
    shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },

  // Hero
  heroWrap:     { width: '100%', height: 160, position: 'relative' },
  heroImage:    { width: '100%', height: '100%' },
  heroBadgeRow: { position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  liveBadgeText:{ fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  heroSubtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' },

  // Question
  questionTitle: {
    fontSize: 26, fontWeight: '900', color: D.onSurface,
    textAlign: 'center', lineHeight: 32, letterSpacing: -0.3,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },

  // Content
  contentWrap: { paddingHorizontal: 16, paddingVertical: 12 },

  // Hint
  hintText: {
    fontSize: 12, color: D.onMuted, textAlign: 'center',
    fontStyle: 'italic', paddingBottom: 20, paddingHorizontal: 20,
  },

  // Footer
  footer:         { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 8 },
  ctaBtn:         {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 8,
    shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaText:        { fontSize: 15, fontWeight: '900', letterSpacing: 2.5 },
  ctaArrow:       { fontSize: 22, fontWeight: '300', marginTop: -2 },

  // Success state
  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  successIcon:  { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successCheck: { fontSize: 36, fontWeight: '900' },
  emptyTitle:   { fontSize: 26, fontWeight: '800', color: D.onSurface, textAlign: 'center' },
  emptySub:     { fontSize: 15, color: D.onVariant, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  emptyBtn:     { paddingHorizontal: 36, paddingVertical: 16, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Image, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { MOCK_CLUBS, MOCK_PLAYERS } from '../../constants/MockData';
import { PLAYER_IMAGES } from '../../constants/PlayerAssets';

// ── Local assets ──────────────────────────────────────────────────────────────
const CLUB_IMAGES: Record<string, any> = {
  fcb: require('../../assets/images/bayern.png'),
  bvb: require('../../assets/images/dortmund.png'),
  svw: require('../../assets/images/bremen.png'),
};

const IMG_USER_AVATAR_DEFAULT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCyD6NKV6QV7p30BsmTFi4W11zuZcMsm4-QwbFlmqI6iAa9G_dPpnlMiY13AG88tac33TMKzhvJJz3dnms572QZq8HasknHLAhi3ehP2pbYWSEb40Oz7hpxlYP6olu8sT2ZlqfPunBKu7ov8zA3lu_H7A7HlkmsbSkWFeU8CeiDSdjRhx-nUU1saY9kQXWdzu8qT4_BJM-BO_BcvVVsC2X5xjw9FL1vaOlJgR3SroCNTmi9y75hUB4mUvurFMegm5anagOtbD9GEA';

// ── Settings rows ─────────────────────────────────────────────────────────────
const SETTINGS: { id: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'personal',      label: 'Personal Details', icon: 'person'        },
  { id: 'notifications', label: 'Notifications',    icon: 'notifications' },
  { id: 'privacy',       label: 'Privacy',          icon: 'lock'          },
  { id: 'help',          label: 'Help & Support',   icon: 'help-outline'  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, lobbyPoints, followedPlayers, selectedClub, reset } = useAppStore();
  const theme = useTheme();

  // ── Derive club-aware design tokens ──────────────────────────────────────
  const accent     = theme.club.primary;
  const onAccent   = theme.club.onPrimary;
  const isBVB      = selectedClub === 'bvb';
  const isSVW      = selectedClub === 'svw';
  const isFCB      = selectedClub === 'fcb';

  const bg         = (isBVB || isSVW) ? '#000000' : '#121212';
  const surface    = (isBVB || isSVW) ? '#111111' : '#1E1E1E';
  const surfaceLow = '#1A1A1A';
  const outline    = (isBVB || isSVW) ? '#2A2A2A' : '#333333';
  const onSurface  = '#FFFFFF';
  const onVariant  = (isBVB || isSVW) ? '#B3B3B3' : '#CCCCCC';
  const onMuted    = (isBVB || isSVW) ? '#666666' : '#888888';
  const danger     = '#FF4444';

  // ── Resolve club display info ─────────────────────────────────────────────
  const clubData   = MOCK_CLUBS.find((c) => c.id === selectedClub);
  const clubName   = clubData?.name ?? 'Bayern Munich';
  const clubId     = clubData?.id   ?? 'fcb';

  // ── Resolve followed player display info ─────────────────────────────────
  const followedId   = followedPlayers[0] ?? 'p1';
  const playerData   = MOCK_PLAYERS.find((p) => p.id === followedId);
  const playerName   = playerData?.name ?? 'Harry Kane';

  const lifetimePoints = lobbyPoints > 0 ? lobbyPoints : 15780;

  // ── Local state ───────────────────────────────────────────────────────────
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.username ?? 'Captain');
  const [crestErrored, setCrestErrored] = useState(false);

  const displayName = user?.username ? `Captain ${user.username}` : 'Captain Alex';

  // ── Profile picture upload ────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ── Name editing ──────────────────────────────────────────────────────────
  const handleSaveName = () => {
    if (editName.trim()) {
      // Update the store — the store's user object has a username field
      useAppStore.setState({ user: { username: editName.trim() } });
    }
    setNameModalVisible(false);
  };

  // ── Settings handler ──────────────────────────────────────────────────────
  const handleSettingPress = (id: string) => {
    if (id === 'personal') {
      setEditName(user?.username ?? 'Captain');
      setNameModalVisible(true);
      return;
    }
    Alert.alert(id.charAt(0).toUpperCase() + id.slice(1), 'Coming soon.');
  };

  // ── Log out ───────────────────────────────────────────────────────────────
  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => { reset(); router.replace('/'); },
      },
    ]);
  };

  // ── Dynamic gradient ──────────────────────────────────────────────────────
  const gradientColors: [string, string, string, string] = isFCB
    ? ['#DC052D', '#5C0012', '#121212', '#121212']
    : isBVB
    ? ['#FDE100', '#4A4200', '#000000', '#000000']
    : isSVW
    ? ['#139B48', '#0A4A22', '#000000', '#000000']
    : ['#1A1A1A', '#121212', '#121212', '#121212'];
  const gradientLocations: [number, number, number, number] = isFCB
    ? [0, 0.4, 0.75, 1]
    : (isBVB || isSVW)
    ? [0, 0.35, 0.7, 1]
    : [0, 0.3, 0.7, 1];

  const headerIconColor = isBVB ? '#000000' : '#FFFFFF';
  const crestSrc = CLUB_IMAGES[clubId];

  // Avatar source — local pick overrides remote default
  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : { uri: IMG_USER_AVATAR_DEFAULT };

  return (
    <LinearGradient colors={gradientColors} locations={gradientLocations} style={{ flex: 1 }}>
    <SafeAreaView style={p.root} edges={['top']}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={[p.header, { borderBottomColor: outline }]}>
        <TouchableOpacity
          style={p.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={28} color={headerIconColor} />
        </TouchableOpacity>

        <Text style={[p.headerTitle, { color: headerIconColor }]}>PROFILE</Text>
        <View style={p.headerSpacer} />
      </View>

      {/* ── SCROLL CONTENT ──────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={p.scroll}
      >

        {/* ── IDENTITY ────────────────────────────────────────────────── */}
        <View style={p.identitySection}>
          <View style={p.avatarContainer}>
            <View style={[p.avatarRing, { borderColor: accent }]}>
              <Image
                source={avatarSource}
                style={p.avatar}
                resizeMode="cover"
                accessibilityLabel="User avatar"
              />
            </View>
            <TouchableOpacity
              style={[p.cameraBadge, { backgroundColor: bg, borderColor: accent }]}
              onPress={handlePickImage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <MaterialIcons name="photo-camera" size={16} color={accent} />
            </TouchableOpacity>
          </View>

          <Text style={[p.username, { color: onSurface }]}>{displayName}</Text>
          <Text style={[p.memberSince, { color: onMuted }]}>
            FAN SQUAD MEMBER SINCE 2024
          </Text>
        </View>

        {/* ── STATS GRID ──────────────────────────────────────────────── */}
        <View style={[p.statsCard, { backgroundColor: surface }]}>
          <View style={p.statItem}>
            <Text style={[p.statLabel, { color: onMuted }]}>POINTS</Text>
            <Text style={[p.statValue, { color: accent }]}>
              {lifetimePoints.toLocaleString()}
            </Text>
          </View>
          <View style={[p.statSep, { backgroundColor: outline }]} />
          <View style={p.statItem}>
            <Text style={[p.statLabel, { color: onMuted }]}>PREDICTIONS</Text>
            <Text style={[p.statValue, { color: onSurface }]}>42</Text>
          </View>
          <View style={[p.statSep, { backgroundColor: outline }]} />
          <View style={p.statItem}>
            <Text style={[p.statLabel, { color: onMuted }]}>WIN RATE</Text>
            <Text style={[p.statValue, { color: onSurface }]}>68%</Text>
          </View>
        </View>

        {/* ── YOUR SQUAD ──────────────────────────────────────────────── */}
        <Text style={[p.sectionTitle, { color: onMuted }]}>YOUR SQUAD</Text>

        <View style={p.squadRow}>
          {/* Club card */}
          <View style={[p.squadCard, { backgroundColor: surfaceLow, borderColor: outline }]}>
            <View style={p.squadImageWrap}>
              {crestSrc && !crestErrored ? (
                <Image
                  source={crestSrc}
                  style={p.crestImage}
                  resizeMode="contain"
                  onError={() => setCrestErrored(true)}
                  accessibilityLabel={`${clubName} crest`}
                />
              ) : (
                <View style={[p.crestFallback, { backgroundColor: accent }]}>
                  <Text style={[p.crestFallbackText, { color: onAccent }]}>
                    {clubId.toUpperCase().slice(0, 3)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[p.squadLabel, { color: onSurface }]}>{clubName}</Text>
          </View>

          {/* Player card */}
          <View style={[p.squadCard, { backgroundColor: surfaceLow, borderColor: outline }]}>
            <View style={[p.squadImageWrap, p.squadImageCircle, { borderColor: accent }]}>
              <Image
                source={PLAYER_IMAGES[playerName] || require('../../assets/images/app-logo.png')}
                style={p.playerImage}
                resizeMode="cover"
                accessibilityLabel={playerName}
              />
            </View>
            <Text style={[p.squadLabel, { color: onSurface }]}>{playerName}</Text>
          </View>
        </View>

        {/* ── SETTINGS ────────────────────────────────────────────────── */}
        <Text style={[p.sectionTitle, { color: onMuted }]}>SETTINGS</Text>

        <View style={[p.settingsList, { backgroundColor: surface, borderColor: outline }]}>
          {SETTINGS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                p.settingRow,
                index < SETTINGS.length - 1 && [p.settingRowBorder, { borderBottomColor: outline }],
              ]}
              onPress={() => handleSettingPress(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={item.id === 'personal' ? accent : onMuted}
                style={p.settingIcon}
              />
              <Text style={[p.settingLabel, { color: onSurface }]}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={22} color={outline} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOG OUT ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[p.logoutBtn, { borderColor: danger }]}
          onPress={handleLogOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={[p.logoutText, { color: danger }]}>LOG OUT</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── NAME EDITING MODAL ──────────────────────────────────────────── */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={m.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={m.backdropTouch}
            activeOpacity={1}
            onPress={() => setNameModalVisible(false)}
          />
          <View style={[m.card, { backgroundColor: surface, borderColor: outline }]}>
            <Text style={[m.title, { color: onSurface }]}>Edit Name</Text>
            <Text style={[m.subtitle, { color: onMuted }]}>
              Update your display name
            </Text>

            <View style={[m.inputWrap, { borderColor: accent + '60', backgroundColor: surfaceLow }]}>
              <TextInput
                style={[m.input, { color: onSurface }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={onMuted}
                autoFocus
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                accessibilityLabel="Name input"
              />
              <View style={[m.inputUnderline, { backgroundColor: accent }]} />
            </View>

            <View style={m.btnRow}>
              <TouchableOpacity
                style={[m.cancelBtn, { borderColor: outline }]}
                onPress={() => setNameModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[m.cancelText, { color: onVariant }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[m.saveBtn, { backgroundColor: accent }]}
                onPress={handleSaveName}
                activeOpacity={0.85}
              >
                <Text style={[m.saveText, { color: onAccent }]}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
    </LinearGradient>
  );
}


// ── Styles ───────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 3 },
  headerSpacer: { width: 36 },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },

  // ── Identity ──────────────────────────────────────────────────────────────
  identitySection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    overflow: 'hidden', borderWidth: 2,
  },
  avatar: { width: 100, height: 100 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  username: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  memberSince: { fontSize: 11, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },

  // ── Stats card ────────────────────────────────────────────────────────────
  statsCard: {
    borderRadius: 14, paddingVertical: 18, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statSep: { width: 1, height: 40 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    textTransform: 'uppercase', marginBottom: 12,
  },

  // ── Your Squad ────────────────────────────────────────────────────────────
  squadRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  squadCard: {
    flex: 1, borderRadius: 14, paddingVertical: 20, paddingHorizontal: 12,
    alignItems: 'center', gap: 10, borderWidth: 1,
  },
  squadImageWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  squadImageCircle: { borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  crestImage: { width: 64, height: 64, borderRadius: 8 },
  crestFallback: {
    width: 64, height: 64, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  crestFallbackText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  playerImage: {
    width: 64, height: 64, borderRadius: 32,
  },
  squadLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // ── Settings ──────────────────────────────────────────────────────────────
  settingsList: { borderRadius: 14, borderWidth: 1, marginBottom: 28, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  settingRowBorder: { borderBottomWidth: 1 },
  settingIcon: { marginRight: 14 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  // ── Log out ───────────────────────────────────────────────────────────────
  logoutBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '800', letterSpacing: 2.5 },
});

// ── Modal styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    gap: 12,
  },
  title: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13, marginBottom: 8,
  },
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '600',
  },
  inputUnderline: {
    height: 3,
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13, fontWeight: '800', letterSpacing: 1.5,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 13, fontWeight: '800', letterSpacing: 1.5,
  },
});

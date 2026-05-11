/**
 * Squad Screen — Watch Party Lobby + Chat
 *
 * View A (lobbyCode === null): Join / Create lobby
 * View B (lobbyCode !== null): Active chat room
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView,
  Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';

const { width: SW } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:         '#121212',
  surface:    '#1E1E1E',
  surfaceLow: '#1A1A1A',
  input:      '#121212',
  outline:    '#333333',
  accent:     '#00FFC2',
  bayernRed:  '#DC052D',
  bayernBlue: '#0066B2',
  onSurface:  '#FFFFFF',
  onMuted:    '#CCCCCC',
  onDim:      '#666666',
  danger:     '#FF4444',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function nowTime(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── Seed messages shown when a lobby is first created ────────────────────────
const SEED_MESSAGES: Message[] = [
  { id: 's1', text: "Let's gooo! 🔥 Who's scoring first?",  sender: 'other', timestamp: nowTime() },
  { id: 's2', text: 'Kane obviously. No debate.',            sender: 'other', timestamp: nowTime() },
];

// ─────────────────────────────────────────────────────────────────────────────
// ── View A: Join / Create ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
interface LobbyGateProps {
  joinInput: string;
  setJoinInput: (v: string) => void;
  onCreateLobby: () => void;
  onJoinLobby: () => void;
}

function LobbyGate({ joinInput, setJoinInput, onCreateLobby, onJoinLobby }: LobbyGateProps) {
  return (
    <View style={g.root}>

      {/* ── CREATE LOBBY ── */}
      <View style={g.card}>
        <View style={[g.iconWrap, { backgroundColor: D.bayernRed + '20' }]}>
          <MaterialIcons name="groups" size={32} color={D.bayernRed} />
        </View>
        <Text style={g.cardTitle}>START A WATCH PARTY</Text>
        <Text style={g.cardSub}>Generate a code and invite your friends.</Text>
        <TouchableOpacity
          style={g.createBtn}
          onPress={onCreateLobby}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create lobby"
        >
          <Text style={g.createBtnText}>CREATE LOBBY</Text>
        </TouchableOpacity>
      </View>

      {/* ── DIVIDER ── */}
      <View style={g.divider}>
        <View style={g.dividerLine} />
        <Text style={g.dividerText}>OR</Text>
        <View style={g.dividerLine} />
      </View>

      {/* ── JOIN LOBBY ── */}
      <View style={g.card}>
        <Text style={g.cardTitle}>JOIN A SQUAD</Text>
        <Text style={g.cardSub}>Enter the 5-digit code from your friend.</Text>
        <TextInput
          style={g.codeInput}
          value={joinInput}
          onChangeText={v => setJoinInput(v.toUpperCase())}
          placeholder="ENTER 5-DIGIT CODE"
          placeholderTextColor={D.onDim}
          autoCapitalize="characters"
          maxLength={5}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={onJoinLobby}
          accessibilityLabel="Lobby code input"
        />
        <TouchableOpacity
          style={[
            g.joinBtn,
            !joinInput.trim() && { opacity: 0.45 },
          ]}
          onPress={onJoinLobby}
          disabled={!joinInput.trim()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Join squad"
        >
          <Text style={g.joinBtnText}>JOIN SQUAD</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const g = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: D.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: D.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    color: D.onMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  createBtn: {
    marginTop: 6,
    width: '100%',
    height: 50,
    backgroundColor: D.bayernRed,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.bayernRed,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: D.onSurface,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: D.outline,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: D.onDim,
    letterSpacing: 2,
  },
  codeInput: {
    width: '100%',
    height: 50,
    backgroundColor: D.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: D.outline,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: D.onSurface,
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinBtn: {
    marginTop: 6,
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: D.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: D.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ── View B: Active Chat Room ──────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
interface ChatRoomProps {
  lobbyCode: string;
  messages: Message[];
  chatMessage: string;
  setChatMessage: (v: string) => void;
  onSend: () => void;
  onLeave: () => void;
}

function ChatRoom({
  lobbyCode, messages, chatMessage,
  setChatMessage, onSend, onLeave,
}: ChatRoomProps) {
  const flatRef = useRef<FlatList<Message>>(null);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[c.msgRow, isMe && c.msgRowMe]}>
        <View style={[c.bubble, isMe ? c.bubbleMe : c.bubbleOther]}>
          <Text style={c.bubbleText}>{item.text}</Text>
          <Text style={c.bubbleTime}>{item.timestamp}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    // KeyboardAvoidingView lifts the input footer above the keyboard.
    // behavior='padding' on iOS adds bottom padding equal to keyboard height.
    // On Android we use undefined (not 'height') because the window resize
    // mode in AndroidManifest handles it; 'height' can cause double-shifting.
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >

      {/* ── LOBBY HEADER ── */}
      <View style={c.header}>
        <View style={c.headerLeft}>
          <MaterialIcons name="groups" size={18} color={D.accent} />
          <Text style={c.lobbyCode}>LOBBY: #{lobbyCode}</Text>
        </View>
        <TouchableOpacity
          style={c.leaveBtn}
          onPress={onLeave}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Leave lobby"
        >
          <Text style={c.leaveBtnText}>LEAVE</Text>
        </TouchableOpacity>
      </View>

      {/* ── CHAT FEED ── */}
      {/* inverted={true} so newest messages appear at the bottom naturally */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={c.emptyWrap}>
            <Text style={c.emptyText}>Say something to your squad 👋</Text>
          </View>
        }
      />

      {/* ── INPUT FOOTER ── */}
      <View style={c.inputBar}>
        <TextInput
          style={c.input}
          value={chatMessage}
          onChangeText={setChatMessage}
          placeholder="Send a message…"
          placeholderTextColor={D.onDim}
          returnKeyType="send"
          onSubmitEditing={onSend}
          blurOnSubmit={false}
          accessibilityLabel="Chat message input"
        />
        <TouchableOpacity
          style={[c.sendBtn, !chatMessage.trim() && { opacity: 0.45 }]}
          onPress={onSend}
          disabled={!chatMessage.trim()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <MaterialIcons name="send" size={18} color={D.onSurface} />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const c = StyleSheet.create({
  // ── Lobby header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: D.surfaceLow,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: D.outline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lobbyCode: {
    fontSize: 14,
    fontWeight: '800',
    color: D.accent,
    letterSpacing: 1.5,
  },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: D.danger + '60',
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: D.danger,
    letterSpacing: 1.5,
  },

  // ── Chat list ────────────────────────────────────────────────────────────
  msgRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: SW * 0.72,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  bubbleOther: {
    backgroundColor: '#333333',
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: D.bayernBlue,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: D.onSurface,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    alignSelf: 'flex-end',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: D.onDim,
  },

  // ── Input bar ────────────────────────────────────────────────────────────
  // paddingBottom: 90 clears the Expo Router bottom tab bar on Android
  // (where KAV behavior is undefined and the tab bar sits ~80px tall).
  // On iOS the KAV padding mode handles the lift; the extra padding is
  // harmless there since the keyboard offset already accounts for it.
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 90,
    backgroundColor: D.input,
    borderTopWidth: 1,
    borderTopColor: D.outline,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: D.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: D.onSurface,
    borderWidth: 1,
    borderColor: D.outline,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: D.bayernRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.bayernRed,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ── Screen ────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function SquadScreen() {
  const [lobbyCode,    setLobbyCode]    = useState<string | null>(null);
  const [joinInput,    setJoinInput]    = useState('');
  const [chatMessage,  setChatMessage]  = useState('');
  const [messages,     setMessages]     = useState<Message[]>([]);

  const selectedClub = useAppStore(s => s.selectedClub);
  const isBVB = selectedClub === 'bvb';
  const isFCB = selectedClub === 'fcb';

  // Dynamic gradient (matches Hub)
  const gradientColors: [string, string, string, string] = isFCB
    ? ['#DC052D', '#5C0012', '#121212', '#121212']
    : isBVB
    ? ['#FDE100', '#4A4200', '#000000', '#000000']
    : ['#1A1A1A', '#121212', '#121212', '#121212'];
  const gradientLocations: [number, number, number, number] = isFCB
    ? [0, 0.4, 0.75, 1]
    : isBVB
    ? [0, 0.35, 0.7, 1]
    : [0, 0.3, 0.7, 1];
  const headerTextColor = isBVB ? '#000000' : '#FFFFFF';

  // ── Create lobby ──────────────────────────────────────────────────────────
  const handleCreateLobby = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const code = generateCode();
    setLobbyCode(code);
    setMessages([...SEED_MESSAGES]);
  }, []);

  // ── Join lobby ────────────────────────────────────────────────────────────
  const handleJoinLobby = useCallback(() => {
    if (!joinInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLobbyCode(joinInput.trim().toUpperCase());
    setJoinInput('');
    setMessages([...SEED_MESSAGES]);
  }, [joinInput]);

  // ── Leave lobby ───────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLobbyCode(null);
    setMessages([]);
    setChatMessage('');
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = chatMessage.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id:        `${Date.now()}_${Math.random()}`,
      text,
      sender:    'me',
      timestamp: nowTime(),
    };
    // Prepend because FlatList is inverted — newest first in the data array
    setMessages(prev => [newMsg, ...prev]);
    setChatMessage('');
  }, [chatMessage]);

  return (
    <LinearGradient colors={gradientColors} locations={gradientLocations} style={{ flex: 1 }}>
    <SafeAreaView style={screen.root} edges={['top']}>

      {/* ── SCREEN HEADER ── */}
      <View style={screen.header}>
        <Text style={screen.headerTitle}>
          <Text style={{ color: isBVB ? '#000000' : '#DC052D' }}>FAN </Text>
          <Text style={{ color: headerTextColor }}>SQUAD</Text>
        </Text>
        {lobbyCode && (
          <View style={screen.livePill}>
            <View style={screen.liveDot} />
            <Text style={screen.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── CONDITIONAL VIEWS ── */}
      {lobbyCode === null ? (
        <LobbyGate
          joinInput={joinInput}
          setJoinInput={setJoinInput}
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
        />
      ) : (
        <ChatRoom
          lobbyCode={lobbyCode}
          messages={messages}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          onSend={handleSend}
          onLeave={handleLeave}
        />
      )}

    </SafeAreaView>
    </LinearGradient>
  );
}

const screen = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220,5,45,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220,5,45,0.40)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC052D',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC052D',
    letterSpacing: 1.5,
  },
});

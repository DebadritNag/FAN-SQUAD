/**
 * PlayerAssets.ts
 * Master asset dictionary mapping every player name variant used in the app
 * to its local PNG require path.
 *
 * Rules:
 *  - Keys must exactly match the `name` field in MOCK_PLAYERS (or any alias used elsewhere)
 *  - Paths are relative to this file's location: constants/ → ../assets/
 *  - require() calls must be static strings — no dynamic keys at runtime
 *
 * Usage:
 *   import { PLAYER_IMAGES, getPlayerImage } from '../constants/PlayerAssets';
 *   <Image source={getPlayerImage(player.name)} style={{ width: 80, height: 80, borderRadius: 40 }} />
 */

export const PLAYER_IMAGES: Record<string, any> = {

  // ── FC Bayern München ──────────────────────────────────────────────────────
  'Harry Kane':       require('../assets/images/player_photos/Harry_Kane.png'),
  'Jamal Musiala':    require('../assets/images/player_photos/Jamal_Musiala.png'),
  'Leroy Sané':       require('../assets/images/player_photos/Leroy_Sane.png'),
  'Serge Gnabry':     require('../assets/images/player_photos/Serge_Gnabry.png'),
  'Joshua Kimmich':   require('../assets/images/player_photos/Joshua_Kimmich.png'),
  'Leon Goretzka':    require('../assets/images/player_photos/Leon_Goretzka.png'),
  'Thomas Müller':    require('../assets/images/player_photos/Thomas_Muller.png'),
  'Robert Lewandowski': require('../assets/images/player_photos/Robert_Lewandowski.png'),

  // ── Borussia Dortmund ──────────────────────────────────────────────────────
  'Donyell Malen':    require('../assets/images/player_photos/Donyell_Malen.png'),
  'Julian Brandt':    require('../assets/images/player_photos/Julian_Brandt.png'),
  'Niclas Füllkrug':  require('../assets/images/player_photos/Niclas_Fullkrug.png'),
  'Marco Reus':       require('../assets/images/player_photos/Marco_Reus.png'),
  'Marcel Sabitzer':  require('../assets/images/player_photos/Marcel_Sabitzer.png'),
  'Karim Adeyemi':    require('../assets/images/player_photos/Karim_Adeyemi.png'),

  // ── Werder Bremen ─────────────────────────────────────────────────────────
  'Marvin Ducksch':   require('../assets/images/player_photos/Marvin_Ducksch.png'),
  'Romano Schmid':    require('../assets/images/player_photos/Romano_Schmid.png'),
  'Mitchell Weiser':  require('../assets/images/player_photos/Mitchell_Weiser.png'),

  // ── Short-name / prediction aliases ───────────────────────────────────────
  // These cover any place in the app that uses a surname-only key
  'Müller':           require('../assets/images/player_photos/Thomas_Muller.png'),
  'Muller':           require('../assets/images/player_photos/Thomas_Muller.png'),
  'Lewandowski':      require('../assets/images/player_photos/Robert_Lewandowski.png'),
  'Malen':            require('../assets/images/player_photos/Donyell_Malen.png'),
  'Fullkrug':         require('../assets/images/player_photos/Niclas_Fullkrug.png'),
  'Füllkrug':         require('../assets/images/player_photos/Niclas_Fullkrug.png'),
  'Ducksch':          require('../assets/images/player_photos/Marvin_Ducksch.png'),
  'Weiser':           require('../assets/images/player_photos/Mitchell_Weiser.png'),
  'Kane':             require('../assets/images/player_photos/Harry_Kane.png'),
  'Sane':             require('../assets/images/player_photos/Leroy_Sane.png'),
  'Musiala':          require('../assets/images/player_photos/Jamal_Musiala.png'),
  'Gnabry':           require('../assets/images/player_photos/Serge_Gnabry.png'),
  'Kimmich':          require('../assets/images/player_photos/Joshua_Kimmich.png'),
  'Goretzka':         require('../assets/images/player_photos/Leon_Goretzka.png'),
  'Brandt':           require('../assets/images/player_photos/Julian_Brandt.png'),
  'Reus':             require('../assets/images/player_photos/Marco_Reus.png'),
  'Sabitzer':         require('../assets/images/player_photos/Marcel_Sabitzer.png'),
  'Adeyemi':          require('../assets/images/player_photos/Karim_Adeyemi.png'),
  'Schmid':           require('../assets/images/player_photos/Romano_Schmid.png'),
};

/**
 * Safe getter — returns the local asset if the name is in the dictionary,
 * otherwise returns undefined so callers can fall back to initials/remote URL.
 *
 * Example:
 *   const src = getPlayerImage(player.name);
 *   {src ? <Image source={src} ... /> : <InitialsAvatar name={player.name} />}
 */
export function getPlayerImage(name: string): any | undefined {
  return PLAYER_IMAGES[name] ?? undefined;
}

/**
 * DFL Lineup Parser
 *
 * Parses the DFL MatchInformations XML (embedded as a TypeScript string in
 * assets/lineupData.ts) and returns a structured lineup object for the home
 * team (Role="home").
 *
 * WHY NOT require('../assets/lineup.xml')?
 * Metro treats .xml files as binary assets and returns a numeric asset ID,
 * not the file content. The TypeScript string export in lineupData.ts is the
 * correct zero-config approach for all platforms.
 *
 * ── DFL PlayingPosition code → tactical line mapping ─────────────────────────
 *
 *  Goalkeeper  : TW
 *  Defenders   : IVR, IVL, IVZ, RV, LV          (IV* = Innenverteidiger, RV/LV = Außenverteidiger)
 *  Midfielders : DMR, DML, DRM, DLM, ZO, ZM,    (defensive/central mid)
 *                OLM, ORM, OZM                   (offensive/attacking mid)
 *  Attackers   : STZ, STL, STR, HS,              (Stürmer)
 *                RA, LA                           (Rechts-/Linksaußen — wide forwards)
 *
 *  Any unrecognised position falls back to midfielders so no player is lost.
 */

import { XMLParser } from 'fast-xml-parser';
import { LINEUP_XML } from '../assets/lineupData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LineupPlayer {
  personId:   string;
  shirtNumber: number;
  shortname:  string;
  firstName:  string;
  lastName:   string;
  position:   string;
  teamLeader: boolean;
}

export interface StaffMember {
  personId:  string;
  role:      string;
  firstName: string;
  lastName:  string;
  shortname: string;
}

export interface ParsedLineup {
  teamName:      string;
  shortName:     string;
  formation:     string;
  primaryColor:  string;
  secondaryColor:string;
  startingXI: {
    goalkeeper:  LineupPlayer[];
    defenders:   LineupPlayer[];
    midfielders: LineupPlayer[];
    attackers:   LineupPlayer[];
  };
  substitutes: LineupPlayer[];
  staff: {
    headcoach:  StaffMember | null;
    assistants: StaffMember[];
  };
}

// ── Position classification ───────────────────────────────────────────────────
// Uses substring matching so partial codes (e.g. "IV" catches IVR/IVL/IVZ)
// are handled without maintaining an exhaustive set.

function classifyPosition(
  pos: string,
): 'goalkeeper' | 'defenders' | 'midfielders' | 'attackers' {
  if (!pos) return 'midfielders'; // unknown → mid so no player is lost

  const p = pos.toUpperCase();

  // ── Goalkeeper ──────────────────────────────────────────────────────────
  if (p === 'TW') return 'goalkeeper';

  // ── Defenders ───────────────────────────────────────────────────────────
  // IV* = Innenverteidiger (centre-back), RV = right-back, LV = left-back
  if (p.startsWith('IV') || p === 'RV' || p === 'LV') return 'defenders';

  // ── Attackers ───────────────────────────────────────────────────────────
  // ST* = Stürmer (striker), RA/LA = wide forwards (Rechts-/Linksaußen)
  if (p.startsWith('ST') || p === 'HS' || p === 'RA' || p === 'LA') return 'attackers';

  // ── Midfielders (everything else) ───────────────────────────────────────
  // DM* = defensive mid, ZO/ZM = central mid, OM*/OL*/OR* = attacking mid
  return 'midfielders';
}

// ── Attribute helpers ─────────────────────────────────────────────────────────

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s.length > 0 ? s : fallback;
}

function bool(v: unknown): boolean {
  return String(v).toLowerCase() === 'true';
}

function num(v: unknown, fallback = 0): number {
  const n = parseInt(String(v), 10);
  return isNaN(n) ? fallback : n;
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse the embedded DFL XML and return a structured lineup for the home team.
 * Synchronous — safe to call from Zustand actions.
 */
export function parseDFLLineup(xmlContent?: string): ParsedLineup {
  // Guard: if caller passes something that isn't a string (e.g. a Metro asset
  // number from a stale require() call), fall back to the embedded constant.
  const source =
    typeof xmlContent === 'string' && xmlContent.trim().startsWith('<')
      ? xmlContent
      : LINEUP_XML;

  let doc: any;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',  // attributes are plain keys, no prefix
      isArray: (name) =>
        // Always treat these as arrays even when there is only one child node
        ['Team', 'Player', 'Trainer', 'Referee'].includes(name),
    });
    doc = parser.parse(source);
  } catch (err) {
    console.warn('parseDFLLineup: XML parse error', err);
    return emptyLineup();
  }

  // ── Navigate to Teams ─────────────────────────────────────────────────────
  const teams: any[] =
    doc?.PutDataRequest?.MatchInformation?.Teams?.Team ?? [];

  if (teams.length === 0) {
    console.warn('parseDFLLineup: no <Team> nodes found');
    return emptyLineup();
  }

  // Target the home team
  const homeTeam = teams.find((t: any) => str(t.Role) === 'home');
  if (!homeTeam) {
    console.warn('parseDFLLineup: no home team found');
    return emptyLineup();
  }

  // ── Players ───────────────────────────────────────────────────────────────
  const rawPlayers: any[] = homeTeam?.Players?.Player ?? [];

  const startingXI: ParsedLineup['startingXI'] = {
    goalkeeper:  [],
    defenders:   [],
    midfielders: [],
    attackers:   [],
  };
  const substitutes: LineupPlayer[] = [];

  for (const p of rawPlayers) {
    const player: LineupPlayer = {
      personId:    str(p.PersonId),
      shirtNumber: num(p.ShirtNumber),
      shortname:   str(p.Shortname),
      firstName:   str(p.FirstName),
      lastName:    str(p.LastName),
      position:    str(p.PlayingPosition),
      teamLeader:  bool(p.TeamLeader),
    };

    if (bool(p.Starting)) {
      const line = classifyPosition(player.position);
      startingXI[line].push(player);
    } else {
      substitutes.push(player);
    }
  }

  // Sort each line by shirt number for consistent left-to-right display
  for (const line of Object.values(startingXI)) {
    line.sort((a, b) => a.shirtNumber - b.shirtNumber);
  }
  substitutes.sort((a, b) => a.shirtNumber - b.shirtNumber);

  // ── Coaching staff ────────────────────────────────────────────────────────
  const rawStaff: any[] = homeTeam?.TrainerStaff?.Trainer ?? [];

  let headcoach: StaffMember | null = null;
  const assistants: StaffMember[] = [];

  for (const t of rawStaff) {
    const member: StaffMember = {
      personId:  str(t.PersonId),
      role:      str(t.Role),
      firstName: str(t.FirstName),
      lastName:  str(t.LastName),
      shortname: str(t.Shortname),
    };
    if (member.role === 'headcoach') {
      headcoach = member;
    } else {
      assistants.push(member);
    }
  }

  // Validate primary color — XML has "#00000" (5 chars) which is malformed;
  // fall back to a visible red so the pitch color is always usable.
  const rawPrimary = str(homeTeam.PlayerShirtMainColor, '');
  const primaryColor =
    /^#[0-9A-Fa-f]{6}$/.test(rawPrimary) ? rawPrimary : '#DC052D';

  return {
    teamName:       str(homeTeam.TeamName, 'Home'),
    shortName:      str(homeTeam.ShortName, 'HME'),
    formation:      str(homeTeam.LineUp, '4-4-2'),
    primaryColor,
    secondaryColor: str(homeTeam.PlayerShirtSecondaryColor, '#FFFFFF'),
    startingXI,
    substitutes,
    staff: { headcoach, assistants },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyLineup(): ParsedLineup {
  return {
    teamName: 'Unknown', shortName: 'UNK', formation: '4-4-2',
    primaryColor: '#DC052D', secondaryColor: '#FFFFFF',
    startingXI: { goalkeeper: [], defenders: [], midfielders: [], attackers: [] },
    substitutes: [],
    staff: { headcoach: null, assistants: [] },
  };
}

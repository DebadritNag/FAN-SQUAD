import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getClubTheme, Colors, Typography, Spacing, Radius, Shadows, GlassCard } from '../constants/Theme';
import { MOCK_CLUBS } from '../constants/MockData';

export const useTheme = () => {
  const teams = useAppStore((state) => state.teams);
  const selectedClub = useAppStore((state) => state.selectedClub);

  const club = useMemo(() => {
    // First try to find the club from live WebSocket team data
    const team = teams.find((t) => t.teamId === selectedClub);
    if (team) {
      return {
        id: team.teamId,
        name: team.teamName,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        crestUrl: '',
        playerImageUrl: '',
      };
    }

    // Fallback: resolve from static MOCK_CLUBS using the stored club id
    const mockClub = MOCK_CLUBS.find((c) => c.id === selectedClub);
    return mockClub ?? null;
  }, [teams, selectedClub]);

  const clubTheme = useMemo(() => getClubTheme(club), [club]);

  return {
    colors: Colors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    glassCard: GlassCard,
    club: clubTheme,
  };
};

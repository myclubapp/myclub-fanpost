import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { ClubSearch } from "@/components/ClubSearch";
import { TeamSearch } from "@/components/TeamSearch";
import { GameList } from "@/components/GameList";
import { GamePreviewDisplay } from "@/components/GamePreviewDisplay";
import { TeamSlotDialog } from "@/components/TeamSlotDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Download, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamSlots } from "@/hooks/useTeamSlots";
import { supabase } from "@/integrations/supabase/client";

export type SportType = "unihockey" | "volleyball" | "handball";

const Index = () => {
  const {
    sport,
    clubId,
    teamId,
    gameId
  } = useParams<{
    sport: SportType;
    clubId?: string;
    teamId?: string;
    gameId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = new URLSearchParams(location.search);
  const editSelection = searchParams.get('editSelection') === '1';
  const themeParam = searchParams.get('theme') || searchParams.get('template');
  const tabParam = searchParams.get('tab') || 'preview';
  const homeParam = searchParams.get('home') === 'true';
  const detailParam = searchParams.get('detail') === 'true';

  const [selectedSport, setSelectedSport] = useState<SportType | "">(sport || "");
  const [selectedTheme, setSelectedTheme] = useState<string>(themeParam || "kanva");
  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [isHomeGame, setIsHomeGame] = useState<boolean>(homeParam);
  const [showResultDetail, setShowResultDetail] = useState<boolean>(detailParam);
  const [selectedClubId, setSelectedClubId] = useState<string>(clubId || "");
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || "");
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>(() => {
    if (gameId) {
      return gameId.split(',').map(id => id.trim()).filter(id => id);
    }
    return [];
  });
  const [gamesHaveResults, setGamesHaveResults] = useState<boolean[]>([]);
  const [gamesData, setGamesData] = useState<any[]>([]);
  const [rememberLastSelection, setRememberLastSelection] = useState(true);
  const [loadedLastSelection, setLoadedLastSelection] = useState(false);
  const [showTeamSlotDialog, setShowTeamSlotDialog] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);
  const gamePreviewRef = useRef<{ triggerDownload: () => void; triggerInstagramShare: () => void } | null>(null);
  
  const {
    isTeamInSlot,
    canAddSlot,
    addTeamSlot,
    getDaysUntilChange,
    maxTeams,
  } = useTeamSlots();

  // Load last selection from profile on mount
  useEffect(() => {
    const loadLastSelection = async () => {
      if (!user || loadedLastSelection || clubId || teamId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('remember_last_selection, last_sport, last_club_id, last_team_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.remember_last_selection && data.last_sport && data.last_club_id) {
          setRememberLastSelection(true);
          const lastSport = data.last_sport as SportType;
          
          // Use last saved sport if no sport in URL
          const targetSport = sport || lastSport;
          
          setSelectedSport(targetSport);
          setSelectedClubId(data.last_club_id);
          
          if (data.last_team_id) {
            setSelectedTeamId(data.last_team_id);
            navigate(`/studio/${targetSport}/${data.last_club_id}/${data.last_team_id}`);
          } else {
            navigate(`/studio/${targetSport}/${data.last_club_id}`);
          }
        }
        
        setLoadedLastSelection(true);
      } catch (error) {
        console.error('Error loading last selection:', error);
        setLoadedLastSelection(true);
      }
    };

    loadLastSelection();
  }, [user, sport, clubId, teamId, loadedLastSelection, navigate]);

  // Save last selection to profile when it changes
  useEffect(() => {
    const saveLastSelection = async () => {
      if (!user || !rememberLastSelection || !selectedSport || !selectedClubId) return;
      
      try {
        await supabase
          .from('profiles')
          .update({
            last_sport: selectedSport,
            last_club_id: selectedClubId,
            last_team_id: selectedTeamId || null,
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving last selection:', error);
      }
    };

    if (loadedLastSelection) {
      saveLastSelection();
    }
  }, [user, rememberLastSelection, selectedSport, selectedClubId, selectedTeamId, loadedLastSelection]);

  // Load remember setting from profile (Instagram username handling is in GamePreviewDisplay)
  useEffect(() => {
    const loadProfileSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setRememberLastSelection((data as any).remember_last_selection ?? true);
        }
      } catch (error) {
        console.error('Error loading profile settings:', error);
      }
    };

    loadProfileSettings();
  }, [user]);

  // Load club name from API when clubId is set via URL
  useEffect(() => {
    const fetchClubName = async () => {
      if (!selectedClubId || selectedClubName || !selectedSport) return;
      
      const apiUrls: Record<SportType, string> = {
        unihockey: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20clubs{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%20%0A}",
        volleyball: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20clubs%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A",
        handball: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20clubs%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A",
      };

      const apiUrl = apiUrls[selectedSport as SportType];
      if (!apiUrl) return;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const clubs = data.data?.clubs || [];
        const club = clubs.find((c: { id: string, name: string }) => c.id === selectedClubId);
        if (club) {
          setSelectedClubName(club.name);
        }
      } catch (error) {
        console.error("Error fetching club name:", error);
      }
    };

    fetchClubName();
  }, [selectedClubId, selectedClubName, selectedSport]);

  // Load team name from API when teamId is set via URL
  useEffect(() => {
    const fetchTeamName = async () => {
      if (!selectedTeamId || selectedTeamName || !selectedSport || !selectedClubId) return;
      
      const apiUrls: Record<SportType, (clubId: string) => string> = {
        unihockey: (clubId: string) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%0A}%0A`,
        volleyball: (clubId: string) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A`,
        handball: (clubId: string) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A`,
      };

      const apiUrl = apiUrls[selectedSport as SportType](selectedClubId);
      if (!apiUrl) return;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const teams = data.data?.teams || [];
        const team = teams.find((t: { id: string, name: string }) => t.id === selectedTeamId);
        if (team) {
          setSelectedTeamName(team.name);
        }
      } catch (error) {
        console.error("Error fetching team name:", error);
      }
    };

    fetchTeamName();
  }, [selectedTeamId, selectedTeamName, selectedSport, selectedClubId]);

  useEffect(() => {
    if (sport && sport !== selectedSport) {
      setSelectedSport(sport);
    }
  }, [sport]);

  useEffect(() => {
    if (clubId && clubId !== selectedClubId) {
      setSelectedClubId(clubId);
    }
  }, [clubId]);

  useEffect(() => {
    if (teamId && teamId !== selectedTeamId) {
      setSelectedTeamId(teamId);
    }
  }, [teamId]);

  useEffect(() => {
    if (gameId) {
      const gameIdsFromUrl = gameId.split(',').map(id => id.trim()).filter(id => id);
      setSelectedGameIds(gameIdsFromUrl);
    }
  }, [gameId]);

  // Ensure volleyball and handball have gamesData available even when navigating directly with a gameId
  useEffect(() => {
    const fetchGamesIfNeeded = async () => {
      if (
        (selectedSport === 'volleyball' || selectedSport === 'handball') &&
        selectedTeamId &&
        selectedGameIds.length > 0 &&
        gamesData.length === 0
      ) {
        try {
          let apiUrl: string;
          
          if (selectedSport === 'volleyball') {
            const query = `{
  games(teamId: "${selectedTeamId}") {
    id
    date
    time
    location
    city
    teamHome
    teamAway
    teamHomeLogo
    teamAwayLogo
    result
    resultDetail
  }
}`;
            apiUrl = `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=${encodeURIComponent(query)}`;
          } else {
            // handball
            const query = `{
  games(teamId: "${selectedTeamId}", clubId: "${selectedClubId}") {
    id
    teamHome
    teamAway
    teamHomeLogo
    teamAwayLogo
    date
    time
    result
    resultDetail
  }
}`;
            apiUrl = `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=${encodeURIComponent(query)}`;
          }
          
          const res = await fetch(apiUrl);
          if (res.ok) {
            const json = await res.json();
            const list = json.data?.games || [];
            setGamesData(list);
            // Optionally recompute results presence
            const hasRes = selectedGameIds.map(id => {
              const g = list.find((x: any) => x.id === id);
              return !!(g?.result && g.result !== '' && g.result !== '-:-');
            });
            setGamesHaveResults(hasRes);
          }
        } catch (e) {
          console.error('Failed to preload games list', e);
        }
      }
    };

    fetchGamesIfNeeded();
  }, [selectedSport, selectedTeamId, selectedClubId, selectedGameIds, gamesData.length]);

  const handleSportChange = (value: string) => {
    const newSport = value as SportType;
    setSelectedSport(newSport);
    setSelectedClubId("");
    setSelectedClubName("");
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameIds([]);
    navigate(`/studio/${newSport}`);
  };

  const handleClubSelect = (clubId: string, clubName: string) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameIds([]);
    if (selectedSport) {
      navigate(`/studio/${selectedSport}/${clubId}`);
    }
  };

  const handleTeamSelect = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setSelectedGameIds([]);
    if (selectedSport && selectedClubId) {
      navigate(`/studio/${selectedSport}/${selectedClubId}/${teamId}`);
    }
  };

  const handleExportClick = () => {
    // Check if team is in a slot
    if (isTeamInSlot(selectedTeamId)) {
      // Team is already saved, proceed with export
      gamePreviewRef.current?.triggerInstagramShare();
    } else {
      // Team not in slot, show dialog
      setShowTeamSlotDialog(true);
      setPendingExport(true);
    }
  };

  const handleConfirmTeamSlot = async () => {
    setShowTeamSlotDialog(false);
    
    if (selectedSport && selectedClubId && selectedTeamId && selectedTeamName) {
      const success = await addTeamSlot(
        selectedTeamId,
        selectedTeamName,
        selectedSport,
        selectedClubId
      );
      
      if (success && pendingExport) {
        // Export after saving team
        gamePreviewRef.current?.triggerInstagramShare();
      }
    }
    
    setPendingExport(false);
  };

  const handleCancelTeamSlot = () => {
    setShowTeamSlotDialog(false);
    setPendingExport(false);
  };

  const canExport = isTeamInSlot(selectedTeamId) || canAddSlot();

  const handleGameSelect = (gameIds: string[], hasResults: boolean[], games?: any[]) => {
    setSelectedGameIds(gameIds);
    setGamesHaveResults(hasResults);
    setGamesData(games || []);
    const gameIdsParam = gameIds.join(',');
    const params = new URLSearchParams();
    if (selectedTheme !== 'kanva') params.set('theme', selectedTheme);
    if (activeTab !== 'preview') params.set('tab', activeTab);
    if (isHomeGame) params.set('home', 'true');
    if (showResultDetail) params.set('detail', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/studio/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameIdsParam}${queryString}`);
  };

  const buildUrlWithParams = (overrides: Partial<{ theme: string; tab: string; home: boolean; detail: boolean }> = {}) => {
    if (selectedGameIds.length === 0) return;
    
    const gameIdsParam = selectedGameIds.join(',');
    const params = new URLSearchParams();
    
    const finalTheme = overrides.theme ?? selectedTheme;
    const finalTab = overrides.tab ?? activeTab;
    const finalHome = overrides.home ?? isHomeGame;
    const finalDetail = overrides.detail ?? showResultDetail;
    
    // Check if it's a custom template (not a standard myclub theme)
    const isCustomTemplate = !['kanva','kanva-light', 'kanva-dark', 'kadetten-unihockey' ].includes(finalTheme);
    
    if (isCustomTemplate) {
      // For custom templates, only set the template parameter
      params.set('template', finalTheme);
    } else {
      // For standard themes
      if (finalTheme !== 'kanva') params.set('theme', finalTheme);
      if (finalTab !== 'preview') params.set('tab', finalTab);
      
      // Only add home parameter if preview tab is active
      if (finalTab === 'preview' && finalHome) params.set('home', 'true');
      
      // Only add detail parameter if result tab is active
      if (finalTab === 'result' && finalDetail) params.set('detail', 'true');
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return `/studio/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameIdsParam}${queryString}`;
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    const url = buildUrlWithParams({ theme });
    if (url) navigate(url);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = buildUrlWithParams({ tab });
    if (url) navigate(url);
  };

  const handleHomeGameChange = (value: boolean) => {
    setIsHomeGame(value);
    const url = buildUrlWithParams({ home: value });
    if (url) navigate(url);
  };

  const handleResultDetailChange = (value: boolean) => {
    setShowResultDetail(value);
    const url = buildUrlWithParams({ detail: value });
    if (url) navigate(url);
  };

  const sportLabels: Record<SportType, string> = {
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    handball: "Handball"
  };

  return (
    <main className="min-h-screen bg-background pt-16">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Title with selection info */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 space-y-2 sm:space-y-3 md:space-y-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight px-2 break-words">
            {!selectedSport && t.studio.title}
            {selectedSport && !selectedClubId && `${sportLabels[selectedSport]} - ${t.studio.selectClub}`}
            {selectedClubId && !selectedTeamId && `${selectedClubName} - ${t.studio.selectTeam}`}
            {selectedTeamId && selectedGameIds.length === 0 && `${selectedClubName} - ${selectedTeamName}`}
            {selectedGameIds.length > 0 && `${selectedClubName} - ${selectedTeamName}`}
          </h1>
          {!selectedSport && (
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              {t.studio.subtitle}
            </p>
          )}
        </div>

        {/* Selection Steps */}
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
          {/* Step 1: Sport Selection - Show only if no sport selected */}
          {!selectedSport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </span>
                  {t.studio.selectSport}
                </CardTitle>
                <CardDescription>
                  {t.studio.selectSportDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="sport-select">{t.studio.selectSport}</Label>
                  <Select value={selectedSport} onValueChange={handleSportChange}>
                    <SelectTrigger id="sport-select">
                      <SelectValue placeholder={t.studio.selectSportPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unihockey">Unihockey</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="handball">Handball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Club Selection - Show only if sport selected but no club */}
          {selectedSport && !selectedClubId && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSport("");
                  navigate('/studio');
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.studio.back}
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      2
                    </span>
                    {t.studio.selectClub}
                  </CardTitle>
                  <CardDescription>
                    {t.studio.selectClubDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClubSearch
                    sportType={selectedSport}
                    onClubSelect={handleClubSelect}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Team Selection - Show only if club selected but no team */}
          {selectedSport && selectedClubId && !selectedTeamId && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedClubId("");
                  setSelectedClubName("");
                  navigate(`/studio/${selectedSport}`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.studio.back}
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      3
                    </span>
                    {t.studio.selectTeam}
                  </CardTitle>
                  <CardDescription>
                    {t.studio.selectTeamDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamSearch
                    sportType={selectedSport}
                    clubId={selectedClubId}
                    clubName={selectedClubName}
                    onTeamSelect={handleTeamSelect}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Game Selection - Show only if team selected or when editing selection */}
          {selectedSport && selectedClubId && selectedTeamId && (selectedGameIds.length === 0 || editSelection) && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTeamId("");
                  setSelectedTeamName("");
                  navigate(`/studio/${selectedSport}/${selectedClubId}`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.studio.back}
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      4
                    </span>
                    {t.studio.selectGame}
                  </CardTitle>
                  <CardDescription>
                    {t.studio.selectGameDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GameList
                    sportType={selectedSport}
                    teamId={selectedTeamId}
                    clubId={selectedClubId}
                    onGameSelect={handleGameSelect}
                    initialSelectedGameIds={selectedGameIds}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Game Preview Display - Show only if game selected and not editing selection */}
          {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && !editSelection && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate(`/studio/${selectedSport}/${selectedClubId}/${selectedTeamId}?editSelection=1`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.studio.backToGameSelection}
              </Button>
              <GamePreviewDisplay
                sportType={selectedSport}
                clubId={selectedClubId}
                teamId={selectedTeamId}
                gameIds={selectedGameIds}
                gamesHaveResults={gamesHaveResults}
                gamesData={gamesData}
                studioUrl={(() => {
                  const params = new URLSearchParams();
                  if (selectedTheme !== 'kanva') params.set('theme', selectedTheme);
                  if (activeTab !== 'preview') params.set('tab', activeTab);
                  if (isHomeGame) params.set('home', 'true');
                  if (showResultDetail) params.set('detail', 'true');
                  const queryString = params.toString() ? `?${params.toString()}` : '';
                  return `/studio/${selectedSport}/${selectedClubId}/${selectedTeamId}/${selectedGameIds.join(',')}${queryString}`;
                })()}
                selectedTheme={selectedTheme}
                onThemeChange={handleThemeChange}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isHomeGame={isHomeGame}
                onHomeGameChange={handleHomeGameChange}
                showResultDetail={showResultDetail}
                onResultDetailChange={handleResultDetailChange}
                ref={gamePreviewRef}
              />
            </div>
          )}
        </div>
      </div>

      {/* Team Slot Warning - Show when team is not in slot and no slots available */}
      {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && !editSelection && !canExport && (
        <div className="max-w-4xl mx-auto mb-28">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sie haben das Maximum von {maxTeams} Team-Slot{maxTeams !== 1 ? 's' : ''} erreicht. 
              Um für weitere Teams zu exportieren, upgraden Sie Ihr Abo oder löschen Sie einen bestehenden Slot im Profil.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Sticky Footer for Export - Show when preview is displayed */}
      {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && !editSelection && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-2 max-w-4xl mx-auto">
              {!user && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bitte melden Sie sich an oder registrieren Sie sich, um Bilder zu exportieren.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleExportClick}
                className="w-full gap-2"
                size="lg"
                disabled={!user || !canExport}
              >
                <Download className="h-4 w-4" />
                {t.studio.exportAsImage}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Slot Dialog */}
      <TeamSlotDialog
        open={showTeamSlotDialog}
        onOpenChange={setShowTeamSlotDialog}
        teamName={selectedTeamName}
        onConfirm={handleConfirmTeamSlot}
        onCancel={handleCancelTeamSlot}
      />
    </main>
  );
};

export default Index;

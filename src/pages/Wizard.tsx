import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { ClubSearch } from "@/components/ClubSearch";
import { TeamSearch } from "@/components/TeamSearch";
import { GameList } from "@/components/GameList";
import { GamePreviewDisplay } from "@/components/GamePreviewDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Instagram } from "lucide-react";
import myclubLogo from "@/assets/myclub-logo.png";
import { useAuth } from "@/hooks/useAuth";
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
  const searchParams = new URLSearchParams(location.search);
  const editSelection = searchParams.get('editSelection') === '1';
  const themeParam = searchParams.get('theme') || searchParams.get('template');
  const tabParam = searchParams.get('tab') || 'preview';
  const homeParam = searchParams.get('home') === 'true';
  const detailParam = searchParams.get('detail') === 'true';

  const [selectedSport, setSelectedSport] = useState<SportType | "">(sport || "");
  const [selectedTheme, setSelectedTheme] = useState<string>(themeParam || "myclub");
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
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const gamePreviewRef = useRef<{ triggerDownload: () => void; triggerInstagramShare: () => void } | null>(null);

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
            navigate(`/wizard/${targetSport}/${data.last_club_id}/${data.last_team_id}`);
          } else {
            navigate(`/wizard/${targetSport}/${data.last_club_id}`);
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

  // Load remember setting and Instagram username from profile
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
          setInstagramUsername((data as any).instagram_username || null);
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
        handball: "",
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
        handball: () => "",
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

  // Ensure volleyball has gamesData available even when navigating directly with a gameId
  useEffect(() => {
    const fetchVolleyballGamesIfNeeded = async () => {
      if (
        selectedSport === 'volleyball' &&
        selectedTeamId &&
        selectedGameIds.length > 0 &&
        gamesData.length === 0
      ) {
        try {
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
          const apiUrl = `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=${encodeURIComponent(query)}`;
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
          console.error('Failed to preload volleyball games list', e);
        }
      }
    };

    fetchVolleyballGamesIfNeeded();
  }, [selectedSport, selectedTeamId, selectedGameIds, gamesData.length]);

  const handleSportChange = (value: string) => {
    const newSport = value as SportType;
    setSelectedSport(newSport);
    setSelectedClubId("");
    setSelectedClubName("");
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameIds([]);
    navigate(`/wizard/${newSport}`);
  };

  const handleClubSelect = (clubId: string, clubName: string) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameIds([]);
    if (selectedSport) {
      navigate(`/wizard/${selectedSport}/${clubId}`);
    }
  };

  const handleTeamSelect = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setSelectedGameIds([]);
    if (selectedSport && selectedClubId) {
      navigate(`/wizard/${selectedSport}/${selectedClubId}/${teamId}`);
    }
  };

  const handleGameSelect = (gameIds: string[], hasResults: boolean[], games?: any[]) => {
    setSelectedGameIds(gameIds);
    setGamesHaveResults(hasResults);
    setGamesData(games || []);
    const gameIdsParam = gameIds.join(',');
    const params = new URLSearchParams();
    if (selectedTheme !== 'myclub') params.set('theme', selectedTheme);
    if (activeTab !== 'preview') params.set('tab', activeTab);
    if (isHomeGame) params.set('home', 'true');
    if (showResultDetail) params.set('detail', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameIdsParam}${queryString}`);
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
    const isCustomTemplate = !['myclub', 'kadetten-unihockey', 'myclub-light', 'myclub-dark'].includes(finalTheme);
    
    if (isCustomTemplate) {
      // For custom templates, only set the template parameter
      params.set('template', finalTheme);
    } else {
      // For standard themes
      if (finalTheme !== 'myclub') params.set('theme', finalTheme);
      if (finalTab !== 'preview') params.set('tab', finalTab);
      
      // Only add home parameter if preview tab is active
      if (finalTab === 'preview' && finalHome) params.set('home', 'true');
      
      // Only add detail parameter if result tab is active
      if (finalTab === 'result' && finalDetail) params.set('detail', 'true');
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return `/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameIdsParam}${queryString}`;
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
        <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight px-2">
            {!selectedSport && "Social Media Posts für dein Team"}
            {selectedSport && !selectedClubId && `${sportLabels[selectedSport]} - Club auswählen`}
            {selectedClubId && !selectedTeamId && `${selectedClubName} - Team auswählen`}
            {selectedTeamId && selectedGameIds.length === 0 && `${selectedClubName} - ${selectedTeamName}`}
            {selectedGameIds.length > 0 && `${selectedClubName} - ${selectedTeamName}`}
          </h1>
          {!selectedSport && (
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Erstelle professionelle Social Media Posts für deine Spiele in Sekunden
            </p>
          )}
        </div>

        {/* Selection Steps */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          {/* Step 1: Sport Selection - Show only if no sport selected */}
          {!selectedSport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </span>
                  Sportart wählen
                </CardTitle>
                <CardDescription>
                  Wähle deine Sportart aus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="sport-select">Sportart</Label>
                  <Select value={selectedSport} onValueChange={handleSportChange}>
                    <SelectTrigger id="sport-select">
                      <SelectValue placeholder="Wähle eine Sportart..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unihockey">Unihockey</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="handball" disabled>
                        <div className="flex items-center gap-2">
                          Handball
                          <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                        </div>
                      </SelectItem>
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
                  navigate('/wizard');
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      2
                    </span>
                    Club auswählen
                  </CardTitle>
                  <CardDescription>
                    Wähle deinen Club aus
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
                  navigate(`/wizard/${selectedSport}`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      3
                    </span>
                    Team auswählen
                  </CardTitle>
                  <CardDescription>
                    Wähle dein Team aus
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
                  navigate(`/wizard/${selectedSport}/${selectedClubId}`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      4
                    </span>
                    Spiel auswählen
                  </CardTitle>
                  <CardDescription>
                    Wähle das Spiel aus und erstelle deinen Post
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GameList
                    sportType={selectedSport}
                    teamId={selectedTeamId}
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
                  navigate(`/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}?editSelection=1`);
                }}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück zur Spielauswahl
              </Button>
              <GamePreviewDisplay
                sportType={selectedSport}
                clubId={selectedClubId}
                gameIds={selectedGameIds}
                gamesHaveResults={gamesHaveResults}
                gamesData={gamesData}
                wizardUrl={(() => {
                  const params = new URLSearchParams();
                  if (selectedTheme !== 'myclub') params.set('theme', selectedTheme);
                  if (activeTab !== 'preview') params.set('tab', activeTab);
                  if (isHomeGame) params.set('home', 'true');
                  if (showResultDetail) params.set('detail', 'true');
                  const queryString = params.toString() ? `?${params.toString()}` : '';
                  return `/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}/${selectedGameIds.join(',')}${queryString}`;
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

      {/* Sticky Footer for Export - Show when preview is displayed */}
      {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && !editSelection && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
              {instagramUsername ? (
                <>
                  <Button
                    onClick={() => gamePreviewRef.current?.triggerDownload()}
                    className="flex-1 gap-2"
                    size="lg"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    Exportieren
                  </Button>
                  <Button
                    onClick={() => gamePreviewRef.current?.triggerInstagramShare()}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram Story
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => gamePreviewRef.current?.triggerDownload()}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Als Bild exportieren
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ChevronLeft } from "lucide-react";
import myclubLogo from "@/assets/myclub-logo.png";

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

  const [selectedSport, setSelectedSport] = useState<SportType | "">(sport || "");
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

  // Load club name from API when clubId is set via URL
  useEffect(() => {
    const fetchClubName = async () => {
      if (!selectedClubId || selectedClubName || !selectedSport) return;
      
      const apiUrls: Record<SportType, string> = {
        unihockey: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query={%0A%20%20clubs{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20}%20%0A}",
        volleyball: "",
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
        volleyball: () => "",
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
    } else {
      if (selectedGameIds.length > 0) {
        setSelectedGameIds([]);
      }
    }
  }, [gameId]);

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

  const handleGameSelect = (gameIds: string[], hasResults: boolean[]) => {
    setSelectedGameIds(gameIds);
    setGamesHaveResults(hasResults);
    const gameIdsParam = gameIds.join(',');
    navigate(`/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameIdsParam}`);
  };

  const sportLabels: Record<SportType, string> = {
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    handball: "Handball"
  };

  return (
    <div className="min-h-screen bg-background pt-16">{/* pt-16 für fixed header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Title with selection info */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {!selectedSport && "Social Media Posts für dein Team"}
            {selectedSport && !selectedClubId && `${sportLabels[selectedSport]} - Club auswählen`}
            {selectedClubId && !selectedTeamId && `${selectedClubName} - Team auswählen`}
            {selectedTeamId && selectedGameIds.length === 0 && `${selectedClubName} - ${selectedTeamName}`}
            {selectedGameIds.length > 0 && `${selectedClubName} - ${selectedTeamName}`}
          </h1>
          {!selectedSport && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Erstelle professionelle Social Media Posts für deine Spiele in Sekunden
            </p>
          )}
        </div>

        {/* Selection Steps */}
        <div className="max-w-4xl mx-auto space-y-8">
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
                      <SelectItem value="handball">Handball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Club Selection - Show only if sport selected but no club */}
          {selectedSport && !selectedClubId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
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
                </div>
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
          )}

          {/* Step 3: Team Selection - Show only if club selected but no team */}
          {selectedSport && selectedClubId && !selectedTeamId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
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
                </div>
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
          )}

          {/* Step 4: Game Selection - Show only if team selected but no game */}
          {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length === 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
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
                </div>
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
                />
              </CardContent>
            </Card>
          )}

          {/* Game Preview Display - Show only if game selected */}
          {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGameIds([]);
                  navigate(`/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}`);
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
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClubSearch } from "@/components/ClubSearch";
import { TeamSearch } from "@/components/TeamSearch";
import { GameList } from "@/components/GameList";
import { GamePreviewDisplay } from "@/components/GamePreviewDisplay";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import myclubLogo from "@/assets/myclub-logo.png";

export type SportType = "unihockey" | "volleyball" | "handball";

const Index = () => {
  const { sport, clubId, teamId, gameId } = useParams<{
    sport?: SportType;
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
  const [selectedGameId, setSelectedGameId] = useState<string>(gameId || "");

  // Sync URL params with state
  useEffect(() => {
    if (sport) setSelectedSport(sport);
    if (clubId) setSelectedClubId(clubId);
    if (teamId) setSelectedTeamId(teamId);
    if (gameId) setSelectedGameId(gameId);
  }, [sport, clubId, teamId, gameId]);

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

  const handleSportSelect = (sport: SportType) => {
    setSelectedSport(sport);
    setSelectedClubId("");
    setSelectedClubName("");
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameId("");
    navigate(`/${sport}`);
  };

  const handleClubSelect = (clubId: string, clubName: string) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    setSelectedTeamId("");
    setSelectedTeamName("");
    setSelectedGameId("");
    navigate(`/${selectedSport}/${clubId}`);
  };

  const handleTeamSelect = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
    setSelectedGameId("");
    navigate(`/${selectedSport}/${selectedClubId}/${teamId}`);
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    navigate(`/${selectedSport}/${selectedClubId}/${selectedTeamId}/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={myclubLogo} alt="myclub" className="h-10 w-auto" />
              <div className="border-l border-border/50 pl-3">
                <h1 className="text-xl font-bold text-foreground">
                  FanPost
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Welcome Section */}
          {!selectedSport && (
            <div className="text-center py-16 space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Spielvorschauen,{" "}
                <span className="text-primary">die begeistern</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Erstelle professionelle Social-Media-Bilder für deine Spiele.
                <br />
                Einfach. Schnell. Beeindruckend.
              </p>
            </div>
          )}

          {/* Sport Selection */}
          {!selectedSport && (
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-[var(--shadow-card)] border-border hover:shadow-[var(--shadow-glow)] transition-all duration-300 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Sportart auswählen
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Wähle zuerst die Sportart deines Vereins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup onValueChange={(value) => handleSportSelect(value as SportType)} className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer bg-background">
                      <RadioGroupItem value="unihockey" id="unihockey" />
                      <Label htmlFor="unihockey" className="text-base font-medium cursor-pointer flex-1">
                        Unihockey
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer bg-background">
                      <RadioGroupItem value="volleyball" id="volleyball" />
                      <Label htmlFor="volleyball" className="text-base font-medium cursor-pointer flex-1">
                        Volleyball
                      </Label>
                      <Badge variant="secondary" className="ml-auto">Coming soon</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer bg-background">
                      <RadioGroupItem value="handball" id="handball" />
                      <Label htmlFor="handball" className="text-base font-medium cursor-pointer flex-1">
                        Handball
                      </Label>
                      <Badge variant="secondary" className="ml-auto">Coming soon</Badge>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Club Search */}
          {selectedSport && !selectedClubId && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedSport("");
                    navigate("/");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                  ← Andere Sportart wählen
                </button>
              </div>
              <ClubSearch sportType={selectedSport} onClubSelect={handleClubSelect} />
            </div>
          )}

          {/* Team Search */}
          {selectedClubId && !selectedTeamId && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedClubId("");
                    navigate(`/${selectedSport}`);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                  ← Anderen Club wählen
                </button>
              </div>
              <TeamSearch 
                sportType={selectedSport as SportType}
                clubId={selectedClubId}
                clubName={selectedClubName}
                onTeamSelect={handleTeamSelect} 
              />
            </div>
          )}

          {/* Game List */}
          {selectedTeamId && !selectedGameId && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedTeamId("");
                    navigate(`/${selectedSport}/${selectedClubId}`);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                  ← Anderes Team wählen
                </button>
                {selectedTeamName && (
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedClubName} - {selectedTeamName}
                  </h3>
                )}
              </div>
              <GameList 
                sportType={selectedSport as SportType}
                teamId={selectedTeamId} 
                onGameSelect={handleGameSelect}
              />
            </div>
          )}

          {/* Game Preview Display */}
          {selectedTeamId && selectedGameId && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedGameId("");
                    navigate(`/${selectedSport}/${selectedClubId}/${selectedTeamId}`);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Zurück zur Spielauswahl
                </button>
              </div>
              <GamePreviewDisplay 
                sportType={selectedSport as SportType}
                clubId={selectedClubId} 
                gameId={selectedGameId}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            FanPost - Powered by{" "}
            <a 
              href="https://my-club.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              myclub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

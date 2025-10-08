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

  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    
    if (selectedSport) {
      breadcrumbs.push(
        <Badge key="sport" variant="secondary" className="text-sm">
          {sportLabels[selectedSport]}
        </Badge>
      );
    }
    
    if (selectedClubName) {
      breadcrumbs.push(
        <Badge key="club" variant="secondary" className="text-sm">
          {selectedClubName}
        </Badge>
      );
    }
    
    if (selectedTeamName) {
      breadcrumbs.push(
        <Badge key="team" variant="secondary" className="text-sm">
          {selectedTeamName}
        </Badge>
      );
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {breadcrumb}
                {index < breadcrumbs.length - 1 && (
                  <span className="text-muted-foreground">/</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Social Media Posts für dein Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Erstelle professionelle Social Media Posts für deine Spiele in Sekunden
          </p>
        </div>

        {/* Selection Steps */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Sport Selection */}
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

          {/* Step 2: Club Selection */}
          {selectedSport && (
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
          )}

          {/* Step 3: Team Selection */}
          {selectedSport && selectedClubId && (
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
          )}

          {/* Step 4: Game Selection */}
          {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length === 0 && (
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
                />
              </CardContent>
            </Card>
          )}

          {/* Game Preview Display */}
          {selectedSport && selectedClubId && selectedTeamId && selectedGameIds.length > 0 && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedGameIds([]);
                  navigate(`/wizard/${selectedSport}/${selectedClubId}/${selectedTeamId}`);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Zurück zur Spielauswahl
              </button>
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

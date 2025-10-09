import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

type SportType = "unihockey" | "volleyball" | "handball";

interface Game {
  id: string;
  result: string;
  date: string;
  time: string;
  teamHome: string;
  teamAway: string;
}

interface GameListProps {
  sportType: SportType;
  teamId: string;
  onGameSelect: (gameIds: string[], hasResults: boolean[], games?: Game[]) => void;
  initialSelectedGameIds?: string[];
}

const SPORT_API_URLS: Record<SportType, (teamId: string) => string> = {
  unihockey: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`,
  volleyball: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`,
  handball: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`
};

export const GameList = ({ sportType, teamId, onGameSelect, initialSelectedGameIds = [] }: GameListProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>(initialSelectedGameIds);
  const { toast } = useToast();

  // Group games by date
  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.date]) {
      acc[game.date] = [];
    }
    acc[game.date].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  const handleGameToggle = (gameId: string) => {
    setSelectedGameIds((prev) => {
      if (prev.includes(gameId)) {
        return prev.filter((id) => id !== gameId);
      } else {
        if (prev.length >= 3) {
          toast({
            title: "Maximum erreicht",
            description: "Du kannst maximal 3 Spiele auswählen",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, gameId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedGameIds.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wähle mindestens ein Spiel aus",
        variant: "destructive",
      });
      return;
    }
    
    // Check if selected games have results
    const hasResults = selectedGameIds.map(id => {
      const game = games.find(g => g.id === id);
      return !!(game?.result && game.result !== "" && game.result !== "-:-");
    });
    
    // Pass the games data for sports that don't support individual game queries
    onGameSelect(selectedGameIds, hasResults, games);
  };

  // Update selected games when games are loaded and initialSelectedGameIds are present
  useEffect(() => {
    if (games.length > 0 && initialSelectedGameIds.length > 0) {
      setSelectedGameIds(initialSelectedGameIds);
    }
  }, [games.length, initialSelectedGameIds]);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const apiUrl = SPORT_API_URLS[sportType](teamId);
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("Fehler beim Laden der Spiele");
        
        const result = await response.json();
        const data: Game[] = result.data?.games || [];
        
        // Sort games by date (newest first)
        const sortedGames = data.sort((a, b) => {
          // Parse date format DD.MM.YYYY
          const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('.');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          };
          
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
        
        setGames(sortedGames);
      } catch (error) {
        console.error("Error fetching games:", error);
        toast({
          title: "Fehler",
          description: "Spiele konnten nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [sportType, teamId, toast]);

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Keine Spiele für diesen Club gefunden
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-[var(--shadow-card)] border-border bg-card/50 backdrop-blur-sm mb-24">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Verfügbare Spiele
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Wähle ein oder mehrere Spiele vom gleichen Tag aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {Object.entries(groupedGames).map(([date, gamesOnDate]) => {
            const hasMultipleGames = gamesOnDate.length > 1;
            
            return (
              <div 
                key={date}
                className={`rounded-lg ${hasMultipleGames ? 'border-2 border-primary/20 p-3 bg-primary/5' : ''}`}
              >
                {hasMultipleGames && (
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {date} - {gamesOnDate.length} Spiele
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {gamesOnDate.map((game) => {
                    const isSelected = selectedGameIds.includes(game.id);
                    
                    return (
                      <div
                        key={game.id}
                        className={`group p-3 sm:p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border bg-background hover:bg-muted/50 hover:border-muted-foreground/30'
                        }`}
                        onClick={() => handleGameToggle(game.id)}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleGameToggle(game.id)}
                            className="pointer-events-none mt-0.5"
                          />
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <span className="font-semibold text-sm sm:text-base text-foreground break-words">{game.teamHome}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground">vs</span>
                              <span className="font-semibold text-sm sm:text-base text-foreground break-words">{game.teamAway}</span>
                            </div>
                            {game.result && game.result !== "-:-" && game.result !== "" && (
                              <div className="text-xs sm:text-sm font-medium text-primary">
                                Resultat: {game.result}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              {!hasMultipleGames && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {game.date}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                {game.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      {selectedGameIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
              <span className="text-sm sm:text-base font-medium text-foreground">
                {selectedGameIds.length} Spiel{selectedGameIds.length > 1 ? 'e' : ''} ausgewählt
              </span>
              <Button 
                onClick={handleContinue}
                className="gap-2"
                size="lg"
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

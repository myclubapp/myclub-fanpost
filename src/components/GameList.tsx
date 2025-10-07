import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  onGameSelect: (gameId: string) => void;
}

const SPORT_API_URLS: Record<SportType, (teamId: string) => string> = {
  unihockey: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`,
  volleyball: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`,
  handball: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`
};

export const GameList = ({ sportType, teamId, onGameSelect }: GameListProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    <Card className="shadow-[var(--shadow-card)] border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          Verfügbare Spiele
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Wähle ein Spiel für die Vorschau aus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="group p-5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary transition-all duration-300 cursor-pointer"
              onClick={() => onGameSelect(game.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base text-foreground">{game.teamHome}</span>
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className="font-semibold text-base text-foreground">{game.teamAway}</span>
                  </div>
                  {game.result && game.result !== "-:-" && game.result !== "" && (
                    <div className="text-sm font-medium text-primary">
                      Resultat: {game.result}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {game.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {game.time}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

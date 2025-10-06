import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Game {
  id: string;
  name: string;
  result: string;
  teamHome: string;
  teamAway: string;
  time: string;
  date: string;
  liga: string;
}

interface GameListProps {
  clubId: string;
  onGameSelect: (gameId: string) => void;
}

export const GameList = ({ clubId, onGameSelect }: GameListProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://europe-west6-myclubmanagement.cloudfunctions.net/gamePreviewClubGames?clubId=${clubId}`
        );
        
        if (!response.ok) throw new Error("Fehler beim Laden der Spiele");
        
        const data: Game[] = await response.json();
        
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
        
        setGames(sortedGames || []);
      } catch (error) {
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
  }, [clubId, toast]);

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
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Verfügbare Spiele
        </CardTitle>
        <CardDescription>
          Wählen Sie ein Spiel für die Vorschau aus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="group p-4 rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-primary/50 transition-all duration-300 cursor-pointer"
              onClick={() => onGameSelect(game.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="font-semibold text-lg">
                    {game.teamHome} vs {game.teamAway}
                  </div>
                  {game.result && game.result !== "-:-" && (
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
                    {game.liga && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {game.liga}
                      </div>
                    )}
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

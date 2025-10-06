import { useState, useEffect } from "react";
import { Search, Building2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Club {
  clubId: string;
  name: string;
  teamHome?: string;
  teamAway?: string;
  [key: string]: any;
}

interface ClubSearchProps {
  onClubSelect: (clubId: string, clubName: string) => void;
}

export const ClubSearch = ({ onClubSelect }: ClubSearchProps) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://europe-west6-myclubmanagement.cloudfunctions.net/gamePreviewClubs"
        );
        
        if (!response.ok) throw new Error("Fehler beim Laden der Clubs");
        
        const data = await response.json();
        
        // Extract unique clubs from the games data
        const clubMap = new Map<string, Club>();
        
        if (Array.isArray(data)) {
          data.forEach((game: any) => {
            if (game.clubId) {
              if (!clubMap.has(game.clubId)) {
                clubMap.set(game.clubId, {
                  clubId: game.clubId,
                  name: game.teamHome || game.teamAway || game.clubId,
                });
              }
            }
          });
        }
        
        const clubsList = Array.from(clubMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setClubs(clubsList);
        setFilteredClubs(clubsList);
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Clubs konnten nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(
        (club) =>
          club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.clubId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [searchTerm, clubs]);

  const handleClubSelect = (club: Club) => {
    onClubSelect(club.clubId, club.name);
  };

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

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50 hover:shadow-[var(--shadow-glow)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Club auswählen
        </CardTitle>
        <CardDescription>
          Suchen Sie nach Ihrem Verein ({clubs.length} Clubs verfügbar)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Club-Name oder ID suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-300 focus:shadow-md"
            />
          </div>

          <ScrollArea className="h-[400px] rounded-md border border-border/50">
            <div className="space-y-2 p-2">
              {filteredClubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Clubs gefunden</p>
                </div>
              ) : (
                filteredClubs.map((club) => (
                  <div
                    key={club.clubId}
                    onClick={() => handleClubSelect(club)}
                    className="group p-4 rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {club.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {club.clubId}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

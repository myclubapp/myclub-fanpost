import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Club {
  id: string;
  name: string;
}

interface ClubSearchProps {
  onClubSelect: (clubId: string, clubName: string) => void;
}

export const ClubSearch = ({ onClubSelect }: ClubSearchProps) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
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
        
        const data: Club[] = await response.json();
        
        const sortedClubs = data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setClubs(sortedClubs);
        
        if (sortedClubs.length === 0) {
          toast({
            title: "Keine Clubs gefunden",
            description: "Es konnten keine Clubs geladen werden. Versuchen Sie es später erneut.",
          });
        }
      } catch (error) {
        console.error("Error fetching clubs:", error);
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

  const handleClubChange = (clubId: string) => {
    setSelectedClubId(clubId);
    const selectedClub = clubs.find((club) => club.id === clubId);
    if (selectedClub) {
      onClubSelect(selectedClub.id, selectedClub.name);
    }
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
    <Card className="shadow-[var(--shadow-card)] border-border hover:shadow-[var(--shadow-glow)] transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          Club auswählen
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Wähle deinen Verein aus ({clubs.length} Clubs verfügbar)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select value={selectedClubId} onValueChange={handleClubChange}>
            <SelectTrigger className="w-full h-12 text-base border-border bg-background hover:border-primary transition-colors">
              <SelectValue placeholder="Club auswählen..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {clubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Clubs verfügbar</p>
                </div>
              ) : (
                clubs.map((club) => (
                  <SelectItem 
                    key={club.id} 
                    value={club.id}
                    className="text-base cursor-pointer hover:bg-primary/10"
                  >
                    {club.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

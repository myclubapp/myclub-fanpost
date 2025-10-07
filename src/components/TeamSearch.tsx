import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SportType = "unihockey" | "volleyball" | "handball";

interface Team {
  id: string;
  name: string;
}

interface TeamSearchProps {
  sportType: SportType;
  clubId: string;
  clubName: string;
  onTeamSelect: (teamId: string, teamName: string) => void;
}

const SPORT_API_URLS: Record<SportType, (clubId: string) => string> = {
  unihockey: (clubId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A`,
  volleyball: (clubId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A`,
  handball: (clubId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20teams(clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A`
};

export const TeamSearch = ({ sportType, clubId, clubName, onTeamSelect }: TeamSearchProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const apiUrl = SPORT_API_URLS[sportType](clubId);
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("Fehler beim Laden der Teams");
        
        const result = await response.json();
        const data: Team[] = result.data?.teams || [];
        
        const sortedTeams = data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setTeams(sortedTeams);
        
        if (sortedTeams.length === 0) {
          toast({
            title: "Keine Teams gefunden",
            description: "Es konnten keine Teams für diesen Club geladen werden.",
          });
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Fehler",
          description: "Teams konnten nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [sportType, clubId, toast]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const selectedTeam = teams.find((team) => team.id === teamId);
    if (selectedTeam) {
      onTeamSelect(selectedTeam.id, selectedTeam.name);
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
          {clubName}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Wähle ein Team aus ({teams.length} Teams verfügbar)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select value={selectedTeamId} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-full h-12 text-base border-border bg-background hover:border-primary transition-colors">
              <SelectValue placeholder="Team auswählen..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Teams verfügbar</p>
                </div>
              ) : (
                teams.map((team) => (
                  <SelectItem 
                    key={team.id} 
                    value={team.id}
                    className="text-base cursor-pointer hover:bg-primary/10"
                  >
                    {team.name}
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

import { useState, useEffect } from "react";
import { Building2, Check, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type SportType = "unihockey" | "volleyball" | "handball";

interface Club {
  id: string;
  name: string;
}

interface ClubSearchProps {
  sportType: SportType;
  onClubSelect: (clubId: string, clubName: string) => void;
}

const SPORT_API_URLS: Record<SportType, string> = {
  unihockey: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20clubs%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%20%0A%7D",
  volleyball: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20clubs%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A",
  handball: "https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20clubs%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A"
};

const SPORT_LABELS: Record<SportType, string> = {
  unihockey: "Unihockey",
  volleyball: "Volleyball",
  handball: "Handball"
};

export const ClubSearch = ({ sportType, onClubSelect }: ClubSearchProps) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const apiUrl = SPORT_API_URLS[sportType];
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("Fehler beim Laden der Clubs");
        
        const result = await response.json();
        const data: Club[] = result.data?.clubs || [];
        
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
  }, [sportType, toast]);

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
          {SPORT_LABELS[sportType]} Club auswählen
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Wähle deinen {SPORT_LABELS[sportType]}-Verein aus ({clubs.length} Clubs verfügbar)
        </CardDescription>
        {sportType === "handball" && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Damit du KANVA für deinen Handball Verein nutzen kannst, musst du zuerst deinen API Key hochladen. 
              Hier bekommst du einen API-Key:{" "}
              <a 
                href="https://www.handball.ch/de/news/2023/api-schnittstellen-wechsel-fuer-vereine-erforderlich/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                handball.ch
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <Command className="rounded-lg border border-border shadow-md">
          <CommandInput placeholder="Club suchen..." />
          <CommandList>
            <CommandEmpty>
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine Clubs gefunden</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {clubs.map((club) => (
                <CommandItem
                  key={club.id}
                  value={club.name}
                  onSelect={() => handleClubChange(club.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClubId === club.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {club.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
};

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ClubSearchProps {
  onClubSelect: (clubId: string) => void;
}

export const ClubSearch = ({ onClubSelect }: ClubSearchProps) => {
  const [clubId, setClubId] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    if (!clubId.trim()) {
      setError("Bitte geben Sie eine Club-ID ein");
      return;
    }
    setError("");
    onClubSelect(clubId.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50 hover:shadow-[var(--shadow-glow)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Club auswählen
        </CardTitle>
        <CardDescription>
          Geben Sie Ihre Club-ID ein (z.B. su-452800)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Club-ID eingeben..."
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="transition-all duration-300 focus:shadow-md"
            />
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>
          <Button 
            onClick={handleSearch}
            className="shadow-md hover:shadow-lg"
          >
            <Search className="mr-2 h-4 w-4" />
            Suchen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

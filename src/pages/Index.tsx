import { useState } from "react";
import { ClubSearch } from "@/components/ClubSearch";
import { GameList } from "@/components/GameList";
import { GamePreviewDisplay } from "@/components/GamePreviewDisplay";
import myclubLogo from "@/assets/myclub-logo.png";

const Index = () => {
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  const handleClubSelect = (clubId: string, clubName: string) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    setSelectedGameId(""); // Reset game selection when club changes
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
                  Sports Media Creator
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
          {!selectedClubId && (
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

          {/* Club Search */}
          <div className="max-w-2xl mx-auto">
            <ClubSearch onClubSelect={handleClubSelect} />
          </div>

          {/* Game List */}
          {selectedClubId && !selectedGameId && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => setSelectedClubId("")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                  ← Anderen Club wählen
                </button>
                {selectedClubName && (
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedClubName}
                  </h3>
                )}
              </div>
              <GameList 
                clubId={selectedClubId} 
                onGameSelect={setSelectedGameId}
              />
            </div>
          )}

          {/* Game Preview Display */}
          {selectedClubId && selectedGameId && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <button
                  onClick={() => setSelectedGameId("")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Zurück zur Spielauswahl
                </button>
              </div>
              <GamePreviewDisplay 
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
            Sports Media Creator - Powered by{" "}
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

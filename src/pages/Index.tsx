import { useState } from "react";
import { ClubSearch } from "@/components/ClubSearch";
import { GameList } from "@/components/GameList";
import { GamePreviewDisplay } from "@/components/GamePreviewDisplay";
import { Trophy, Sparkles } from "lucide-react";

const Index = () => {
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Sports Media Creator
              </h1>
              <p className="text-sm text-muted-foreground">
                Professionelle Social-Media-Bilder für Sportvereine
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          {!selectedClubId && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Erstellen Sie beeindruckende Spielvorschauen
              </div>
              <h2 className="text-4xl font-bold text-foreground">
                Willkommen beim Sports Media Creator
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Erstellen Sie professionelle Social-Media-Bilder für Spielvorschauen und Resultate in wenigen Schritten.
              </p>
            </div>
          )}

          {/* Club Search */}
          <div className="max-w-2xl mx-auto">
            <ClubSearch onClubSelect={setSelectedClubId} />
          </div>

          {/* Game List */}
          {selectedClubId && !selectedGameId && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GameList 
                clubId={selectedClubId} 
                onGameSelect={setSelectedGameId}
              />
            </div>
          )}

          {/* Game Preview Display */}
          {selectedClubId && selectedGameId && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4 flex items-center gap-2">
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
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Sports Media Creator - Powered by myclub</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

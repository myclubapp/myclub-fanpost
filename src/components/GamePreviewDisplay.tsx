import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface GamePreviewDisplayProps {
  clubId: string;
  gameId: string;
}

const AVAILABLE_THEMES = [
  { value: "myclub", label: "myclub" },
  { value: "kadetten-unihockey", label: "Kadetten Unihockey" },
];

// Declare the custom web components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'game-preview': any;
      'game-result': any;
    }
  }
}

export const GamePreviewDisplay = ({ clubId, gameId }: GamePreviewDisplayProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedTheme, setSelectedTheme] = useState("myclub");

  useEffect(() => {
    // Load the web component script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/myclub-game-preview@latest/dist/myclub-game-preview/myclub-game-preview.esm.js';
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleDownload = async () => {
    const targetRef = activeTab === "preview" ? previewRef : resultRef;
    
    if (!targetRef.current) return;

    try {
      toast({
        title: "Download wird vorbereitet",
        description: "Das Bild wird erstellt...",
      });

      // Find the web component element
      const webComponent = targetRef.current.querySelector(activeTab === "preview" ? "game-preview" : "game-result");
      
      if (!webComponent) {
        throw new Error("Komponente nicht gefunden");
      }

      // Wait a moment for the component to fully render
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use html-to-image which supports Shadow DOM better
      const dataUrl = await toPng(webComponent as HTMLElement, {
        backgroundColor: null,
        pixelRatio: 2, // Higher quality
        cacheBust: true,
      });

      // Download the image
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${activeTab}-${gameId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Erfolgreich!",
        description: "Das Bild wurde heruntergeladen",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Fehler",
        description: "Bild konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-2xl font-bold text-foreground">
            Social Media Vorschau
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="theme-select" className="text-sm text-muted-foreground">Theme:</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger id="theme-select" className="w-[180px] border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {AVAILABLE_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleDownload} 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="h-4 w-4" />
              Als Bild exportieren
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
            <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon className="h-4 w-4" />
              Spielvorschau
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Resultat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-0">
            <div 
              ref={previewRef}
              className="flex justify-center items-center p-8 bg-muted/10 rounded-lg border border-border"
            >
              <game-preview
                club={clubId}
                game={gameId}
                width="600"
                height="600"
                theme={selectedTheme}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="mt-0">
            <div 
              ref={resultRef}
              className="flex justify-center items-center p-8 bg-muted/10 rounded-lg border border-border"
            >
              <game-result
                club={clubId}
                game={gameId}
                width="600"
                height="600"
                theme={selectedTheme}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

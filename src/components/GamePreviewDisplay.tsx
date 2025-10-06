import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
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
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
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
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the component as canvas
      const canvas = await html2canvas(webComponent as HTMLElement, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${activeTab}-${gameId}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Erfolgreich!",
          description: "Das Bild wurde heruntergeladen",
        });
      }, "image/png");
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
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Social Media Vorschau
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="theme-select" className="text-sm">Theme:</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger id="theme-select" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              variant="gradient"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Als Bild exportieren
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="preview" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Spielvorschau
            </TabsTrigger>
            <TabsTrigger value="result" className="gap-2">
              <FileText className="h-4 w-4" />
              Resultat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-0">
            <div 
              ref={previewRef}
              className="flex justify-center items-center p-8 bg-muted/20 rounded-lg border border-border/50"
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
              className="flex justify-center items-center p-8 bg-muted/20 rounded-lg border border-border/50"
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

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { saveSvgAsPng } from "save-svg-as-png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageCropper } from "./ImageCropper";

type SportType = "unihockey" | "volleyball" | "handball";

interface GamePreviewDisplayProps {
  sportType: SportType;
  clubId: string;
  gameIds: string[];
  gamesHaveResults?: boolean[];
}

const AVAILABLE_THEMES = [
  { value: "kadetten-unihockey", label: "Kadetten Unihockey" },
  { value: "myclub-light", label: "MyClub Light" },
  { value: "myclub-dark", label: "MyClub Dark" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
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

export const GamePreviewDisplay = ({ sportType, clubId, gameIds, gamesHaveResults = [] }: GamePreviewDisplayProps) => {
  const gameId = gameIds[0];
  const gameId2 = gameIds.length > 1 ? gameIds[1] : undefined;
  const previewRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Set initial tab based on whether games have results
  const hasAnyResult = gamesHaveResults.some(hasResult => hasResult);
  const [activeTab, setActiveTab] = useState<string>(hasAnyResult ? "result" : "preview");
  
  const [selectedTheme, setSelectedTheme] = useState("myclub-light");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isHomeGame, setIsHomeGame] = useState(false);

  // Add "su-" prefix for Swiss Unihockey
  const prefixedClubId = sportType === "unihockey" ? `su-${clubId}` : clubId;
  const prefixedGameId = sportType === "unihockey" ? `su-${gameId}` : gameId;
  const prefixedGameId2 = gameId2 && sportType === "unihockey" ? `su-${gameId2}` : gameId2;

  // Update tab when gamesHaveResults changes
  useEffect(() => {
    const hasAnyResult = gamesHaveResults.some(hasResult => hasResult);
    setActiveTab(hasAnyResult ? "result" : "preview");
  }, [gamesHaveResults]);

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

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine Bilddatei aus.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setBackgroundImage(croppedImage);
    setTempImage(null);
    toast({
      title: "Hintergrundbild zugeschnitten",
      description: "Das Bild wurde erfolgreich zugeschnitten.",
    });
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    const targetRef = activeTab === "preview" ? previewRef : resultRef;
    if (!targetRef.current) return;

    const notifyStart = () =>
      toast({
        title: "Download wird vorbereitet",
        description: "Das Bild wird erstellt...",
      });

    const notifySuccess = () =>
      toast({
        title: "Erfolgreich!",
        description: "Das Bild wurde heruntergeladen",
      });

    const notifyError = () =>
      toast({
        title: "Fehler",
        description:
          "Bild konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });

    try {
      notifyStart();

      const componentSelector = activeTab === "preview" ? "game-preview" : "game-result";
      const gameElement = targetRef.current.querySelector(componentSelector);
      
      if (!gameElement) {
        throw new Error("Komponente nicht gefunden");
      }

      const shadowRoot = (gameElement as any).shadowRoot as ShadowRoot | null;
      const svgElement = shadowRoot?.querySelector("svg");

      if (!svgElement) {
        throw new Error("Kein SVG-Element gefunden");
      }

      // Get dimensions from viewBox for accurate sizing
      let width = 600;
      let height = 600;

      if (svgElement.viewBox && svgElement.viewBox.baseVal) {
        const vb = svgElement.viewBox.baseVal;
        width = vb.width;
        height = vb.height;
      }

      const options = {
        scale: 3,
        width,
        height,
        encoderOptions: 1,
        backgroundColor: 'white',
      };

      await saveSvgAsPng(svgElement, `${activeTab}-${gameId}-${Date.now()}.png`, options);
      
      notifySuccess();
    } catch (error) {
      console.error("Export failed:", error);
      notifyError();
    }
  };

  return (
    <>
      {tempImage && (
        <ImageCropper
          image={tempImage}
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setTempImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
      <Card className="shadow-[var(--shadow-card)] border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground mb-4">
          Social Media Vorschau
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ImageIcon className="h-4 w-4" />
                Spielvorschau
              </TabsTrigger>
              <TabsTrigger value="result" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                Resultat
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 flex-wrap">
              {activeTab === "preview" && (
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="home-game" 
                    checked={isHomeGame}
                    onCheckedChange={(checked) => setIsHomeGame(checked as boolean)}
                  />
                  <Label htmlFor="home-game" className="text-sm text-muted-foreground cursor-pointer">
                    Ist Heimspiel
                  </Label>
                </div>
              )}
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
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="hidden"
                  id="background-upload"
                />
                <Label
                  htmlFor="background-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-muted/50 text-sm transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Hintergrundbild
                </Label>
                {backgroundImage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveBackgroundImage}
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <TabsContent value="preview" className="mt-0">
            <div 
              ref={previewRef}
              className="flex justify-center items-center p-4 sm:p-8 bg-muted/10 rounded-lg border border-border overflow-auto"
            >
              <div className="w-full max-w-[600px] aspect-square">
                <game-preview
                  club={prefixedClubId}
                  game={prefixedGameId}
                  width="600"
                  height="600"
                  theme={selectedTheme}
                  ishomegame={isHomeGame.toString()}
                  {...(backgroundImage && { backgroundimage: backgroundImage })}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="mt-0">
            <div 
              ref={resultRef}
              className="flex justify-center items-center p-4 sm:p-8 bg-muted/10 rounded-lg border border-border overflow-auto"
            >
              <div className="w-full max-w-[600px] aspect-square">
                <game-result
                  club={prefixedClubId}
                  game={prefixedGameId}
                  {...(prefixedGameId2 && { "game-2": prefixedGameId2 })}
                  width="600"
                  height="600"
                  theme={selectedTheme}
                  ishomegame={isHomeGame.toString()}
                  {...(backgroundImage && { backgroundimage: backgroundImage })}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Button 
          onClick={handleDownload} 
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
        >
          <Download className="h-4 w-4" />
          Als Bild exportieren
        </Button>
      </CardContent>
    </Card>
    </>
  );
};

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette, Upload, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useUserRole } from "@/hooks/useUserRole";
import * as svg from "save-svg-as-png";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
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
import { supabase } from "@/integrations/supabase/client";

type SportType = "unihockey" | "volleyball" | "handball";

interface GamePreviewDisplayProps {
  sportType: SportType;
  clubId: string;
  gameIds: string[];
  gamesHaveResults?: boolean[];
}

const STANDARD_THEMES = [
  { value: "standard", label: "Standard Theme" },
  { value: "myclub", label: "myclub" },
  { value: "myclub-dark", label: "myclub dark" },
  { value: "myclub-light", label: "myclub light" },
];

interface CustomTemplate {
  id: string;
  name: string;
  value: string; // Will be template ID
  template_type: 'game-preview' | 'game-result';
  isCustom: true;
  config?: any;
}

interface GameData {
  id: string;
  teamHome: string;
  teamAway: string;
  date: string;
  time: string;
  location?: string;
  city?: string;
  result?: string;
  resultDetail?: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
}

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
  const gameId3 = gameIds.length > 2 ? gameIds[2] : undefined;
  const previewRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, hasCredits, consumeCredit, loading: creditsLoading } = useCredits();
  const { isPaidUser } = useUserRole();
  
  // Set initial tab based on whether games have results
  const hasAnyResult = gamesHaveResults.some(hasResult => hasResult);
  const [activeTab, setActiveTab] = useState<string>(hasAnyResult ? "result" : "preview");
  
  const [selectedTheme, setSelectedTheme] = useState("standard");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isHomeGame, setIsHomeGame] = useState(false);
  const [showResultDetail, setShowResultDetail] = useState(false);
  const [svgDimensions, setSvgDimensions] = useState({ width: "500", height: "625" });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loadingGameData, setLoadingGameData] = useState(false);

  // Map sport type to API type
  const apiType = sportType === "unihockey" ? "swissunihockey" : sportType;
  
  // Check if selected theme is a myclub theme
  const isMyClubTheme = STANDARD_THEMES.some(t => t.value === selectedTheme);
  const selectedCustomTemplate = customTemplates.find(t => t.value === selectedTheme);

  // Load custom templates for paid users
  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!user || !isPaidUser) {
        setCustomTemplates([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, template_type, svg_config')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const templates: CustomTemplate[] = data.map(template => ({
            id: template.id,
            name: template.name,
            value: template.id,
            template_type: template.template_type as 'game-preview' | 'game-result',
            config: template.svg_config,
            isCustom: true as const,
          }));
          setCustomTemplates(templates);
        }
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    };

    loadCustomTemplates();
  }, [user, isPaidUser]);

  // Load game data when custom template is selected
  useEffect(() => {
    const fetchGameData = async () => {
      if (!selectedCustomTemplate || !gameId) return;
      
      setLoadingGameData(true);
      try {
        // Construct GraphQL query for single game
        const query = `{
  game(gameId: "${gameId}") {
    teamHome
    teamAway
    date
    time
    location
    city
    result
    resultDetail
    teamHomeLogo
    teamAwayLogo
  }
}`;
        
        const apiUrl = `https://europe-west6-myclubmanagement.cloudfunctions.net/api/${apiType}?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch game data');
        
        const result = await response.json();
        
        if (result.data?.game) {
          setGameData(result.data.game);
        } else {
          throw new Error('No game data received');
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast({
          title: "Fehler",
          description: "Spieldaten konnten nicht geladen werden",
          variant: "destructive",
        });
        setGameData(null);
      } finally {
        setLoadingGameData(false);
      }
    };

    fetchGameData();
  }, [selectedCustomTemplate, gameId, apiType, toast]);

  // Update tab when gamesHaveResults changes
  useEffect(() => {
    const hasAnyResult = gamesHaveResults.some(hasResult => hasResult);
    setActiveTab(hasAnyResult ? "result" : "preview");
  }, [gamesHaveResults]);

  // Update SVG dimensions based on screen size (for display only)
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 480) {
        // Mobile: 330-350px
        setSvgDimensions({ width: "340", height: "425" });
      } else if (screenWidth < 768) {
        // Small tablet
        setSvgDimensions({ width: "400", height: "500" });
      } else if (screenWidth < 1024) {
        // Tablet
        setSvgDimensions({ width: "480", height: "600" });
      } else {
        // Desktop: larger preview
        setSvgDimensions({ width: "560", height: "700" });
      }
    };

    // Set initial dimensions
    updateDimensions();

    // Listen for window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

  // Render custom template SVG with API data
  const renderCustomTemplateSVG = () => {
    if (!selectedCustomTemplate || !gameData) return null;
    
    const config = selectedCustomTemplate.config;
    if (!config || !config.elements) return null;

    return (
      <svg
        width="1080"
        height="1350"
        viewBox="0 0 1080 1350"
        className="max-w-full h-auto"
      >
        {/* Background */}
        <rect width="1080" height="1350" fill={config.backgroundColor || '#1a1a1a'} />
        
        {/* Background image if set */}
        {backgroundImage && (
          <image
            href={backgroundImage}
            width="1080"
            height="1350"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        
        {/* Render elements */}
        {config.elements.map((element: any) => {
          if (element.type === 'text' || element.type === 'api-text') {
            let content = element.content;
            
            // Replace API fields with actual data
            if (element.type === 'api-text' && element.apiField) {
              const fieldValue = (gameData as any)[element.apiField];
              content = fieldValue || element.content;
            }
            
            return (
              <text
                key={element.id}
                x={element.x}
                y={element.y}
                fontSize={element.fontSize}
                fontFamily={element.fontFamily}
                fill={element.fill}
                fontWeight={element.fontWeight}
                textAnchor={element.textAnchor}
              >
                {content}
              </text>
            );
          }
          
          if (element.type === 'image' || element.type === 'api-image') {
            let href = element.href;
            
            // Replace API image fields with actual data
            if (element.type === 'api-image' && element.apiField) {
              const fieldValue = (gameData as any)[element.apiField];
              href = fieldValue || element.href;
            }
            
            return (
              <image
                key={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                href={href}
              />
            );
          }
          
          return null;
        })}
      </svg>
    );
  };

  const inlineExternalImages = async (svgElement: SVGSVGElement): Promise<void> => {
    const images = svgElement.querySelectorAll("image");
    const promises = Array.from(images).map(async (img) => {
      const href = img.getAttribute("href") || img.getAttribute("xlink:href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        try {
          const response = await fetch(href);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.setAttribute("href", dataUrl);
        } catch (error) {
          console.error("Failed to inline image:", href, error);
        }
      }
    });
    await Promise.all(promises);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1]; // remove prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDownload = () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um Posts zu erstellen",
        variant: "destructive",
      });
      return;
    }

    // Check if user has credits
    if (!hasCredits) {
      toast({
        title: "Keine Credits verfügbar",
        description: "Sie haben keine Credits mehr. Kaufen Sie zusätzliche Credits oder upgraden Sie auf Pro.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmDownload = async () => {
    setShowConfirmDialog(false);

    const targetRef = activeTab === "preview" ? previewRef : resultRef;
    if (!targetRef.current) return;

    const notifyStart = () =>
      toast({
        title: "Bild wird vorbereitet",
        description: "Das Bild wird erstellt...",
      });

    const notifySuccess = (isShare: boolean) =>
      toast({
        title: "Erfolgreich!",
        description: isShare ? "Das Bild wurde geteilt. 1 Credit wurde verbraucht." : "Das Bild wurde heruntergeladen. 1 Credit wurde verbraucht.",
      });

    const notifyError = () =>
      toast({
        title: "Fehler",
        description:
          "Bild konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
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

      // Inline external images (team logos, etc.)
      await inlineExternalImages(svgElement);

      // Get SVG dimensions from viewBox or attributes - Instagram format 1080x1350
      let width = 1080;
      let height = 1350;

      if (svgElement.viewBox && svgElement.viewBox.baseVal) {
        width = svgElement.viewBox.baseVal.width;
        height = svgElement.viewBox.baseVal.height;
      } else if (svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
        width = parseFloat(svgElement.getAttribute('width') || '1080');
        height = parseFloat(svgElement.getAttribute('height') || '1350');
      }

      const options = {
        scale: 2,
        backgroundColor: "white",
        width,
        height,
      };

      // Convert SVG to PNG URI
      const pngUri = await svg.svgAsPngUri(svgElement, options);

      // Convert URI to Blob
      const response = await fetch(pngUri);
      const blob = await response.blob();
      const fileName = `${activeTab}-${gameId}-${Date.now()}.png`;

      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Use Capacitor Share for native platforms
        try {
          const base64Data = await blobToBase64(blob);

          // Save to filesystem
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          // Get file URI
          const fileUri = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName,
          });

          // Share using Capacitor
          await Share.share({
            title: activeTab === "preview" ? "Spielvorschau" : "Resultat",
            text: activeTab === "preview" ? "Schau dir diese Spielvorschau an!" : "Schau dir dieses Resultat an!",
            url: fileUri.uri,
            dialogTitle: "Bild teilen",
          });

          // Consume credit after successful share
          const creditConsumed = await consumeCredit();
          if (!creditConsumed) {
            toast({
              title: "Warnung",
              description: "Das Bild wurde erstellt, aber es gab ein Problem beim Verbrauch des Credits.",
              variant: "destructive",
            });
          }
          notifySuccess(true);
        } catch (error) {
          console.error("Capacitor share failed:", error);
          throw error;
        }
      } else {
        // Web platform - try Web Share API first
        const canShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] });

        if (canShare) {
          // Use native share on mobile browsers
          const file = new File([blob], fileName, { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: activeTab === "preview" ? "Spielvorschau" : "Resultat",
            text: activeTab === "preview" ? "Schau dir diese Spielvorschau an!" : "Schau dir dieses Resultat an!",
          });
          
          // Consume credit after successful share
          const creditConsumed = await consumeCredit();
          if (!creditConsumed) {
            toast({
              title: "Warnung",
              description: "Das Bild wurde erstellt, aber es gab ein Problem beim Verbrauch des Credits.",
              variant: "destructive",
            });
          }
          notifySuccess(true);
        } else {
          // Fallback to download on desktop
          const link = document.createElement('a');
          link.download = fileName;
          link.href = pngUri;
          link.click();
          
          // Consume credit after successful download
          const creditConsumed = await consumeCredit();
          if (!creditConsumed) {
            toast({
              title: "Warnung",
              description: "Das Bild wurde heruntergeladen, aber es gab ein Problem beim Verbrauch des Credits.",
              variant: "destructive",
            });
          }
          notifySuccess(false);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      // Don't show error if user cancelled the share dialog
      if ((error as Error).name !== 'AbortError') {
        notifyError();
      }
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
        {/* Template Selection - First */}
        <div className="flex items-center gap-2 mb-6">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="theme-select" className="text-sm text-muted-foreground">Vorlage:</Label>
          <Select value={selectedTheme} onValueChange={setSelectedTheme}>
            <SelectTrigger id="theme-select" className="w-[220px] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {STANDARD_THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
              {isPaidUser && customTemplates.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Eigene Vorlagen
                  </div>
                  {customTemplates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {isMyClubTheme ? (
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
              {activeTab === "result" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="result-detail"
                    checked={showResultDetail}
                    onCheckedChange={(checked) => setShowResultDetail(checked as boolean)}
                  />
                  <Label htmlFor="result-detail" className="text-sm text-muted-foreground cursor-pointer">
                    Details anzeigen
                  </Label>
                </div>
              )}
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
              className="w-full bg-muted/10 rounded-lg border border-border overflow-hidden"
            >
              <div className="w-full p-4 sm:p-8 flex justify-center">
                <div className={`w-full flex justify-center`}>
                  <game-preview
                    key={`${gameId}-${gameId2 || 'single'}-${gameId3 || 'single'}`}
                    type={apiType}
                    game={gameId}
                    {...(gameId2 && { "game-2": gameId2 })}
                    {...(gameId3 && { "game-3": gameId3 })}
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    theme={selectedTheme}
                    ishomegame={isHomeGame.toString()}
                    {...(backgroundImage && { backgroundimage: backgroundImage })}
                    style={{ width: '100%', height: 'auto', display: 'block', maxWidth: `${svgDimensions.width}px` }}
                  />
                </div>
              </div>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="mt-0">
            <div
              ref={resultRef}
              className="w-full bg-muted/10 rounded-lg border border-border overflow-hidden"
            >
              <div className="w-full p-4 sm:p-8 flex justify-center">
                <div className={`w-full flex justify-center`}>
                  <game-result
                    key={`${gameId}-${gameId2 || 'single'}-${gameId3 || 'single'}`}
                    type={apiType}
                    game={gameId}
                    {...(gameId2 && { "game-2": gameId2 })}
                    {...(gameId3 && { "game-3": gameId3 })}
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    theme={selectedTheme}
                    ishomegame={isHomeGame.toString()}
                    showresultdetail={showResultDetail.toString()}
                    {...(backgroundImage && { backgroundimage: backgroundImage })}
                    style={{ width: '100%', height: 'auto', display: 'block', maxWidth: `${svgDimensions.width}px` }}
                  />
                </div>
              </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Custom Template Display */
          <div className="w-full bg-muted/10 rounded-lg border border-border overflow-hidden">
            {loadingGameData ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="w-full p-4 sm:p-8 flex justify-center">
                <div className="w-full flex justify-center" style={{ maxWidth: `${svgDimensions.width}px` }}>
                  {renderCustomTemplateSVG()}
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button 
          onClick={handleDownload} 
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
        >
          <Download className="h-4 w-4" />
          Als Bild exportieren
        </Button>
      </CardContent>
    </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bild exportieren</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher? Dieses Bild kostet dich 1 Credit.
              {credits && (
                <span className="block mt-2 text-foreground font-medium">
                  Verbleibende Credits: {credits.credits_remaining}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDownload}>
              Ja, exportieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

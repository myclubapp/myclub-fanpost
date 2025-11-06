import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, Palette, Upload, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageCropper } from "./ImageCropper";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { handlePlatformDownload, type ImageLoadProgress } from "@/utils/svgToImage";
import { AVAILABLE_FONTS, ensureTemplateFontsLoaded, normalizeFontFamilyName } from "@/config/fonts";

type SportType = "unihockey" | "volleyball" | "handball";

const DEFAULT_FONT_FAMILY = Object.values(AVAILABLE_FONTS)[0]?.cssFamily ?? "Bebas Neue";

const resolveFontFamily = (fontFamily?: string | null): string => {
  return normalizeFontFamilyName(fontFamily) || DEFAULT_FONT_FAMILY;
};

export interface GamePreviewDisplayProps {
  sportType: SportType;
  clubId: string;
  teamId: string;
  gameIds: string[];
  gamesHaveResults?: boolean[];
  gamesData?: any[];
  studioUrl?: string;
  selectedTheme?: string;
  onThemeChange?: (theme: string) => void;
}

export interface GamePreviewDisplayRef {
  triggerDownload: () => void;
}

// Standard themes removed - all templates now come from database

interface Template {
  id: string;
  name: string;
  value: string; // Will be template ID
  supported_games: number;
  is_system?: boolean;
  config?: any;
  template_category?: 'preview' | 'result';
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

// Template types moved from web components to database templates

export const GamePreviewDisplay = forwardRef<GamePreviewDisplayRef, GamePreviewDisplayProps>(
  ({
    sportType,
    clubId,
    teamId,
    gameIds,
    gamesHaveResults = [],
    gamesData = [],
    studioUrl,
    selectedTheme: initialTheme = "kanva",
    onThemeChange
  }, ref) => {
  const gameId = gameIds[0];
  const gameId2 = gameIds.length > 1 ? gameIds[1] : undefined;
  const gameId3 = gameIds.length > 2 ? gameIds[2] : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [imageStatuses, setImageStatuses] = useState<ImageLoadProgress[]>([]);

  useEffect(() => {
    void ensureTemplateFontsLoaded();
  }, []);

  // Load user's existing background images
  const { data: userBackgrounds = [], refetch: refetchBackgrounds } = useQuery({
    queryKey: ['user-backgrounds', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.storage
        .from('game-backgrounds')
        .list(`backgrounds/${user.id}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        });

      if (error) {
        console.error('Error loading backgrounds:', error);
        return [];
      }

      if (!data) return [];

      // Filter out .emptyFolderPlaceholder files
      const filteredData = data.filter(file => !file.name.includes('.emptyFolderPlaceholder'));

      const items = await Promise.all(
        filteredData.map(async (file) => {
          const filePath = `backgrounds/${user.id}/${file.name}`;
          const { data: signed, error: signError } = await supabase.storage
            .from('game-backgrounds')
            .createSignedUrl(filePath, 3600);
          if (signError || !signed?.signedUrl) return null;
          return {
            name: file.name,
            url: signed.signedUrl,
          };
        })
      );

      return items.filter((i): i is { name: string; url: string } => !!i);
    },
    enabled: !!user
  });
  const { isPaidUser } = useUserRole();
  
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);

  // Update local theme when prop changes
  useEffect(() => {
    setSelectedTheme(initialTheme);
  }, [initialTheme]);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [svgDimensions, setSvgDimensions] = useState({ width: "500", height: "625" });
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [loadingGameData, setLoadingGameData] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const templateRef = useRef<SVGSVGElement>(null);
  
  // Progress dialog state
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [imageLoadStatus, setImageLoadStatus] = useState<ImageLoadProgress[]>([]);

  // Expose the handleDownload function to parent via ref
  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload
  }));
  // Map sport type to API type
  const apiType = sportType === "unihockey" ? "swissunihockey" : sportType === "volleyball" ? "swissvolley" : sportType === "handball" ? "swisshandball" : sportType;

  // Get current template based on selected theme
  const selectedTemplate = allTemplates.find(t => t.value === selectedTheme);

  // Load templates (system templates + user templates for paid users)
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        let query = supabase
          .from('templates')
          .select('id, name, supported_games, svg_config, is_system')
          .order('is_system', { ascending: false })
          .order('created_at', { ascending: false });

        // Load system templates + user templates (if paid user)
        if (user && isPaidUser) {
          query = query.or(`is_system.eq.true,user_id.eq.${user.id}`);
        } else {
          // Load only system templates for non-paid users
          query = query.eq('is_system', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          console.log('Templates loaded:', data.length);
          const templates: Template[] = data.map(template => {
            // Determine template category based on name
            const name = template.name.toLowerCase();
            const isResult = name.includes('result');
            const category = isResult ? 'result' : 'preview';

            return {
              id: template.id,
              name: template.name,
              value: template.id,
              supported_games: template.supported_games,
              config: template.svg_config,
              is_system: template.is_system,
              template_category: category,
            };
          });

          setAllTemplates(templates);
          console.log('Templates set:', templates);

          // Auto-select first template matching game count if none selected or current not available
          const currentTemplate = templates.find(t => t.value === selectedTheme);
          const matchingTemplates = templates
            .filter(t => t.supported_games === gameIds.length)
            .sort((a, b) => {
              // Sort by supported_games first, then by name
              if (a.supported_games !== b.supported_games) {
                return a.supported_games - b.supported_games;
              }
              return a.name.localeCompare(b.name);
            });
          
          if (!selectedTheme || !currentTemplate || currentTemplate.supported_games !== gameIds.length) {
            const firstMatchingTemplate = matchingTemplates[0];
            if (firstMatchingTemplate) {
              console.log('Auto-selecting first matching template:', firstMatchingTemplate.name);
              setSelectedTheme(firstMatchingTemplate.value);
              onThemeChange?.(firstMatchingTemplate.value);
            }
          }
        } else {
          console.log('No data returned from templates query');
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        toast({
          title: "Fehler",
          description: "Templates konnten nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [user, isPaidUser]);

  // Load game data when needed (for all templates)
  useEffect(() => {
    const fetchGameData = async () => {
      if (!selectedTemplate || !gameId) return;
      
      setLoadingGameData(true);
      try {
        const gameIdsToFetch = [gameId, gameId2, gameId3].filter(Boolean) as string[];
        const fetchedGames: GameData[] = [];
        
        // For volleyball and handball, use the games data passed from the list
        if (sportType === 'volleyball' || sportType === 'handball') {
          if (gamesData.length > 0) {
            for (const id of gameIdsToFetch) {
              const game = gamesData.find((g: any) => g.id === id);
              if (game) {
                fetchedGames.push({
                  id: game.id,
                  teamHome: game.teamHome,
                  teamAway: game.teamAway,
                  date: game.date,
                  time: game.time,
                  result: game.result || '',
                  resultDetail: game.resultDetail || '',
                  teamHomeLogo: game.teamHomeLogo || '',
                  teamAwayLogo: game.teamAwayLogo || '',
                  location: game.location || '',
                  city: game.city || ''
                });
              }
            }
            setGameData(fetchedGames);
            setLoadingGameData(false);
            return;
          }
          // If still not found, do not perform single-game fetch (not supported)
          setGameData([]);
          setLoadingGameData(false);
          return;
        }
        
        // For other sports, fetch individual game data for each game
        for (const id of gameIdsToFetch) {
          const query = `{
  game(gameId: "${id}") {
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
            fetchedGames.push(result.data.game);
          }
        }
        
        if (fetchedGames.length > 0) {
          setGameData(fetchedGames);
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
        setGameData([]);
      } finally {
        setLoadingGameData(false);
      }
    };

    fetchGameData();
  }, [selectedTemplate, gameId, gameId2, gameId3, apiType, toast, sportType, gamesData]);

  // Auto-switching removed - no more tabs

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

  // Web components removed - using database templates now


  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wähle eine Bilddatei aus.",
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

  const handleCropComplete = async (croppedImage: string) => {
    setUploadingBackground(true);
    
    // Use temporary data URL without saving to storage
    setBackgroundImage(croppedImage);
    toast({
      title: "Hintergrundbild zugeschnitten",
      description: "Das Bild wurde erfolgreich zugeschnitten.",
    });
    
    setTempImage(null);
    setUploadingBackground(false);
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render template SVG with API data
  const renderTemplateSVG = () => {
    if (!selectedTemplate || gameData.length === 0) return null;

    const config = selectedTemplate.config;
    if (!config || !config.elements) return null;

    // Get dimensions based on template format
    const templateFormat = config.format || '4:5';
    const canvasWidth = templateFormat === '1100:800' ? 1100 : 1080;
    const canvasHeight = templateFormat === '4:5' ? 1350 : templateFormat === '1100:800' ? 800 : 1080;

    return (
      <svg
        ref={templateRef}
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="max-w-full h-auto"
      >
         {/* Background */}
        {config.useBackgroundPlaceholder && backgroundImage ? (
          <image
            href={backgroundImage}
            width={canvasWidth}
            height={canvasHeight}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <rect width={canvasWidth} height={canvasHeight} fill={config.backgroundColor || '#1a1a1a'} />
        )}
        
        {/* Background image overlay if not using placeholder (for standard themes compatibility) */}
        {!config.useBackgroundPlaceholder && backgroundImage && (
          <image
            href={backgroundImage}
            width={canvasWidth}
            height={canvasHeight}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        
        {/* Render elements */}
        {config.elements.map((element: any) => {
          if (element.type === 'text' || element.type === 'api-text') {
            let content = element.content;
            
            // Replace API fields with actual data
            if (element.type === 'api-text' && element.apiField) {
              // Determine which game data to use (default to first game)
              let gameIndex = 0;
              let apiFieldName = element.apiField;
              
              // Support prefix system: game-2.teamHome, game-3.teamAway
              if (apiFieldName.startsWith('game-2.')) {
                gameIndex = 1;
                apiFieldName = apiFieldName.replace('game-2.', '');
              } else if (apiFieldName.startsWith('game-3.')) {
                gameIndex = 2;
                apiFieldName = apiFieldName.replace('game-3.', '');
              } else if (apiFieldName.startsWith('game.')) {
                apiFieldName = apiFieldName.replace('game.', '');
              }
              
              // Handle comma-separated multiple fields (e.g., "date,time,location")
              if (apiFieldName.includes(',')) {
                const fields = apiFieldName.split(',');
                const targetGame = gameData[gameIndex];
                const values = fields.map(field => targetGame ? (targetGame as any)[field.trim()] : null).filter(Boolean);
                content = values.join(' ') || element.content;
              } else {
                const targetGame = gameData[gameIndex];
                const fieldValue = targetGame ? (targetGame as any)[apiFieldName] : null;
                content = fieldValue || element.content;
              }
            }
            
            const resolvedFontFamily = resolveFontFamily(element.fontFamily);
            const resolvedFontWeight = element.fontWeight || '400';
            const resolvedFontStyle = element.fontStyle || 'normal';
            const resolvedLetterSpacing = element.letterSpacing ?? 0;

            return (
              <text
                key={element.id}
                x={element.x}
                y={element.y}
                fontSize={element.fontSize}
                fontFamily={resolvedFontFamily}
                fill={element.fill}
                fontWeight={resolvedFontWeight}
                fontStyle={resolvedFontStyle}
                textAnchor={element.textAnchor}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                paintOrder={element.paintOrder}
                letterSpacing={resolvedLetterSpacing}
                opacity={element.opacity}
              >
                {content}
              </text>
            );
          }
          
          if (element.type === 'image' || element.type === 'api-image') {
            let href = element.href;
            
            // Replace API image fields with actual data
            if (element.type === 'api-image' && element.apiField) {
              // Determine which game data to use (default to first game)
              let gameIndex = 0;
              let apiFieldName = element.apiField;
              
              // Support prefix system: game-2.teamHomeLogo, game-3.teamAwayLogo
              if (apiFieldName.startsWith('game-2.')) {
                gameIndex = 1;
                apiFieldName = apiFieldName.replace('game-2.', '');
              } else if (apiFieldName.startsWith('game-3.')) {
                gameIndex = 2;
                apiFieldName = apiFieldName.replace('game-3.', '');
              } else if (apiFieldName.startsWith('game.')) {
                apiFieldName = apiFieldName.replace('game.', '');
              }
              
              const targetGame = gameData[gameIndex];
              const fieldValue = targetGame ? (targetGame as any)[apiFieldName] : null;
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

  /**
   * Extracts the SVG element from template
   */
  const extractSvgElement = (): SVGSVGElement | null => {
    if (!templateRef.current) {
      console.error("Template ref not available");
      return null;
    }
    return templateRef.current;
  };

  const handleDownload = () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um Posts zu erstellen",
        variant: "destructive",
      });
      return;
    }

    // Start download directly
    confirmDownload();
  };

  /**
   * Download handler with platform-specific behavior
   */
  const confirmDownload = async () => {
    // Show progress dialog
    setShowProgressDialog(true);
    setImageLoadStatus([]);

    // Extract SVG element
    const svgElement = extractSvgElement();
    if (!svgElement) {
      setShowProgressDialog(false);
      toast({
        title: "Fehler",
        description: "SVG-Element konnte nicht gefunden werden",
        variant: "destructive",
      });
      return;
    }

    // Generate file name
    const templateCategory = selectedTemplate?.template_category || 'template';
    const fileName = `kanva-${templateCategory}-${gameId}-${Date.now()}.png`;

    // Use the shared download handler
    await handlePlatformDownload({
      svgElement,
      fileName,
      isMobile,
      onProgressUpdate: (progress, message) => {
        setProgressValue(progress);
        setProgressMessage(message);
      },
      onImageStatusUpdate: (statuses) => {
        setImageLoadStatus(statuses);
      },
      onSuccess: (message) => {
        setProgressValue(100);
        setProgressMessage(message.description);
        setTimeout(() => {
          setShowProgressDialog(false);
          setImageLoadStatus([]);
          toast(message);
        }, 300);
      },
      onError: (message) => {
        setShowProgressDialog(false);
        setImageLoadStatus([]);
        toast({
          ...message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {progressValue < 100 ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Bild wird erstellt
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Erfolgreich!
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {progressMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {progressValue}% abgeschlossen
            </p>
            
            {imageLoadStatus.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="text-sm font-semibold mb-2 text-foreground">
                  Grafiken ({imageLoadStatus.length})
                </h4>
                <ScrollArea className="flex-1 border rounded-md">
                  <div className="space-y-2 p-3">
                    {imageLoadStatus.map((image, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div className="flex-shrink-0 mt-0.5">
                          {image.status === 'loaded' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {image.status === 'loading' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {image.status === 'pending' && (
                            <div className="h-4 w-4 rounded-full border-2 border-muted" />
                          )}
                          {image.status === 'error' && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-muted-foreground font-mono">
                            {image.url}
                          </p>
                          {image.size && (
                            <p className="text-muted-foreground/70">
                              {image.size}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
          format={selectedTemplate?.config?.format || '4:5'}
        />
      )}
      <Card className="shadow-[var(--shadow-card)] border-border bg-card/50 backdrop-blur-sm mb-24">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground mb-4">
          Social Media Vorschau
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Template Selection with Options - All in one row */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label htmlFor="theme-select" className="text-sm text-muted-foreground">Vorlage:</Label>
            <Select value={selectedTheme} onValueChange={(value) => {
              setSelectedTheme(value);
              onThemeChange?.(value);
            }}>
              <SelectTrigger id="theme-select" className="w-[220px] border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {loadingTemplates ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Lade Vorlagen...</div>
                ) : allTemplates.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Vorlagen verfügbar</div>
                ) : (
                  <>
                    {/* System templates */}
                    {allTemplates.filter(t => t.is_system && t.supported_games === gameIds.length).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          System Vorlagen
                        </div>
                        {allTemplates
                          .filter(t => t.is_system && t.supported_games === gameIds.length)
                          .sort((a, b) => {
                            // Sort by supported_games first, then by name
                            if (a.supported_games !== b.supported_games) {
                              return a.supported_games - b.supported_games;
                            }
                            return a.name.localeCompare(b.name);
                          })
                          .map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.name} ({template.supported_games} {template.supported_games === 1 ? 'Spiel' : 'Spiele'})
                            </SelectItem>
                          ))}
                      </>
                    )}
                    {/* User templates (for paid users) */}
                    {isPaidUser && allTemplates.filter(t => !t.is_system && t.supported_games === gameIds.length).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Eigene Vorlagen
                        </div>
                        {allTemplates
                          .filter(t => !t.is_system && t.supported_games === gameIds.length)
                          .sort((a, b) => {
                            // Sort by supported_games first, then by name
                            if (a.supported_games !== b.supported_games) {
                              return a.supported_games - b.supported_games;
                            }
                            return a.name.localeCompare(b.name);
                          })
                          .map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.name} ({template.supported_games} {template.supported_games === 1 ? 'Spiel' : 'Spiele'})
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Background image upload - show if template supports it */}
          {selectedTemplate?.config?.useBackgroundPlaceholder && (
            <div className="space-y-2">
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
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/50 text-sm transition-colors h-10"
                >
                  <Upload className="h-4 w-4" />
                  Neues Bild
                </Label>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const open = !showGallery;
                    setShowGallery(open);
                    if (open) refetchBackgrounds();
                  }}
                  className="flex items-center gap-2 h-10"
                >
                  <ImageIcon className="w-4 h-4" />
                  Sammlung ({userBackgrounds.length})
                </Button>
                
                {backgroundImage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveBackgroundImage}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {showGallery && userBackgrounds.length > 0 && (
                <div className="mt-2 p-4 border border-border rounded-lg bg-card/50">
                  <p className="text-sm text-muted-foreground mb-3">Deine hochgeladenen Hintergrundbilder:</p>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-3 gap-2">
                      {userBackgrounds.map((bg) => (
                        <div
                          key={bg.name}
                          className="relative cursor-pointer group aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                          onClick={() => {
                            setBackgroundImage(bg.url);
                            setShowGallery(false);
                            toast({
                              title: "Hintergrundbild ausgewählt",
                              description: "Das Bild wurde erfolgreich ausgewählt.",
                            });
                          }}
                        >
                          <img
                            src={bg.url}
                            alt={bg.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {showGallery && userBackgrounds.length === 0 && (
                <div className="mt-2 p-4 border border-border rounded-lg bg-card/50">
                  <p className="text-sm text-muted-foreground text-center">
                    Noch keine Hintergrundbilder hochgeladen. Lade dein erstes Bild über "Neues Bild" hoch.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Checkboxes removed - template configuration is now in database */}
        </div>

        {/* Template Preview - no more tabs */}
        <div className="w-full bg-muted/10 rounded-lg border border-border overflow-hidden">
          {loadingGameData || loadingTemplates ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !selectedTemplate ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-muted-foreground">Keine Vorlage ausgewählt</p>
            </div>
          ) : (
            <div className="w-full p-4 sm:p-8 flex justify-center">
              <div className="w-full flex justify-center" style={{ maxWidth: `${svgDimensions.width}px` }}>
                {renderTemplateSVG()}
              </div>
            </div>
          )}
        </div>
      </CardContent>

    </Card>
    </>
  );
  }
);

GamePreviewDisplay.displayName = "GamePreviewDisplay";

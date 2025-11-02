import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette, Upload, X, Check, Loader2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { convertSvgToImage, downloadDataUrl, openDataUrlInNewWindow, showImageFullscreen, type ImageLoadProgress } from "@/utils/svgToImage";

type SportType = "unihockey" | "volleyball" | "handball";

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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isHomeGame?: boolean;
  onHomeGameChange?: (value: boolean) => void;
  showResultDetail?: boolean;
  onResultDetailChange?: (value: boolean) => void;
}

export interface GamePreviewDisplayRef {
  triggerDownload: () => void;
  triggerInstagramShare: () => void;
}

const STANDARD_THEMES = [
  { value: "kanva", label: "KANVA" },
  { value: "kanva-light", label: "KANVA Light" },
  { value: "kanva-dark", label: "KANVA Dark" },
  { value: "kadetten-unihockey", label: "Kadetten Unihockey" },
];

interface CustomTemplate {
  id: string;
  name: string;
  value: string; // Will be template ID
  supported_games: number;
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
    onThemeChange,
    activeTab: initialActiveTab = "preview",
    onTabChange,
    isHomeGame: initialIsHomeGame = false,
    onHomeGameChange,
    showResultDetail: initialShowResultDetail = false,
    onResultDetailChange
  }, ref) => {
  const gameId = gameIds[0];
  const gameId2 = gameIds.length > 1 ? gameIds[1] : undefined;
  const gameId3 = gameIds.length > 2 ? gameIds[2] : undefined;
  const previewRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

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
  const [activeTab, setActiveTab] = useState<string>(initialActiveTab);
  
  // Update local theme when prop changes
  useEffect(() => {
    setSelectedTheme(initialTheme);
  }, [initialTheme]);
  
  // Update local tab when prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isHomeGame, setIsHomeGame] = useState(initialIsHomeGame);
  const [showResultDetail, setShowResultDetail] = useState(initialShowResultDetail);
  
  // Update local states when props change
  useEffect(() => {
    setIsHomeGame(initialIsHomeGame);
  }, [initialIsHomeGame]);
  
  useEffect(() => {
    setShowResultDetail(initialShowResultDetail);
  }, [initialShowResultDetail]);
  const [svgDimensions, setSvgDimensions] = useState({ width: "500", height: "625" });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [loadingGameData, setLoadingGameData] = useState(false);
  const customTemplateRef = useRef<SVGSVGElement>(null);
  
  // Progress dialog state
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [imageLoadStatus, setImageLoadStatus] = useState<ImageLoadProgress[]>([]);

  // Expose the handleDownload and handleInstagramShare functions to parent via ref
  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload,
    triggerInstagramShare: handleInstagramShare
  }));
  // Map sport type to API type
  const apiType = sportType === "unihockey" ? "swissunihockey" : sportType === "volleyball" ? "swissvolley" : sportType === "handball" ? "swisshandball" : sportType;
  
  // Check if selected theme is a myclub theme
  const isMyClubTheme = STANDARD_THEMES.some(t => t.value === selectedTheme);
  const selectedCustomTemplate = customTemplates.find(t => t.value === selectedTheme);
  const isCustomTemplate = !!selectedCustomTemplate;

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
          .select('id, name, supported_games, svg_config')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const templates: CustomTemplate[] = data.map(template => ({
            id: template.id,
            name: template.name,
            value: template.id,
            supported_games: template.supported_games,
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

  // Load game data when needed (only for custom templates)
  useEffect(() => {
    const fetchGameData = async () => {
      if (!selectedCustomTemplate || !gameId) return;
      
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
  }, [selectedCustomTemplate, gameId, gameId2, gameId3, apiType, toast, sportType, gamesData]);

  // Auto-switch to Result tab once when results become available
  useEffect(() => {
    const hasAnyResult = gamesHaveResults.some(hasResult => hasResult);
    if (hasAnyResult && activeTab === 'preview') {
      const newTab = "result";
      setActiveTab(newTab);
      onTabChange?.(newTab);
    }
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
    // Load the web component script with fixed version to avoid conflicts
    const script = document.createElement('script');
    script.type = 'module';
    // Use fixed version from package.json instead of @latest
    script.src = 'https://unpkg.com/kanva-web-components@latest/dist/kanva-web-components/kanva-web-components.esm.js';
    
    // Only add if not already loaded
    const existingScript = document.querySelector(`script[src="${script.src}"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      // Only remove if we added it
      if (!existingScript && script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);


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

  // Render custom template SVG with API data
  const renderCustomTemplateSVG = () => {
    if (!selectedCustomTemplate || gameData.length === 0) return null;
    
    const config = selectedCustomTemplate.config;
    if (!config || !config.elements) return null;

    // Get dimensions based on template format
    const templateFormat = config.format || '4:5';
    const canvasWidth = templateFormat === '1100:800' ? 1100 : 1080;
    const canvasHeight = templateFormat === '4:5' ? 1350 : templateFormat === '1100:800' ? 800 : 1080;

    return (
      <svg
        ref={customTemplateRef}
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
              
              // Check if the apiField includes a game identifier (game-2 or game-3)
              if (element.apiField.startsWith('game-2.')) {
                gameIndex = 1;
                element.apiField = element.apiField.replace('game-2.', '');
              } else if (element.apiField.startsWith('game-3.')) {
                gameIndex = 2;
                element.apiField = element.apiField.replace('game-3.', '');
              } else if (element.apiField.startsWith('game.')) {
                element.apiField = element.apiField.replace('game.', '');
              }
              
              const targetGame = gameData[gameIndex];
              const fieldValue = targetGame ? (targetGame as any)[element.apiField] : null;
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
              // Determine which game data to use (default to first game)
              let gameIndex = 0;
              let fieldName = element.apiField;
              
              // Check if the apiField includes a game identifier (game-2 or game-3)
              if (element.apiField.startsWith('game-2.')) {
                gameIndex = 1;
                fieldName = element.apiField.replace('game-2.', '');
              } else if (element.apiField.startsWith('game-3.')) {
                gameIndex = 2;
                fieldName = element.apiField.replace('game-3.', '');
              } else if (element.apiField.startsWith('game.')) {
                fieldName = element.apiField.replace('game.', '');
              }
              
              const targetGame = gameData[gameIndex];
              const fieldValue = targetGame ? (targetGame as any)[fieldName] : null;
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
   * Helper to convert blob to base64 (for Capacitor)
   */
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

  /**
   * Detects if running on iOS using Capacitor's reliable platform detection
   * This works for both native apps AND web browsers on iOS
   */
  const isIOSPlatform = (): boolean => {
    // Capacitor.getPlatform() returns: 'ios', 'android', or 'web'
    const platform = Capacitor.getPlatform();

    // For native iOS app
    if (platform === 'ios') {
      console.log('iOS detected: Native iOS app');
      return true;
    }

    // For web (including iOS browsers like Firefox, Safari, Chrome on iOS)
    // We need to check the actual device OS
    if (platform === 'web') {
      // Use multiple detection methods for iOS browsers
      const isIOSUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPadPro = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isIPad13Plus = navigator.userAgent.includes('Mac') && 'ontouchend' in document;

      const result = isIOSUserAgent || isIPadPro || isIPad13Plus;

      console.log('Platform Detection (Web):', {
        capacitorPlatform: platform,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        isIOSUserAgent,
        isIPadPro,
        isIPad13Plus,
        finalResult: result
      });

      return result;
    }

    console.log('Platform detected:', platform);
    return false;
  };

  /**
   * Detects if the browser is Firefox (works on all platforms including iOS)
   */
  const isFirefox = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('firefox') || userAgent.includes('fxios');
  };

  /**
   * Extracts the SVG element from either web component or custom template
   */
  const extractSvgElement = (): SVGSVGElement | null => {
    // Check if using custom template
    if (selectedCustomTemplate) {
      if (!customTemplateRef.current) {
        console.error("Custom template ref not available");
        return null;
      }
      return customTemplateRef.current;
    }

    // Using myclub web component
    const targetRef = activeTab === "preview" ? previewRef : resultRef;
    const componentSelector = activeTab === "preview" ? "game-preview" : "game-result";
    const gameElement = targetRef.current?.querySelector(componentSelector);

    if (!gameElement) {
      console.error("Game element not found");
      return null;
    }

    const shadowRoot = (gameElement as any).shadowRoot as ShadowRoot | null;
    const svgElement = shadowRoot?.querySelector("svg") || null;

    if (!svgElement) {
      console.error("SVG element not found in shadow root");
    }

    return svgElement;
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

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  /**
   * Simplified download/share handler using the new unified utility
   */
  const handleInstagramShare = async () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um Posts zu erstellen",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show progress dialog
      setShowProgressDialog(true);
      setImageLoadStatus([]);

      // Extract SVG element
      const svgElement = extractSvgElement();
      if (!svgElement) {
        throw new Error("SVG-Element konnte nicht gefunden werden");
      }

      // Convert SVG to image with progress tracking
      const { dataUrl, blob } = await convertSvgToImage(svgElement, {
        scale: 2,
        backgroundColor: 'white',
        onProgress: (progress, message) => {
          setProgressValue(progress);
          setProgressMessage(message);
        },
        onImageStatusUpdate: (statuses) => {
          setImageLoadStatus(statuses);
        },
      });

      // Generate file name
      const fileName = `kanva-${activeTab}-${gameId}-${Date.now()}.png`;

      // Simple download - works on all platforms
      downloadDataUrl(dataUrl, fileName);

      // Success feedback
      setProgressValue(100);
      setProgressMessage("Download erfolgreich!");

      setTimeout(() => {
        setShowProgressDialog(false);
        setImageLoadStatus([]);
        toast({
          title: "Download erfolgreich",
          description: "Das Bild wurde erfolgreich heruntergeladen.",
        });
      }, 500);

    } catch (error) {
      console.error("Export failed:", error);
      setShowProgressDialog(false);
      setImageLoadStatus([]);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bild konnte nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInstagram = () => {
    setShowConfirmDialog(false);
    
    // Try to open Instagram app or website
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Try Instagram app deep link on mobile
      try {
        window.location.href = 'instagram://';
      } catch (e) {
        // Fallback to Instagram website
        window.open('https://www.instagram.com', '_blank');
      }
    } else {
      // Open Instagram website on desktop
      window.open('https://www.instagram.com', '_blank');
    }
    
    toast({
      title: "Instagram geöffnet",
      description: "Du kannst das Bild jetzt in deiner Instagram Story hochladen.",
    });
  };

  /**
   * Simplified confirm download handler with platform-specific behavior
   */
  const confirmDownload = async () => {
    setShowConfirmDialog(false);

    try {
      // Show progress dialog
      setShowProgressDialog(true);
      setImageLoadStatus([]);

      // Extract SVG element
      const svgElement = extractSvgElement();
      if (!svgElement) {
        throw new Error("SVG-Element konnte nicht gefunden werden");
      }

      // Convert SVG to image with progress tracking
      const { dataUrl, blob } = await convertSvgToImage(svgElement, {
        scale: 2,
        backgroundColor: 'white',
        onProgress: (progress, message) => {
          setProgressValue(progress);
          setProgressMessage(message);
        },
        onImageStatusUpdate: (statuses) => {
          setImageLoadStatus(statuses);
        },
      });

      // Generate file name
      const fileName = `kanva-${activeTab}-${gameId}-${Date.now()}.png`;

      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Native platforms: Use Capacitor Share API
        setProgressMessage("Wird geteilt...");

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

          setProgressValue(100);
          setProgressMessage("Erfolgreich geteilt!");

          setTimeout(() => {
            setShowProgressDialog(false);
            setImageLoadStatus([]);
            toast({
              title: "Erfolgreich!",
              description: "Das Bild wurde geteilt.",
            });
          }, 500);
        } catch (error) {
          // User might have cancelled the share dialog
          if ((error as Error).name === 'AbortError') {
            setShowProgressDialog(false);
            setImageLoadStatus([]);
            toast({
              title: "Abgebrochen",
              description: "Der Share-Dialog wurde abgebrochen.",
            });
          } else {
            throw error;
          }
        }
      } else {
        // Web platforms: Platform-specific behavior
        setProgressMessage("Download wird vorbereitet...");

        const iosDevice = isIOSPlatform();
        const isAndroid = Capacitor.getPlatform() === 'android' || /Android/i.test(navigator.userAgent);
        const isMobileDevice = isMobile || iosDevice || isAndroid;

        console.log('Download Platform Detection:', {
          isMobile,
          isMobileDevice,
          isIOS: iosDevice,
          isAndroid,
          userAgent: navigator.userAgent,
          capacitorPlatform: Capacitor.getPlatform()
        });

        // iOS handling (works for both native app web view AND web browsers on iOS)
        if (iosDevice) {
          const firefox = isFirefox();
          
          if (firefox) {
            // Firefox on iOS: Use blob URL approach for better download compatibility
            console.log('Using iOS Firefox download approach');
            setProgressMessage("Download wird vorbereitet...");
            
            // Convert data URL to blob URL for better compatibility
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            
            // Try to trigger download using blob URL
            const downloadSuccess = downloadDataUrl(blobUrl, fileName);
            
            // Also try opening in new window as fallback
            if (!downloadSuccess) {
              const opened = openDataUrlInNewWindow(blobUrl, fileName);
              if (opened) {
                setProgressMessage("Bild in neuem Tab geöffnet!");
              }
            }
            
            // Cleanup blob URL after delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            
            setProgressValue(100);
            setProgressMessage(downloadSuccess ? "Download erfolgreich!" : "Bild geöffnet!");

            setTimeout(() => {
              setShowProgressDialog(false);
              setImageLoadStatus([]);
              toast({
                title: downloadSuccess ? "Download erfolgreich" : "Bild geöffnet",
                description: downloadSuccess 
                  ? "Das Bild wurde erfolgreich heruntergeladen."
                  : "Das Bild wurde in einem neuen Tab geöffnet. Du kannst es dort speichern.",
                duration: 5000,
              });
            }, 500);
          } else {
            // Safari or other browsers on iOS: Use fullscreen viewer
            console.log('Using iOS fullscreen viewer approach');
            setProgressValue(100);
            setProgressMessage("Bild bereit!");

            setTimeout(() => {
              setShowProgressDialog(false);
              setImageLoadStatus([]);

              // Show fullscreen image viewer with the converted PNG
              showImageFullscreen(dataUrl, fileName, () => {
                toast({
                  title: "Bild geschlossen",
                  description: "Du kannst das Bild jederzeit erneut herunterladen.",
                });
              });

              toast({
                title: "Bild bereit zum Speichern",
                description: "Das PNG-Bild wird angezeigt. Drücke lang darauf, um es zu speichern.",
                duration: 5000,
              });
            }, 300);
          }
        }
        // Android or other mobile devices
        else if (isMobileDevice) {
          console.log('Using mobile approach (Android or other mobile)');
          // Try to open in new window
          const opened = openDataUrlInNewWindow(dataUrl, fileName);

          setProgressValue(100);
          setProgressMessage(opened ? "Bild geöffnet!" : "Download vorbereitet!");

          setTimeout(() => {
            setShowProgressDialog(false);
            setImageLoadStatus([]);

            if (opened) {
              toast({
                title: "Bild geöffnet",
                description: "Das Bild wurde in einem neuen Tab geöffnet.",
              });
            } else {
              // Fallback: Show fullscreen viewer with converted PNG
              showImageFullscreen(dataUrl, fileName, () => {
                toast({
                  title: "Bild geschlossen",
                  description: "Du kannst das Bild jederzeit erneut herunterladen.",
                });
              });

              toast({
                title: "Bild bereit zum Speichern",
                description: "Das PNG-Bild wird angezeigt. Drücke lang darauf, um es zu speichern.",
                duration: 5000,
              });
            }
          }, 500);
        }
        // Desktop web
        else {
          console.log('Using desktop download approach');
          downloadDataUrl(dataUrl, fileName);

          setProgressValue(100);
          setProgressMessage("Download erfolgreich!");

          setTimeout(() => {
            setShowProgressDialog(false);
            setImageLoadStatus([]);
            toast({
              title: "Download erfolgreich",
              description: "Das Bild wurde erfolgreich heruntergeladen.",
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      setShowProgressDialog(false);
      setImageLoadStatus([]);

      // Don't show error if user cancelled
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Fehler",
          description: error instanceof Error ? error.message : "Bild konnte nicht erstellt werden.",
          variant: "destructive",
        });
      }
    }
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
          format={selectedCustomTemplate?.config?.format || '4:5'}
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
                        {template.name} ({template.supported_games} {template.supported_games === 1 ? 'Spiel' : 'Spiele'})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Background image upload - before checkboxes */}
          {(isMyClubTheme || (isCustomTemplate && selectedCustomTemplate?.config?.useBackgroundPlaceholder)) && (
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

          {/* Home game checkbox */}
          {isMyClubTheme && activeTab === "preview" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="home-game"
                checked={isHomeGame}
                onCheckedChange={(checked) => {
                  const value = checked as boolean;
                  setIsHomeGame(value);
                  onHomeGameChange?.(value);
                }}
              />
              <Label htmlFor="home-game" className="text-sm text-muted-foreground cursor-pointer">
                Ist Heimspiel
              </Label>
            </div>
          )}

          {/* Result detail checkbox */}
          {isMyClubTheme && activeTab === "result" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="result-detail"
                checked={showResultDetail}
                onCheckedChange={(checked) => {
                  const value = checked as boolean;
                  setShowResultDetail(value);
                  onResultDetailChange?.(value);
                }}
              />
              <Label htmlFor="result-detail" className="text-sm text-muted-foreground cursor-pointer">
                Details anzeigen
              </Label>
            </div>
          )}
        </div>

        {isMyClubTheme ? (
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            onTabChange?.(value);
          }} className="w-full">
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
                    {...((apiType === 'swissvolley' || apiType === 'swisshandball') && { team: teamId })}
                    {...(apiType === 'swisshandball' && { club: clubId })}
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    theme={selectedTheme}
                    ishomegame={isHomeGame.toString()}
                    backgroundimage={backgroundImage || ''}
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
                    {...((apiType === 'swissvolley' || apiType === 'swisshandball') && { team: teamId })}
                    {...(apiType === 'swisshandball' && { club: clubId })}
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    theme={selectedTheme}
                    ishomegame={isHomeGame.toString()}
                    showresultdetail={showResultDetail.toString()}
                    backgroundimage={backgroundImage || ''}
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
      </CardContent>

    </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instagram öffnen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dein Bild wurde erfolgreich heruntergeladen. Möchtest du Instagram öffnen, um das Bild zu teilen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nein, danke</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenInstagram}>
              Ja, Instagram öffnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
  }
);

GamePreviewDisplay.displayName = "GamePreviewDisplay";

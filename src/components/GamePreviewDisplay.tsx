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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [imageLoadStatus, setImageLoadStatus] = useState<Array<{
    url: string;
    status: 'pending' | 'loading' | 'loaded' | 'error';
    size?: string;
  }>>([]);

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

  const inlineExternalImages = async (svgElement: SVGSVGElement): Promise<void> => {
    const images = svgElement.querySelectorAll("image");
    const proxyBase = `https://rgufivgtyonitgjlozog.functions.supabase.co/image-proxy?url=`;

    const toDataUrl = async (blob: Blob) =>
      await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

    const tryFetch = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return await toDataUrl(blob);
      } catch (e) {
        // Fallback via proxy
        try {
          const proxyUrl = proxyBase + encodeURIComponent(url);
          const res2 = await fetch(proxyUrl, { mode: "cors" });
          if (!res2.ok) throw new Error(`Proxy HTTP ${res2.status}`);
          const blob2 = await res2.blob();
          return await toDataUrl(blob2);
        } catch (e2) {
          console.error("Failed to inline image (and proxy)", url, e2);
          return null;
        }
      }
    };

    const promises = Array.from(images).map(async (img) => {
      const href = img.getAttribute("href") || img.getAttribute("xlink:href");
      if (!href) return;
      if (href.startsWith("data:")) return; // already inlined
      if (/^https?:\/\//i.test(href)) {
        const dataUrl = await tryFetch(href);
        if (dataUrl) {
          img.setAttribute("href", dataUrl);
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
        description: "Bitte melde dich an, um Posts zu erstellen",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

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
      setShowProgressDialog(true);
      setProgressValue(10);
      setProgressMessage("Bild wird vorbereitet...");
      setImageLoadStatus([]);

      let svgElement: SVGSVGElement | null = null;

      // Check if using custom template
      if (selectedCustomTemplate) {
        if (!customTemplateRef.current) {
          console.error("Custom template ref not available");
          throw new Error("Template nicht geladen");
        }
        svgElement = customTemplateRef.current;
      } else {
        // Using myclub web component
        const targetRef = activeTab === "preview" ? previewRef : resultRef;
        const componentSelector = activeTab === "preview" ? "game-preview" : "game-result";
        const gameElement = targetRef.current?.querySelector(componentSelector);

        if (!gameElement) {
          throw new Error("Komponente nicht gefunden");
        }

        const shadowRoot = (gameElement as any).shadowRoot as ShadowRoot | null;
        svgElement = shadowRoot?.querySelector("svg") || null;
      }

      if (!svgElement) {
        throw new Error("Kein SVG-Element gefunden");
      }

      setProgressValue(30);
      setProgressMessage("Bilder werden geladen...");

      // Wait for images to load
      const images = svgElement.querySelectorAll('image');
      await Promise.all(
        Array.from(images).map(img => {
          const href = img.getAttribute('href') || img.getAttribute('xlink:href');
          if (!href || href.startsWith('data:')) return Promise.resolve();

          return new Promise((resolve) => {
            const testImg = new Image();
            const timeout = setTimeout(() => resolve(undefined), 10000);
            testImg.onload = () => {
              clearTimeout(timeout);
              resolve(undefined);
            };
            testImg.onerror = () => {
              clearTimeout(timeout);
              resolve(undefined);
            };
            testImg.src = href;
          });
        })
      );

      setProgressValue(50);
      setProgressMessage("Bilder werden verarbeitet...");

      // Inline external images
      await inlineExternalImages(svgElement);

      setProgressValue(70);
      setProgressMessage("Bild wird konvertiert...");

      // Get SVG dimensions
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

      // Convert SVG to PNG
      const pngUri = await svg.svgAsPngUri(svgElement, options);
      const response = await fetch(pngUri);
      const blob = await response.blob();
      const fileName = `kanva-${activeTab}-${gameId}-${Date.now()}.png`;

      setProgressValue(90);
      setProgressMessage("Download wird vorbereitet...");

      // Build game URL and template info
      const gameUrl = studioUrl || window.location.pathname;
      const templateInfo = selectedCustomTemplate
        ? `template=${selectedCustomTemplate.id}`
        : `theme=${selectedTheme}`;

      // Download the image
      const link = document.createElement('a');
      link.download = fileName;
      link.href = pngUri;
      link.click();

      setProgressValue(100);
      setProgressMessage("Download erfolgreich!");

      // Close dialog after short delay
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
        description: "Bild konnte nicht heruntergeladen werden. Bitte versuche es erneut.",
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

  const confirmDownload = async () => {
    setShowConfirmDialog(false);

    try {
      setShowProgressDialog(true);
      setProgressValue(10);
      setProgressMessage("Bild wird vorbereitet...");
      setImageLoadStatus([]);

      let svgElement: SVGSVGElement | null = null;

      // Check if using custom template
      if (selectedCustomTemplate) {
        if (!customTemplateRef.current) {
          console.error("Custom template ref not available");
          throw new Error("Template nicht geladen");
        }
        svgElement = customTemplateRef.current;
        console.log("Using custom template SVG", svgElement);
      } else {
        // Using myclub web component
        const targetRef = activeTab === "preview" ? previewRef : resultRef;
        const componentSelector = activeTab === "preview" ? "game-preview" : "game-result";
        const gameElement = targetRef.current?.querySelector(componentSelector);

        if (!gameElement) {
          throw new Error("Komponente nicht gefunden");
        }

        const shadowRoot = (gameElement as any).shadowRoot as ShadowRoot | null;
        svgElement = shadowRoot?.querySelector("svg") || null;
      }

      if (!svgElement) {
        console.error("No SVG element found");
        throw new Error("Kein SVG-Element gefunden");
      }

      console.log("SVG element dimensions:", {
        width: svgElement.getAttribute('width'),
        height: svgElement.getAttribute('height'),
        viewBox: svgElement.getAttribute('viewBox')
      });

      setProgressValue(25);
      setProgressMessage("SVG wird vorbereitet...");

      // Clone the SVG to avoid modifying the displayed version
      console.log("Cloning SVG element...");
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      console.log("SVG cloned successfully");

      setProgressValue(35);
      setProgressMessage("Bilder werden geladen...");

      // Wait for images to load - both custom templates and web components
      console.log("Waiting for images to load...");
      const images = clonedSvg.querySelectorAll('image');
      
      // Initialize image load status
      const imageStatuses: Array<{
        url: string;
        status: 'pending' | 'loading' | 'loaded' | 'error';
        size?: string;
      }> = Array.from(images).map(img => {
        const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
        const isDataUrl = href.startsWith('data:');
        const urlPreview = isDataUrl 
          ? `data-url (${(href.length / 1024).toFixed(1)} KB)` 
          : href.substring(0, 50) + (href.length > 50 ? '...' : '');
        
        return {
          url: urlPreview,
          status: ((href && !isDataUrl) ? 'pending' : 'loaded') as 'pending' | 'loaded',
          size: isDataUrl ? `${(href.length / 1024).toFixed(1)} KB` : undefined
        };
      });
      
      setImageLoadStatus(imageStatuses);
      
      await Promise.all(
        Array.from(images).map(async (img, index) => {
          const href = img.getAttribute('href') || img.getAttribute('xlink:href');
          if (!href || href.startsWith('data:')) return Promise.resolve();

          return new Promise((resolve) => {
            // Update status to loading
            setImageLoadStatus(prev => {
              const updated = [...prev];
              updated[index] = { ...updated[index], status: 'loading' };
              return updated;
            });

            const testImg = new Image();
            const timeout = setTimeout(() => {
              console.warn('Image load timeout:', href);
              setImageLoadStatus(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], status: 'error' };
                return updated;
              });
              resolve(undefined);
            }, 10000); // 10 second timeout

            testImg.onload = () => {
              clearTimeout(timeout);
              console.log('Image loaded:', href);
              setImageLoadStatus(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], status: 'loaded' };
                return updated;
              });
              resolve(undefined);
            };
            testImg.onerror = () => {
              clearTimeout(timeout);
              console.warn('Failed to preload image:', href);
              setImageLoadStatus(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], status: 'error' };
                return updated;
              });
              resolve(undefined);
            };
            testImg.src = href;
          });
        })
      );
      console.log("All images loaded");

      setProgressValue(55);
      setProgressMessage("Bilder werden verarbeitet...");

      // Inline external images (team logos, etc.)
      console.log("Inlining external images...");
      await inlineExternalImages(clonedSvg);
      console.log("Images inlined successfully");

      setProgressValue(70);
      setProgressMessage("Bild wird konvertiert...");

      // Use cloned SVG for conversion
      svgElement = clonedSvg;

      // Get SVG dimensions from viewBox or attributes
      let width = 1080;
      let height = 1350;

      if (svgElement.viewBox && svgElement.viewBox.baseVal) {
        width = svgElement.viewBox.baseVal.width;
        height = svgElement.viewBox.baseVal.height;
      } else if (svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
        width = parseFloat(svgElement.getAttribute('width') || '1080');
        height = parseFloat(svgElement.getAttribute('height') || '1350');
      }

      console.log("Export dimensions:", { width, height });

      const options = {
        scale: 2,
        backgroundColor: "white",
        width,
        height,
      };

      console.log("Converting SVG to PNG...");
      // Convert SVG to PNG URI
      const pngUri = await svg.svgAsPngUri(svgElement, options);
      console.log("SVG converted to PNG successfully");

      setProgressValue(85);
      setProgressMessage("Download wird vorbereitet...");

      // Convert URI to Blob
      const response = await fetch(pngUri);
      const blob = await response.blob();
      const fileName = `${activeTab}-${gameId}-${Date.now()}.png`;

      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();

      // Build game URL and template info
      const gameUrl = studioUrl || window.location.pathname;
      const templateInfo = selectedCustomTemplate
        ? `template=${selectedCustomTemplate.id}`
        : `theme=${selectedTheme}`;

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

          setProgressValue(95);
          setProgressMessage("Wird geteilt...");

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
          console.error("Capacitor share failed:", error);
          setShowProgressDialog(false);
          setImageLoadStatus([]);
          // User might have cancelled the share dialog
          if ((error as Error).name === 'AbortError') {
            toast({
              title: "Abgebrochen",
              description: "Der Share-Dialog wurde abgebrochen.",
            });
          } else {
            throw error;
          }
        }
      } else {
        // Web platform - try Web Share API
        try {
          const file = new File([blob], fileName, { type: 'image/png' });

          setProgressValue(95);
          setProgressMessage("Wird geteilt...");

          // Check if Web Share API is available and supports files
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            console.log("Using Web Share API");
            await navigator.share({
              files: [file],
              title: activeTab === "preview" ? "Spielvorschau" : "Resultat",
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
          } else {
            // Fallback for mobile browsers that don't support Web Share API
            console.log("Using mobile-friendly fallback");
            
            // Check if we're on mobile
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
              // On mobile without share API, open image in new tab
              // User can then long-press and save the image
              const newWindow = window.open();
              if (newWindow) {
                newWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Bild speichern</title>
                      <style>
                        body {
                          margin: 0;
                          padding: 20px;
                          background: #1a1a1a;
                          color: white;
                          font-family: system-ui, -apple-system, sans-serif;
                          text-align: center;
                        }
                        .instructions {
                          margin-bottom: 20px;
                          padding: 15px;
                          background: rgba(255,255,255,0.1);
                          border-radius: 8px;
                        }
                        img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 8px;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                        }
                      </style>
                    </head>
                    <body>
                      <div class="instructions">
                        <h2>📥 Bild speichern</h2>
                        <p>Halte das Bild gedrückt und wähle "Bild speichern" aus dem Menü.</p>
                      </div>
                      <img src="${pngUri}" alt="Generiertes Bild" />
                    </body>
                  </html>
                `);
              }
              
              setProgressValue(100);
              setProgressMessage("Bild in neuem Tab geöffnet!");
              
              setTimeout(() => {
                setShowProgressDialog(false);
                setImageLoadStatus([]);
                toast({
                  title: "Bild geöffnet",
                  description: "Halte das Bild gedrückt und wähle 'Bild speichern'.",
                  duration: 5000,
                });
              }, 500);
            } else {
              // Desktop fallback: direct download
              console.log("Using download fallback");
              const link = document.createElement('a');
              link.download = fileName;
              link.href = pngUri;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();

              // Cleanup after a short delay
              setTimeout(() => {
                document.body.removeChild(link);
              }, 100);

              setProgressValue(100);
              setProgressMessage("Download erfolgreich!");
              
              setTimeout(() => {
                setShowProgressDialog(false);
                setImageLoadStatus([]);
                toast({
                  title: "Erfolgreich!",
                  description: "Das Bild wurde heruntergeladen.",
                });
              }, 500);
            }
          }
        } catch (error) {
          // User cancelled the share dialog
          if ((error as Error).name === 'AbortError') {
            console.log("User cancelled share");
            setShowProgressDialog(false);
            setImageLoadStatus([]);
            toast({
              title: "Abgebrochen",
              description: "Der Share-Dialog wurde abgebrochen.",
            });
          } else {
            console.error('Share failed:', error);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      setShowProgressDialog(false);
      setImageLoadStatus([]);
      // Don't show error if user cancelled the share dialog
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Fehler",
          description: "Bild konnte nicht erstellt werden. Bitte versuche es erneut.",
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

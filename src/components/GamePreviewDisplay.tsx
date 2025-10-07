import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, Palette, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toPng, toSvg } from "html-to-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GamePreviewDisplayProps {
  clubId: string;
  gameId: string;
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

export const GamePreviewDisplay = ({ clubId, gameId }: GamePreviewDisplayProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedTheme, setSelectedTheme] = useState("myclub-light");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

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
        setBackgroundImage(e.target?.result as string);
        toast({
          title: "Hintergrundbild hochgeladen",
          description: "Das Bild wurde erfolgreich hochgeladen.",
        });
      };
      reader.readAsDataURL(file);
    }
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

      const host = targetRef.current.querySelector(
        activeTab === "preview" ? "game-preview" : "game-result"
      ) as HTMLElement | null;

      if (!host) {
        throw new Error("Komponente nicht gefunden");
      }

      // Try to capture inner content of the Shadow DOM (more reliable)
      const shadowRoot = (host as any).shadowRoot as ShadowRoot | null;
      const captureNode =
        (shadowRoot?.firstElementChild as HTMLElement | null) ?? host;

      // Preload images (including CSS background-images) and fonts
      const preloadAssets = async (rootEl: HTMLElement) => {
        const urls = new Set<string>();

        // <img> tags
        rootEl.querySelectorAll("img").forEach((img) => {
          const src = (img as HTMLImageElement).src;
          if (src) urls.add(src);
        });

        // background-image urls
        const elements = rootEl.querySelectorAll<HTMLElement>("*");
        const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
        elements.forEach((el) => {
          const bg = getComputedStyle(el).backgroundImage;
          let m;
          while ((m = urlRegex.exec(bg)) !== null) {
            urls.add(m[1]);
          }
        });

        await Promise.all(
          Array.from(urls).map(
            (u) =>
              new Promise<void>((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Ignore failures to avoid blocking
                img.src = u;
              })
          )
        );

        // Wait for fonts to be ready
        try {
          // @ts-ignore
          await document.fonts?.ready;
        } catch (_) {
          // ignore
        }
        // Small extra delay to ensure layout settled
        await new Promise((r) => setTimeout(r, 400));
      };

      await preloadAssets(captureNode);

      const dataUrl = await toPng(captureNode, {
        backgroundColor: null,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${activeTab}-${gameId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notifySuccess();
    } catch (error) {
      console.error("PNG export failed, trying SVG fallback:", error);
      try {
        const fallbackNode =
          ((targetRef.current.querySelector(
            activeTab === "preview" ? "game-preview" : "game-result"
          ) as any)?.shadowRoot?.firstElementChild as HTMLElement | null) ??
          (targetRef.current.querySelector(
            activeTab === "preview" ? "game-preview" : "game-result"
          ) as HTMLElement);

        const svgDataUrl = await toSvg(fallbackNode, {
          cacheBust: true,
          backgroundColor: null,
        });

        const link = document.createElement("a");
        link.href = svgDataUrl;
        link.download = `${activeTab}-${gameId}-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Als SVG exportiert",
          description:
            "PNG-Export fehlgeschlagen, SVG wurde stattdessen heruntergeladen.",
        });
      } catch (svgErr) {
        console.error("SVG fallback failed:", svgErr);
        notifyError();
      }
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
                backgroundimage={backgroundImage || undefined}
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
                backgroundimage={backgroundImage || undefined}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

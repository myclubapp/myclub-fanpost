import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Move, Type, ImageIcon, Database, Upload, ChevronDown, ChevronUp, RectangleHorizontal, Square, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/ImageCropper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';

interface Logo {
  id: string;
  name: string;
  logo_type: string;
  file_url: string | null;
  file_path: string;
}

interface SVGElement {
  id: string;
  type: 'text' | 'image' | 'api-text' | 'api-image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  apiField?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string;
  textAnchor?: string;
  href?: string;
  zIndex?: number;
}

// API Fields per game
const getAPIFieldsForGame = (gameNumber: number) => {
  const suffix = gameNumber === 1 ? '' : gameNumber.toString();
  return {
    text: [
      { value: `teamHome${suffix}`, label: `Heim Team Name${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `teamAway${suffix}`, label: `Auswärts Team Name${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `date${suffix}`, label: `Datum${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `time${suffix}`, label: `Uhrzeit${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `location${suffix}`, label: `Spielort${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `city${suffix}`, label: `Stadt${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `result${suffix}`, label: `Resultat${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `resultDetail${suffix}`, label: `Resultat Detail${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
    ],
    image: [
      { value: `teamHomeLogo${suffix}`, label: `Heim Team Logo${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
      { value: `teamAwayLogo${suffix}`, label: `Auswärts Team Logo${gameNumber > 1 ? ` (Spiel ${gameNumber})` : ''}` },
    ]
  };
};

interface TemplateDesignerProps {
  supportedGames: number;
  config: any;
  onChange: (config: any) => void;
  onSupportedGamesChange: (games: number) => void;
  format: '4:5' | '1:1';
  onFormatChange: (format: '4:5' | '1:1') => void;
  previewMode: boolean;
  previewData: any;
  onTogglePreview: () => void;
}

export const TemplateDesigner = ({ supportedGames, config, onChange, onSupportedGamesChange, format, onFormatChange, previewMode, previewData, onTogglePreview }: TemplateDesignerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [elements, setElements] = useState<SVGElement[]>(config.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [expandedGame, setExpandedGame] = useState<number | null>(1);
  const [cropperFormat, setCropperFormat] = useState<'4:5' | '1:1' | 'free'>(format as '4:5' | '1:1');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#1a1a1a');
  const [useBackgroundPlaceholder, setUseBackgroundPlaceholder] = useState(config.useBackgroundPlaceholder || false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(config.backgroundImageUrl || '');
  const [backgroundMode, setBackgroundMode] = useState<'placeholder' | 'color' | 'image'>(
    config.backgroundImageUrl ? 'image' : config.useBackgroundPlaceholder ? 'placeholder' : 'color'
  );
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [loadingLogos, setLoadingLogos] = useState(false);

  // Canvas dimensions based on format
  const canvasDimensions = format === '4:5' 
    ? { width: 1080, height: 1350 } 
    : { width: 1080, height: 1080 };

  // Load logos on mount
  useEffect(() => {
    if (user) {
      loadLogos();
    }
  }, [user]);

  const loadLogos = async () => {
    if (!user) return;
    
    setLoadingLogos(true);
    try {
      const { data, error } = await supabase
        .from('user_logos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
    } catch (error: any) {
      console.error('Error loading logos:', error);
    } finally {
      setLoadingLogos(false);
    }
  };

  const addLogoElement = (logo: Logo) => {
    if (!logo.file_url) return;
    
    const maxZIndex = Math.max(0, ...elements.map(el => el.zIndex ?? 0));
    const newElement: SVGElement = {
      id: `logo-${Date.now()}`,
      type: 'image',
      x: canvasDimensions.width / 2 - 100,
      y: 100,
      width: 200,
      height: 200,
      href: logo.file_url,
      zIndex: maxZIndex + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setShowLogoDialog(false);
    
    toast({
      title: 'Logo hinzugefügt',
      description: `${logo.name} wurde zum Template hinzugefügt.`,
    });
  };

  // Load template background images
  const { data: templateBackgrounds = [], refetch: refetchBackgrounds } = useQuery({
    queryKey: ['template-backgrounds', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.storage
        .from('template-images')
        .list(`templates/${user.id}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' },
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      const items = await Promise.all(
        data.map(async (file) => {
          const filePath = `templates/${user.id}/${file.name}`;
          const { data: publicUrlData } = supabase.storage
            .from('template-images')
            .getPublicUrl(filePath);

          return {
            name: file.name,
            url: publicUrlData.publicUrl,
            path: filePath,
          };
        })
      );

      return items;
    },
    enabled: !!user,
  });

  // Sync elements and format with config
  useEffect(() => {
    onChange({ 
      ...config, 
      elements, 
      format, 
      backgroundColor, 
      useBackgroundPlaceholder: backgroundMode === 'placeholder',
      backgroundImageUrl: backgroundMode === 'image' ? backgroundImageUrl : ''
    });
  }, [elements, format, backgroundColor, backgroundMode, backgroundImageUrl]);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setDraggingElement(elementId);
    setSelectedElement(elementId);
    setDragOffset({
      x: svgP.x - element.x,
      y: svgP.y - element.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingElement) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setElements(prev => prev.map(el => 
      el.id === draggingElement
        ? { ...el, x: svgP.x - dragOffset.x, y: svgP.y - dragOffset.y }
        : el
    ));
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  const updateElement = (id: string, updates: Partial<SVGElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const updated = { ...el, ...updates };
        
        // If updating width/height of image and lockAspectRatio is true
        if ((el.type === 'image' || el.type === 'api-image') && lockAspectRatio && el.width && el.height) {
          const aspectRatio = el.width / el.height;
          
          if (updates.width !== undefined && updates.height === undefined) {
            updated.height = Math.round(updates.width / aspectRatio);
          } else if (updates.height !== undefined && updates.width === undefined) {
            updated.width = Math.round(updates.height * aspectRatio);
          }
        }
        
        return updated;
      }
      return el;
    }));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const addTextElement = () => {
    const maxZIndex = Math.max(0, ...elements.map(el => el.zIndex ?? 0));
    const newElement: SVGElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: canvasDimensions.width / 2,
      y: 200,
      content: 'Neuer Text',
      fontSize: 48,
      fontFamily: 'Bebas Neue, sans-serif',
      fill: '#ffffff',
      fontWeight: '900',
      textAnchor: 'middle',
      zIndex: maxZIndex + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const addApiTextField = (apiField: string) => {
    const maxZIndex = Math.max(0, ...elements.map(el => el.zIndex ?? 0));
    const newElement: SVGElement = {
      id: `api-text-${Date.now()}`,
      type: 'api-text',
      x: canvasDimensions.width / 2,
      y: 300,
      content: `{${apiField}}`,
      apiField,
      fontSize: 48,
      fontFamily: 'Bebas Neue, sans-serif',
      fill: '#ffffff',
      fontWeight: '900',
      textAnchor: 'middle',
      zIndex: maxZIndex + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };


  const addApiImageField = (apiField: string) => {
    const maxZIndex = Math.max(0, ...elements.map(el => el.zIndex ?? 0));
    const newElement: SVGElement = {
      id: `api-image-${Date.now()}`,
      type: 'api-image',
      x: 400,
      y: 500,
      width: 189,
      height: 189,
      apiField,
      href: 'https://via.placeholder.com/189', // Placeholder
      zIndex: maxZIndex + 1
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei aus.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: "Die maximale Dateigröße beträgt 10 MB.",
        variant: "destructive",
      });
      return;
    }

    // Load image and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImage(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: string) => {
    setTempImage(null);
    setUploading(true);
    
    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      if (!user) throw new Error('User not authenticated');
      
      const fileExt = 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `templates/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-images')
        .getPublicUrl(filePath);

      const maxZIndex = Math.max(0, ...elements.map(el => el.zIndex ?? 0));
      const newElement: SVGElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        x: 0,
        y: 0,
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        href: publicUrl,
        zIndex: maxZIndex + 1
      };
      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);

      toast({
        title: "Bild hochgeladen",
        description: "Das Bild wurde erfolgreich zugeschnitten und hochgeladen.",
      });
    } catch (error: any) {
      toast({
        title: "Upload-Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const getElementContent = (element: SVGElement) => {
    if (previewMode && (element.type === 'api-text' || element.type === 'api-image')) {
      if (!previewData) return element.content || element.href;
      
      const fieldValue = previewData[element.apiField || ''];
      return fieldValue || element.content || element.href;
    }
    
    return element.type === 'image' || element.type === 'api-image' 
      ? element.href 
      : element.content;
  };

  // Check if an API field is already in use
  const isApiFieldUsed = (apiField: string) => {
    return elements.some(el => el.apiField === apiField);
  };

  const moveElementForward = (id: string) => {
    setElements(prev => {
      const currentIndex = prev.findIndex(el => el.id === id);
      if (currentIndex === -1 || currentIndex === prev.length - 1) return prev; // Already at top or not found
      
      // Swap with next element (move forward in rendering order)
      const newElements = [...prev];
      const temp = newElements[currentIndex];
      newElements[currentIndex] = newElements[currentIndex + 1];
      newElements[currentIndex + 1] = temp;
      
      // Update z-indices to match new order
      return newElements.map((el, idx) => ({ ...el, zIndex: idx }));
    });
  };

  const moveElementBackward = (id: string) => {
    setElements(prev => {
      const currentIndex = prev.findIndex(el => el.id === id);
      if (currentIndex === -1 || currentIndex === 0) return prev; // Already at bottom or not found
      
      // Swap with previous element (move backward in rendering order)
      const newElements = [...prev];
      const temp = newElements[currentIndex];
      newElements[currentIndex] = newElements[currentIndex - 1];
      newElements[currentIndex - 1] = temp;
      
      // Update z-indices to match new order
      return newElements.map((el, idx) => ({ ...el, zIndex: idx }));
    });
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

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
          format={cropperFormat}
          onFormatChange={setCropperFormat}
        />
      )}

      {/* Logo Selection Dialog */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Logo auswählen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingLogos ? (
              <div className="text-center py-8 text-muted-foreground">Logos werden geladen...</div>
            ) : logos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Logos gefunden. Laden Sie zuerst Logos in der Logo-Verwaltung hoch.
              </div>
            ) : (
              <Tabs defaultValue="sponsor" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sponsor">Sponsoren</TabsTrigger>
                  <TabsTrigger value="club">Verein</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sponsor" className="mt-4">
                  {logos.filter(logo => logo.logo_type === 'sponsor').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Keine Sponsoren-Logos gefunden
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {logos.filter(logo => logo.logo_type === 'sponsor').map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => addLogoElement(logo)}
                          className="group relative border rounded-lg p-4 hover:border-primary transition-colors"
                        >
                          <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                            {logo.file_url ? (
                              <img
                                src={logo.file_url}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-sm font-medium truncate">{logo.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="club" className="mt-4">
                  {logos.filter(logo => logo.logo_type === 'club').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Keine Vereins-Logos gefunden
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {logos.filter(logo => logo.logo_type === 'club').map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => addLogoElement(logo)}
                          className="group relative border rounded-lg p-4 hover:border-primary transition-colors"
                        >
                          <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                            {logo.file_url ? (
                              <img
                                src={logo.file_url}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-sm font-medium truncate">{logo.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="team" className="mt-4">
                  {logos.filter(logo => logo.logo_type === 'team').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Keine Team-Logos gefunden
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {logos.filter(logo => logo.logo_type === 'team').map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => addLogoElement(logo)}
                          className="group relative border rounded-lg p-4 hover:border-primary transition-colors"
                        >
                          <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                            {logo.file_url ? (
                              <img
                                src={logo.file_url}
                                alt={logo.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-sm font-medium truncate">{logo.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Template Canvas</CardTitle>
          <CardDescription>
            Klicken und ziehen Sie Elemente, um sie zu verschieben
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={addTextElement} size="sm" variant="outline" className="gap-2" disabled={previewMode}>
              <Type className="h-4 w-4" />
              Statischer Text
            </Button>
            <Button
              onClick={() => setShowLogoDialog(true)}
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={previewMode}
            >
              <ImageIcon className="h-4 w-4" />
              Logo auswählen
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={uploading || previewMode}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Lädt hoch...' : 'Bild hochladen'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Drag & Drop API Fields per Game */}
          <div className="mb-4 space-y-2">
            {Array.from({ length: supportedGames }, (_, i) => i + 1).map(gameNumber => {
              const apiFields = getAPIFieldsForGame(gameNumber);
              const isExpanded = expandedGame === gameNumber;
              
              return (
                <Card key={gameNumber} className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedGame(isExpanded ? null : gameNumber)}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="font-medium">Spiel {gameNumber}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-3 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Text-Felder</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {apiFields.text.map(field => {
                            const isUsed = isApiFieldUsed(field.value);
                            return (
                              <Button
                                key={field.value}
                                variant={isUsed ? "default" : "outline"}
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => !isUsed && addApiTextField(field.value)}
                                disabled={isUsed || previewMode}
                              >
                                <Type className="h-3 w-3 mr-1.5" />
                                {field.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Bild-Felder</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {apiFields.image.map(field => {
                            const isUsed = isApiFieldUsed(field.value);
                            return (
                              <Button
                                key={field.value}
                                variant={isUsed ? "default" : "outline"}
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => !isUsed && addApiImageField(field.value)}
                                disabled={isUsed || previewMode}
                              >
                                <ImageIcon className="h-3 w-3 mr-1.5" />
                                {field.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>


          <div className="border rounded-none overflow-auto bg-muted/10">
            <svg
              ref={svgRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              viewBox={`0 0 ${canvasDimensions.width} ${canvasDimensions.height}`}
              className="max-w-full h-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Background */}
              {backgroundMode === 'image' && backgroundImageUrl ? (
                <image 
                  href={backgroundImageUrl} 
                  width={canvasDimensions.width} 
                  height={canvasDimensions.height}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <rect width={canvasDimensions.width} height={canvasDimensions.height} fill={backgroundMode === 'placeholder' ? '#333333' : backgroundColor} />
              )}
              
              {backgroundMode === 'placeholder' && (
                <>
                  <text
                    x={canvasDimensions.width / 2}
                    y={canvasDimensions.height / 2 - 20}
                    fontSize={32}
                    fontFamily="sans-serif"
                    fill="#888888"
                    textAnchor="middle"
                  >
                    Hintergrundbild-Platzhalter
                  </text>
                  <text
                    x={canvasDimensions.width / 2}
                    y={canvasDimensions.height / 2 + 20}
                    fontSize={16}
                    fontFamily="sans-serif"
                    fill="#666666"
                    textAnchor="middle"
                  >
                    Hier wird im Studio das hochgeladene Bild angezeigt
                  </text>
                </>
              )}
              
              {/* Grid for reference */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>
              <rect width={canvasDimensions.width} height={canvasDimensions.height} fill="url(#grid)" />

              {/* Render elements */}
              {elements.map((element, index) => {
                const isSelected = selectedElement === element.id && !previewMode;
                const isApiElement = element.type === 'api-text' || element.type === 'api-image';
                const displayContent = getElementContent(element);
                
                if (element.type === 'text' || element.type === 'api-text') {
                  return (
                    <g key={element.id}>
                      {isSelected && (
                        <rect
                          x={element.x - (element.textAnchor === 'middle' ? 100 : 0)}
                          y={element.y - (element.fontSize || 24)}
                          width={element.textAnchor === 'middle' ? 200 : 300}
                          height={(element.fontSize || 24) + 10}
                          fill="none"
                          stroke={isApiElement ? "#10b981" : "#3b82f6"}
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}
                      <text
                        x={element.x}
                        y={element.y}
                        fontSize={element.fontSize}
                        fontFamily={element.fontFamily}
                        fill={element.fill}
                        fontWeight={element.fontWeight}
                        textAnchor={element.textAnchor}
                        style={{ cursor: previewMode ? 'default' : 'move', userSelect: 'none' }}
                        onMouseDown={previewMode ? undefined : (e) => handleMouseDown(e, element.id)}
                      >
                        {displayContent}
                      </text>
                      {isApiElement && !previewMode && (
                        <text
                          x={element.x}
                          y={element.y - (element.fontSize || 24) - 5}
                          fontSize={12}
                          fill="#10b981"
                          textAnchor={element.textAnchor}
                          style={{ pointerEvents: 'none' }}
                        >
                          API: {element.apiField}
                        </text>
                      )}
                    </g>
                  );
                }
                
                if (element.type === 'image' || element.type === 'api-image') {
                  return (
                    <g key={element.id}>
                      {isSelected && (
                        <rect
                          x={element.x - 2}
                          y={element.y - 2}
                          width={(element.width || 100) + 4}
                          height={(element.height || 100) + 4}
                          fill="none"
                          stroke={isApiElement ? "#10b981" : "#3b82f6"}
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}
                      {isApiElement && !previewMode && (
                        <defs>
                          <pattern id={`hatch-${element.id}`} patternUnits="userSpaceOnUse" width="8" height="8">
                            <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" 
                              stroke="#10b981" 
                              strokeWidth="1" 
                              opacity="0.3" />
                          </pattern>
                        </defs>
                      )}
                      <rect
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={isApiElement && !previewMode ? `url(#hatch-${element.id})` : "none"}
                        stroke={isApiElement && !previewMode ? "#10b981" : "none"}
                        strokeWidth="1"
                        style={{ cursor: previewMode ? 'default' : 'move' }}
                        onMouseDown={previewMode ? undefined : (e) => handleMouseDown(e, element.id)}
                      />
                      {(element.type === 'image' || previewMode) && (
                        <image
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          href={displayContent}
                          style={{ cursor: previewMode ? 'default' : 'move' }}
                          onMouseDown={previewMode ? undefined : (e) => handleMouseDown(e, element.id)}
                        />
                      )}
                      {isApiElement && !previewMode && (
                        <>
                          <rect
                            x={element.x}
                            y={element.y - 20}
                            width={element.width || 100}
                            height={18}
                            fill="#10b981"
                            opacity={0.9}
                          />
                          <text
                            x={element.x + (element.width || 100) / 2}
                            y={element.y - 6}
                            fontSize={12}
                            fill="#ffffff"
                            textAnchor="middle"
                            style={{ pointerEvents: 'none' }}
                          >
                            API: {element.apiField}
                          </text>
                        </>
                      )}
                    </g>
                  );
                }
                
                return null;
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Properties Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hintergrund</CardTitle>
            <CardDescription>
              Wählen Sie einen Platzhalter, eine Farbe oder ein Bild aus Ihrer Sammlung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hintergrund-Typ</Label>
              <Select value={backgroundMode} onValueChange={(value: 'placeholder' | 'color' | 'image') => setBackgroundMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Platzhalter (für dynamisches Bild)</SelectItem>
                  <SelectItem value="color">Feste Farbe</SelectItem>
                  <SelectItem value="image">Bild aus Sammlung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {backgroundMode === 'color' && (
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 p-1 h-10"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                  placeholder="#1a1a1a"
                />
              </div>
            )}
            
            {backgroundMode === 'placeholder' && (
              <p className="text-xs text-muted-foreground">
                Im Studio kann dann ein Hintergrundbild hochgeladen werden, das automatisch eingefügt wird.
              </p>
            )}

            {backgroundMode === 'image' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const open = !showBackgroundGallery;
                      setShowBackgroundGallery(open);
                      if (open) refetchBackgrounds();
                    }}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Sammlung ({templateBackgrounds.length})
                  </Button>
                  
                  {backgroundImageUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setBackgroundImageUrl('')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Entfernen
                    </Button>
                  )}
                </div>

                {showBackgroundGallery && templateBackgrounds.length > 0 && (
                  <div className="mt-2 p-4 border border-border rounded-lg bg-card/50">
                    <p className="text-sm text-muted-foreground mb-3">Ihre Template-Hintergrundbilder:</p>
                    <ScrollArea className="h-[200px]">
                      <div className="grid grid-cols-3 gap-2">
                        {templateBackgrounds.map((bg: any) => (
                          <div
                            key={bg.name}
                            className="relative cursor-pointer group aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                            onClick={() => {
                              setBackgroundImageUrl(bg.url);
                              setShowBackgroundGallery(false);
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

                {showBackgroundGallery && templateBackgrounds.length === 0 && (
                  <div className="mt-2 p-4 border border-border rounded-lg bg-card/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Noch keine Hintergrundbilder hochgeladen. Template-Bilder können in der Vorlagen-Verwaltung hochgeladen werden.
                    </p>
                  </div>
                )}

                {backgroundImageUrl && (
                  <div className="border rounded-lg p-2">
                    <img 
                      src={backgroundImageUrl} 
                      alt="Ausgewähltes Hintergrundbild" 
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Element-Eigenschaften</CardTitle>
            <CardDescription>
              {selectedElementData
                ? `Bearbeiten: ${selectedElementData.type === 'text' ? 'Text' : 'Bild'}`
                : 'Kein Element ausgewählt'}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {selectedElementData ? (
            <div className="space-y-4">
              <Badge variant="outline" className="gap-1 mb-4">
                {selectedElementData.type === 'text' || selectedElementData.type === 'api-text' ? (
                  <Type className="h-3 w-3" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                {selectedElementData.type === 'api-text' || selectedElementData.type === 'api-image' ? (
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    API {selectedElementData.type === 'api-text' ? 'Text' : 'Bild'}
                  </span>
                ) : (
                  selectedElementData.type === 'text' ? 'Text' : 'Bild'
                )}
              </Badge>

              {(selectedElementData.type === 'api-text' || selectedElementData.type === 'api-image') && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">API Feld: {selectedElementData.apiField}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wird automatisch mit Daten aus der API befüllt
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>X Position</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedElementData.x)}
                    onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Y Position</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedElementData.y)}
                    onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
                  />
                </div>
              </div>

              {(selectedElementData.type === 'text' || selectedElementData.type === 'api-text') && (
                <>
                  {selectedElementData.type === 'text' && (
                    <div className="space-y-2">
                      <Label>Text</Label>
                      <Input
                        value={selectedElementData.content}
                        onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Schriftart</Label>
                    <Select
                      value={selectedElementData.fontFamily}
                      onValueChange={(value) => updateElement(selectedElementData.id, { fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bebas Neue, sans-serif">Bebas Neue</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                   <div className="space-y-2">
                    <Label>Schriftgröße</Label>
                    <Input
                      type="number"
                      value={selectedElementData.fontSize}
                      onChange={(e) => updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Farbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedElementData.fill}
                        onChange={(e) => updateElement(selectedElementData.id, { fill: e.target.value })}
                        className="w-16 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={selectedElementData.fill}
                        onChange={(e) => updateElement(selectedElementData.id, { fill: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ausrichtung</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['start', 'middle', 'end'].map(anchor => (
                        <Button
                          key={anchor}
                          size="sm"
                          variant={selectedElementData.textAnchor === anchor ? 'default' : 'outline'}
                          onClick={() => updateElement(selectedElementData.id, { textAnchor: anchor as any })}
                        >
                          {anchor === 'start' ? 'Links' : anchor === 'middle' ? 'Mitte' : 'Rechts'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(selectedElementData.type === 'image' || selectedElementData.type === 'api-image') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Breite</Label>
                      <Input
                        type="number"
                        value={selectedElementData.width}
                        onChange={(e) => updateElement(selectedElementData.id, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Höhe</Label>
                      <Input
                        type="number"
                        value={selectedElementData.height}
                        onChange={(e) => updateElement(selectedElementData.id, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="aspect-ratio" 
                      checked={lockAspectRatio}
                      onCheckedChange={(checked) => setLockAspectRatio(checked as boolean)}
                    />
                    <Label htmlFor="aspect-ratio" className="text-sm cursor-pointer">
                      Seitenverhältnis beibehalten
                    </Label>
                  </div>

                  {selectedElementData.type === 'image' && (
                    <div className="space-y-2">
                      <Label>Bild URL</Label>
                      <Input
                        value={selectedElementData.href}
                        onChange={(e) => updateElement(selectedElementData.id, { href: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                 </>
               )}

               <div className="space-y-2">
                 <Label>Ebene</Label>
                 <div className="flex gap-2">
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => moveElementBackward(selectedElementData.id)}
                     className="flex-1"
                     disabled={elements.findIndex(el => el.id === selectedElementData.id) === 0}
                   >
                     Nach hinten
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => moveElementForward(selectedElementData.id)}
                     className="flex-1"
                     disabled={elements.findIndex(el => el.id === selectedElementData.id) === elements.length - 1}
                   >
                     Nach vorne
                   </Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Position: {elements.findIndex(el => el.id === selectedElementData.id) + 1} von {elements.length}
                 </p>
               </div>

              <Button
                className="w-full"
                variant="destructive"
                onClick={() => deleteElement(selectedElementData.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Element löschen
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Move className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Wählen Sie ein Element aus, um es zu bearbeiten</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
    </>
  );
};
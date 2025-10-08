import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Move, Type, ImageIcon, Database, Upload, Eye, ChevronDown, ChevronUp, RectangleHorizontal, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/ImageCropper';

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
}

export const TemplateDesigner = ({ supportedGames, config, onChange, onSupportedGamesChange, format, onFormatChange }: TemplateDesignerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [elements, setElements] = useState<SVGElement[]>(config.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [expandedGame, setExpandedGame] = useState<number | null>(1);
  const [cropperFormat, setCropperFormat] = useState<'4:5' | '1:1'>(format);

  // Canvas dimensions based on format
  const canvasDimensions = format === '4:5' 
    ? { width: 1080, height: 1350 } 
    : { width: 1080, height: 1080 };

  // Sync elements and format with config
  useEffect(() => {
    onChange({ ...config, elements, format });
  }, [elements, format]);

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
      
      const fileExt = 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

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
        x: 400,
        y: 400,
        width: 189,
        height: 189,
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

  const loadPreviewData = async () => {
    try {
      const gameIds = ['1073721', '1073723', '1073724'];
      const gamesToLoad = gameIds.slice(0, supportedGames);
      
      const promises = gamesToLoad.map(gameId =>
        fetch(`https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20game(gameId%3A%20%22${gameId}%22)%20%7B%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20location%0A%20%20%20%20city%0A%20%20%20%20result%0A%20%20%20%20resultDetail%0A%20%20%20%20teamHomeLogo%0A%20%20%20%20teamAwayLogo%0A%20%20%7D%0A%7D%0A`)
          .then(res => res.json())
          .then(data => data.data.game)
      );
      
      const gamesData = await Promise.all(promises);
      
      // Create preview data with suffixed fields for games 2 and 3
      const previewDataObj: any = gamesData[0]; // Game 1 has no suffix
      
      if (gamesData[1]) {
        Object.keys(gamesData[1]).forEach(key => {
          previewDataObj[`${key}2`] = gamesData[1][key];
        });
      }
      
      if (gamesData[2]) {
        Object.keys(gamesData[2]).forEach(key => {
          previewDataObj[`${key}3`] = gamesData[2][key];
        });
      }
      
      setPreviewData(previewDataObj);
      setPreviewMode(true);
      toast({
        title: "Vorschau geladen",
        description: `Template wird mit Beispieldaten für ${supportedGames} ${supportedGames === 1 ? 'Spiel' : 'Spiele'} angezeigt`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Vorschaudaten konnten nicht geladen werden",
        variant: "destructive",
      });
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
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      
      const currentZ = element.zIndex ?? 0;
      const higherElements = prev.filter(el => (el.zIndex ?? 0) > currentZ);
      
      if (higherElements.length === 0) return prev; // Already at top
      
      const nextZ = Math.min(...higherElements.map(el => el.zIndex ?? 0));
      
      // Swap z-indices
      const updated = prev.map(el => {
        if (el.id === id) return { ...el, zIndex: nextZ };
        if (el.zIndex === nextZ) return { ...el, zIndex: currentZ };
        return el;
      });
      
      return updated;
    });
  };

  const moveElementBackward = (id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      
      const currentZ = element.zIndex ?? 0;
      const lowerElements = prev.filter(el => (el.zIndex ?? 0) < currentZ);
      
      if (lowerElements.length === 0) return prev; // Already at bottom
      
      const prevZ = Math.max(...lowerElements.map(el => el.zIndex ?? 0));
      
      // Swap z-indices
      const updated = prev.map(el => {
        if (el.id === id) return { ...el, zIndex: prevZ };
        if (el.zIndex === prevZ) return { ...el, zIndex: currentZ };
        return el;
      });
      
      return updated;
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
            <Button onClick={addTextElement} size="sm" variant="outline" className="gap-2">
              <Type className="h-4 w-4" />
              Statischer Text
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              size="sm" 
              variant="outline" 
              className="gap-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Lädt hoch...' : 'Bild hochladen'}
            </Button>
            <Button 
              onClick={() => previewMode ? setPreviewMode(false) : loadPreviewData()} 
              size="sm" 
              variant={previewMode ? "default" : "outline"}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Editor-Modus' : 'Vorschau'}
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
                                disabled={isUsed}
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
                                disabled={isUsed}
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

          <div className="flex items-center gap-3 mb-4">
            <Label className="text-sm font-medium">Format:</Label>
            <div className="flex gap-2">
              <Button
                variant={format === '4:5' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFormatChange('4:5')}
                className="gap-2"
              >
                <RectangleHorizontal className="h-4 w-4" />
                4:5 (Instagram)
              </Button>
              <Button
                variant={format === '1:1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFormatChange('1:1')}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                1:1 (Quadratisch)
              </Button>
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              {canvasDimensions.width}x{canvasDimensions.height}px
            </span>
          </div>

          <div className="border rounded-none overflow-auto bg-muted/10">
            <span className="text-sm text-muted-foreground ml-2">
              {canvasDimensions.width}x{canvasDimensions.height}px
            </span>
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
              <rect width={canvasDimensions.width} height={canvasDimensions.height} fill={config.backgroundColor || '#1a1a1a'} />
              
              {/* Grid for reference */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>
              <rect width={canvasDimensions.width} height={canvasDimensions.height} fill="url(#grid)" />

              {/* Render elements */}
              {[...elements]
                .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                .map(element => {
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
                 <Label>Ebene (Z-Index)</Label>
                 <div className="flex gap-2">
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => moveElementBackward(selectedElementData.id)}
                     className="flex-1"
                   >
                     Nach hinten
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => moveElementForward(selectedElementData.id)}
                     className="flex-1"
                   >
                     Nach vorne
                   </Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Aktuell: {selectedElementData.zIndex ?? 0}
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
    </>
  );
};
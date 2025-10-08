import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Move, Type, ImageIcon, Database, Upload, Eye } from 'lucide-react';
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
}

// API Fields per template type
const API_FIELDS = {
  'game-preview': {
    text: [
      { value: 'teamHome', label: 'Heim Team Name' },
      { value: 'teamAway', label: 'Auswärts Team Name' },
      { value: 'date', label: 'Datum' },
      { value: 'time', label: 'Uhrzeit' },
      { value: 'location', label: 'Spielort' },
      { value: 'city', label: 'Stadt' },
    ],
    image: [
      { value: 'teamHomeLogo', label: 'Heim Team Logo' },
      { value: 'teamAwayLogo', label: 'Auswärts Team Logo' },
      { value: 'teamHomeLogo2', label: 'Heim Team Logo (Spiel 2)' },
      { value: 'teamAwayLogo2', label: 'Auswärts Team Logo (Spiel 2)' },
      { value: 'teamHomeLogo3', label: 'Heim Team Logo (Spiel 3)' },
      { value: 'teamAwayLogo3', label: 'Auswärts Team Logo (Spiel 3)' },
    ]
  },
  'game-result': {
    text: [
      { value: 'teamHome', label: 'Heim Team Name' },
      { value: 'teamAway', label: 'Auswärts Team Name' },
      { value: 'result', label: 'Resultat' },
      { value: 'resultDetail', label: 'Resultat Detail' },
      { value: 'date', label: 'Datum' },
      { value: 'time', label: 'Uhrzeit' },
      { value: 'location', label: 'Spielort' },
      { value: 'city', label: 'Stadt' },
      { value: 'result2', label: 'Resultat (Spiel 2)' },
      { value: 'resultDetail2', label: 'Resultat Detail (Spiel 2)' },
    ],
    image: [
      { value: 'teamHomeLogo', label: 'Heim Team Logo' },
      { value: 'teamAwayLogo', label: 'Auswärts Team Logo' },
      { value: 'teamHomeLogo2', label: 'Heim Team Logo (Spiel 2)' },
      { value: 'teamAwayLogo2', label: 'Auswärts Team Logo (Spiel 2)' },
    ]
  }
};

interface TemplateDesignerProps {
  templateType: 'game-preview' | 'game-result';
  config: any;
  onChange: (config: any) => void;
}

export const TemplateDesigner = ({ templateType, config, onChange }: TemplateDesignerProps) => {
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

  // Sync elements with config
  useEffect(() => {
    onChange({ ...config, elements });
  }, [elements]);

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
    const newElement: SVGElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 540,
      y: 200,
      content: 'Neuer Text',
      fontSize: 48,
      fontFamily: 'Bebas Neue, sans-serif',
      fill: '#ffffff',
      fontWeight: '900',
      textAnchor: 'middle'
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const addApiTextField = (apiField: string) => {
    const fieldLabel = API_FIELDS[templateType].text.find(f => f.value === apiField)?.label || apiField;
    const newElement: SVGElement = {
      id: `api-text-${Date.now()}`,
      type: 'api-text',
      x: 540,
      y: 300,
      content: `{${apiField}}`,
      apiField,
      fontSize: 48,
      fontFamily: 'Bebas Neue, sans-serif',
      fill: '#ffffff',
      fontWeight: '900',
      textAnchor: 'middle'
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const addImageElement = () => {
    const newElement: SVGElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      x: 400,
      y: 400,
      width: 189,
      height: 189,
      href: 'https://via.placeholder.com/189'
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const addApiImageField = (apiField: string) => {
    const fieldLabel = API_FIELDS[templateType].image.find(f => f.value === apiField)?.label || apiField;
    const newElement: SVGElement = {
      id: `api-image-${Date.now()}`,
      type: 'api-image',
      x: 400,
      y: 500,
      width: 189,
      height: 189,
      apiField,
      href: 'https://via.placeholder.com/189' // Placeholder
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

      const newElement: SVGElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        x: 400,
        y: 400,
        width: 189,
        height: 189,
        href: publicUrl
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
      const response = await fetch('https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20game(gameId%3A%20%221073721%22)%20%7B%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20location%0A%20%20%20%20city%0A%20%20%20%20result%0A%20%20%20%20resultDetail%0A%20%20%20%20teamHomeLogo%0A%20%20%20%20teamAwayLogo%0A%20%20%7D%0A%7D%0A');
      const data = await response.json();
      setPreviewData(data.data.game);
      setPreviewMode(true);
      toast({
        title: "Vorschau geladen",
        description: "Template wird mit Beispieldaten angezeigt",
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
            <Button onClick={addImageElement} size="sm" variant="outline" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild-URL
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
            
            <div className="flex gap-2 items-center ml-auto">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Select onValueChange={addApiTextField}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="API Text-Feld..." />
                </SelectTrigger>
                <SelectContent>
                  {API_FIELDS[templateType].text.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={addApiImageField}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="API Bild-Feld..." />
                </SelectTrigger>
                <SelectContent>
                  {API_FIELDS[templateType].image.map(field => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-none overflow-auto bg-muted/10">
            <svg
              ref={svgRef}
              width="1080"
              height="1350"
              viewBox="0 0 1080 1350"
              className="max-w-full h-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Background */}
              <rect width="1080" height="1350" fill={config.backgroundColor || '#1a1a1a'} />
              
              {/* Grid for reference */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>
              <rect width="1080" height="1350" fill="url(#grid)" />

              {/* Render elements */}
              {elements.map(element => {
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
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="gap-1">
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteElement(selectedElementData.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

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
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="aspect-ratio" 
                      checked={lockAspectRatio}
                      onCheckedChange={(checked) => setLockAspectRatio(checked as boolean)}
                    />
                    <Label htmlFor="aspect-ratio" className="text-sm cursor-pointer">
                      Seitenverhältnis beibehalten
                    </Label>
                  </div>
                  
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
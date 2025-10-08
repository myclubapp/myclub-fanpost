import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Move, Type, ImageIcon } from 'lucide-react';

interface SVGElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string;
  textAnchor?: string;
  href?: string;
}

interface TemplateDesignerProps {
  templateType: 'game-preview' | 'game-result';
  config: any;
  onChange: (config: any) => void;
}

export const TemplateDesigner = ({ templateType, config, onChange }: TemplateDesignerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [elements, setElements] = useState<SVGElement[]>(config.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
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

  const selectedElementData = elements.find(el => el.id === selectedElement);

  return (
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
          <div className="flex gap-2 mb-4">
            <Button onClick={addTextElement} size="sm" variant="outline" className="gap-2">
              <Type className="h-4 w-4" />
              Text hinzufügen
            </Button>
            <Button onClick={addImageElement} size="sm" variant="outline" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Bild hinzufügen
            </Button>
          </div>

          <div className="border rounded-lg overflow-auto bg-muted/10">
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
                const isSelected = selectedElement === element.id;
                
                if (element.type === 'text') {
                  return (
                    <g key={element.id}>
                      {isSelected && (
                        <rect
                          x={element.x - (element.textAnchor === 'middle' ? 100 : 0)}
                          y={element.y - (element.fontSize || 24)}
                          width={element.textAnchor === 'middle' ? 200 : 300}
                          height={(element.fontSize || 24) + 10}
                          fill="none"
                          stroke="#3b82f6"
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
                        style={{ cursor: 'move', userSelect: 'none' }}
                        onMouseDown={(e) => handleMouseDown(e, element.id)}
                      >
                        {element.content}
                      </text>
                    </g>
                  );
                }
                
                if (element.type === 'image') {
                  return (
                    <g key={element.id}>
                      {isSelected && (
                        <rect
                          x={element.x - 2}
                          y={element.y - 2}
                          width={(element.width || 100) + 4}
                          height={(element.height || 100) + 4}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}
                      <image
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        href={element.href}
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => handleMouseDown(e, element.id)}
                      />
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
                  {selectedElementData.type === 'text' ? <Type className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  {selectedElementData.type === 'text' ? 'Text' : 'Bild'}
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteElement(selectedElementData.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

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

              {selectedElementData.type === 'text' && (
                <>
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <Input
                      value={selectedElementData.content}
                      onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                    />
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

              {selectedElementData.type === 'image' && (
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

                  <div className="space-y-2">
                    <Label>Bild URL</Label>
                    <Input
                      value={selectedElementData.href}
                      onChange={(e) => updateElement(selectedElementData.id, { href: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
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
  );
};
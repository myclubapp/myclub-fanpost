import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface SVGElement {
  id: string;
  type: 'text' | 'image' | 'api-text' | 'api-image' | 'rect';
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
  fontStyle?: string;
  letterSpacing?: number;
  textAnchor?: string;
  href?: string;
  zIndex?: number;
  rx?: number; // border radius for rect
  ry?: number; // border radius for rect
  stroke?: string; // stroke color for rect
  strokeWidth?: number; // stroke width for rect
}

interface SVGImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (config: {
    elements: SVGElement[];
    backgroundColor?: string;
    width?: number;
    height?: number;
  }) => void;
  format: '4:5' | '1:1' | '1100:800';
}

export const SVGImporter = ({ open, onOpenChange, onImport, format }: SVGImporterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseSVGFile = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.includes('svg')) {
        throw new Error('Bitte wähle eine SVG-Datei aus');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Datei ist zu gross (max. 5MB)');
      }

      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('SVG-Datei konnte nicht geparst werden');
      }

      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        throw new Error('Keine gültige SVG-Datei');
      }

      // Extract dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      let width = 1080;
      let height = 1080;
      
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number);
        width = w || 1080;
        height = h || 1080;
      } else {
        width = parseFloat(svgElement.getAttribute('width') || '1080');
        height = parseFloat(svgElement.getAttribute('height') || '1080');
      }

      // Extract background color
      const backgroundColor = svgElement.style.backgroundColor || 
                            svgElement.getAttribute('fill') || 
                            '#1a1a1a';

      // Parse elements
      const elements: SVGElement[] = [];
      let elementCounter = 0;

      console.log('SVG parsing started');

      // Parse text elements (search in entire document, including nested groups)
      const textElements = doc.querySelectorAll('text, tspan');
      console.log(`Found ${textElements.length} text elements`);
      textElements.forEach((textEl) => {
        const x = parseFloat(textEl.getAttribute('x') || '0');
        const y = parseFloat(textEl.getAttribute('y') || '0');
        const content = textEl.textContent || '';
        
        if (!content.trim()) return; // Skip empty text

        const computedStyle = window.getComputedStyle(textEl as Element);
        const fontSize = parseFloat(textEl.getAttribute('font-size') || 
                                   computedStyle.fontSize || 
                                   '16');
        const fontFamily = textEl.getAttribute('font-family') || 
                          computedStyle.fontFamily || 
                          'Arial';
        const fill = textEl.getAttribute('fill') || 
                    computedStyle.fill || 
                    '#ffffff';
        const fontWeight = textEl.getAttribute('font-weight') || 
                          computedStyle.fontWeight || 
                          'normal';
        const fontStyle = textEl.getAttribute('font-style') || 
                         computedStyle.fontStyle || 
                         'normal';
        const letterSpacing = parseFloat(textEl.getAttribute('letter-spacing') || 
                                        computedStyle.letterSpacing || 
                                        '0');
        const textAnchor = textEl.getAttribute('text-anchor') || 
                          computedStyle.textAnchor || 
                          'start';

        elements.push({
          id: `imported-text-${elementCounter++}`,
          type: 'text',
          x,
          y,
          content,
          fontSize,
          fontFamily: fontFamily.replace(/['"]/g, ''),
          fill,
          fontWeight,
          fontStyle,
          letterSpacing,
          textAnchor: textAnchor as 'start' | 'middle' | 'end',
          zIndex: elementCounter,
        });
      });

      // Parse direct image elements
      const imageElements = doc.querySelectorAll('image');
      console.log(`Found ${imageElements.length} direct image elements`);
      imageElements.forEach((imgEl) => {
        const x = parseFloat(imgEl.getAttribute('x') || '0');
        const y = parseFloat(imgEl.getAttribute('y') || '0');
        const width = parseFloat(imgEl.getAttribute('width') || '100');
        const height = parseFloat(imgEl.getAttribute('height') || '100');
        const href = imgEl.getAttribute('href') || 
                    imgEl.getAttribute('xlink:href') || 
                    '';

        if (!href) return; // Skip images without source

        elements.push({
          id: `imported-image-${elementCounter++}`,
          type: 'image',
          x,
          y,
          width,
          height,
          href,
          zIndex: elementCounter,
        });
      });

      // Parse images from patterns (common in exported SVGs)
      const patterns = doc.querySelectorAll('pattern');
      console.log(`Found ${patterns.length} pattern elements`);
      patterns.forEach((pattern) => {
        const patternImages = pattern.querySelectorAll('image');
        patternImages.forEach((imgEl) => {
          const x = parseFloat(imgEl.getAttribute('x') || '0');
          const y = parseFloat(imgEl.getAttribute('y') || '0');
          const width = parseFloat(imgEl.getAttribute('width') || '100');
          const height = parseFloat(imgEl.getAttribute('height') || '100');
          const href = imgEl.getAttribute('href') || 
                      imgEl.getAttribute('xlink:href') || 
                      '';

          if (href) {
            elements.push({
              id: `imported-pattern-image-${elementCounter++}`,
              type: 'image',
              x,
              y,
              width,
              height,
              href,
              zIndex: elementCounter,
            });
          }
        });
      });

      // Parse rect elements as shapes
      const rectElements = doc.querySelectorAll('rect');
      console.log(`Found ${rectElements.length} rect elements`);
      rectElements.forEach((rectEl) => {
        const x = parseFloat(rectEl.getAttribute('x') || '0');
        const y = parseFloat(rectEl.getAttribute('y') || '0');
        const width = parseFloat(rectEl.getAttribute('width') || '100');
        const height = parseFloat(rectEl.getAttribute('height') || '100');
        const fill = rectEl.getAttribute('fill') || '#cccccc';
        const rx = parseFloat(rectEl.getAttribute('rx') || '0');
        const ry = parseFloat(rectEl.getAttribute('ry') || '0');
        const stroke = rectEl.getAttribute('stroke') || '';
        const strokeWidth = parseFloat(rectEl.getAttribute('stroke-width') || '0');

        // Skip full-page background rects (typically x=0, y=0, and width/height >= 90% of canvas)
        const isFullBackground = x === 0 && y === 0 && 
                                width >= (svgElement.viewBox?.baseVal.width || width) * 0.9 &&
                                height >= (svgElement.viewBox?.baseVal.height || height) * 0.9;
        
        if (!isFullBackground) {
          elements.push({
            id: `imported-rect-${elementCounter++}`,
            type: 'rect',
            x,
            y,
            width,
            height,
            fill,
            rx,
            ry,
            stroke: stroke || undefined,
            strokeWidth: strokeWidth || undefined,
            zIndex: elementCounter,
          });
        }
      });

      console.log('Total elements parsed:', elements.length);
      console.log('Elements:', elements);

      // Count element types
      const textCount = elements.filter(e => e.type === 'text').length;
      const imageCount = elements.filter(e => e.type === 'image').length;
      const rectCount = elements.filter(e => e.type === 'rect').length;

      if (elements.length === 0) {
        const totalFound = textElements.length + imageElements.length + patterns.length + rectElements.length;
        toast({
          title: 'Keine Elemente importiert',
          description: `Gefunden: ${textElements.length} Text, ${imageElements.length} Bilder, ${rectElements.length} Rechtecke, ${patterns.length} Patterns - aber keine konnten importiert werden. Überprüfe die SVG-Struktur.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'SVG erfolgreich importiert',
        description: `${elements.length} Elemente importiert: ${textCount} Text, ${imageCount} Bilder, ${rectCount} Rechtecke`,
      });

      onImport({
        elements,
        backgroundColor,
        width,
        height,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Import fehlgeschlagen',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseSVGFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      parseSVGFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>SVG-Datei importieren</DialogTitle>
          <DialogDescription>
            Lade eine SVG-Datei hoch, um sie als Template zu importieren. 
            Text- und Bild-Elemente werden automatisch erkannt.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Klicke oder ziehe eine SVG-Datei hierher
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximale Dateigrösse: 5MB
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Hinweise zum Import:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Text-Elemente werden als bearbeitbare Texte importiert</li>
            <li>Bild-Elemente werden als statische Bilder importiert</li>
            <li>Rechteck-Elemente werden als Formen importiert</li>
            <li>Hintergrundfarben werden übernommen</li>
            <li>Komplexe Pfade werden nicht unterstützt</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

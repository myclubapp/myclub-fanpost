import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ImageCropperProps {
  image: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: string) => void;
  format?: '4:5' | '1:1' | 'free';
  onFormatChange?: (format: '4:5' | '1:1' | 'free') => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.95);
};

export const ImageCropper = ({ image, open, onClose, onCropComplete, format = '4:5', onFormatChange }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const aspectRatio = format === '4:5' ? 1080 / 1350 : format === '1:1' ? 1 : undefined;

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      // If free format, use original image without cropping
      if (format === 'free') {
        onCropComplete(image);
        onClose();
        return;
      }

      if (!croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error("Fehler beim Zuschneiden:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Bild zuschneiden</DialogTitle>
        </DialogHeader>
        
        {onFormatChange && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={format === '4:5' ? 'default' : 'outline'}
                onClick={() => onFormatChange('4:5')}
              >
                4:5
              </Button>
              <Button
                type="button"
                size="sm"
                variant={format === '1:1' ? 'default' : 'outline'}
                onClick={() => onFormatChange('1:1')}
              >
                1:1
              </Button>
              <Button
                type="button"
                size="sm"
                variant={format === 'free' ? 'default' : 'outline'}
                onClick={() => onFormatChange('free')}
              >
                Frei
              </Button>
            </div>
          </div>
        )}
        
        <div className="relative w-full h-[400px] bg-muted/10 rounded-lg overflow-hidden">
          {format === 'free' ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={onZoomChange}
            />
          )}
        </div>
        {format !== 'free' && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="zoom" className="text-sm text-muted-foreground">
                Zoom
              </Label>
              <Slider
                id="zoom"
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                className="w-full"
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border">
            Abbrechen
          </Button>
          <Button onClick={handleCrop} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {format === 'free' ? 'Übernehmen' : 'Zuschneiden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

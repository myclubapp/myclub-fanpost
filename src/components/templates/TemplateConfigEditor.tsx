import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Type, Layout } from 'lucide-react';

interface TemplateConfigEditorProps {
  templateType: 'game-preview' | 'game-result';
  config: any;
  onChange: (config: any) => void;
}

export const TemplateConfigEditor = ({ templateType, config, onChange }: TemplateConfigEditorProps) => {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Konfiguration</CardTitle>
        <CardDescription>
          Passen Sie die Darstellung Ihres Templates an
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Farben
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.primaryColor || '#3b82f6'}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.primaryColor || '#3b82f6'}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={config.secondaryColor || '#10b981'}
                  onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.secondaryColor || '#10b981'}
                  onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={config.backgroundColor || '#ffffff'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.backgroundColor || '#ffffff'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Textfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={config.textColor || '#000000'}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.textColor || '#000000'}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Schriftart</Label>
              <Input
                id="fontFamily"
                value={config.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => updateConfig('fontFamily', e.target.value)}
                placeholder="Arial, sans-serif"
              />
            </div>

            <div className="space-y-2">
              <Label>Titel-Schriftgröße: {config.titleFontSize || 24}px</Label>
              <Slider
                value={[config.titleFontSize || 24]}
                onValueChange={([value]) => updateConfig('titleFontSize', value)}
                min={16}
                max={48}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Text-Schriftgröße: {config.textFontSize || 16}px</Label>
              <Slider
                value={[config.textFontSize || 16]}
                onValueChange={([value]) => updateConfig('textFontSize', value)}
                min={12}
                max={32}
                step={1}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="boldTitles"
                checked={config.boldTitles !== false}
                onCheckedChange={(checked) => updateConfig('boldTitles', checked)}
              />
              <Label htmlFor="boldTitles" className="cursor-pointer">
                Titel fett darstellen
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Innenabstand: {config.padding || 20}px</Label>
              <Slider
                value={[config.padding || 20]}
                onValueChange={([value]) => updateConfig('padding', value)}
                min={0}
                max={50}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Rahmenbreite: {config.borderWidth || 0}px</Label>
              <Slider
                value={[config.borderWidth || 0]}
                onValueChange={([value]) => updateConfig('borderWidth', value)}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Eckenradius: {config.borderRadius || 8}px</Label>
              <Slider
                value={[config.borderRadius || 8]}
                onValueChange={([value]) => updateConfig('borderRadius', value)}
                min={0}
                max={50}
                step={2}
              />
            </div>

            {templateType === 'game-result' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="showDetail"
                  checked={config.showDetail !== false}
                  onCheckedChange={(checked) => updateConfig('showDetail', checked)}
                />
                <Label htmlFor="showDetail" className="cursor-pointer">
                  Detaillierte Resultate anzeigen
                </Label>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

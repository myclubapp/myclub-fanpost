import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/components/theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';

export const SettingsSection = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Einstellungen</CardTitle>
        <CardDescription>
          Passen Sie die Darstellung an Ihre Präferenzen an
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Darstellung</Label>
          <p className="text-sm text-muted-foreground">
            Wählen Sie, wie die Anwendung angezeigt werden soll.
          </p>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer font-normal">
                <Sun className="h-4 w-4" />
                Hell
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer font-normal">
                <Moon className="h-4 w-4" />
                Dunkel
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer font-normal">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};

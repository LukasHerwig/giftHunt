import { useTranslation } from 'react-i18next';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Mode } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ThemeSettingsProps {
  className?: string;
}

export const ThemeSettings = ({ className }: ThemeSettingsProps) => {
  const { t } = useTranslation();
  const { theme, setMode, isDark } = useTheme();

  const modeOptions: { value: Mode; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') },
  ];

  const handleModeChange = (mode: Mode) => {
    setMode(mode);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('theme.title')}
        </CardTitle>
        <CardDescription>{t('theme.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('theme.appearance')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {modeOptions.map(({ value, icon: Icon, label }) => {
              const isSelected = theme.mode === value;

              return (
                <Button
                  key={value}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => handleModeChange(value)}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                  {isSelected && value === 'system' && (
                    <Badge variant="secondary" className="text-xs">
                      {isDark ? t('theme.dark') : t('theme.light')}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Theme Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('theme.preview')}</h3>
          <div className="p-4 rounded-lg border bg-card">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* Sky Serenity color display */}
                  <div
                    className="w-8 h-8 rounded-xl border-2 border-background shadow-sm"
                    style={{ backgroundColor: `hsl(${theme.colors.base})` }}
                    title="Sky Serenity theme"
                  />
                  {/* Generated variations */}
                  <div className="flex flex-col gap-1">
                    <div
                      className="w-4 h-2 rounded-sm"
                      style={{
                        backgroundColor: `hsl(${theme.colors.primary})`,
                      }}
                      title="Primary variation"
                    />
                    <div
                      className="w-4 h-2 rounded-sm"
                      style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                      title="Accent variation"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">
                    Sky Serenity Theme
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Soft sky blue with harmonious accents
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Sky Serenity</Badge>
                <Badge variant="outline">
                  {theme.mode === 'system'
                    ? `${t('theme.system')} (${
                        isDark ? t('theme.dark') : t('theme.light')
                      })`
                    : theme.mode === 'dark'
                    ? t('theme.dark')
                    : t('theme.light')}
                </Badge>
              </div>
              {/* Live preview of UI elements */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    Primary Button
                  </Button>
                  <Button size="sm" variant="outline">
                    Outline Button
                  </Button>
                </div>
                <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
                  Sample card background with muted text
                </div>
                <div className="w-full h-2 bg-gradient-to-r from-primary to-accent rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

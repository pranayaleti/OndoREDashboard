import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'English (United States)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'header' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ variant = 'header', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLocale = LOCALES.find(l => l.code === i18n.language) ?? LOCALES[0];

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    try {
      const token = localStorage.getItem('ondo_access_token');
      if (token) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';
        fetch(`${baseUrl}/users/me/locale`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ locale: code }),
        }).catch(() => {});
      }
    } catch {
      // Best effort — localStorage/API may not be available
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('shrink-0', className)} aria-label="Change language">
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {LOCALES.map((locale) => (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              className={cn(
                'cursor-pointer',
                i18n.language === locale.code && 'bg-accent font-medium'
              )}
            >
              {locale.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 text-white hover:bg-muted dark:hover:bg-card shrink-0',
            className
          )}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">{currentLocale.label.split(' ')[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLanguageChange(locale.code)}
            className={cn(
              'cursor-pointer',
              i18n.language === locale.code && 'bg-accent font-medium'
            )}
          >
            {locale.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wordmark } from './brand';

export function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <Button variant="ghost" size="icon" aria-label="Ajustes e backup" onClick={onOpenSettings}>
          <Settings />
        </Button>
      </div>
    </header>
  );
}

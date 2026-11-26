import { MotionConfig } from 'framer-motion';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}

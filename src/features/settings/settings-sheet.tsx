import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackupPanel } from './backup-panel';
import { FinanceSettings } from './finance-settings';
import { VehicleSettings } from './vehicle-settings';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Ajustes</SheetTitle>
          <SheetDescription>Veículo, verba do Cofrinho e backup dos dados.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="financas" className="min-h-0 flex-1 gap-0">
          <div className="border-b px-5 py-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="financas">Finanças</TabsTrigger>
              <TabsTrigger value="veiculo">Veículo</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <TabsContent value="financas">
              <FinanceSettings />
            </TabsContent>
            <TabsContent value="veiculo">
              <VehicleSettings />
            </TabsContent>
            <TabsContent value="backup">
              <BackupPanel />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

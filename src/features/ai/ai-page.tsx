import type { AppTab } from '@/app/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeminiStatus } from './gemini-status';
import { PromptBuilder } from './prompt-builder';
import { ReportAnalyzer } from './report-analyzer';

export function AiPage({ onNavigate }: { onNavigate: (tab: AppTab) => void }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estúdio de IA"
        description="Prompts para visualizar os próximos upgrades e uma segunda opinião sobre laudos e orçamentos."
      />
      <GeminiStatus />
      <Tabs defaultValue="prompts">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="prompts">Prompt de render</TabsTrigger>
          <TabsTrigger value="laudo">Laudo e orçamento</TabsTrigger>
        </TabsList>
        <TabsContent value="prompts" className="pt-2">
          <PromptBuilder />
        </TabsContent>
        <TabsContent value="laudo" className="pt-2">
          <ReportAnalyzer onNavigate={onNavigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Module } from '@nestjs/common';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { AiAnalysisWorker } from './ai-analysis.worker';
import { BullModule } from '@nestjs/bullmq';
import { PlagiarismModule } from '../plagiarism/plagiarism.module';
import { ReferencesModule } from '../references/references.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
    PlagiarismModule,
    ReferencesModule,
  ],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService, AiAnalysisWorker],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}

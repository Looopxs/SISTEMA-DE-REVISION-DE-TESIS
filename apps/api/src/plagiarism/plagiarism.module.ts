import { Module } from '@nestjs/common';
import { PlagiarismController } from './plagiarism.controller';
import { PlagiarismService } from './plagiarism.service';
import { PlagiarismWorker } from './plagiarism.worker';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'plagiarism',
    }),
  ],
  controllers: [PlagiarismController],
  providers: [PlagiarismService, PlagiarismWorker],
  exports: [PlagiarismService],
})
export class PlagiarismModule {}

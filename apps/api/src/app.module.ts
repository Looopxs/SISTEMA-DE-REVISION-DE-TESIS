import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { AdvancesModule } from './advances/advances.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { ReviewModule } from './review/review.module';
import { FineTuningModule } from './fine-tuning/fine-tuning.module';
import { PlagiarismModule } from './plagiarism/plagiarism.module';
import { ReferencesModule } from './references/references.module';
import { OrcidModule } from './orcid/orcid.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { ThesisGeneratorModule } from './thesis-generator/thesis-generator.module';
import { ArticleReviewerModule } from './article-reviewer/article-reviewer.module';
import { EmailSenderModule } from './email-sender/email-sender.module';
import { ProgramsController } from './programs/programs.controller';
import { BullModule } from '@nestjs/bullmq';
import { AudioModule } from './audio/audio.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: null,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TemplatesModule,
    AdvancesModule,
    AiAnalysisModule,
    ReviewModule,
    FineTuningModule,
    PlagiarismModule,
    ReferencesModule,
    OrcidModule,
    ReportsModule,
    DashboardModule,
    NotificationsModule,
    StorageModule,
    ThesisGeneratorModule,
    ArticleReviewerModule,
    EmailSenderModule,
    AudioModule,
  ],
  controllers: [ProgramsController],
})
export class AppModule {}

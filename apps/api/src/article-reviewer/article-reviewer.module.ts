import { Module } from '@nestjs/common';
import { ArticleReviewerController } from './article-reviewer.controller';
import { ArticleReviewerService } from './article-reviewer.service';

@Module({
  controllers: [ArticleReviewerController],
  providers: [ArticleReviewerService],
})
export class ArticleReviewerModule {}

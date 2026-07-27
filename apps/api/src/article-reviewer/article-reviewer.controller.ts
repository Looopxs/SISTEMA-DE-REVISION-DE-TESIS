import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticleReviewerService } from './article-reviewer.service';
import { ReviewArticleDto } from './article-reviewer.dto';

@ApiTags('Revisor de Artículos Científicos')
@Controller('article-reviewer')
export class ArticleReviewerController {
  constructor(private readonly service: ArticleReviewerService) {}

  @Post('review')
  @ApiOperation({ summary: 'Analiza, evalúa y traduce un artículo científico (SSE streaming)' })
  async review(@Body() dto: ReviewArticleDto, @Res() res: Response) {
    await this.service.reviewStream(dto.article, res);
  }
}

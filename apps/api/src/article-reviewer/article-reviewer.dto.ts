import { IsString } from 'class-validator';

export class ReviewArticleDto {
  @IsString()
  article!: string;
}

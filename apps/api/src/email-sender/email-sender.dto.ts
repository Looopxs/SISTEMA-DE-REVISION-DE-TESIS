import { IsString, IsArray, IsEmail, IsOptional, IsEnum, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export enum SendType {
  INDIVIDUAL = 'individual',
  BATCH = 'batch',
}

export class RecipientDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class SendEmailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  @ArrayMinSize(1)
  recipients!: RecipientDto[];

  @IsString()
  subject!: string;

  @IsString()
  content!: string; // Markdown content to send

  @IsEnum(SendType)
  @IsOptional()
  type?: SendType = SendType.INDIVIDUAL;

  @IsString()
  @IsOptional()
  documentType?: string; // 'thesis' | 'article-review' | 'custom'

  @IsString()
  @IsOptional()
  senderName?: string;
}

export class ConfigureSmtpDto {
  @IsString()
  host!: string;

  @IsString()
  port!: string;

  @IsString()
  user!: string;

  @IsString()
  pass!: string;

  @IsString()
  @IsOptional()
  fromName?: string;
}

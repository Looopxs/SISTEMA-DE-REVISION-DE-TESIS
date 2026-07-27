import { IsString, IsOptional } from 'class-validator';

export class GenerateThesisDto {
  @IsString()
  topic!: string;

  @IsString()
  @IsOptional()
  variables?: string;

  @IsString()
  @IsOptional()
  context?: string;
}

export class ChatMessageDto {
  @IsString()
  message!: string;

  @IsOptional()
  history?: Array<{ role: 'user' | 'model'; parts: string }>;

  @IsOptional()
  university?: string | string[];

  @IsString()
  @IsOptional()
  documentType?: string; // 'tesis' | 'proyecto' | 'articulo'

  // Datos de portada del usuario (para inyectar en prompts)
  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  advisorName?: string;

  @IsString()
  @IsOptional()
  thesisTitle?: string;

  @IsString()
  @IsOptional()
  faculty?: string;

  @IsString()
  @IsOptional()
  school?: string;

  @IsString()
  @IsOptional()
  selectedUniversity?: string;
}

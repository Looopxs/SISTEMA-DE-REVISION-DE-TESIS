import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThesisGeneratorService } from './thesis-generator.service';
import { ChatMessageDto, GenerateThesisDto } from './thesis-generator.dto';

@ApiTags('Generador de Tesis IA')
@Controller('thesis-generator')
export class ThesisGeneratorController {
  constructor(private readonly service: ThesisGeneratorService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat con Gemini Pro para generar tesis (SSE streaming)' })
  async chat(@Body() dto: ChatMessageDto, @Res() res: Response) {
    await this.service.chatStream(
      dto.message,
      dto.history || [],
      res,
      dto.university,
      dto.documentType,
      {
        authorName: dto.authorName,
        advisorName: dto.advisorName,
        thesisTitle: dto.thesisTitle,
        faculty: dto.faculty,
        school: dto.school,
        selectedUniversity: dto.selectedUniversity,
      },
    );
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generar tesis completa (respuesta directa, para descarga)' })
  async generate(@Body() dto: GenerateThesisDto) {
    const content = await this.service.generateThesisFull(
      dto.topic,
      dto.variables,
      dto.context,
    );
    return { content, generatedAt: new Date().toISOString() };
  }
}

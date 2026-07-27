import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsArray, IsEmail, IsOptional } from 'class-validator';
import { EmailSenderService } from './email-sender.service';

class SendDto {
  @IsArray() @IsEmail({}, { each: true })
  to!: string[];
  @IsString() subject!: string;
  @IsString() content!: string;
}

class SetKeyDto {
  @IsString() apiKey!: string;
}

@ApiTags('Email Sender')
@Controller('email-sender')
export class EmailSenderController {
  constructor(private readonly service: EmailSenderService) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar email con Resend' })
  async send(@Body() dto: SendDto) {
    const results = await this.service.send(dto.to, dto.subject, dto.content);
    return { results };
  }

  @Post('set-key')
  @ApiOperation({ summary: 'Configurar API Key de Resend' })
  setKey(@Body() dto: SetKeyDto) {
    this.service.setApiKey(dto.apiKey);
    return { ok: true, message: 'API Key guardada ✅' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Estado de la configuración' })
  status() {
    return { configured: !!this.service.getApiKeyPreview(), key: this.service.getApiKeyPreview() };
  }
}

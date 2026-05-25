import {
  Controller, Get, Post, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AiAnalysisService } from './ai-analysis.service';

@ApiTags('ai-analysis')
@ApiBearerAuth()
@Controller('ai-analysis')
@UseGuards(JwtAuthGuard)
export class AiAnalysisController {
  constructor(private aiAnalysisService: AiAnalysisService) {}

  @Post('analyze/:advanceId')
  @Roles('ADVISOR', 'COORDINATOR', 'ADMIN')
  async analyze(@Param('advanceId') advanceId: string) {
    // Ejecutar análisis DIRECTO (sin cola) para resultado instantáneo
    await this.aiAnalysisService.analyzeAdvance(advanceId);
    return { message: 'Análisis de IA completado', advanceId };
  }

  @Get(':advanceId')
  getAnalysis(@Param('advanceId') advanceId: string) {
    return this.aiAnalysisService.getAnalysis(advanceId);
  }

  @Post('reanalyze/:advanceId')
  @Roles('COORDINATOR', 'ADMIN')
  async reanalyze(@Param('advanceId') advanceId: string) {
    await this.aiAnalysisService.reanalyze(advanceId);
    return { message: 'Re-análisis de IA completado', advanceId };
  }
}

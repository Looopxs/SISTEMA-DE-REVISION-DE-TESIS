import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('advance/:advanceId')
  async getAdvanceReport(@Param('advanceId') advanceId: string) {
    return this.reportsService.generateAdvanceReport(advanceId);
  }

  @Get('advance/:advanceId/html')
  async getAdvanceReportHTML(
    @Param('advanceId') advanceId: string,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generateAdvanceReport(advanceId);
    res.setHeader('Content-Type', 'text/html');
    res.send(report.html);
  }
}

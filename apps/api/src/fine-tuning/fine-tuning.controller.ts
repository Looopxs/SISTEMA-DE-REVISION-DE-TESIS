import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FineTuningService } from './fine-tuning.service';

@ApiTags('fine-tuning')
@ApiBearerAuth()
@Controller('fine-tuning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FineTuningController {
  constructor(private ftService: FineTuningService) {}

  @Get('stats')
  @Roles('COORDINATOR', 'ADMIN')
  getStats() {
    return this.ftService.getStats();
  }

  @Get('datasets')
  @Roles('ADMIN')
  getDatasets() {
    return this.ftService.getDatasets();
  }

  @Post('export')
  @Roles('ADMIN')
  exportDataset() {
    return this.ftService.exportDataset();
  }
}

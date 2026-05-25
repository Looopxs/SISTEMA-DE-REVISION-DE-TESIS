import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @Roles('COORDINATOR', 'ADMIN', 'ADVISOR', 'STUDENT')
  findAll(@Query('programId') programId?: string) {
    return this.templatesService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Post('upload')
  @Roles('COORDINATOR', 'ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { programId: string; name: string; version: string; citationStyle?: string },
  ) {
    return this.templatesService.upload(file, body);
  }

  @Put(':id/rubric')
  @Roles('COORDINATOR', 'ADMIN')
  updateRubric(@Param('id') id: string, @Body() body: { rubric: any }) {
    return this.templatesService.updateRubric(id, body.rubric);
  }

  @Delete(':id')
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.templatesService.deactivate(id);
  }
}

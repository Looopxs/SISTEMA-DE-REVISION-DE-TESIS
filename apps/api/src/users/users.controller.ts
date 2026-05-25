import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('COORDINATOR', 'ADMIN')
  findAll(@Query('role') role?: string, @Query('programId') programId?: string) {
    return this.usersService.findAll({ role, programId });
  }

  @Get('programs')
  getPrograms() {
    return this.usersService.getPrograms();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('COORDINATOR', 'ADMIN')
  create(@Body() body: {
    email: string; password: string; name: string;
    role: string; programId?: string; advisorId?: string;
  }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles('COORDINATOR', 'ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Post(':studentId/assign-advisor/:advisorId')
  @Roles('COORDINATOR', 'ADMIN')
  assignAdvisor(
    @Param('studentId') studentId: string,
    @Param('advisorId') advisorId: string,
  ) {
    return this.usersService.assignAdvisor(studentId, advisorId);
  }
}

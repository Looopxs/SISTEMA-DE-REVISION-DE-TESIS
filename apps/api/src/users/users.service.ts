import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { role?: string; programId?: string }) {
    return this.prisma.user.findMany({
      where: {
        ...(filters?.role && { role: filters.role as any }),
        ...(filters?.programId && { programId: filters.programId }),
      },
      select: {
        id: true, email: true, name: true, role: true,
        programId: true, isActive: true, avatarUrl: true,
        program: { select: { name: true } },
        advisor: { select: { id: true, name: true } },
        _count: { select: { advisees: true, advances: true } },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        program: true,
        advisor: { select: { id: true, name: true, email: true } },
        advisees: { select: { id: true, name: true, email: true } },
        orcidProfile: { select: { orcidId: true, displayName: true, keywords: true } },
      },
    });
  }

  async create(data: {
    email: string; password: string; name: string;
    role: string; programId?: string; advisorId?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role as any,
        programId: data.programId,
        advisorId: data.advisorId,
      },
    });
  }

  async update(id: string, data: {
    name?: string; role?: string; programId?: string;
    advisorId?: string; isActive?: boolean;
  }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role as any }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.advisorId !== undefined && { advisorId: data.advisorId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async assignAdvisor(studentId: string, advisorId: string) {
    return this.prisma.user.update({
      where: { id: studentId },
      data: { advisorId },
    });
  }

  async getPrograms() {
    return this.prisma.program.findMany({
      where: { isActive: true },
      include: { _count: { select: { users: true, templates: true } } },
    });
  }
}

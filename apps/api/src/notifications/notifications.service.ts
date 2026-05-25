import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    data?: any;
  }) {
    return this.prisma.notification.create({ data });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  // Notificar al estudiante que el análisis IA completó
  async notifyAnalysisComplete(advanceId: string) {
    const advance = await this.prisma.advance.findUniqueOrThrow({
      where: { id: advanceId },
      include: { aiAnalysis: { select: { overallScore: true, gradeConverted: true } } },
    });

    await this.createNotification({
      userId: advance.studentId,
      title: 'Análisis IA completado',
      body: `Tu avance "${advance.title}" obtuvo ${advance.aiAnalysis?.overallScore?.toFixed(0) || 0}% de cumplimiento.`,
      type: 'AI_COMPLETE',
      data: { advanceId },
    });
  }
}

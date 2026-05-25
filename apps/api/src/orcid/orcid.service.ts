import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OrcidService {
  private readonly logger = new Logger(OrcidService.name);

  constructor(private prisma: PrismaService) {}

  getAuthorizationUrl(userId: string): string {
    const state = `${userId}:${crypto.randomBytes(16).toString('hex')}`;
    const params = new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID || '',
      response_type: 'code',
      scope: '/authenticate /read-limited',
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/orcid/callback`,
      state,
    });
    return `https://orcid.org/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    const [userId] = state.split(':');

    const tokenRes = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID || '',
        client_secret: process.env.ORCID_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/orcid/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    await this.prisma.orcidProfile.upsert({
      where: { userId },
      create: {
        userId,
        orcidId: tokenData.orcid,
        accessToken: this.encrypt(tokenData.access_token),
        refreshToken: this.encrypt(tokenData.refresh_token || ''),
        tokenExpiry: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        displayName: tokenData.name,
      },
      update: {
        accessToken: this.encrypt(tokenData.access_token),
        refreshToken: this.encrypt(tokenData.refresh_token || ''),
        tokenExpiry: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
      },
    });

    return { success: true, orcidId: tokenData.orcid };
  }

  async getProfile(userId: string) {
    return this.prisma.orcidProfile.findUnique({
      where: { userId },
      include: { publications: { orderBy: { year: 'desc' }, take: 20 } },
    });
  }

  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    } catch {
      return text; // Fallback sin encriptación en desarrollo
    }
  }
}

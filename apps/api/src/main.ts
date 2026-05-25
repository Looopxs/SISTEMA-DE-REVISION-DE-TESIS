import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // CORS — permitir acceso desde localhost, red local y Tailscale
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir peticiones sin origin (curl, Postman, SSR)
      if (!origin) return callback(null, true);
      // Permitir localhost, IPs privadas (192.168.x.x, 10.x.x.x) y Tailscale (100.x.x.x)
      if (
        origin.includes('localhost') ||
        origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|100\.)/)
      ) {
        return callback(null, true);
      }
      // Permitir FRONTEND_URL si está configurado
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('KIMY API')
    .setDescription('Sistema de Revisión Inteligente de Tesis — API REST')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y gestión de sesiones')
    .addTag('users', 'Gestión de usuarios')
    .addTag('templates', 'Documentos patrón institucionales')
    .addTag('advances', 'Avances de tesis')
    .addTag('ai-analysis', 'Análisis de IA')
    .addTag('reviews', 'Revisiones humanas')
    .addTag('fine-tuning', 'Fine-tuning con feedback humano')
    .addTag('plagiarism', 'Detección de plagio')
    .addTag('references', 'Validación de citas con CrossRef')
    .addTag('orcid', 'Integración ORCID')
    .addTag('reports', 'Reportes y exportación PDF')
    .addTag('dashboard', 'Dashboard y KPIs')
    .addTag('notifications', 'Notificaciones')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 KIMY API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs\n`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});

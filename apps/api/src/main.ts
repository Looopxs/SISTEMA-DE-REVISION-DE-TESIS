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
      if (!origin) return callback(null, true);
      // Localhost y redes privadas
      if (
        origin.includes('localhost') ||
        /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|100\.)/.test(origin)
      ) return callback(null, true);
      // Produccion: Vercel, Render y FRONTEND_URL
      const allowed = [process.env.FRONTEND_URL].filter(Boolean);
      if (
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) return callback(null, true);
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

  // Health check para Render
  app.getHttpAdapter().get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`\nJORANA IA API corriendo en http://0.0.0.0:${port}`);
  console.log(`Swagger docs: http://0.0.0.0:${port}/api/docs\n`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});

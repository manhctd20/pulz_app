import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from './app.module';

const DEV_SECRET_MARKERS = ['dev-access-secret', 'dev-refresh-secret', 'change-me', 'replace-me'];

function assertProductionSecrets(config: ConfigService) {
  const nodeEnv = config.get<string>('NODE_ENV');
  if (nodeEnv !== 'production') return;
  const access = config.get<string>('JWT_ACCESS_SECRET') ?? '';
  const refresh = config.get<string>('JWT_REFRESH_SECRET') ?? '';
  const cors = config.get<string>('CORS_ORIGINS') ?? '';
  const bad: string[] = [];
  if (DEV_SECRET_MARKERS.some((m) => access.includes(m)) || access.length < 32) {
    bad.push('JWT_ACCESS_SECRET (must be unique + ≥32 chars)');
  }
  if (DEV_SECRET_MARKERS.some((m) => refresh.includes(m)) || refresh.length < 32) {
    bad.push('JWT_REFRESH_SECRET (must be unique + ≥32 chars)');
  }
  if (cors.trim() === '*' || cors.trim() === '') {
    bad.push('CORS_ORIGINS (must be explicit comma-separated list, not "*")');
  }
  if (bad.length > 0) {
    throw new Error(
      `Refusing to start in production with insecure config: ${bad.join(', ')}. ` +
        `Set strong env values and try again.`,
    );
  }
}

function buildCorsOrigin(raw: string | undefined) {
  if (!raw || raw.trim() === '') {
    return (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      const ok =
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^exp:\/\//.test(origin) ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
      cb(null, ok);
    };
  }
  if (raw.trim() === '*') return true;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function bootstrap() {
  // Cho phép SwaggerModule đọc schema từ zod DTO (createZodDto)
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  assertProductionSecrets(config);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe(), new ValidationPipe({ transform: true }));

  app.enableCors({
    origin: buildCorsOrigin(config.get<string>('CORS_ORIGINS')),
    credentials: true,
  });

  // === Swagger ===
  const enableDocs =
    config.get<string>('NODE_ENV') !== 'production' ||
    config.get<string>('ENABLE_SWAGGER') === 'true';

  if (enableDocs) {
    const docsConfig = new DocumentBuilder()
      .setTitle('PulzApp API')
      .setDescription(
        'Group habit challenge — Auth, Habits, Groups, Leaderboard.\n\n' +
          'Đăng nhập qua `POST /auth/login` để lấy `accessToken`, paste vào nút "Authorize" (Bearer).',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addTag('auth', 'Đăng ký / đăng nhập / refresh / me')
      .addTag('habits', 'CRUD thói quen + check-in + history')
      .addTag('groups', 'Nhóm: tạo / join / detail / kick / leave / rename / delete')
      .addTag('leaderboard', 'Bảng xếp hạng theo group + period')
      .build();

    const document = SwaggerModule.createDocument(app, docsConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'PulzApp API Docs',
    });
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 API listening on http://0.0.0.0:${port}/api/v1`, 'Bootstrap');
  if (enableDocs) {
    Logger.log(`📘 Swagger docs at http://0.0.0.0:${port}/docs`, 'Bootstrap');
  }
}

void bootstrap();

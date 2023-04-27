import { Logger } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestFactory } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestExpressApplication } from '@nestjs/platform-express';
import fs from 'fs';
import helmet from 'helmet';
import { AppModule, AppStartedEvent } from './app/app.module';
import { ConfigService } from './app/config/config.service';
import { rawBodyMiddleware } from './app/helpers/rawBody.middleware';
import { AppLogger } from './app/logging/logging.service';
import { addGlobalProviders } from './main.global';

const gethttpsOptionsFromEnv = (): HttpsOptions | undefined => {
  const privateKeyPath = process.env.TLS_PRIVATE_KEY;
  const certificatePath = process.env.TLS_CERTIFICATE;
  if (!privateKeyPath || !certificatePath) {
    return undefined;
  }
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const certificate = fs.readFileSync(certificatePath, 'utf8');
  return { key: privateKey, cert: certificate };
};

async function bootstrap() {
  /* ============= INITIATE APP ===================== */
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    httpsOptions: gethttpsOptionsFromEnv(),
  });
  const conf = app.get(ConfigService);
  app.use(rawBodyMiddleware());
  app.useLogger(await app.resolve(AppLogger));

  /* ============= SECURITY MIDDLEWARE  ============= */
  app.use(
    helmet({
      contentSecurityPolicy: conf.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: conf.isProduction ? undefined : false,
    }),
  );

  /* ============= GLOBAL PROVIDERS ================= */
  await addGlobalProviders(app);

  /* ============= STARTING ========================= */
  const port = conf.port;
  await app.listen(port, () => {
    const eventEmitter = app.get(EventEmitter2);
    const baseUrl = new URL('http://foo');
    baseUrl.protocol = conf.protocol;
    baseUrl.host = conf.host;
    baseUrl.port = String(port);
    Logger.log(`Listening at ${baseUrl.href}`);
    eventEmitter.emit(AppStartedEvent.symbol, { baseUrl });
  });
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsgateModule } from '@wsgate/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await WsgateModule.setup('/wsgate', app, { title: 'Simple Chat' });

  await app.listen(3000);
  console.log('WsGate UI → http://localhost:3000/wsgate');
}
bootstrap();

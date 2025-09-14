import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173'], // Replace with your frontend URLs
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow sending of cookies and authorization headers
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

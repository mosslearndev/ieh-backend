// backend/src/main.ts 

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    // เปลี่ยนจาก hard-code เป็นการอ่านค่าจาก .env
    origin: process.env.FRONTEND_URL, 
    credentials: true,
  });

  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
  app.useStaticAssets(join(__dirname, '..', 'uploads/slips'), { prefix: '/uploads/slips' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT || 4000);  // ⬅️ เผื่อ Render กำหนด PORT
}
bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import cookieParser from 'cookie-parser';
// import { join } from 'path'; // 1. Import 'join' จาก path
// import { NestExpressApplication } from '@nestjs/platform-express'; // 2. Import NestExpressApplication

// async function bootstrap() {
//   // 3. เปลี่ยน type ของ app เป็น NestExpressApplication
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);

//   app.enableCors({
//     origin: 'http://localhost:3000',
//     credentials: true,
//   });

//   app.use(cookieParser());

//   // 4. บอกให้แอปฯ ใช้โฟลเดอร์ 'uploads' เป็นที่เก็บไฟล์สาธารณะ
//   app.useStaticAssets(join(__dirname, '..', 'uploads'), {
//     prefix: '/uploads/', // กำหนดให้เข้าถึงผ่าน URL http://localhost:4000/uploads/filename.jpg
//   });

//   app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
//   await app.listen(4000);
// }
// bootstrap();
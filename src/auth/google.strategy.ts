// // backend/src/auth/google.strategy.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    
    // 1. อ่านค่า BACKEND_URL จาก .env
    const backendUrl = configService.get<string>('BACKEND_URL');

    if (!clientID || !clientSecret || !backendUrl) {
      throw new InternalServerErrorException('Google OAuth is not configured properly');
    }

    super({
      clientID: clientID,
      clientSecret: clientSecret,
      // 2. สร้าง callbackURL แบบไดนามิก
      callbackURL: `${backendUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile;
    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
    };
    done(null, user);
  }
}

// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, VerifyCallback } from 'passport-google-oauth20';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(private configService: ConfigService) {
//     // 1. ดึงค่า environment variables ออกมาเก็บในตัวแปร
//     const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
//     const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

//     // 2. ตรวจสอบให้แน่ใจว่ามีค่าอยู่จริง
//     if (!clientID || !clientSecret) {
//       throw new InternalServerErrorException('Google OAuth client ID or secret not configured');
//     }

//   //   super({
//   //     // 3. ใช้ค่าที่ตรวจสอบแล้ว ซึ่งตอนนี้ TypeScript มั่นใจว่าเป็น string
//   //     clientID: clientID,
//   //     clientSecret: clientSecret,
//   //     callbackURL: 'http://localhost:4000/auth/google/callback',
//   //     scope: ['email', 'profile'],
//   //   });
//   // }
  
//   super({
//       clientID: clientID,
//       clientSecret: clientSecret,
//       // สร้าง Backend URL แบบไดนามิก
//       callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`,
//       scope: ['email', 'profile'],
//     });
//   }

//   async validate(
//     accessToken: string,
//     refreshToken: string,
//     profile: any,
//     done: VerifyCallback,
//   ): Promise<any> {
//     const { name, emails } = profile;
//     const user = {
//       email: emails[0].value,
//       name: `${name.givenName} ${name.familyName}`,
//     };
//     done(null, user);
//   }
// }


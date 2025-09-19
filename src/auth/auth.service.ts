// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private mailerSend: MailerSend;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // --- แก้ไข: ตรวจสอบว่ามี API TOKEN หรือไม่ ---
    const apiKey = process.env.MAILERSEND_API_TOKEN;
    if (!apiKey) {
      throw new InternalServerErrorException('MailerSend API token is not configured.');
    }
    this.mailerSend = new MailerSend({ apiKey });
  }

  // login google
  async validateGoogleUser(profile: { email: string; name: string }) {
    // 1. ค้นหาผู้ใช้ด้วยอีเมลที่ได้จาก Google
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    // 2. ถ้าไม่พบผู้ใช้ในระบบ ให้สร้างใหม่
    if (!user) {
      // สร้างรหัสผ่านแบบสุ่ม เพราะผู้ใช้ที่มาจาก Google ไม่จำเป็นต้องใช้รหัสผ่านของเรา
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          password: hashedPassword, // Field นี้จำเป็นต้องมี แต่จะไม่ได้ใช้จริง
          provider: 'google',       // ระบุว่าผู้ใช้นี้มาจาก Google
          isVerified: true,         // ถือว่ายืนยันแล้ว
        },
      });
    }

    // 3. สร้าง JWT Token สำหรับผู้ใช้ (ไม่ว่าจะเก่าหรือใหม่)
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Google Login successful',
      access_token: this.jwtService.sign(payload),
      role: user.role, 
    };
  }

  // --- 1. สมัครสมาชิก (ไม่มี OTP) ---
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // isVerified ถูกตั้งเป็น true โดย default ใน schema
      },
    });

    // สมัครเสร็จแล้ว Login ให้เลย
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Registration successful',
      access_token: this.jwtService.sign(payload),
    };
  }

  // --- 2. เข้าสู่ระบบ ---
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }

  // --- 3. ขอ Reset รหัสผ่าน (ส่ง OTP) ---
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // ไม่ต้องแจ้งว่าไม่เจอ user เพื่อความปลอดภัย
      return { message: 'If a matching account was found, an email has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt },
    });

    // ส่งอีเมลด้วย MailerSend
    const senderEmail = process.env.SENDER_EMAIL;
    if (!senderEmail) {
        console.error('MailerSend sender email is not configured.');
        // ไม่ต้องแจ้ง error ให้ user แต่ log ไว้ที่ server
        return { message: 'If a matching account was found, an email has been sent.' };
    }

     const sentFrom = new Sender(senderEmail, 'IEH Support');
    const recipients = [new Recipient(email, user.name)];
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Your Password Reset Code for IEH Website')
      .setHtml(this.getOtpEmailTemplate(otp));

    try {
      await this.mailerSend.email.send(emailParams);
    } catch (error) {
      console.error('MailerSend Error:', error);
      // ไม่ต้อง throw error ออกไป ให้ user เห็นว่าสำเร็จเหมือนเดิม
    }

    return { message: 'If a matching account was found, an email has been sent.' };
  }
  
  // --- 4. Reset รหัสผ่านด้วย OTP ---
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new UnauthorizedException('Invalid request.');
    }

    if (user.otp !== otp || new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Password has been reset successfully.' };
  }

  // Template อีเมล OTP
  private getOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Your One-Time Password (OTP) for resetting your password is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">
          ${otp}
        </p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
  }
}
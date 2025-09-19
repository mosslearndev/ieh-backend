// backend/src/auth/auth.controller.ts

import { Controller, Post, Body, Res, Get, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express'; 
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto, 
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.authService.register(registerDto);
    response.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });
    return { message: data.message };
  }

  @Post('login')
  async login(
    @Body(ValidationPipe) loginDto: LoginDto, // <-- เพิ่ม ValidationPipe
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.authService.login(loginDto);
    response.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });
    // 2. ส่ง message และ role กลับไป
    return { 
      message: data.message,
      role: data.role // <-- เพิ่มบรรทัดนี้
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', { path: '/' });
    return { message: 'Logout successful' };
  }

  @Post('forgot-password')
  forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) { // <-- เพิ่ม ValidationPipe
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) { // <-- เพิ่ม ValidationPipe
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  // ประตูที่ 1: สำหรับให้ Frontend ส่ง User ไปหา Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // ไม่ต้องเขียนโค้ดอะไรที่นี่ AuthGuard จะจัดการ redirect ให้เอง
  }

  // ประตูที่ 2: สำหรับให้ Google ส่ง User กลับมาหาเรา
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res: Response) {
    // req.user คือข้อมูลที่ผ่านการ validate จาก GoogleStrategy แล้ว
    const data = await this.authService.validateGoogleUser(req.user);

    // สร้าง Cookie ให้กับผู้ใช้
    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });

    // ส่งผู้ใช้กลับไปที่หน้าแรกของ Frontend
    if (data.role === 'ADMIN') {
      return res.redirect('http://localhost:3000/admin-dashboard');
    } else {
      return res.redirect('http://localhost:3000');
    }
    // return res.redirect('http://localhost:3000');
  }
}
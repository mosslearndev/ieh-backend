// backend/src/auth/dto/reset-password.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsNotEmpty({ message: 'OTP cannot be empty' })
  otp: string;

  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
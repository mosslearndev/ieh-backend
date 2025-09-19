// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
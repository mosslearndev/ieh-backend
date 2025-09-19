import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() subject: string;
  @IsString() @IsNotEmpty() message: string;
}
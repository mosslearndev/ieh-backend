import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
export class CreateAddressDto {
  @IsString() @IsNotEmpty() recipientName: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() addressLine1: string;
  @IsString() @IsNotEmpty() district: string;
  @IsString() @IsNotEmpty() province: string;
  @IsString() @IsNotEmpty() postalCode: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}
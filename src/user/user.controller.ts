import { Controller, Get, Patch, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req) {
      return req.user; // req.user มาจาก JwtStrategy
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body(ValidationPipe) updateUserDto: UpdateUserDto) {
      return this.userService.updateProfile(req.user.id, updateUserDto);
  }

  @Patch('password')
  changePassword(@Req() req, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
      return this.userService.changePassword(req.user.id, changePasswordDto);
  }
}
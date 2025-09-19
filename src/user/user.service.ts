//backend\src\user\user.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    // เพิ่ม constructor เพื่อ inject PrismaService
    constructor(private prisma: PrismaService) {}

    async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { name: updateUserDto.name },
            // select: { id: true, name: true, email: true, role: true, provider: true },
        });
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // ตรวจสอบว่าผู้ใช้ที่ล็อกอินด้วย Google พยายามเปลี่ยนรหัสผ่านหรือไม่
        if (user.provider === 'google') {
            throw new UnauthorizedException('Cannot change password for Google accounts.');
        }

        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid current password');
        }

        const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        return { message: 'Password changed successfully' };
    }
}
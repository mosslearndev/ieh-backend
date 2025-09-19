//backend/src/orders/orders.controller.ts
import { Controller, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile, InternalServerErrorException, ValidationPipe, Get, Patch, Param, } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AdminGuard } from 'src/auth/admin.guard';

@Controller('orders')
@UseGuards(AuthGuard('jwt')) // ทุกอย่างในนี้ต้องล็อกอินก่อน
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('upload-slip')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/slips', // แยกโฟลเดอร์เก็บสลิป
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `slip-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new InternalServerErrorException('Slip upload failed');
    }
    
    // 1. อ่าน Base URL ของ Backend จาก .env
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const relativeUrl = `/uploads/slips/${file.filename}`;

    // 2. ส่งกลับทั้ง URL แบบเต็มและแบบย่อ
    return {
      url: relativeUrl,
      fullUrl: `${baseUrl}${relativeUrl}`,
    };
  }

  @Post()
  create(@Req() req, @Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    const userId = req.user.id;
    return this.ordersService.create(userId, createOrderDto);
  }

  // User: Get their own orders
  @Get('my-orders')
  findMyOrders(@Req() req) {
    const userId = req.user.id;
    return this.ordersService.findAllForUser(userId);
  }
  
  // User: Get a single order of their own
  @Get('my-orders/:id')
  findMyOrderById(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.ordersService.findOneForUser(userId, id);
  }

  // Admin: Get all orders
  @Get('all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.ordersService.findAllForAdmin();
  }

  // Admin: Get a single order by ID
  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneForAdmin(id);
  }

  // Admin: Update order status
  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body(ValidationPipe) updateDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
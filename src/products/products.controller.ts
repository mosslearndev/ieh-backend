// backend/src/products/products.controller.ts

import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe,Query,
  UseInterceptors, UploadedFile, InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- Upload รูปภาพ ---
  @Post('upload')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // โฟลเดอร์ที่จะเก็บไฟล์
      filename: (req, file, callback) => {
        // --- แก้ไขส่วนนี้ ---
        // 1. แปลงชื่อไฟล์กลับเป็น UTF-8 เพื่อรองรับภาษาไทย
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(originalname);
        // 2. ใช้ชื่อไฟล์ที่แปลงแล้ว
        const filename = `${originalname.split('.')[0]}-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new InternalServerErrorException('File upload failed');
    }
    
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const relativeUrl = `/uploads/${file.filename}`;

    // ส่งกลับทั้ง URL แบบย่อและแบบเต็ม
    return {
      url: relativeUrl,
      fullUrl: `${baseUrl}${relativeUrl}`,
    };
  }

  // --- Admin Routes ---
  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  create(@Body(ValidationPipe) createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  update(@Param('id') id: string, @Body(ValidationPipe) updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // --- Public Routes ---
  @Get()
  findAll(
    @Query('search') search: string,
    @Query('category') category: string,
    @Query('brand') brand: string,
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string,
    @Query('sortBy') sortBy: string,
    @Query('order') order: string,
  ) {
    return this.productsService.findAll(search, category, brand, minPrice, maxPrice, sortBy, order);
  }

  
  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
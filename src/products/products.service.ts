// backend/src/products/products.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // สำหรับ Admin
  create(createProductDto: CreateProductDto) {
    const { categoryId, brandId, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        category: {
          connect: { id: categoryId },
        },
        brand: {
          connect: { id: brandId },
        },
      },
    });
  }

  // สำหรับทุกคน
  // --- ยกเครื่องฟังก์ชัน findAll ใหม่ทั้งหมด ---
  async findAll(
    query: string,
    category: string,
    brand: string,
    minPrice: string,
    maxPrice: string,
    sortBy: string,
    order: string,
  ) {
    const where: Prisma.ProductWhereInput = {};

    // 1. Search filter
    if (query) {
      where.OR = [
        { name_th: { contains: query, mode: 'insensitive' } },
        { name_en: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // 2. Category and Brand filters
    if (category) where.categoryId = category;
    if (brand) where.brandId = brand;

    // 3. Price range filter
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) || !isNaN(max)) {
      where.price = {};
      if (!isNaN(min)) where.price.gte = min;
      if (!isNaN(max)) where.price.lte = max;
    }

    // 4. Sorting logic
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = order === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'name') {
        // This is a simplification. Real multilingual sort is more complex.
        orderBy.name_en = order === 'desc' ? 'desc' : 'asc';
    } else { // Default sort by newest
      orderBy.createdAt = 'desc';
    }

    return this.prisma.product.findMany({
      where,
      orderBy,
      include: { category: true, brand: true },
    });
  }

  // สำหรับทุกคน
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  // สำหรับ Admin
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Step 1: ดึงข้อมูลสินค้าเดิมจาก DB ก่อน
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Step 2: เปรียบเทียบ URL รูปภาพชุดเก่าและใหม่ เพื่อหาไฟล์ที่ต้องลบ
    if (updateProductDto.imageUrls) {
      const oldImageUrls = existingProduct.imageUrls;
      const newImageUrls = updateProductDto.imageUrls;
      const urlsToDelete = oldImageUrls.filter(url => !newImageUrls.includes(url));

      // Step 3: ถ้ามีไฟล์ที่ต้องลบ ให้ทำการลบออกจากโฟลเดอร์ 'uploads'
      if (urlsToDelete.length > 0) {
        await Promise.all(
          urlsToDelete.map(async (url) => {
            try {
              // ดึงชื่อไฟล์จาก URL (เช่น 'http://.../uploads/image.png' -> 'image.png')
              const filename = url.split('/').pop();
              if (filename) {
                const filePath = join(process.cwd(), 'uploads', filename);
                await fs.unlink(filePath); // สั่งลบไฟล์
              }
            } catch (error) {
              // ถ้าลบไฟล์ไม่สำเร็จ (เช่น ไฟล์ไม่มีอยู่แล้ว) ให้แสดง log แต่ไม่ต้องหยุดการทำงาน
              console.error(`Failed to delete file for URL: ${url}`, error);
            }
          })
        );
      }
    }

    // Step 4: อัปเดตข้อมูลสินค้าในฐานข้อมูล
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    // เพิ่ม Logic การลบไฟล์รูปภาพที่เกี่ยวข้องกับสินค้าก่อนลบข้อมูลออกจาก DB
    const productToDelete = await this.prisma.product.findUnique({
      where: { id },
    });
    
    if (productToDelete && productToDelete.imageUrls.length > 0) {
       await Promise.all(
          productToDelete.imageUrls.map(async (url) => {
            try {
              const filename = url.split('/').pop();
              if (filename) {
                const filePath = join(process.cwd(), 'uploads', filename);
                await fs.unlink(filePath);
              }
            } catch (error) {
              console.error(`Failed to delete file for URL: ${url}`, error);
            }
          })
        );
    }
    
    return this.prisma.product.delete({ where: { id } });
  }

  // --- หน้าแรก ---
  async findFeatured() {
    // เปลี่ยน Logic ทั้งหมดเป็นการดึงสินค้า 4 รายการล่าสุดมาแสดงเสมอ
    // ซึ่งเป็นวิธีที่เสถียรและตรงไปตรงมาที่สุดสำหรับหน้าแรก
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
      include: {
        brand: true,
        category: true,
      },
    });
  }
}
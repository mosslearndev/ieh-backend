//backend/src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'; 
import { Prisma } from '@prisma/client'; // 1. Import 'Prisma' type helper

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { cartItems, ...shippingDetails } = createOrderDto;

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    return this.prisma.$transaction(async (tx) => {
      const productIds = cartItems.map(item => item.id);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('Some products in the cart were not found.');
      }

      let totalAmount = 0;
      // 2. กำหนด Type ให้กับ Array อย่างชัดเจน
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = []; 

      for (const cartItem of cartItems) {
        const product = products.find(p => p.id === cartItem.id);

        // 3. เพิ่ม if check เพื่อจัดการกรณีที่อาจเป็น undefined
        if (!product) {
          throw new BadRequestException(`Product with ID ${cartItem.id} was not found in the database.`);
        }
        
        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(`Not enough stock for product: ${product.name_th}`);
        }

        const finalPrice = product.price * (1 - product.discount / 100);
        totalAmount += finalPrice * cartItem.quantity;
        
        orderItemsData.push({
          productId: product.id,
          name: `${product.name_th} / ${product.name_en}`,
          price: finalPrice,
          quantity: cartItem.quantity,
        });
        
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: cartItem.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          ...shippingDetails,
          totalAmount,
          userId,
          items: {
            createMany: { // ใช้ createMany เพื่อประสิทธิภาพที่ดีกว่า
              data: orderItemsData,
            },
          },
        },
      });

      return order;
    });
  }

  // สำหรับ User: ดึงเฉพาะ Order ของตัวเอง
  async findAllForUser(userId: string) {
    // 1. ดึงข้อมูล Order และ Items พื้นฐานมาก่อน
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    // 2. ใช้ Promise.all เพื่อดึงข้อมูลรูปภาพของสินค้าในทุก Order พร้อมกัน
    const ordersWithProductData = await Promise.all(
      orders.map(async (order) => {
        const itemsWithImages = await Promise.all(
          order.items.map(async (item) => {
            // 3. สำหรับสินค้าแต่ละชิ้น ให้ไปค้นหาข้อมูล Product จาก productId
            const product = await this.prisma.product.findUnique({
              where: { id: item.productId },
              select: { imageUrls: true, brand: true }, // ดึงแค่ imageUrls และ brand
            });
            // 4. แนบข้อมูลที่ได้กลับเข้าไปใน item object
            return { ...item, product }; 
          })
        );
        return { ...order, items: itemsWithImages };
      })
    );

    return ordersWithProductData;
  }

  // สำหรับ User: ดึง Order เดียวของตัวเอง
  async findOneForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: userId },
      include: {
        items: true, // ดึง items พื้นฐานมาก่อน
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or you do not have permission to view it.');
    }

    // ดึงข้อมูล Product ที่เกี่ยวข้องกับ items ใน Order นี้
    const productIds = order.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, imageUrls: true }, // ดึงแค่ ID กับ รูปภาพ
    });

    // แนบ imageUrls เข้าไปในแต่ละ item
    const itemsWithImages = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        imageUrls: product ? product.imageUrls : [], // ถ้าเจอ product ให้ใช้รูป, ถ้าไม่เจอ (สินค้าถูกลบ) ให้เป็น array ว่าง
      };
    });

    return { ...order, items: itemsWithImages };
  }

  // สำหรับ Admin: ดึงทุก Order
  findAllForAdmin() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }, // ดึงแค่ชื่อ user มาแสดง
        items: true,
      },
    });
  }

  // สำหรับ Admin: ดึง Order เดียว
  findOneForAdmin(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });
  }

  // สำหรับ Admin: อัปเดตสถานะ Order
  updateStatus(orderId: string, updateDto: UpdateOrderStatusDto) {
    if (updateDto.status === 'SHIPPED' && (!updateDto.shippingProvider || !updateDto.trackingNumber)) {
      throw new BadRequestException('Shipping provider and tracking number are required for SHIPPED status.');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateDto.status,
        shippingProvider: updateDto.shippingProvider,
        trackingNumber: updateDto.trackingNumber,
      },
    });
  }
}


// // backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(startDate?: string, endDate?: string) {
    // 1. สร้างเงื่อนไขสำหรับวันที่
    const dateFilter: Prisma.OrderWhereInput = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day

      dateFilter.createdAt = {
        gte: start, // Greater than or equal to
        lte: end,   // Less than or equal to
      };
    }

    // 2. ใช้ dateFilter ในการ query ข้อมูล
    const totalRevenue = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { ...dateFilter, status: { not: 'CANCELLED' } },
    });

    const totalOrders = await this.prisma.order.count({ where: dateFilter });
    
    // 3. ข้อมูลที่ไม่เกี่ยวกับเวลา ไม่ต้องใช้ filter
    const totalCustomers = await this.prisma.user.count({ where: { role: 'USER' } });
    const totalProducts = await this.prisma.product.count();

    // 4. สินค้าขายดี ให้กรองจาก OrderItem ที่อยู่ใน Order ตามช่วงเวลา
    const bestSellingProducts = await this.prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        _sum: { quantity: true },
        where: { order: dateFilter }, // กรองที่นี่
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
    });
    
    const lowStockProducts = await this.prisma.product.findMany({
        where: { stock: { lte: 10 } },
        orderBy: { stock: 'asc' },
        take: 5,
        include: { brand: true }
    });
    
    // 5. กราฟยอดขายจะยังแสดงผล 12 เดือนย้อนหลังตามเดิม (ไม่ผูกกับ filter)
    const salesByMonth = await this.prisma.$queryRaw<any[]>`
        SELECT 
            to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
            SUM("totalAmount") as revenue
        FROM "Order"
        WHERE "createdAt" >= date_trunc('month', NOW() - interval '11 month') AND status != 'CANCELLED'
        GROUP BY month
        ORDER BY month ASC;
    `;

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      bestSellingProducts: bestSellingProducts.map(p => ({name: p.name, sold: p._sum.quantity || 0})),
      lowStockProducts: lowStockProducts.map(p => ({
          name_th: p.name_th,
          name_en: p.name_en,
          stock: p.stock, 
          brand: p.brand.name
      })),
      salesByMonth: salesByMonth.map(s => ({...s, revenue: Number(s.revenue)})),
    };
  }
}
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { Prisma } from '@prisma/client';

// @Injectable()
// export class DashboardService {
//   constructor(private prisma: PrismaService) {}

//   async getStats(startDate?: string, endDate?: string) {
//     const dateFilter: Prisma.OrderWhereInput = {};
//     if (startDate && endDate) {
//       dateFilter.createdAt = {
//         gte: new Date(startDate),
//         lte: new Date(endDate),
//       };
//     }

//     const totalRevenue = await this.prisma.order.aggregate({
//       _sum: { totalAmount: true },
//       where: { ...dateFilter, status: { not: 'CANCELLED' } },
//     });

//     const totalOrders = await this.prisma.order.count({ where: dateFilter });
    
//     const totalCustomers = await this.prisma.user.count({ where: { role: 'USER' } });
//     const totalProducts = await this.prisma.product.count();

//     const bestSellingProducts = await this.prisma.orderItem.groupBy({
//         by: ['productId', 'name'],
//         _sum: { quantity: true },
//         where: { order: dateFilter },
//         orderBy: { _sum: { quantity: 'desc' } },
//         take: 5,
//     });
    
//     const lowStockProducts = await this.prisma.product.findMany({
//         where: { stock: { lte: 10 } },
//         orderBy: { stock: 'asc' },
//         take: 5,
//         include: { brand: true }
//     });
    
//     const salesByMonth = await this.prisma.$queryRaw<any[]>`
//         SELECT 
//             to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
//             SUM("totalAmount") as revenue
//         FROM "Order"
//         WHERE "createdAt" >= date_trunc('month', NOW() - interval '11 month') AND status != 'CANCELLED'
//         GROUP BY month
//         ORDER BY month ASC;
//     `;

//     return {
//       totalRevenue: totalRevenue._sum.totalAmount || 0,
//       totalOrders,
//       totalCustomers,
//       totalProducts,
//       bestSellingProducts: bestSellingProducts.map(p => ({name: p.name, sold: p._sum.quantity})),
//       // --- แก้ไขที่บรรทัดนี้ ---
//       // ส่งชื่อไปทั้ง 2 ภาษา ให้ Frontend เป็นคนเลือกแสดงผล
//       lowStockProducts: lowStockProducts.map(p => ({
//         name_th: p.name_th, 
//         name_en: p.name_en, 
//         stock: p.stock, 
//         brand: p.brand.name
//       })),
//       salesByMonth: salesByMonth.map(s => ({...s, revenue: Number(s.revenue)})),
//     };
//   }
// }

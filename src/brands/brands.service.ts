import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  create(createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({ data: createBrandDto });
  }

  findAll() {
    return this.prisma.brand.findMany();
  }

  remove(id: string) {
    return this.prisma.brand.delete({ where: { id } });
  }
}

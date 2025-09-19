import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
      if (createAddressDto.isDefault) {
          await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return this.prisma.address.create({ data: { ...createAddressDto, userId } });
  }

  findAll(userId: string) {
      return this.prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
  }

  async update(userId: string, addressId: string, updateAddressDto: UpdateAddressDto) {
      if (updateAddressDto.isDefault) {
          await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return this.prisma.address.update({ where: { id: addressId, userId }, data: updateAddressDto });
  }

  remove(userId: string, addressId: string) {
      return this.prisma.address.delete({ where: { id: addressId, userId } });
  }
}
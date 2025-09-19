import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('address')
@UseGuards(AuthGuard('jwt'))
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Req() req, @Body(ValidationPipe) createAddressDto: CreateAddressDto) {
    return this.addressService.create(req.user.id, createAddressDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.addressService.findAll(req.user.id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body(ValidationPipe) updateAddressDto: UpdateAddressDto) {
    return this.addressService.update(req.user.id, id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.addressService.remove(req.user.id, id);
  }
}
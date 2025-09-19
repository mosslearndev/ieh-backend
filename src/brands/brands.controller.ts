import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // Public route for everyone
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  // Admin routes
  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  create(@Body(ValidationPipe) createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}

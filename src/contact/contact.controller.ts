//backend/src/contact/contact.controller.ts
import { Controller, Post, Body, ValidationPipe, Get, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  create(@Body(ValidationPipe) createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  // GET /contact (Admin only)
  @Get()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  findAll() {
    return this.contactService.findAll();
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
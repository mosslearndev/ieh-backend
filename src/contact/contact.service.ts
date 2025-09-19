//backend\src\contact\contact.service.ts
import { Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

@Injectable()
export class ContactService {
  private mailerSend: MailerSend;

  constructor(private prisma: PrismaService) {
    // 1. ตรวจสอบว่ามี API Key หรือไม่ก่อนใช้งาน
    const apiKey = process.env.MAILERSEND_API_TOKEN;
    if (!apiKey) {
      console.error('MAILERSEND_API_TOKEN is not set in .env file');
      throw new InternalServerErrorException('Email service is not configured.');
    }
    this.mailerSend = new MailerSend({ apiKey });
  }

  async create(createContactDto: CreateContactDto) {
    // 2. บันทึกลงฐานข้อมูล (โค้ดส่วนนี้จะทำงานได้หลัง prisma generate)
    const message = await this.prisma.contactMessage.create({
      data: createContactDto,
    });

    const senderEmail = process.env.SENDER_EMAIL;
    const recipientEmail = process.env.CONTACT_FORM_RECIPIENT;

    if (senderEmail && recipientEmail) {
      const sentFrom = new Sender(senderEmail, 'IEH Website Contact Form');
      const recipients = [new Recipient(recipientEmail, 'Admin')];
      
      // 3. แก้ไขการเรียกใช้ setReplyTo ให้ถูกต้อง
      const replyTo = new Recipient(createContactDto.email, createContactDto.name);

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(replyTo) // <-- ใช้ object Recipient ที่สร้างขึ้น
        .setSubject(`New Contact Message: ${createContactDto.subject}`)
        .setHtml(`
            <h3>You have a new message from your website contact form:</h3>
            <ul>
                <li><strong>Name:</strong> ${createContactDto.name}</li>
                <li><strong>Email:</strong> ${createContactDto.email}</li>
                <li><strong>Subject:</strong> ${createContactDto.subject}</li>
            </ul>
            <p><strong>Message:</strong></p>
            <p>${createContactDto.message.replace(/\n/g, '<br>')}</p>
        `);
      
      try {
        await this.mailerSend.email.send(emailParams);
      } catch (error) {
          console.error("MailerSend failed to send email:", error);
          // อาจจะ throw error หรือไม่ก็ได้ ขึ้นอยู่กับว่าอยากให้ user รู้หรือไม่
      }
    }
    
    return message;
  }

  // Add this function
  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // --- ฟังก์ชัน Mark as Read ---
  async markAsRead(id: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    // ตรวจสอบก่อนว่ามีข้อความนี้อยู่จริงหรือไม่ (optional but good practice)
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return this.prisma.contactMessage.delete({
      where: { id },
    });
  }
}
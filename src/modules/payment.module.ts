import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';
import { HashAlgorithm } from 'vnpay';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { VNPayService } from '../services/vnpay.service';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { Appointment } from '../entities/appointment.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { InvoiceService } from 'src/services/invoice.service';
import { InvoiceController } from 'src/controllers/invoice.controller';

/**
 * PaymentModule
 *
 * Handles invoice generation from completed appointments.
 * Records payment transactions (cash, bank transfer, and online via payment gateways).
 * Integrates with payment gateways via IPaymentGatewayService interface (VNPay, Momo, ZaloPay).
 * Manages payment callbacks and transaction records.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Payment,
      PaymentGatewayArchive,
      Appointment,
      PetOwner,
    ]),
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const tmnCode = configService.get<string>('VNPAY_TMN_CODE');
        const secureSecret = configService.get<string>('VNPAY_HASH_SECRET');

        // Warn but don't fail if VNPay is not configured
        if (!tmnCode || !secureSecret) {
          console.warn('[VNPay] TMN_CODE or HASH_SECRET not configured. VNPay payments will be disabled.');
        }

        return {
          tmnCode: tmnCode || 'PLACEHOLDER',
          secureSecret: secureSecret || 'PLACEHOLDER_SECRET',
          vnpayHost:
            configService.get<string>('VNPAY_URL') ||
            'https://sandbox.vnpayment.vn',
          testMode: configService.get<string>('NODE_ENV') !== 'production',
          hashAlgorithm: HashAlgorithm.SHA512,
          enableLog: configService.get<string>('NODE_ENV') !== 'production',
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentController, InvoiceController],
  providers: [PaymentService, VNPayService, InvoiceService],
  exports: [PaymentService, InvoiceService],
})
export class PaymentModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';

/**
 * PaymentModule
 *
 * Handles invoice generation from completed appointments.
 * Records payment transactions (cash, bank transfer, and online via VNPay).
 * Integrates with VNPay payment gateway for online credit/debit card and QR code payments.
 * Manages payment callbacks and transaction records.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment, PaymentGatewayArchive]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

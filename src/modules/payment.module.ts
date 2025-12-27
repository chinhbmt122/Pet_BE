import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  ],
  controllers: [PaymentController, InvoiceController],
  providers: [PaymentService, VNPayService, InvoiceService],
  exports: [PaymentService, InvoiceService],
})
export class PaymentModule {}

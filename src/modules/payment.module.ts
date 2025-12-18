import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { VNPayService } from '../services/vnpay.service';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { Appointment } from '../entities/appointment.entity';

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
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPaymentGatewayService',
      useClass: VNPayService,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}

/**
 * VNPay IPN (Instant Payment Notification) Usage Examples
 *
 * IPN là callback từ VNPay server đến server của bạn để thông báo kết quả giao dịch.
 * Khác với Return URL (callback từ browser người dùng), IPN đảm bảo server của bạn
 * nhận được thông báo giao dịch ngay cả khi người dùng đóng trình duyệt.
 *
 * @see https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/#t%E1%BA%A1o-url-thanh-to%C3%A1n
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VNPayService } from './services/vnpay.service';
import { IpnResponse } from './services/interfaces/payment-gateway.interface';

// =============================================================================
// Example 1: Basic IPN Handler in Payment Controller
// =============================================================================

@Controller('api/payments/vnpay')
export class PaymentController {
  constructor(private readonly vnpayService: VNPayService) {}

  /**
   * VNPay IPN endpoint
   * VNPay sẽ gửi POST request đến endpoint này với query parameters
   *
   * Setup IPN URL trong VNPay merchant portal:
   * - Sandbox: https://sandbox.vnpayment.vn/merchantv2/
   * - Production: https://vnpay.vn/
   *
   * IPN URL format: https://yourdomain.com/api/payments/vnpay/ipn
   */
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpn(@Body() ipnData: any): Promise<IpnResponse> {
    console.log('=== Received VNPay IPN ===');
    console.log('IPN Data:', ipnData);

    try {
      // 1. Verify IPN signature
      const verification = await this.vnpayService.verifyIpn(ipnData);

      // 2. Check signature validity
      if (!verification.isValid) {
        console.error('Invalid IPN signature');
        return this.vnpayService.generateIpnResponse(
          false,
          'Invalid signature',
        );
      }

      // 3. Process payment result
      if (verification.status === 'SUCCESS') {
        // TODO: Update order status in database
        // TODO: Send notification to customer
        // TODO: Trigger fulfillment process

        console.log(`Payment successful for order ${verification.orderId}`);
        console.log(`Transaction ID: ${verification.transactionId}`);
        console.log(`Amount: ${verification.amount}`);

        return this.vnpayService.generateIpnResponse(true, 'Order confirmed');
      } else {
        // Payment failed
        console.log(`Payment failed for order ${verification.orderId}`);
        console.log(`Reason: ${verification.message}`);

        // TODO: Update order status as failed

        return this.vnpayService.generateIpnResponse(true, 'Order failed');
      }
    } catch (error) {
      console.error('Error processing IPN:', error);
      return this.vnpayService.generateIpnResponse(false, 'System error');
    }
  }
}

// =============================================================================
// Example 2: IPN Handler with Database Update
// =============================================================================

@Controller('api/payments/vnpay')
export class PaymentControllerWithDB {
  constructor(
    private readonly vnpayService: VNPayService,
    // private readonly orderService: OrderService,
    // private readonly invoiceService: InvoiceService,
  ) {}

  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpnWithDB(@Body() ipnData: any): Promise<IpnResponse> {
    try {
      // Verify IPN
      const verification = await this.vnpayService.verifyIpn(ipnData);

      if (!verification.isValid) {
        return this.vnpayService.generateIpnResponse(
          false,
          'Invalid signature',
        );
      }

      // Find order/invoice by orderId
      const orderId = verification.orderId;
      // const order = await this.orderService.findByOrderId(orderId);

      // if (!order) {
      //   return this.vnpayService.generateIpnResponse(false, 'Order not found');
      // }

      // Check if already processed
      // if (order.isPaid) {
      //   return this.vnpayService.generateIpnResponse(true, 'Order already confirmed');
      // }

      // Update order status
      if (verification.status === 'SUCCESS') {
        // await this.orderService.updatePaymentStatus(orderId, {
        //   status: 'PAID',
        //   transactionId: verification.transactionId,
        //   paidAmount: verification.amount,
        //   paidAt: new Date(),
        // });

        // Create or update invoice
        // await this.invoiceService.markAsPaid(orderId, {
        //   paymentMethod: 'VNPAY',
        //   transactionId: verification.transactionId,
        // });

        return this.vnpayService.generateIpnResponse(true, 'Order confirmed');
      } else {
        // await this.orderService.updatePaymentStatus(orderId, {
        //   status: 'PAYMENT_FAILED',
        //   failureReason: verification.message,
        // });

        return this.vnpayService.generateIpnResponse(true, 'Order failed');
      }
    } catch (error) {
      console.error('Error processing IPN:', error);
      return this.vnpayService.generateIpnResponse(false, 'System error');
    }
  }
}

// =============================================================================
// Example 3: IPN Response Codes Explained
// =============================================================================

/**
 * VNPay IPN Response Codes
 *
 * Merchant phải trả về cho VNPay theo format:
 * {
 *   "RspCode": "00",
 *   "Message": "success"
 * }
 *
 * Response Codes:
 * - "00": Confirm Success - Merchant xác nhận đã nhận IPN và xử lý thành công
 * - "01": Order not found - Không tìm thấy đơn hàng
 * - "02": Order already confirmed - Đơn hàng đã được xác nhận trước đó
 * - "04": Invalid amount - Số tiền không hợp lệ (không khớp với đơn hàng)
 * - "97": Invalid signature - Chữ ký không hợp lệ
 * - "99": Unknown error - Lỗi không xác định
 *
 * Lưu ý:
 * - VNPay sẽ retry IPN nếu không nhận được response code "00"
 * - Retry tối đa 3 lần trong vòng 24h
 * - IPN phải response trong vòng 30s
 */

// =============================================================================
// Example 4: Testing IPN Locally with ngrok
// =============================================================================

/**
 * Để test IPN trên localhost:
 *
 * 1. Install ngrok:
 *    npm install -g ngrok
 *
 * 2. Run your NestJS app:
 *    npm run start:dev
 *
 * 3. Start ngrok tunnel:
 *    ngrok http 3000
 *
 * 4. Copy ngrok URL (ví dụ: https://abc123.ngrok.io)
 *
 * 5. Configure IPN URL in VNPay merchant portal:
 *    https://abc123.ngrok.io/api/payments/vnpay/ipn
 *
 * 6. Create a test payment and complete it
 *
 * 7. Check your terminal for IPN callback logs
 */

// =============================================================================
// Example 5: IPN Security Best Practices
// =============================================================================

@Controller('api/payments/vnpay')
export class SecurePaymentController {
  constructor(private readonly vnpayService: VNPayService) {}

  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleSecureIpn(@Body() ipnData: any): Promise<IpnResponse> {
    try {
      // 1. Always verify signature first
      const verification = await this.vnpayService.verifyIpn(ipnData);

      if (!verification.isValid) {
        // Log suspicious activity
        console.warn('Received IPN with invalid signature:', {
          orderId: ipnData.vnp_TxnRef,
          timestamp: new Date(),
          ipnData,
        });
        return this.vnpayService.generateIpnResponse(
          false,
          'Invalid signature',
        );
      }

      // 2. Validate order exists and is in correct state
      const orderId = verification.orderId;
      // const order = await this.orderService.findByOrderId(orderId);

      // if (!order) {
      //   console.warn('IPN for non-existent order:', orderId);
      //   return this.vnpayService.generateIpnResponse(false, 'Order not found');
      // }

      // 3. Check for duplicate IPN (idempotency)
      // if (order.vnpayTransactionId === verification.transactionId) {
      //   console.log('Duplicate IPN, already processed:', verification.transactionId);
      //   return this.vnpayService.generateIpnResponse(true, 'Order already confirmed');
      // }

      // 4. Validate amount matches
      // if (order.totalAmount !== verification.amount) {
      //   console.error('Amount mismatch:', {
      //     expected: order.totalAmount,
      //     received: verification.amount,
      //   });
      //   return this.vnpayService.generateIpnResponse(false, 'Invalid amount');
      // }

      // 5. Use database transaction for atomic updates
      // await this.database.transaction(async (trx) => {
      //   await this.orderService.updatePaymentStatus(orderId, {
      //     status: verification.status === 'SUCCESS' ? 'PAID' : 'FAILED',
      //     transactionId: verification.transactionId,
      //   }, trx);
      //
      //   if (verification.status === 'SUCCESS') {
      //     await this.invoiceService.markAsPaid(orderId, {...}, trx);
      //   }
      // });

      return this.vnpayService.generateIpnResponse(true, 'Confirmed');
    } catch (error) {
      // Log error for debugging
      console.error('IPN processing error:', error);

      // Still return response to VNPay to avoid retries
      return this.vnpayService.generateIpnResponse(false, 'System error');
    }
  }
}

// =============================================================================
// Example 6: Difference between Return URL and IPN
// =============================================================================

/**
 * Return URL vs IPN:
 *
 * RETURN URL (verifyCallback):
 * - User's browser redirects to this URL after payment
 * - Format: GET request with query parameters
 * - User can see the result immediately
 * - May be interrupted if user closes browser
 * - Should show success/failure page to user
 * - Example: http://localhost:3000/payment/success?vnp_TxnRef=...
 *
 * IPN (verifyIpn):
 * - VNPay server sends POST request directly to your server
 * - Server-to-server communication
 * - More reliable than Return URL
 * - Guaranteed delivery with retries
 * - Should update database and trigger business logic
 * - Must respond with JSON: {RspCode: "00", Message: "success"}
 *
 * BEST PRACTICE:
 * - Use Return URL for user experience (show success page)
 * - Use IPN for data consistency (update database)
 * - Always implement BOTH endpoints
 * - IPN is the source of truth for payment status
 */

export default {
  note: 'This file contains usage examples only. Import and adapt as needed.',
};

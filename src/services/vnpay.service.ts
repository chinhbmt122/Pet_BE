import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import type { ProductCode, ReturnQueryFromVNPay, VnpLocale } from 'vnpay';
import {
  IPaymentGatewayService,
  PaymentUrlParams,
  PaymentUrlResponse,
  PaymentCallbackData,
  CallbackVerificationResult,
  IpnCallbackData,
  IpnVerificationResult,
  IpnResponse,
  RefundRequest,
  RefundResponse,
  TransactionQueryRequest,
  TransactionQueryResponse,
} from './interfaces/payment-gateway.interface';

/**
 * VNPay Payment Gateway Service
 *
 * Implements VNPay payment gateway integration using nestjs-vnpay library.
 * Handles payment URL generation, callback verification, refunds, and transaction queries.
 *
 * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 * @see https://github.com/lehuygiang28/nestjs-vnpay
 */
@Injectable()
export class VNPayService implements IPaymentGatewayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly vnpayService: VnpayService,
  ) {}

  /**
   * Generate VNPay payment URL
   */
  async generatePaymentUrl(
    params: PaymentUrlParams,
  ): Promise<PaymentUrlResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    const returnUrl =
      params.returnUrl ||
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/api/payments/vnpay/ipn';

    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddress || '127.0.0.1',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderDescription,
      vnp_OrderType: 'other' as ProductCode,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: (params.locale === 'en' ? 'en' : 'vn') as VnpLocale,
    });

    console.log('=== VNPay Payment URL Generation ===');
    console.log('Order ID:', params.orderId);
    console.log('Amount:', params.amount);
    console.log('Payment URL:', paymentUrl);

    return {
      paymentUrl,
      orderId: params.orderId,
    };
  }

  /**
   * Verify VNPay callback signature and extract payment result
   */
  async verifyCallback(
    callbackData: PaymentCallbackData,
  ): Promise<CallbackVerificationResult> {
    const verify = await this.vnpayService.verifyReturnUrl(callbackData as any);

    console.log('=== VNPay Callback Verification ===');
    console.log('Is Valid:', verify.isVerified);
    console.log('Is Success:', verify.isSuccess);
    console.log('Response Code:', callbackData['vnp_ResponseCode']);

    // Extract payment result
    const responseCode = callbackData['vnp_ResponseCode'] as string;
    const isSuccess = verify.isSuccess && responseCode === '00';

    return {
      isValid: verify.isVerified,
      transactionId: verify.isVerified
        ? (callbackData['vnp_TransactionNo'] as string)
        : null,
      amount: verify.isVerified
        ? parseInt(callbackData['vnp_Amount'] as string) / 100
        : null,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: this.getResponseMessage(responseCode),
      rawData: callbackData,
    };
  }

  /**
   * Verify VNPay IPN (Instant Payment Notification)
   * IPN is a server-to-server callback from VNPay to notify payment result
   */
  async verifyIpn(ipnData: IpnCallbackData): Promise<IpnVerificationResult> {
    const verify = await this.vnpayService.verifyIpnCall(
      ipnData as ReturnQueryFromVNPay,
    );

    console.log('=== VNPay IPN Verification ===');
    console.log('Is Valid:', verify.isVerified);
    console.log('Is Success:', verify.isSuccess);
    console.log('Order ID:', ipnData['vnp_TxnRef']);
    console.log('Response Code:', ipnData['vnp_ResponseCode']);
    console.log('Transaction No:', ipnData['vnp_TransactionNo']);

    // Extract payment result
    const responseCode = ipnData['vnp_ResponseCode'] as string;
    const isSuccess = verify.isSuccess && responseCode === '00';

    return {
      isValid: verify.isVerified,
      orderId: verify.isVerified ? (ipnData['vnp_TxnRef'] as string) : null,
      transactionId: verify.isVerified
        ? (ipnData['vnp_TransactionNo'] as string)
        : null,
      amount: verify.isVerified
        ? parseInt(ipnData['vnp_Amount'] as string) / 100
        : null,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: this.getResponseMessage(responseCode),
      rawData: ipnData,
    };
  }

  /**
   * Generate IPN response according to VNPay specification
   * VNPay requires response in format: {RspCode: '00', Message: 'success'}
   *
   * Response codes:
   * - '00': Success
   * - '01': Order not found
   * - '02': Order already confirmed
   * - '04': Invalid amount
   * - '97': Invalid signature
   * - '99': Unknown error
   */
  generateIpnResponse(
    isValid: boolean,
    message: string = 'success',
  ): IpnResponse {
    if (!isValid) {
      return {
        RspCode: '97',
        Message: 'Invalid signature',
      };
    }

    return {
      RspCode: '00',
      Message: message,
    };
  }

  /**
   * Initiate refund transaction
   */
  async initiateRefund(request: RefundRequest): Promise<RefundResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    try {
      const refundData = {
        vnp_Amount: request.amount,
        vnp_TransactionType: '02', // Full refund
        vnp_TxnRef: request.orderId,
        vnp_TransactionDate: new Date(),
        vnp_TransactionNo: request.transactionId,
        vnp_CreateBy: 'system',
        vnp_CreateDate: new Date(),
        vnp_IpAddr: '127.0.0.1',
        vnp_OrderInfo: request.reason,
      };

      // Note: nestjs-vnpay library doesn't have built-in refund method
      // This would need to be implemented via HTTP call to VNPay API
      // For now, return placeholder response
      console.log('Refund request:', refundData);

      return {
        success: false,
        refundTransactionId: null,
        message: 'Refund API requires manual HTTP implementation with VNPay',
        rawData: refundData,
      };
    } catch (error: any) {
      return {
        success: false,
        refundTransactionId: null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: error?.message || 'Refund failed',
        rawData: request,
      };
    }
  }

  /**
   * Query transaction status from VNPay
   */
  async queryTransaction(
    request: TransactionQueryRequest,
  ): Promise<TransactionQueryResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    try {
      // Note: nestjs-vnpay library doesn't have built-in query method
      // This would need to be implemented via HTTP call to VNPay API
      const queryData = {
        vnp_TxnRef: request.orderId,
        vnp_TransactionDate: request.transactionDate,
        vnp_OrderInfo: `Query transaction ${request.orderId}`,
        vnp_IpAddr: '127.0.0.1',
      };

      console.log('Query transaction request:', queryData);

      return {
        found: false,
        transactionId: null,
        amount: null,
        status: 'NOT_FOUND',
        rawData: queryData,
      };
    } catch (error: any) {
      return {
        found: false,
        transactionId: null,
        amount: null,
        status: 'ERROR',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        rawData: { error: error?.message || 'Unknown error' },
      };
    }
  }

  /**
   * Get gateway name
   */
  getGatewayName(): string {
    return 'VNPAY';
  }

  // ===== Private Helper Methods =====

  /**
   * Get human-readable message for VNPay response code
   */
  private getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Transaction successful',
      '07': 'Transaction suspicious (locked)',
      '09': 'Customer card not registered for online payment',
      '10': 'Customer authentication failed',
      '11': 'Transaction timeout',
      '12': 'Customer account locked',
      '13': 'Invalid OTP',
      '24': 'Customer cancelled transaction',
      '51': 'Insufficient account balance',
      '65': 'Customer exceeded daily transaction limit',
      '75': 'Payment bank under maintenance',
      '79': 'Transaction failed (multiple retries)',
      '99': 'Unknown error',
    };

    return messages[code] || `Error code: ${code}`;
  }
}

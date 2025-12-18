import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import {
  IPaymentGatewayService,
  PaymentUrlParams,
  PaymentUrlResponse,
  PaymentCallbackData,
  CallbackVerificationResult,
  RefundRequest,
  RefundResponse,
  TransactionQueryRequest,
  TransactionQueryResponse,
} from './interfaces/payment-gateway.interface';

/**
 * VNPay Payment Gateway Service
 *
 * Implements VNPay payment gateway integration.
 * Handles payment URL generation, callback verification, refunds, and transaction queries.
 * Uses HMAC-SHA512 for signature generation and verification.
 *
 * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
@Injectable()
export class VNPayService implements IPaymentGatewayService {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpayUrl: string;
  private readonly returnUrl: string;
  private readonly version: string = '2.1.0';
  private readonly currCode: string = 'VND';

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    this.vnpayUrl =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/api/payments/vnpay/callback';
  }

  /**
   * Generate VNPay payment URL
   */
  async generatePaymentUrl(
    params: PaymentUrlParams,
  ): Promise<PaymentUrlResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    const createDate = this.formatDate(new Date());
    const expireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes

    // Build VNPay parameters
    const vnpParams: Record<string, string> = {
      vnp_Version: this.version,
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: this.currCode,
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderDescription,
      vnp_OrderType: 'other',
      vnp_Amount: (params.amount * 100).toString(), // VNPay requires amount in smallest unit (VND * 100)
      vnp_ReturnUrl: params.returnUrl || this.returnUrl,
      vnp_IpAddr: params.ipAddress,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort parameters and generate signature
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);
    const secureHash = this.generateHmacSha512(signData, this.hashSecret);

    // Add signature to parameters
    sortedParams.vnp_SecureHash = secureHash;

    // Build payment URL
    const paymentUrl = `${this.vnpayUrl}?${querystring.stringify(sortedParams)}`;

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
    await Promise.resolve(); // Satisfy async lint rule
    const vnpParams = { ...callbackData };
    const secureHash = vnpParams['vnp_SecureHash'] as string;

    // Remove signature fields
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort parameters and generate signature
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);
    const expectedHash = this.generateHmacSha512(signData, this.hashSecret);

    // Verify signature
    const isValid = secureHash === expectedHash;

    // Extract payment result
    const responseCode = vnpParams['vnp_ResponseCode'] as string;
    const transactionStatus = vnpParams['vnp_TransactionStatus'] as string;
    const isSuccess = responseCode === '00' && transactionStatus === '00';

    return {
      isValid,
      transactionId: isValid
        ? (vnpParams['vnp_TransactionNo'] as string)
        : null,
      amount: isValid
        ? parseInt(vnpParams['vnp_Amount'] as string) / 100
        : null,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: this.getResponseMessage(responseCode),
      rawData: callbackData,
    };
  }

  /**
   * Initiate refund transaction
   */
  async initiateRefund(request: RefundRequest): Promise<RefundResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    const createDate = this.formatDate(new Date());
    const transactionDate = this.formatDate(new Date()); // Should be original transaction date

    // Build refund parameters
    const vnpParams: Record<string, string> = {
      vnp_Version: this.version,
      vnp_Command: 'refund',
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: request.orderId,
      vnp_Amount: (request.amount * 100).toString(),
      vnp_OrderInfo: request.reason,
      vnp_TransactionNo: request.transactionId,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
      vnp_CreateBy: 'system',
      vnp_IpAddr: '127.0.0.1',
    };

    // Sort parameters and generate signature
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);
    const secureHash = this.generateHmacSha512(signData, this.hashSecret);

    sortedParams.vnp_SecureHash = secureHash;

    // TODO: Make HTTP request to VNPay refund API
    // This is a placeholder - actual implementation would use HTTP client
    // const response = await this.httpService.post(vnpayRefundUrl, sortedParams).toPromise();

    return {
      success: false,
      refundTransactionId: null,
      message: 'Refund API not yet implemented - requires HTTP client setup',
      rawData: sortedParams,
    };
  }

  /**
   * Query transaction status from VNPay
   */
  async queryTransaction(
    request: TransactionQueryRequest,
  ): Promise<TransactionQueryResponse> {
    await Promise.resolve(); // Satisfy async lint rule
    const createDate = this.formatDate(new Date());
    const transactionDate = this.formatDate(request.transactionDate);

    // Build query parameters
    const vnpParams: Record<string, string> = {
      vnp_Version: this.version,
      vnp_Command: 'querydr',
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: request.orderId,
      vnp_OrderInfo: `Query transaction ${request.orderId}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: '127.0.0.1',
    };

    // Sort parameters and generate signature
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);
    const secureHash = this.generateHmacSha512(signData, this.hashSecret);

    sortedParams.vnp_SecureHash = secureHash;

    // TODO: Make HTTP request to VNPay query API
    // This is a placeholder - actual implementation would use HTTP client
    // const response = await this.httpService.post(vnpayQueryUrl, sortedParams).toPromise();

    return {
      found: false,
      transactionId: null,
      amount: null,
      status: 'NOT_FOUND',
      rawData: sortedParams,
    };
  }

  /**
   * Get gateway name
   */
  getGatewayName(): string {
    return 'VNPAY';
  }

  // ===== Private Helper Methods =====

  /**
   * Generate HMAC-SHA512 signature
   */
  private generateHmacSha512(data: string, secret: string): string {
    return crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');
  }

  /**
   * Sort object keys alphabetically
   */
  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      const value: unknown = obj[key];
      if (value !== '' && value !== undefined && value !== null) {
        if (typeof value === 'string' || typeof value === 'number') {
          sorted[key] = String(value);
        }
      }
    }

    return sorted;
  }

  /**
   * Format date to VNPay format (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

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

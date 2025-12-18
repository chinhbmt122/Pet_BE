/**
 * Payment Gateway Interface
 *
 * Abstraction for payment gateway integrations (VNPay, Momo, ZaloPay).
 * Allows swapping gateway implementations without changing PaymentService.
 * Follows Dependency Inversion Principle (SOLID).
 */

export interface PaymentUrlParams {
  orderId: string;
  amount: number;
  orderDescription: string;
  returnUrl: string;
  ipAddress: string;
  locale?: string;
}

export interface PaymentUrlResponse {
  paymentUrl: string;
  orderId: string;
}

export interface PaymentCallbackData {
  [key: string]: string | number;
}

export interface CallbackVerificationResult {
  isValid: boolean;
  transactionId: string | null;
  amount: number | null;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  rawData: object;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  orderId: string;
}

export interface RefundResponse {
  success: boolean;
  refundTransactionId: string | null;
  message: string;
  rawData: object;
}

export interface TransactionQueryRequest {
  orderId: string;
  transactionDate: Date;
}

export interface TransactionQueryResponse {
  found: boolean;
  transactionId: string | null;
  amount: number | null;
  status: string;
  rawData: object;
}

export interface IPaymentGatewayService {
  /**
   * Generate payment URL for customer to complete payment
   */
  generatePaymentUrl(params: PaymentUrlParams): Promise<PaymentUrlResponse>;

  /**
   * Verify callback signature and extract payment result
   */
  verifyCallback(
    callbackData: PaymentCallbackData,
  ): Promise<CallbackVerificationResult>;

  /**
   * Initiate refund transaction
   */
  initiateRefund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Query transaction status from gateway
   */
  queryTransaction(
    request: TransactionQueryRequest,
  ): Promise<TransactionQueryResponse>;

  /**
   * Get gateway name (e.g., 'VNPAY', 'MOMO', 'ZALOPAY')
   */
  getGatewayName(): string;
}

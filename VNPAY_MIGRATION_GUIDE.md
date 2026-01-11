# VNPay Integration with nestjs-vnpay Library

## Overview

The VNPay payment gateway integration has been migrated from a custom implementation to use the official `nestjs-vnpay` library. This provides better maintenance, automatic updates, and follows NestJS best practices.

## Changes Made

### 1. Package Installation

Added the `nestjs-vnpay` package:

```bash
npm install nestjs-vnpay
```

### 2. VNPayService Refactoring

**Before (Custom Implementation):**

- Manual HMAC-SHA512 signature generation
- Manual parameter sorting and query string building
- Custom date formatting
- Direct crypto operations

**After (Using nestjs-vnpay):**

- Uses VnpayService from nestjs-vnpay library
- Automatic signature generation and verification
- Built-in parameter handling
- Type-safe API with TypeScript definitions

### 3. Module Configuration

**File: `src/modules/payment.module.ts`**

Added VnpayModule configuration:

```typescript
import { VnpayModule } from 'nestjs-vnpay';

@Module({
  imports: [
    // ... other imports
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        tmnCode: configService.get<string>('VNPAY_TMN_CODE') || '',
        secureSecret: configService.get<string>('VNPAY_HASH_SECRET') || '',
        vnpayHost: configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn',
        testMode: configService.get<string>('NODE_ENV') !== 'production',
        hashAlgorithm: 'SHA512' as const,
        enableLog: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
  // ... rest of module config
})
```

### 4. Service Implementation

**File: `src/services/vnpay.service.ts`**

The VNPayService now injects VnpayService from the library:

```typescript
import { VnpayService } from 'nestjs-vnpay';

@Injectable()
export class VNPayService implements IPaymentGatewayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly vnpayService: VnpayService,
  ) {}

  async generatePaymentUrl(
    params: PaymentUrlParams,
  ): Promise<PaymentUrlResponse> {
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddress || '127.0.0.1',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderDescription,
      vnp_OrderType: 'other' as ProductCode,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: (params.locale === 'en' ? 'en' : 'vn') as VnpLocale,
    });
    return { paymentUrl, orderId: params.orderId };
  }

  async verifyCallback(
    callbackData: PaymentCallbackData,
  ): Promise<CallbackVerificationResult> {
    const verify = await this.vnpayService.verifyReturnUrl(callbackData as any);
    // Process verification result
  }
}
```

## Environment Configuration

No changes required to `.env` file. The same environment variables are used:

```env
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-return
```

## Benefits

1. **Maintained Library**: Regular updates and bug fixes from the community
2. **Type Safety**: Full TypeScript support with proper type definitions
3. **Best Practices**: Follows NestJS module patterns
4. **Less Code**: Reduced boilerplate code
5. **Tested**: The library is tested and used by other projects
6. **Documentation**: Official documentation available at https://vnpay.js.org

## API Compatibility

The existing API endpoints remain unchanged:

- `POST /api/payments/online/initiate` - Initiate online payment
- `POST /api/payments/vnpay/callback` - VNPay callback handler
- All other payment endpoints unchanged

## Payment Service Fix

Also fixed a bug in `initiateOnlinePayment` where the invoice status was reset to PENDING but not saved before validation. Now it properly saves the invoice after canceling the previous payment.

## Testing

Test the integration:

1. Start the application: `npm run start:dev`
2. Create an invoice for a completed appointment
3. Initiate online payment: `POST /api/payments/online/initiate`
4. Follow the payment URL to VNPay sandbox
5. Complete the payment
6. Verify callback is processed correctly

## Troubleshooting

### Common Issues

1. **Module not found error**
   - Run `npm install` to ensure nestjs-vnpay is installed
2. **Configuration errors**
   - Verify all VNPAY\_\* environment variables are set correctly
   - Check that VNPAY_URL points to the correct endpoint

3. **Signature verification fails**
   - Ensure VNPAY_HASH_SECRET matches your VNPay merchant account
   - Verify the callback URL is configured in VNPay merchant portal

## Additional Features

The nestjs-vnpay library supports additional features not yet implemented:

- `queryDr()` - Query payment status from VNPay
- `refund()` - Process refunds through VNPay API
- `getBankList()` - Get list of supported banks

These can be implemented in future iterations by calling the respective methods on `this.vnpayService`.

## References

- nestjs-vnpay GitHub: https://github.com/lehuygiang28/nestjs-vnpay
- nestjs-vnpay Documentation: https://vnpay.js.org
- VNPay API Documentation: https://sandbox.vnpayment.vn/apis/docs/

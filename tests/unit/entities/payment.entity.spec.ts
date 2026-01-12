/**
 * Payment Entity Unit Tests
 *
 * Tests the domain logic of the Payment entity without any mocking.
 * Covers state transitions, guard methods, factory methods, and business rules.
 */

import { Payment, PaymentMethod, PaymentStatus } from '../../../src/entities/payment.entity';

describe('Payment Entity - Domain Logic', () => {
    /**
     * Factory function to create Payment instances for testing
     */
    function createPayment(overrides: Partial<Payment> = {}): Payment {
        const payment = new Payment();
        payment.paymentId = overrides.paymentId ?? 1;
        payment.invoiceId = overrides.invoiceId ?? 1;
        payment.paymentMethod = overrides.paymentMethod ?? PaymentMethod.VNPAY;
        payment.amount = overrides.amount ?? 100000;
        payment.paymentStatus = overrides.paymentStatus ?? PaymentStatus.PENDING;
        payment.transactionId = overrides.transactionId ?? null;
        payment.idempotencyKey = overrides.idempotencyKey ?? null;
        payment.paidAt = overrides.paidAt ?? null;
        payment.receivedBy = overrides.receivedBy ?? null;
        payment.gatewayResponse = overrides.gatewayResponse ?? null;
        payment.refundAmount = overrides.refundAmount ?? 0;
        payment.refundDate = overrides.refundDate ?? null;
        payment.refundReason = overrides.refundReason ?? null;
        payment.notes = overrides.notes ?? null;
        return payment;
    }

    // ===== Static Factory Methods =====

    describe('Static Factory Methods', () => {
        describe('createCashPayment()', () => {
            it('should create a cash payment with correct properties', () => {
                const payment = Payment.createCashPayment({
                    invoiceId: 1,
                    amount: 50000,
                    receivedBy: 5,
                    notes: 'Cash received',
                });

                expect(payment.invoiceId).toBe(1);
                expect(payment.amount).toBe(50000);
                expect(payment.paymentMethod).toBe(PaymentMethod.CASH);
                expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
                expect(payment.receivedBy).toBe(5);
                expect(payment.notes).toBe('Cash received');
                expect(payment.transactionId).toBeNull();
                expect(payment.idempotencyKey).toBeNull();
            });

            it('should default notes to null if not provided', () => {
                const payment = Payment.createCashPayment({
                    invoiceId: 1,
                    amount: 50000,
                    receivedBy: 5,
                });

                expect(payment.notes).toBeNull();
            });
        });

        describe('createOnlinePayment()', () => {
            it('should create an online payment with correct properties', () => {
                const payment = Payment.createOnlinePayment({
                    invoiceId: 1,
                    amount: 100000,
                    paymentMethod: PaymentMethod.VNPAY,
                    idempotencyKey: 'IDEM-123',
                    notes: 'VNPay payment',
                });

                expect(payment.invoiceId).toBe(1);
                expect(payment.amount).toBe(100000);
                expect(payment.paymentMethod).toBe(PaymentMethod.VNPAY);
                expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
                expect(payment.idempotencyKey).toBe('IDEM-123');
                expect(payment.notes).toBe('VNPay payment');
                expect(payment.receivedBy).toBeNull();
                expect(payment.transactionId).toBeNull();
            });

            it('should support different payment methods', () => {
                const momoPayment = Payment.createOnlinePayment({
                    invoiceId: 1,
                    amount: 50000,
                    paymentMethod: PaymentMethod.MOMO,
                    idempotencyKey: 'MOMO-123',
                });

                expect(momoPayment.paymentMethod).toBe(PaymentMethod.MOMO);
            });
        });
    });

    // ===== State Transitions =====

    describe('State Transitions', () => {
        describe('processCash()', () => {
            it('should transition from PENDING to SUCCESS for cash payment', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.PENDING,
                });

                payment.processCash();

                expect(payment.paymentStatus).toBe(PaymentStatus.SUCCESS);
                expect(payment.paidAt).toBeInstanceOf(Date);
            });

            it('should throw when not PENDING', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.SUCCESS,
                });

                expect(() => payment.processCash()).toThrow(
                    'Cannot process cash: current status is SUCCESS, expected PENDING'
                );
            });

            it('should throw when payment method is not CASH', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.VNPAY,
                    paymentStatus: PaymentStatus.PENDING,
                });

                // Note: canProcessCash() checks both status AND method, so guard fails first
                expect(() => payment.processCash()).toThrow(
                    /Cannot process cash/
                );
            });
        });

        describe('startOnlinePayment()', () => {
            it('should transition from PENDING to PROCESSING', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.VNPAY,
                    paymentStatus: PaymentStatus.PENDING,
                });

                payment.startOnlinePayment();

                expect(payment.paymentStatus).toBe(PaymentStatus.PROCESSING);
            });

            it('should throw when not PENDING', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.VNPAY,
                    paymentStatus: PaymentStatus.PROCESSING,
                });

                expect(() => payment.startOnlinePayment()).toThrow(
                    'Cannot start online payment: current status is PROCESSING, expected PENDING'
                );
            });

            it('should throw for CASH payment method', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.PENDING,
                });

                // Note: canStartOnlinePayment() checks both status AND method != CASH
                expect(() => payment.startOnlinePayment()).toThrow(
                    /Cannot start online payment/
                );
            });
        });

        describe('markSuccess()', () => {
            it('should transition from PROCESSING to SUCCESS', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.PROCESSING,
                });
                const gatewayResponse = { vnp_ResponseCode: '00' };

                payment.markSuccess('TXN-12345', gatewayResponse);

                expect(payment.paymentStatus).toBe(PaymentStatus.SUCCESS);
                expect(payment.transactionId).toBe('TXN-12345');
                expect(payment.gatewayResponse).toEqual(gatewayResponse);
                expect(payment.paidAt).toBeInstanceOf(Date);
            });

            it('should throw when not PROCESSING', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(() => payment.markSuccess('TXN', {})).toThrow(
                    'Cannot mark as success: current status is PENDING, expected PROCESSING'
                );
            });
        });

        describe('markFailed()', () => {
            it('should transition from PROCESSING to FAILED', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.PROCESSING,
                });
                const gatewayResponse = { vnp_ResponseCode: '24' };

                payment.markFailed(gatewayResponse);

                expect(payment.paymentStatus).toBe(PaymentStatus.FAILED);
                expect(payment.gatewayResponse).toEqual(gatewayResponse);
            });

            it('should throw when not PROCESSING', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                });

                expect(() => payment.markFailed({})).toThrow(
                    'Cannot mark as failed: current status is SUCCESS, expected PROCESSING'
                );
            });
        });

        describe('refund()', () => {
            it('should transition from SUCCESS to REFUNDED', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                    amount: 100000,
                });

                payment.refund(50000, 'Customer request');

                expect(payment.paymentStatus).toBe(PaymentStatus.REFUNDED);
                expect(payment.refundAmount).toBe(50000);
                expect(payment.refundReason).toBe('Customer request');
                expect(payment.refundDate).toBeInstanceOf(Date);
            });

            it('should allow full refund', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                    amount: 100000,
                });

                payment.refund(100000, 'Full refund');

                expect(payment.paymentStatus).toBe(PaymentStatus.REFUNDED);
                expect(payment.refundAmount).toBe(100000);
            });

            it('should throw when not SUCCESS', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(() => payment.refund(50000, 'reason')).toThrow(
                    'Cannot refund: current status is PENDING, expected SUCCESS'
                );
            });

            it('should throw for zero amount', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                });

                expect(() => payment.refund(0, 'reason')).toThrow(
                    'Refund amount must be positive'
                );
            });

            it('should throw for negative amount', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                });

                expect(() => payment.refund(-100, 'reason')).toThrow(
                    'Refund amount must be positive'
                );
            });

            it('should throw when refund exceeds payment amount', () => {
                const payment = createPayment({
                    paymentStatus: PaymentStatus.SUCCESS,
                    amount: 100000,
                });

                expect(() => payment.refund(150000, 'reason')).toThrow(
                    'Refund amount cannot exceed payment amount'
                );
            });
        });
    });

    // ===== Guard Methods =====

    describe('Guard Methods', () => {
        describe('canProcessCash()', () => {
            it('should return true for PENDING CASH payment', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(payment.canProcessCash()).toBe(true);
            });

            it('should return false for non-CASH payment', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.VNPAY,
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(payment.canProcessCash()).toBe(false);
            });

            it('should return false for non-PENDING status', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.SUCCESS,
                });

                expect(payment.canProcessCash()).toBe(false);
            });
        });

        describe('canStartOnlinePayment()', () => {
            it('should return true for PENDING non-CASH payment', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.VNPAY,
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(payment.canStartOnlinePayment()).toBe(true);
            });

            it('should return false for CASH payment', () => {
                const payment = createPayment({
                    paymentMethod: PaymentMethod.CASH,
                    paymentStatus: PaymentStatus.PENDING,
                });

                expect(payment.canStartOnlinePayment()).toBe(false);
            });
        });

        describe('canMarkSuccess() / canMarkFailed()', () => {
            it('should return true only when PROCESSING', () => {
                const processing = createPayment({ paymentStatus: PaymentStatus.PROCESSING });
                const pending = createPayment({ paymentStatus: PaymentStatus.PENDING });

                expect(processing.canMarkSuccess()).toBe(true);
                expect(processing.canMarkFailed()).toBe(true);
                expect(pending.canMarkSuccess()).toBe(false);
                expect(pending.canMarkFailed()).toBe(false);
            });
        });

        describe('canRefund()', () => {
            it('should return true only when SUCCESS', () => {
                const success = createPayment({ paymentStatus: PaymentStatus.SUCCESS });
                const failed = createPayment({ paymentStatus: PaymentStatus.FAILED });

                expect(success.canRefund()).toBe(true);
                expect(failed.canRefund()).toBe(false);
            });
        });

        describe('isSuccess() / isFailed() / isRefunded()', () => {
            it('should correctly identify payment status', () => {
                expect(createPayment({ paymentStatus: PaymentStatus.SUCCESS }).isSuccess()).toBe(true);
                expect(createPayment({ paymentStatus: PaymentStatus.FAILED }).isFailed()).toBe(true);
                expect(createPayment({ paymentStatus: PaymentStatus.REFUNDED }).isRefunded()).toBe(true);

                // Negative cases
                expect(createPayment({ paymentStatus: PaymentStatus.PENDING }).isSuccess()).toBe(false);
            });
        });
    });

    // ===== Complete State Machine =====

    describe('Complete State Machine', () => {
        /**
         * Payment State Machine:
         *
         *                 ┌─────────┐
         *                 │ PENDING │
         *                 └────┬────┘
         *                      │
         *        ┌─────────────┼─────────────┐
         *        │             │             │
         *   (CASH)processCash  │(Online)startOnlinePayment
         *        │             │             │
         *        ▼             │             ▼
         *   ┌─────────┐        │      ┌────────────┐
         *   │ SUCCESS │        │      │ PROCESSING │
         *   └────┬────┘        │      └──────┬─────┘
         *        │             │             │
         *        │             │    ┌────────┴────────┐
         *        │             │    │                 │
         *        │             │  markSuccess     markFailed
         *        │             │    │                 │
         *        │             │    ▼                 ▼
         *        │             │ ┌─────────┐    ┌─────────┐
         *        │             │ │ SUCCESS │    │ FAILED  │
         *        │             │ └────┬────┘    └─────────┘
         *        │             │      │
         *        └─────────────┼──────┘
         *                      │
         *                   refund
         *                      │
         *                      ▼
         *                 ┌──────────┐
         *                 │ REFUNDED │
         *                 └──────────┘
         */

        it('should support complete cash payment flow', () => {
            const payment = Payment.createCashPayment({
                invoiceId: 1,
                amount: 50000,
                receivedBy: 5,
            });

            expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
            expect(payment.canProcessCash()).toBe(true);

            payment.processCash();

            expect(payment.paymentStatus).toBe(PaymentStatus.SUCCESS);
            expect(payment.isSuccess()).toBe(true);
        });

        it('should support complete online payment success flow', () => {
            const payment = Payment.createOnlinePayment({
                invoiceId: 1,
                amount: 100000,
                paymentMethod: PaymentMethod.VNPAY,
                idempotencyKey: 'IDEM-123',
            });

            // Step 1: Start payment
            expect(payment.canStartOnlinePayment()).toBe(true);
            payment.startOnlinePayment();
            expect(payment.paymentStatus).toBe(PaymentStatus.PROCESSING);

            // Step 2: Success callback
            expect(payment.canMarkSuccess()).toBe(true);
            payment.markSuccess('VNP-TXN-456', { responseCode: '00' });
            expect(payment.paymentStatus).toBe(PaymentStatus.SUCCESS);
            expect(payment.isSuccess()).toBe(true);
        });

        it('should support complete online payment failure flow', () => {
            const payment = Payment.createOnlinePayment({
                invoiceId: 1,
                amount: 100000,
                paymentMethod: PaymentMethod.VNPAY,
                idempotencyKey: 'IDEM-123',
            });

            payment.startOnlinePayment();
            payment.markFailed({ responseCode: '24' });

            expect(payment.paymentStatus).toBe(PaymentStatus.FAILED);
            expect(payment.isFailed()).toBe(true);
        });

        it('should support refund flow from SUCCESS', () => {
            const payment = createPayment({
                paymentStatus: PaymentStatus.SUCCESS,
                amount: 100000,
            });

            expect(payment.canRefund()).toBe(true);
            payment.refund(50000, 'Partial refund');

            expect(payment.paymentStatus).toBe(PaymentStatus.REFUNDED);
            expect(payment.isRefunded()).toBe(true);
            expect(payment.refundAmount).toBe(50000);
        });
    });
});

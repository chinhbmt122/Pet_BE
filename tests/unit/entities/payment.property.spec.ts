/**
 * Payment Entity Property-Based Tests
 *
 * Uses fast-check for property-based testing to discover edge cases
 * in payment state machine and business rules.
 */

import * as fc from 'fast-check';
import { Payment, PaymentMethod, PaymentStatus } from '../../../src/entities/payment.entity';

describe('Payment Entity - Property-Based Tests', () => {
    /**
     * Factory function to create Payment instances
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

    // ===== Custom Arbitraries =====

    const paymentMethodArb = fc.constantFrom(
        PaymentMethod.CASH,
        PaymentMethod.VNPAY,
        PaymentMethod.MOMO,
        PaymentMethod.ZALOPAY,
        PaymentMethod.BANK_TRANSFER
    );

    const onlinePaymentMethodArb = fc.constantFrom(
        PaymentMethod.VNPAY,
        PaymentMethod.MOMO,
        PaymentMethod.ZALOPAY,
        PaymentMethod.BANK_TRANSFER
    );

    const positiveAmountArb = fc.integer({ min: 1, max: 100000000 });

    // ===== Property: State Machine Completeness =====

    describe('State Machine Properties', () => {
        it('PROPERTY: CASH payment can only be processed via processCash()', () => {
            fc.assert(
                fc.property(positiveAmountArb, (amount) => {
                    const payment = createPayment({
                        paymentMethod: PaymentMethod.CASH,
                        paymentStatus: PaymentStatus.PENDING,
                        amount,
                    });

                    expect(payment.canProcessCash()).toBe(true);
                    expect(payment.canStartOnlinePayment()).toBe(false);
                }),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: Online payment cannot use processCash()', () => {
            fc.assert(
                fc.property(onlinePaymentMethodArb, positiveAmountArb, (method, amount) => {
                    const payment = createPayment({
                        paymentMethod: method,
                        paymentStatus: PaymentStatus.PENDING,
                        amount,
                    });

                    expect(payment.canProcessCash()).toBe(false);
                    expect(payment.canStartOnlinePayment()).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: Only PROCESSING status allows markSuccess/markFailed', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        PaymentStatus.PENDING,
                        PaymentStatus.SUCCESS,
                        PaymentStatus.FAILED,
                        PaymentStatus.REFUNDED
                    ),
                    (status) => {
                        const payment = createPayment({ paymentStatus: status });

                        expect(payment.canMarkSuccess()).toBe(false);
                        expect(payment.canMarkFailed()).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: PROCESSING status allows both markSuccess and markFailed', () => {
            fc.assert(
                fc.property(paymentMethodArb, (method) => {
                    const payment = createPayment({
                        paymentMethod: method,
                        paymentStatus: PaymentStatus.PROCESSING,
                    });

                    expect(payment.canMarkSuccess()).toBe(true);
                    expect(payment.canMarkFailed()).toBe(true);
                }),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: Only SUCCESS status allows refund', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        PaymentStatus.PENDING,
                        PaymentStatus.PROCESSING,
                        PaymentStatus.FAILED,
                        PaymentStatus.REFUNDED
                    ),
                    (status) => {
                        const payment = createPayment({ paymentStatus: status });
                        expect(payment.canRefund()).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ===== Property: Refund Constraints =====

    describe('Refund Properties', () => {
        it('PROPERTY: Refund amount must be <= payment amount', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 10000000 }), // payment amount
                    fc.integer({ min: 1, max: 1000000 }),     // extra amount
                    (amount, extraAmount) => {
                        const payment = createPayment({
                            paymentStatus: PaymentStatus.SUCCESS,
                            amount,
                        });

                        // Refund amount is strictly greater than payment
                        const refundAmount = amount + extraAmount;

                        expect(() => payment.refund(refundAmount, 'reason')).toThrow(
                            'Refund amount cannot exceed payment amount'
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });


        it('PROPERTY: Valid refund amount (1 to amount) should succeed', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 100000 }), // payment amount
                    fc.integer({ min: 1, max: 100 }),      // refund percentage
                    fc.string({ minLength: 1, maxLength: 100 }), // reason
                    (amount, refundPercentage, reason) => {
                        const refundAmount = Math.floor((amount * refundPercentage) / 100);
                        fc.pre(refundAmount > 0 && refundAmount <= amount);

                        const payment = createPayment({
                            paymentStatus: PaymentStatus.SUCCESS,
                            amount,
                        });

                        payment.refund(refundAmount, reason);

                        expect(payment.paymentStatus).toBe(PaymentStatus.REFUNDED);
                        expect(payment.refundAmount).toBe(refundAmount);
                        expect(payment.refundReason).toBe(reason);
                        expect(payment.refundDate).toBeInstanceOf(Date);
                    }
                ),
                { numRuns: 200 }
            );
        });

        it('PROPERTY: Zero or negative refund always throws', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: -100000, max: 0 }),
                    (invalidAmount) => {
                        const payment = createPayment({
                            paymentStatus: PaymentStatus.SUCCESS,
                            amount: 100000,
                        });

                        expect(() => payment.refund(invalidAmount, 'reason')).toThrow(
                            'Refund amount must be positive'
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ===== Property: Factory Methods =====

    describe('Factory Method Properties', () => {
        it('PROPERTY: createCashPayment always creates PENDING CASH payment', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),      // invoiceId
                    positiveAmountArb,                      // amount
                    fc.integer({ min: 1, max: 1000 }),     // receivedBy
                    fc.option(fc.string({ maxLength: 200 })), // notes
                    (invoiceId, amount, receivedBy, notes) => {
                        const payment = Payment.createCashPayment({
                            invoiceId,
                            amount,
                            receivedBy,
                            notes: notes ?? undefined,
                        });

                        expect(payment.invoiceId).toBe(invoiceId);
                        expect(payment.amount).toBe(amount);
                        expect(payment.paymentMethod).toBe(PaymentMethod.CASH);
                        expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
                        expect(payment.receivedBy).toBe(receivedBy);
                        expect(payment.transactionId).toBeNull();
                        expect(payment.idempotencyKey).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: createOnlinePayment always creates PENDING payment with idempotency key', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),        // invoiceId
                    positiveAmountArb,                        // amount
                    onlinePaymentMethodArb,                   // method
                    fc.string({ minLength: 1, maxLength: 50 }), // idempotencyKey
                    (invoiceId, amount, method, idempotencyKey) => {
                        const payment = Payment.createOnlinePayment({
                            invoiceId,
                            amount,
                            paymentMethod: method,
                            idempotencyKey,
                        });

                        expect(payment.invoiceId).toBe(invoiceId);
                        expect(payment.amount).toBe(amount);
                        expect(payment.paymentMethod).toBe(method);
                        expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
                        expect(payment.idempotencyKey).toBe(idempotencyKey);
                        expect(payment.receivedBy).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ===== Property: Status Helpers =====

    describe('Status Helper Properties', () => {
        it('PROPERTY: isSuccess/isFailed/isRefunded are mutually exclusive', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        PaymentStatus.PENDING,
                        PaymentStatus.PROCESSING,
                        PaymentStatus.SUCCESS,
                        PaymentStatus.FAILED,
                        PaymentStatus.REFUNDED
                    ),
                    (status) => {
                        const payment = createPayment({ paymentStatus: status });

                        const trueCount = [
                            payment.isSuccess(),
                            payment.isFailed(),
                            payment.isRefunded(),
                        ].filter(Boolean).length;

                        // At most one of them is true
                        expect(trueCount).toBeLessThanOrEqual(1);

                        // If status is one of the terminal states, exactly one is true
                        if ([PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED].includes(status)) {
                            expect(trueCount).toBe(1);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ===== Property: Complete Flow Invariants =====

    describe('Flow Invariants', () => {
        it('PROPERTY: Successful online payment always has transactionId and gatewayResponse', () => {
            fc.assert(
                fc.property(
                    onlinePaymentMethodArb,
                    positiveAmountArb,
                    fc.string({ minLength: 5, maxLength: 50 }), // transactionId
                    fc.record({ responseCode: fc.string() }),   // gatewayResponse
                    (method, amount, transactionId, gatewayResponse) => {
                        const payment = createPayment({
                            paymentMethod: method,
                            paymentStatus: PaymentStatus.PENDING,
                            amount,
                        });

                        payment.startOnlinePayment();
                        payment.markSuccess(transactionId, gatewayResponse);

                        expect(payment.transactionId).toBe(transactionId);
                        expect(payment.gatewayResponse).toEqual(gatewayResponse);
                        expect(payment.paidAt).toBeInstanceOf(Date);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: Failed payment has gatewayResponse but no transactionId', () => {
            fc.assert(
                fc.property(
                    onlinePaymentMethodArb,
                    fc.record({ errorCode: fc.string() }),
                    (method, gatewayResponse) => {
                        const payment = createPayment({
                            paymentMethod: method,
                            paymentStatus: PaymentStatus.PENDING,
                        });

                        payment.startOnlinePayment();
                        payment.markFailed(gatewayResponse);

                        expect(payment.transactionId).toBeNull();
                        expect(payment.gatewayResponse).toEqual(gatewayResponse);
                        expect(payment.paidAt).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

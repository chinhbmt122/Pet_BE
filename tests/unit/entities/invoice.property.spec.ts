/**
 * Invoice Entity Property-Based Tests
 *
 * Uses fast-check for property-based testing to discover edge cases
 * that might be missed by traditional example-based tests.
 */

import * as fc from 'fast-check';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';

describe('Invoice Entity - Property-Based Tests', () => {
    /**
     * Factory function to create Invoice instances
     */
    function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
        const invoice = new Invoice();
        invoice.invoiceId = overrides.invoiceId ?? 1;
        invoice.invoiceNumber = overrides.invoiceNumber ?? 'INV-001';
        invoice.appointmentId = overrides.appointmentId ?? 1;
        invoice.issueDate = overrides.issueDate ?? new Date();
        invoice.subtotal = overrides.subtotal ?? 100;
        invoice.discount = overrides.discount ?? 0;
        invoice.tax = overrides.tax ?? 0;
        invoice.totalAmount = overrides.totalAmount ?? 100;
        invoice.status = overrides.status ?? InvoiceStatus.PENDING;
        return invoice;
    }

    // ===== Property: State Transition Completeness =====

    describe('State Machine Properties', () => {
        it('PROPERTY: Any PENDING invoice can transition to exactly two states', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 1000000 }), // invoiceId
                    fc.integer({ min: 1, max: 1000000 }), // amount
                    (invoiceId, amount) => {
                        const invoice = createInvoice({
                            invoiceId,
                            totalAmount: amount,
                            status: InvoiceStatus.PENDING,
                        });

                        // Can go to PAID (cash) or PROCESSING_ONLINE
                        expect(invoice.canPayByCash()).toBe(true);
                        expect(invoice.canStartOnlinePayment()).toBe(true);

                        // Cannot go to FAILED from PENDING
                        expect(invoice.canMarkPaid()).toBe(false);
                        expect(invoice.canMarkFailed()).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: PROCESSING_ONLINE can transition to PAID, FAILED, or retry online', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 1000000 }), (invoiceId) => {
                    const invoice = createInvoice({
                        invoiceId,
                        status: InvoiceStatus.PROCESSING_ONLINE,
                    });

                    // Can go to PAID or FAILED
                    expect(invoice.canMarkPaid()).toBe(true);
                    expect(invoice.canMarkFailed()).toBe(true);

                    // Cannot pay by cash from PROCESSING
                    expect(invoice.canPayByCash()).toBe(false);

                    // CAN retry online payment (new behavior)
                    expect(invoice.canStartOnlinePayment()).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: PAID blocks all transitions, FAILED allows online retry', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(InvoiceStatus.PAID, InvoiceStatus.FAILED),
                    (terminalStatus) => {
                        const invoice = createInvoice({ status: terminalStatus });

                        // These should always be blocked
                        expect(invoice.canPayByCash()).toBe(false);
                        expect(invoice.canMarkPaid()).toBe(false);
                        expect(invoice.canMarkFailed()).toBe(false);

                        // PAID blocks online retry, FAILED allows it
                        if (terminalStatus === InvoiceStatus.PAID) {
                            expect(invoice.canStartOnlinePayment()).toBe(false);
                        } else {
                            expect(invoice.canStartOnlinePayment()).toBe(true);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ===== Property: Financial Calculations =====

    describe('Financial Calculation Properties', () => {
        it('PROPERTY: totalAmount = subtotal - discount + tax (always)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000000 }), // subtotal
                    fc.integer({ min: 0, max: 100000 }),  // discount
                    fc.integer({ min: 0, max: 100000 }),  // tax
                    (subtotal, discount, tax) => {
                        // Skip impossible cases where discount > subtotal
                        fc.pre(discount <= subtotal);

                        const invoice = createInvoice({
                            subtotal,
                            discount: 0,
                            tax: 0,
                            totalAmount: subtotal,
                            status: InvoiceStatus.PENDING,
                        });

                        invoice.applyDiscount(discount);
                        invoice.updateTax(tax);

                        expect(invoice.totalAmount).toBe(subtotal - discount + tax);
                    }
                ),
                { numRuns: 200 }
            );
        });

        it('PROPERTY: Discount can never be negative', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: -1000000, max: -1 }), // negative discount
                    (negativeDiscount) => {
                        const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                        expect(() => invoice.applyDiscount(negativeDiscount)).toThrow(
                            'Discount cannot be negative'
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: Tax can never be negative', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: -1000000, max: -1 }), // negative tax
                    (negativeTax) => {
                        const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                        expect(() => invoice.updateTax(negativeTax)).toThrow(
                            'Tax cannot be negative'
                        );
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ===== Property: State Consistency =====

    describe('State Consistency Properties', () => {
        it('PROPERTY: Once PAID, paidAt is always set', () => {
            fc.assert(
                fc.property(fc.boolean(), (useCashPath) => {
                    const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                    if (useCashPath) {
                        invoice.payByCash();
                    } else {
                        invoice.startOnlinePayment();
                        invoice.markPaid();
                    }

                    expect(invoice.status).toBe(InvoiceStatus.PAID);
                    expect(invoice.paidAt).toBeInstanceOf(Date);
                }),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: isPaid() is true if and only if status is PAID', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        InvoiceStatus.PENDING,
                        InvoiceStatus.PROCESSING_ONLINE,
                        InvoiceStatus.PAID,
                        InvoiceStatus.FAILED
                    ),
                    (status) => {
                        const invoice = createInvoice({ status });

                        if (status === InvoiceStatus.PAID) {
                            expect(invoice.isPaid()).toBe(true);
                        } else {
                            expect(invoice.isPaid()).toBe(false);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: isFailed() is true if and only if status is FAILED', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        InvoiceStatus.PENDING,
                        InvoiceStatus.PROCESSING_ONLINE,
                        InvoiceStatus.PAID,
                        InvoiceStatus.FAILED
                    ),
                    (status) => {
                        const invoice = createInvoice({ status });

                        if (status === InvoiceStatus.FAILED) {
                            expect(invoice.isFailed()).toBe(true);
                        } else {
                            expect(invoice.isFailed()).toBe(false);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ===== Property: Overdue Logic =====

    describe('Overdue Properties', () => {
        it('PROPERTY: PAID invoices are never overdue', () => {
            fc.assert(
                fc.property(
                    fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
                    (issueDate) => {
                        const invoice = createInvoice({
                            status: InvoiceStatus.PAID,
                            issueDate,
                        });

                        expect(invoice.isOverdue()).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('PROPERTY: Recent invoices (< 30 days) are not overdue', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 29 }), // days ago
                    (daysAgo) => {
                        const issueDate = new Date();
                        issueDate.setDate(issueDate.getDate() - daysAgo);

                        const invoice = createInvoice({
                            status: InvoiceStatus.PENDING,
                            issueDate,
                        });

                        expect(invoice.isOverdue()).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('PROPERTY: Old unpaid invoices (> 30 days) are overdue', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 31, max: 365 }), // days ago
                    fc.constantFrom(InvoiceStatus.PENDING, InvoiceStatus.FAILED),
                    (daysAgo, status) => {
                        const issueDate = new Date();
                        issueDate.setDate(issueDate.getDate() - daysAgo);

                        const invoice = createInvoice({
                            status,
                            issueDate,
                        });

                        expect(invoice.isOverdue()).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ===== Property: Idempotency =====

    describe('Idempotency Properties', () => {
        it('PROPERTY: Applying same discount twice should not change result', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 1000 }), // subtotal
                    fc.integer({ min: 0, max: 50 }),     // discount
                    (subtotal, discount) => {
                        const invoice1 = createInvoice({
                            subtotal,
                            totalAmount: subtotal,
                            status: InvoiceStatus.PENDING,
                        });
                        const invoice2 = createInvoice({
                            subtotal,
                            totalAmount: subtotal,
                            status: InvoiceStatus.PENDING,
                        });

                        // Apply discount once vs twice
                        invoice1.applyDiscount(discount);
                        invoice2.applyDiscount(discount);
                        invoice2.applyDiscount(discount); // Second application

                        // Both should have same final state
                        expect(invoice1.discount).toBe(invoice2.discount);
                        expect(invoice1.totalAmount).toBe(invoice2.totalAmount);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

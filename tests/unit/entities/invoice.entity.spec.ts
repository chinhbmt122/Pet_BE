/**
 * Invoice Entity Unit Tests
 *
 * Tests the domain logic of the Invoice entity without any mocking.
 * These tests verify state transitions, guard methods, and business rules.
 */

import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';

describe('Invoice Entity - Domain Logic', () => {
    /**
     * Factory function to create Invoice instances for testing
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

    // ===== State Machine Tests =====

    describe('State Transitions', () => {
        describe('payByCash()', () => {
            it('should transition from PENDING to PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                invoice.payByCash();

                expect(invoice.status).toBe(InvoiceStatus.PAID);
                expect(invoice.paidAt).toBeInstanceOf(Date);
            });

            it('should throw when status is PROCESSING_ONLINE', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PROCESSING_ONLINE });

                expect(() => invoice.payByCash()).toThrow(
                    'Cannot pay by cash: current status is PROCESSING_ONLINE, expected PENDING'
                );
            });

            it('should throw when status is PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.payByCash()).toThrow(
                    'Cannot pay by cash: current status is PAID, expected PENDING'
                );
            });

            it('should throw when status is FAILED', () => {
                const invoice = createInvoice({ status: InvoiceStatus.FAILED });

                expect(() => invoice.payByCash()).toThrow(
                    'Cannot pay by cash: current status is FAILED, expected PENDING'
                );
            });
        });

        describe('startOnlinePayment()', () => {
            it('should transition from PENDING to PROCESSING_ONLINE', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                invoice.startOnlinePayment();

                expect(invoice.status).toBe(InvoiceStatus.PROCESSING_ONLINE);
            });

            it('should throw when not PENDING', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.startOnlinePayment()).toThrow(
                    'Cannot start online payment: current status is PAID, expected PENDING'
                );
            });
        });

        describe('markPaid()', () => {
            it('should transition from PROCESSING_ONLINE to PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PROCESSING_ONLINE });

                invoice.markPaid();

                expect(invoice.status).toBe(InvoiceStatus.PAID);
                expect(invoice.paidAt).toBeInstanceOf(Date);
            });

            it('should throw when not PROCESSING_ONLINE', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                expect(() => invoice.markPaid()).toThrow(
                    'Cannot mark as paid: current status is PENDING, expected PROCESSING_ONLINE'
                );
            });
        });

        describe('markFailed()', () => {
            it('should transition from PROCESSING_ONLINE to FAILED', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PROCESSING_ONLINE });

                invoice.markFailed();

                expect(invoice.status).toBe(InvoiceStatus.FAILED);
            });

            it('should throw when not PROCESSING_ONLINE', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                expect(() => invoice.markFailed()).toThrow(
                    'Cannot mark as failed: current status is PENDING, expected PROCESSING_ONLINE'
                );
            });
        });

        describe('markAsPaid() (convenience method)', () => {
            it('should work from PENDING (cash path)', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                invoice.markAsPaid();

                expect(invoice.status).toBe(InvoiceStatus.PAID);
            });

            it('should work from PROCESSING_ONLINE (callback path)', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PROCESSING_ONLINE });

                invoice.markAsPaid();

                expect(invoice.status).toBe(InvoiceStatus.PAID);
            });

            it('should throw from PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.markAsPaid()).toThrow(
                    'Cannot mark as paid: current status is PAID'
                );
            });

            it('should accept custom paidAt date', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });
                const customDate = new Date('2025-01-01');

                invoice.markAsPaid(customDate);

                expect(invoice.paidAt).toEqual(customDate);
            });
        });
    });

    // ===== Guard Methods =====

    describe('Guard Methods', () => {
        describe('canPayByCash()', () => {
            it('should return true when PENDING', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });
                expect(invoice.canPayByCash()).toBe(true);
            });

            it.each([
                InvoiceStatus.PROCESSING_ONLINE,
                InvoiceStatus.PAID,
                InvoiceStatus.FAILED,
            ])('should return false when %s', (status) => {
                const invoice = createInvoice({ status });
                expect(invoice.canPayByCash()).toBe(false);
            });
        });

        describe('canStartOnlinePayment()', () => {
            it.each([
                InvoiceStatus.PENDING,
                InvoiceStatus.PROCESSING_ONLINE,  // Can retry
                InvoiceStatus.FAILED,  // Can retry after failure
            ])('should return true when %s', (status) => {
                const invoice = createInvoice({ status });
                expect(invoice.canStartOnlinePayment()).toBe(true);
            });

            it('should return false when PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });
                expect(invoice.canStartOnlinePayment()).toBe(false);
            });
        });

        describe('canMarkPaid()', () => {
            it('should return true when PROCESSING_ONLINE', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PROCESSING_ONLINE });
                expect(invoice.canMarkPaid()).toBe(true);
            });

            it.each([
                InvoiceStatus.PENDING,
                InvoiceStatus.PAID,
                InvoiceStatus.FAILED,
            ])('should return false when %s', (status) => {
                const invoice = createInvoice({ status });
                expect(invoice.canMarkPaid()).toBe(false);
            });
        });

        describe('isPaid() / isFailed()', () => {
            it('isPaid should return true only when PAID', () => {
                expect(createInvoice({ status: InvoiceStatus.PAID }).isPaid()).toBe(true);
                expect(createInvoice({ status: InvoiceStatus.PENDING }).isPaid()).toBe(false);
            });

            it('isFailed should return true only when FAILED', () => {
                expect(createInvoice({ status: InvoiceStatus.FAILED }).isFailed()).toBe(true);
                expect(createInvoice({ status: InvoiceStatus.PENDING }).isFailed()).toBe(false);
            });
        });
    });

    // ===== Business Logic =====

    describe('Business Logic', () => {
        describe('applyDiscount()', () => {
            it('should apply discount and recalculate total', () => {
                const invoice = createInvoice({
                    status: InvoiceStatus.PENDING,
                    subtotal: 100,
                    discount: 0,
                    tax: 10,
                    totalAmount: 110,
                });

                invoice.applyDiscount(20);

                expect(invoice.discount).toBe(20);
                expect(invoice.totalAmount).toBe(90); // 100 - 20 + 10
            });

            it('should throw when not PENDING', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.applyDiscount(10)).toThrow(
                    'Can only apply discount to pending invoices'
                );
            });

            it('should throw for negative discount', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                expect(() => invoice.applyDiscount(-10)).toThrow(
                    'Discount cannot be negative'
                );
            });
        });

        describe('updateTax()', () => {
            it('should update tax and recalculate total', () => {
                const invoice = createInvoice({
                    status: InvoiceStatus.PENDING,
                    subtotal: 100,
                    discount: 10,
                    tax: 0,
                    totalAmount: 90,
                });

                invoice.updateTax(15);

                expect(invoice.tax).toBe(15);
                expect(invoice.totalAmount).toBe(105); // 100 - 10 + 15
            });

            it('should throw when not PENDING', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.updateTax(10)).toThrow(
                    'Can only update tax for pending invoices'
                );
            });

            it('should throw for negative tax', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                expect(() => invoice.updateTax(-10)).toThrow(
                    'Tax cannot be negative'
                );
            });
        });

        describe('updateNotes()', () => {
            it('should update notes when not PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });

                invoice.updateNotes('New notes');

                expect(invoice.notes).toBe('New notes');
            });

            it('should throw when PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });

                expect(() => invoice.updateNotes('New notes')).toThrow(
                    'Cannot update notes for paid invoice'
                );
            });

            it('should accept null notes', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PENDING });
                invoice.notes = 'Old notes';

                invoice.updateNotes(null);

                expect(invoice.notes).toBeNull();
            });
        });

        describe('isOverdue()', () => {
            it('should return false when PAID', () => {
                const invoice = createInvoice({ status: InvoiceStatus.PAID });
                expect(invoice.isOverdue()).toBe(false);
            });

            it('should return false when issued less than 30 days ago', () => {
                const invoice = createInvoice({
                    status: InvoiceStatus.PENDING,
                    issueDate: new Date(), // Today
                });
                expect(invoice.isOverdue()).toBe(false);
            });

            it('should return true when issued more than 30 days ago and unpaid', () => {
                const thirtyOneDaysAgo = new Date();
                thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

                const invoice = createInvoice({
                    status: InvoiceStatus.PENDING,
                    issueDate: thirtyOneDaysAgo,
                });

                expect(invoice.isOverdue()).toBe(true);
            });
        });
    });

    // ===== State Machine Diagram =====

    describe('Complete State Machine', () => {
        /**
         * Invoice State Machine:
         *
         *   ┌─────────┐
         *   │ PENDING │
         *   └────┬────┘
         *        │
         *   ┌────┴────┬─────────────────┐
         *   │         │                 │
         *   ▼         ▼                 │
         * payByCash  startOnlinePayment │
         *   │         │                 │
         *   │    ┌────▼────────────┐    │
         *   │    │PROCESSING_ONLINE│    │
         *   │    └────┬─────┬──────┘    │
         *   │         │     │           │
         *   │    markPaid   markFailed  │
         *   │         │     │           │
         *   ▼         ▼     ▼           │
         * ┌────┐   ┌────┐ ┌──────┐      │
         * │PAID│   │PAID│ │FAILED│      │
         * └────┘   └────┘ └──────┘      │
         */

        it('should support complete cash payment flow', () => {
            const invoice = createInvoice();

            expect(invoice.status).toBe(InvoiceStatus.PENDING);
            expect(invoice.canPayByCash()).toBe(true);

            invoice.payByCash();

            expect(invoice.status).toBe(InvoiceStatus.PAID);
            expect(invoice.isPaid()).toBe(true);
        });

        it('should support complete online payment success flow', () => {
            const invoice = createInvoice();

            // Step 1: Start online payment
            expect(invoice.canStartOnlinePayment()).toBe(true);
            invoice.startOnlinePayment();
            expect(invoice.status).toBe(InvoiceStatus.PROCESSING_ONLINE);

            // Step 2: Mark as paid (after callback)
            expect(invoice.canMarkPaid()).toBe(true);
            invoice.markPaid();
            expect(invoice.status).toBe(InvoiceStatus.PAID);
            expect(invoice.isPaid()).toBe(true);
        });

        it('should support complete online payment failure flow', () => {
            const invoice = createInvoice();

            // Step 1: Start online payment
            invoice.startOnlinePayment();
            expect(invoice.status).toBe(InvoiceStatus.PROCESSING_ONLINE);

            // Step 2: Mark as failed (after callback)
            expect(invoice.canMarkFailed()).toBe(true);
            invoice.markFailed();
            expect(invoice.status).toBe(InvoiceStatus.FAILED);
            expect(invoice.isFailed()).toBe(true);
        });
    });
});

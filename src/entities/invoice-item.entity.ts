import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

/**
 * InvoiceItem Entity
 *
 * Represents individual line items in an invoice.
 * Each item represents a service or product with quantity and pricing.
 */
@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('increment')
  itemId: number;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  itemType: string; // 'SERVICE', 'PRODUCT', 'FEE', 'DISCOUNT'

  @Column({ type: 'int', nullable: true })
  serviceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== Business Logic Methods =====

  /**
   * Calculate amount from quantity and unit price
   */
  calculateAmount(): void {
    this.amount = this.quantity * Number(this.unitPrice);
  }

  /**
   * Update quantity and recalculate amount
   */
  updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    this.quantity = quantity;
    this.calculateAmount();
  }

  /**
   * Update unit price and recalculate amount
   */
  updateUnitPrice(unitPrice: number): void {
    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
    this.unitPrice = unitPrice;
    this.calculateAmount();
  }
}

/**
 * Entity Type Definitions
 *
 * Centralized type definitions for all entity enums.
 * This file maintains all enum types used across entity models.
 */

/**
 * User Type Enum
 * Defines the different types of users in the system
 */
export enum UserType {
  PET_OWNER = 'PET_OWNER',
  MANAGER = 'MANAGER',
  VETERINARIAN = 'VETERINARIAN',
  CARE_STAFF = 'CARE_STAFF',
  RECEPTIONIST = 'RECEPTIONIST',
}

/**
 * Appointment Status Enum
 * Defines the lifecycle states of an appointment
 */
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment Method Enum
 * Defines the available payment methods
 */
export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
}

/**
 * Payment Status Enum
 * Defines the lifecycle states of a payment
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Invoice Status Enum
 * Defines the lifecycle states of an invoice
 */
export enum InvoiceStatus {
  PENDING = 'PENDING',
  PROCESSING_ONLINE = 'PROCESSING_ONLINE',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

/**
 * Audit Operation Enum
 * Defines the types of database operations that can be audited
 */
export enum AuditOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Actor Type Enum
 * Defines the types of actors that can perform audited actions
 */
export enum ActorType {
  EMPLOYEE = 'EMPLOYEE',
  PET_OWNER = 'PET_OWNER',
  SYSTEM = 'SYSTEM',
  WEBHOOK = 'WEBHOOK',
}

/**
 * Vaccine Category Enum
 * Defines the classification of vaccines
 */
export enum VaccineCategory {
  CORE = 'Core',
  NON_CORE = 'Non-core',
  OPTIONAL = 'Optional',
}

/**
 * Cage Size Enum
 * Defines the available cage sizes for boarding
 */
export enum CageSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

/**
 * Cage Status Enum
 * Defines the lifecycle states of a cage
 */
export enum CageStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

/**
 * Cage Assignment Status Enum
 * Defines the lifecycle states of a cage assignment
 */
export enum CageAssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

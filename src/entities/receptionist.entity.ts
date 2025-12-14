import { ChildEntity } from 'typeorm';
import { Employee } from './employee.entity';

/**
 * Receptionist Entity
 *
 * Child entity of Employee for front desk staff.
 * Uses common Employee fields only.
 */
@ChildEntity('RECEPTIONIST')
export class Receptionist extends Employee {
  // Receptionist uses common Employee fields only
  // No additional fields required
}

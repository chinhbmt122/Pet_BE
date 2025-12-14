import { ChildEntity } from 'typeorm';
import { Employee } from './employee.entity';

/**
 * Manager Entity
 *
 * Child entity of Employee for management staff.
 * Uses common Employee fields only.
 */
@ChildEntity('MANAGER')
export class Manager extends Employee {
  // Manager uses common Employee fields only
  // No additional fields required
}

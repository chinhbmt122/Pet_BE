import { ChildEntity, Column } from 'typeorm';
import { Employee } from './employee.entity';

/**
 * CareStaff Entity
 *
 * Child entity of Employee for care/grooming staff.
 * Has additional skills array for grooming capabilities.
 */
@ChildEntity('CARE_STAFF')
export class CareStaff extends Employee {
  /**
   * Array of skills the care staff possesses
   * e.g., ['bathing', 'grooming', 'spa', 'nail_trimming']
   */
  @Column({ type: 'simple-array', nullable: true })
  skills: string[];
}

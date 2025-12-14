import { Injectable } from '@nestjs/common';
import { Veterinarian } from '../entities/veterinarian.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';
import { EmployeeCreateProps } from '../domain/employee.domain';

/**
 * EmployeeFactory - Creates Employee entities
 * KISS: One shared interface, simple helper method
 */
@Injectable()
export class EmployeeFactory {
  private setBase(
    employee: Veterinarian | CareStaff | Manager | Receptionist,
    props: EmployeeCreateProps,
  ): void {
    employee.accountId = props.accountId;
    employee.fullName = props.fullName;
    employee.phoneNumber = props.phoneNumber;
    employee.address = props.address;
    employee.hireDate = props.hireDate;
    employee.salary = props.salary;
    employee.isAvailable = true;
  }

  createVeterinarian(
    props: EmployeeCreateProps & { licenseNumber: string; expertise?: string },
  ): Veterinarian {
    const e = new Veterinarian();
    this.setBase(e, props);
    e.licenseNumber = props.licenseNumber;
    e.expertise = props.expertise ?? '';
    return e;
  }

  createCareStaff(
    props: EmployeeCreateProps & { skills?: string[] },
  ): CareStaff {
    const e = new CareStaff();
    this.setBase(e, props);
    e.skills = props.skills ?? [];
    return e;
  }

  createManager(props: EmployeeCreateProps): Manager {
    const e = new Manager();
    this.setBase(e, props);
    return e;
  }

  createReceptionist(props: EmployeeCreateProps): Receptionist {
    const e = new Receptionist();
    this.setBase(e, props);
    return e;
  }
}

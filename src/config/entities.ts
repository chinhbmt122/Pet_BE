import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { Manager } from '../entities/manager.entity';
import { Receptionist } from '../entities/receptionist.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Pet } from '../entities/pet.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Service } from '../entities/service.entity';
import { Cage } from '../entities/cage.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentService } from '../entities/appointment-service.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import { VaccinationHistory } from '../entities/vaccination-history.entity';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { PaymentGatewayArchive } from '../entities/payment-gateway-archive.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EmailLog } from '../entities/email-log.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

export const entitiesOrdered = [
  Account,
  Employee,
  CareStaff,
  Veterinarian,
  Manager,
  Receptionist,
  PetOwner,
  Pet,
  ServiceCategory,
  Service,
  Cage,
  CageAssignment,
  WorkSchedule,
  Appointment,
  AppointmentService,
  MedicalRecord,
  VaccineType,
  VaccinationHistory,
  Payment,
  Invoice,
  InvoiceItem,
  PaymentGatewayArchive,
  AuditLog,
  EmailLog,
  PasswordResetToken,
];

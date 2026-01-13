import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '../../entities/types/entity.types';
import { Invoice } from '../../entities/invoice.entity';
import { PetResponseDto } from '../pet/pet-response.dto';
import { PetOwnerResponseDto } from '../pet-owner/pet-owner-response.dto';
import { AppointmentStatus } from '../../entities/types/entity.types';
import { InvoiceItemDto } from '../invoice-item.dto';

/**
 * Appointment DTO for invoice response
 */
export class AppointmentDto {
  @ApiProperty({ description: 'Appointment ID' })
  appointmentId: number;

  @ApiProperty({ description: 'Pet ID' })
  petId: number;

  @ApiProperty({ description: 'Employee ID' })
  employeeId: number;

  @ApiProperty({
    description: 'Service IDs for this appointment',
    type: [Number],
  })
  serviceIds: number[];

  @ApiProperty({ description: 'Appointment date' })
  appointmentDate: Date;

  @ApiProperty({ description: 'Start time' })
  startTime: string;

  @ApiProperty({ description: 'End time' })
  endTime: string;

  @ApiProperty({ description: 'Appointment status', enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;
}

/**
 * Invoice Response DTO
 *
 * Returned from invoice endpoints.
 * Includes factory method for conversion from entity.
 */
export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID', example: 1 })
  invoiceId: number;

  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Appointment ID', example: 1 })
  appointmentId: number;

  @ApiProperty({
    description: 'Unique invoice number',
    example: 'INV-20241218-00001',
  })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice issue date', example: '2024-12-18' })
  issueDate: Date;

  @ApiProperty({ description: 'Subtotal amount', example: 500000 })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount', example: 50000 })
  discount: number;

  @ApiProperty({ description: 'Tax amount', example: 45000 })
  tax: number;

  @ApiProperty({ description: 'Total amount', example: 495000 })
  totalAmount: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Service completed',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-12-18T10:30:00Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-12-18T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-12-18T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Appointment details (if included)',
    type: () => AppointmentDto,
  })
  appointment?: AppointmentDto;

  @ApiPropertyOptional({
    description: 'Pet owner details (if included)',
    type: () => PetOwnerResponseDto,
  })
  petOwner?: PetOwnerResponseDto;

  @ApiPropertyOptional({
    description: 'Pet details (if included)',
    type: () => PetResponseDto,
  })
  pet?: PetResponseDto;

  @ApiProperty({
    description: 'All services in this appointment',
    type: 'array',
  })
  services: Array<{
    serviceId: number;
    serviceName: string;
    basePrice: number;
    description?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Invoice line items (if included)',
    type: [InvoiceItemDto],
  })
  items?: InvoiceItemDto[];

  /**
   * Factory method to convert entity to DTO
   */
  static fromEntity(entity: Invoice): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.invoiceId = entity.invoiceId;
    dto.status = entity.status;
    dto.appointmentId = entity.appointmentId;
    dto.invoiceNumber = entity.invoiceNumber;
    dto.issueDate = entity.issueDate;
    dto.subtotal = Number(entity.subtotal);
    dto.discount = Number(entity.discount);
    dto.tax = Number(entity.tax);
    dto.totalAmount = Number(entity.totalAmount);
    dto.notes = entity.notes;
    dto.paidAt = entity.paidAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    // Include related entities if they're loaded
    if (entity.appointment) {
      // Get all service IDs from appointmentServices
      const serviceIds = (entity.appointment.appointmentServices || []).map(
        (as) => as.serviceId,
      );

      dto.appointment = {
        appointmentId: entity.appointment.appointmentId,
        petId: entity.appointment.petId,
        employeeId: entity.appointment.employeeId,
        serviceIds,
        appointmentDate: entity.appointment.appointmentDate,
        startTime: entity.appointment.startTime,
        endTime: entity.appointment.endTime,
        status: entity.appointment.status,
        notes: entity.appointment.notes,
      };

      // Include pet if loaded
      if (entity.appointment.pet) {
        dto.pet = {
          id: entity.appointment.pet.petId,
          ownerId: entity.appointment.pet.ownerId,
          name: entity.appointment.pet.name,
          species: entity.appointment.pet.species,
          breed: entity.appointment.pet.breed,
          birthDate: entity.appointment.pet.birthDate,
          gender: entity.appointment.pet.gender,
          weight: entity.appointment.pet.weight
            ? Number(entity.appointment.pet.weight)
            : null,
          color: entity.appointment.pet.color,
          // age: entity.appointment.pet.getAge(),
          createdAt: entity.appointment.pet.createdAt,
        };

        // Include pet owner if loaded
        if (entity.appointment.pet.owner) {
          dto.petOwner = {
            petOwnerId: entity.appointment.pet.owner.petOwnerId,
            accountId: entity.appointment.pet.owner.accountId,
            fullName: entity.appointment.pet.owner.fullName,
            phoneNumber: entity.appointment.pet.owner.phoneNumber,
            address: entity.appointment.pet.owner.address,
            preferredContactMethod:
              entity.appointment.pet.owner.preferredContactMethod,
            emergencyContact: entity.appointment.pet.owner.emergencyContact,
            registrationDate: entity.appointment.pet.owner.registrationDate,
            // createdAt: entity.appointment.pet.owner.createdAt,
            // updatedAt: entity.appointment.pet.owner.updatedAt,
          };
        }
      }

      // Include ALL services from appointmentServices
      dto.services = (entity.appointment.appointmentServices || [])
        .filter((as) => as.service)
        .map((as) => ({
          serviceId: as.service.serviceId,
          serviceName: as.service.serviceName,
          basePrice: Number(as.service.basePrice),
          description: as.service.description,
        }));
    }

    // Include invoice items if loaded
    if (entity.items && entity.items.length > 0) {
      dto.items = InvoiceItemDto.fromEntityList(entity.items);
    }

    return dto;
  }

  /**
   * Factory method to convert entity list to DTO list
   */
  static fromEntityList(entities: Invoice[]): InvoiceResponseDto[] {
    return entities.map((entity) => InvoiceResponseDto.fromEntity(entity));
  }
}

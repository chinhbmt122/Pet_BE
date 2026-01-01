import { Injectable } from '@nestjs/common';
import { I18nException } from '../utils/i18n-exception.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cage } from '../entities/cage.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';
import { Pet } from '../entities/pet.entity';
import { Employee } from '../entities/employee.entity';
import {
  CageStatus,
  CageAssignmentStatus,
} from '../entities/types/entity.types';
import { CreateCageDto, UpdateCageDto, AssignCageDto } from '../dto/cage';

/**
 * CageService (Pure Anemic Pattern)
 *
 * Manages cages and cage assignments for pet boarding.
 * Business logic and validation in service layer, no domain models.
 */
@Injectable()
export class CageService {
  constructor(
    @InjectRepository(Cage)
    private readonly cageRepository: Repository<Cage>,
    @InjectRepository(CageAssignment)
    private readonly assignmentRepository: Repository<CageAssignment>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  // ============================================
  // CAGE MANAGEMENT
  // ============================================

  /**
   * Creates a new cage
   */
  async createCage(dto: CreateCageDto): Promise<Cage> {
    // Check if cage number already exists
    const existing = await this.cageRepository.findOne({
      where: { cageNumber: dto.cageNumber },
    });
    if (existing) {
      I18nException.conflict('errors.conflict.cageNumber', {
        cageNumber: dto.cageNumber,
      });
    }

    const cage = this.cageRepository.create({
      ...dto,
      status: CageStatus.AVAILABLE,
    });

    return this.cageRepository.save(cage);
  }

  /**
   * Updates cage details
   */
  async updateCage(cageId: number, dto: UpdateCageDto): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    // Check cage number uniqueness if being updated
    if (dto.cageNumber && dto.cageNumber !== cage.cageNumber) {
      const existing = await this.cageRepository.findOne({
        where: { cageNumber: dto.cageNumber },
      });
      if (existing) {
        I18nException.conflict('errors.conflict.cageNumber', {
          cageNumber: dto.cageNumber,
        });
      }
    }

    Object.assign(cage, dto);
    return this.cageRepository.save(cage);
  }

  /**
   * Gets cage by ID
   */
  async getCageById(cageId: number): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }
    return cage;
  }

  /**
   * Gets all cages with optional filters
   */
  async getAllCages(filters?: {
    size?: string;
    isAvailable?: boolean;
  }): Promise<Cage[]> {
    const queryBuilder = this.cageRepository.createQueryBuilder('cage');

    if (filters?.size) {
      queryBuilder.andWhere('cage.size = :size', { size: filters.size });
    }

    if (filters?.isAvailable !== undefined) {
      if (filters.isAvailable) {
        queryBuilder.andWhere('cage.status = :status', {
          status: CageStatus.AVAILABLE,
        });
      } else {
        queryBuilder.andWhere('cage.status != :status', {
          status: CageStatus.AVAILABLE,
        });
      }
    }

    return queryBuilder.orderBy('cage.cageNumber', 'ASC').getMany();
  }

  /**
   * Gets available cages with optional filters
   */
  async getAvailableCages(filters?: {
    size?: string;
    dateRange?: string;
  }): Promise<Cage[]> {
    const queryBuilder = this.cageRepository
      .createQueryBuilder('cage')
      .where('cage.status = :status', { status: CageStatus.AVAILABLE });

    if (filters?.size) {
      queryBuilder.andWhere('cage.size = :size', { size: filters.size });
    }

    // Note: dateRange filtering would require checking cage assignments
    // For now, just return available cages by size

    return queryBuilder.orderBy('cage.cageNumber', 'ASC').getMany();
  }

  /**
   * Deletes a cage (soft delete by marking as inactive)
   */
  async deleteCage(cageId: number): Promise<void> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    // Check if cage has active assignments
    const activeAssignment = await this.assignmentRepository.findOne({
      where: {
        cageId,
        status: CageAssignmentStatus.ACTIVE,
      },
    });

    if (activeAssignment) {
      I18nException.badRequest(
        'errors.badRequest.cannotDeleteCageWithActiveAssignments',
        { cageNumber: cage.cageNumber },
      );
    }

    // Mark as out of service
    cage.status = CageStatus.OUT_OF_SERVICE;
    await this.cageRepository.save(cage);
  }

  // ============================================
  // CAGE ASSIGNMENTS
  // ============================================

  /**
   * Assigns a pet to a cage (check-in)
   */
  async assignPetToCage(
    cageId: number,
    dto: AssignCageDto,
  ): Promise<CageAssignment> {
    // Validate cage
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    if (cage.status !== CageStatus.AVAILABLE) {
      I18nException.badRequest('errors.badRequest.cageNotAvailable', {
        cageNumber: cage.cageNumber,
        status: cage.status,
      });
    }

    // Validate pet
    const pet = await this.petRepository.findOne({
      where: { petId: dto.petId },
    });
    if (!pet) {
      I18nException.notFound('errors.notFound.pet', { id: dto.petId });
    }

    // Check if pet already has an active assignment
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        petId: dto.petId,
        status: CageAssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignment) {
      I18nException.badRequest(
        'errors.badRequest.petAlreadyHasActiveAssignment',
        { petName: pet.name },
      );
    }

    // Validate employee if provided
    if (dto.assignedById) {
      const employee = await this.employeeRepository.findOne({
        where: { employeeId: dto.assignedById },
      });
      if (!employee) {
        I18nException.notFound('errors.notFound.employee', {
          id: dto.assignedById,
        });
      }
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      cageId,
      petId: dto.petId,
      checkInDate: new Date(dto.checkInDate),
      expectedCheckOutDate: dto.expectedCheckOutDate
        ? new Date(dto.expectedCheckOutDate)
        : null,
      dailyRate: dto.dailyRate ?? cage.dailyRate,
      assignedById: dto.assignedById ?? null,
      notes: dto.notes ?? null,
      status: CageAssignmentStatus.ACTIVE,
    });

    const saved = await this.assignmentRepository.save(assignment);

    // Update cage status to occupied
    cage.status = CageStatus.OCCUPIED;
    await this.cageRepository.save(cage);

    return saved;
  }

  /**
   * Checks out a pet from cage (updates assignment and frees cage)
   */
  async checkOutPet(
    assignmentId: number,
    checkOutDate?: string,
  ): Promise<CageAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignmentId },
      relations: ['cage'],
    });

    if (!assignment) {
      I18nException.notFound('errors.notFound.assignment', {
        id: assignmentId,
      });
    }

    if (assignment.status !== CageAssignmentStatus.ACTIVE) {
      I18nException.badRequest('errors.badRequest.assignmentNotActive', {
        status: assignment.status,
      });
    }

    // Update assignment
    assignment.actualCheckOutDate = checkOutDate
      ? new Date(checkOutDate)
      : new Date();
    assignment.status = CageAssignmentStatus.COMPLETED;
    const saved = await this.assignmentRepository.save(assignment);

    // Free up the cage
    if (assignment.cage) {
      assignment.cage.status = CageStatus.AVAILABLE;
      await this.cageRepository.save(assignment.cage);
    }

    return saved;
  }

  /**
   * Gets all assignments for a cage
   */
  async getCageAssignments(cageId: number): Promise<CageAssignment[]> {
    return this.assignmentRepository.find({
      where: { cageId },
      relations: ['pet'],
      order: { checkInDate: 'DESC' },
    });
  }

  /**
   * Gets active assignment for a cage
   */
  async getActiveCageAssignment(
    cageId: number,
  ): Promise<CageAssignment | null> {
    return this.assignmentRepository.findOne({
      where: {
        cageId,
        status: CageAssignmentStatus.ACTIVE,
      },
      relations: ['pet', 'assignedBy'],
    });
  }

  /**
   * Gets all assignments for a pet
   */
  async getPetAssignments(petId: number): Promise<CageAssignment[]> {
    return this.assignmentRepository.find({
      where: { petId },
      relations: ['cage'],
      order: { checkInDate: 'DESC' },
    });
  }

  /**
   * Gets all active assignments
   */
  async getAllActiveAssignments(): Promise<CageAssignment[]> {
    return this.assignmentRepository.find({
      where: { status: CageAssignmentStatus.ACTIVE },
      relations: ['cage', 'pet', 'pet.owner'],
      order: { checkInDate: 'ASC' },
    });
  }

  /**
   * Calculates total cost for an assignment
   */
  calculateAssignmentCost(assignment: CageAssignment): number {
    if (!assignment.actualCheckOutDate) {
      return 0; // Not checked out yet
    }

    const checkIn = new Date(assignment.checkInDate);
    const checkOut = new Date(assignment.actualCheckOutDate);
    const days = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    return days * Number(assignment.dailyRate);
  }

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  /**
   * Puts cage into maintenance mode
   */
  async startMaintenance(cageId: number): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    if (cage.status === CageStatus.OCCUPIED) {
      I18nException.badRequest(
        'errors.badRequest.cannotPutOccupiedCageInMaintenance',
      );
    }

    cage.status = CageStatus.MAINTENANCE;
    return this.cageRepository.save(cage);
  }

  /**
   * Completes maintenance and makes cage available
   */
  async completeMaintenance(cageId: number): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    if (cage.status !== CageStatus.MAINTENANCE) {
      I18nException.badRequest('errors.badRequest.cageNotInMaintenance');
    }

    cage.status = CageStatus.AVAILABLE;
    return this.cageRepository.save(cage);
  }

  /**
   * Reserves a cage for upcoming booking
   */
  async reserveCage(cageId: number): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    if (cage.status !== CageStatus.AVAILABLE) {
      I18nException.badRequest('errors.badRequest.cannotReserveCage', {
        status: cage.status,
      });
    }

    cage.status = CageStatus.RESERVED;
    return this.cageRepository.save(cage);
  }

  /**
   * Cancels cage reservation and makes it available
   */
  async cancelReservation(cageId: number): Promise<Cage> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      I18nException.notFound('errors.notFound.cage', { id: cageId });
    }

    if (cage.status !== CageStatus.RESERVED) {
      I18nException.badRequest('errors.badRequest.cageNotReserved');
    }

    cage.status = CageStatus.AVAILABLE;
    return this.cageRepository.save(cage);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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
      throw new ConflictException(
        `Cage with number ${dto.cageNumber} already exists`,
      );
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    // Check cage number uniqueness if being updated
    if (dto.cageNumber && dto.cageNumber !== cage.cageNumber) {
      const existing = await this.cageRepository.findOne({
        where: { cageNumber: dto.cageNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Cage with number ${dto.cageNumber} already exists`,
        );
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }
    return cage;
  }

  /**
   * Gets all cages
   */
  async getAllCages(): Promise<Cage[]> {
    return this.cageRepository.find({ order: { cageNumber: 'ASC' } });
  }

  /**
   * Gets available cages
   */
  async getAvailableCages(): Promise<Cage[]> {
    return this.cageRepository.find({
      where: { status: CageStatus.AVAILABLE },
      order: { cageNumber: 'ASC' },
    });
  }

  /**
   * Deletes a cage (soft delete by marking as inactive)
   */
  async deleteCage(cageId: number): Promise<void> {
    const cage = await this.cageRepository.findOne({ where: { cageId } });
    if (!cage) {
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    // Check if cage has active assignments
    const activeAssignment = await this.assignmentRepository.findOne({
      where: {
        cageId,
        status: CageAssignmentStatus.ACTIVE,
      },
    });

    if (activeAssignment) {
      throw new BadRequestException(
        `Cannot delete cage ${cage.cageNumber} - it has active assignments`,
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    if (cage.status !== CageStatus.AVAILABLE) {
      throw new BadRequestException(
        `Cage ${cage.cageNumber} is not available (status: ${cage.status})`,
      );
    }

    // Validate pet
    const pet = await this.petRepository.findOne({
      where: { petId: dto.petId },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${dto.petId} not found`);
    }

    // Check if pet already has an active assignment
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        petId: dto.petId,
        status: CageAssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Pet ${pet.name} already has an active cage assignment`,
      );
    }

    // Validate employee if provided
    if (dto.assignedById) {
      const employee = await this.employeeRepository.findOne({
        where: { employeeId: dto.assignedById },
      });
      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${dto.assignedById} not found`,
        );
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
      throw new NotFoundException(
        `Assignment with ID ${assignmentId} not found`,
      );
    }

    if (assignment.status !== CageAssignmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Assignment is not active (status: ${assignment.status})`,
      );
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
      relations: ['cage', 'pet'],
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    if (cage.status === CageStatus.OCCUPIED) {
      throw new BadRequestException('Cannot put occupied cage in maintenance');
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    if (cage.status !== CageStatus.MAINTENANCE) {
      throw new BadRequestException('Cage is not in maintenance');
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    if (cage.status !== CageStatus.AVAILABLE) {
      throw new BadRequestException(
        `Cannot reserve cage in ${cage.status} status`,
      );
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
      throw new NotFoundException(`Cage with ID ${cageId} not found`);
    }

    if (cage.status !== CageStatus.RESERVED) {
      throw new BadRequestException('Cage is not reserved');
    }

    cage.status = CageStatus.AVAILABLE;
    return this.cageRepository.save(cage);
  }
}

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Appointment } from '../../../src/entities/appointment.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * AppointmentController Integration Tests
 * Tests real HTTP endpoints with actual database operations
 * 
 * Based on actual implementation code - all fields verified
 */
describe('AppointmentController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  // Test data
  let petOwnerAccount: Account;
  let petOwner: PetOwner;
  let vetAccount: Account;
  let vet: Veterinarian;
  let receptionistAccount: Account;
  let receptionist: Receptionist;
  let managerAccount: Account;
  let manager: Manager;
  let pet: Pet;
  let service: Service;
  let service2: Service;  // Second service for multi-service tests
  let petOwnerToken: string;
  let vetToken: string;
  let receptionistToken: string;
  let managerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Create test accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Pet owner account (UserType.PET_OWNER = 'PET_OWNER')
    petOwnerAccount = await dataSource.getRepository(Account).save({
      email: 'owner@test.com',
      passwordHash: hashedPassword,
      userType: 'PET_OWNER',
      isActive: true,
    });

    petOwner = await dataSource.getRepository(PetOwner).save({
      accountId: petOwnerAccount.accountId,
      fullName: 'John Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      preferredContactMethod: 'Email',
      emergencyContact: '+0987654321',
    });

    // Veterinarian account (UserType.VETERINARIAN = 'VETERINARIAN')
    vetAccount = await dataSource.getRepository(Account).save({
      email: 'vet@test.com',
      passwordHash: hashedPassword,
      userType: 'VETERINARIAN',
      isActive: true,
    });

    // Veterinarian (Single Table Inheritance - only save to Veterinarian, not Employee)
    vet = await dataSource.getRepository(Veterinarian).save({
      accountId: vetAccount.accountId,
      fullName: 'Dr. Smith',
      phoneNumber: '+0987654321',
      address: '456 Vet St',
      hireDate: new Date('2020-01-01'),
      salary: 5000.00,
      isAvailable: true,
      licenseNumber: 'VET123456',
      expertise: 'General Practice',
    });

    // Receptionist account
    receptionistAccount = await dataSource.getRepository(Account).save({
      email: 'receptionist@test.com',
      passwordHash: hashedPassword,
      userType: 'RECEPTIONIST',
      isActive: true,
    });

    receptionist = await dataSource.getRepository(Receptionist).save({
      accountId: receptionistAccount.accountId,
      fullName: 'Jane Admin',
      phoneNumber: '+1122334455',
      address: '789 Office St',
      hireDate: new Date('2021-01-01'),
      salary: 3000.00,
      isAvailable: true,
      shift: 'Morning',
    });

    // Manager account
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      userType: 'MANAGER',
      isActive: true,
    });

    manager = await dataSource.getRepository(Manager).save({
      accountId: managerAccount.accountId,
      fullName: 'Bob Manager',
      phoneNumber: '+9988776655',
      address: '321 Boss St',
      hireDate: new Date('2019-01-01'),
      salary: 8000.00,
      isAvailable: true,
      department: 'Operations',
      officeLocation: 'Building A',
    });

    // Create pet (fields: name, species, breed, birthDate, gender, weight, initialHealthStatus)
    pet = await dataSource.getRepository(Pet).save({
      ownerId: petOwner.petOwnerId,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthDate: new Date('2020-01-01'),
      gender: 'Male',
      weight: 25.5,
      initialHealthStatus: 'Healthy',
    });

    // Create service category
    const category = await dataSource.getRepository(ServiceCategory).save({
      categoryName: 'Medical',
      description: 'Medical services',
      isActive: true,
    });

    // Create service (fields: serviceName, categoryId, description, basePrice, estimatedDuration, requiredStaffType)
    service = await dataSource.getRepository(Service).save({
      serviceName: 'General Checkup',
      categoryId: category.categoryId,
      basePrice: 50.00,
      estimatedDuration: 30,
      requiredStaffType: 'Veterinarian',
      description: 'General health checkup',
      isAvailable: true,
    });

    // Create second service for multi-service tests
    service2 = await dataSource.getRepository(Service).save({
      serviceName: 'Vaccination',
      categoryId: category.categoryId,
      basePrice: 75.00,
      estimatedDuration: 15,
      requiredStaffType: 'Veterinarian',
      description: 'Pet vaccination service',
      isAvailable: true,
    });

    // Generate JWT tokens (payload: { id, email })
    petOwnerToken = jwtService.sign({
      id: petOwnerAccount.accountId,
      email: petOwnerAccount.email,
    });

    vetToken = jwtService.sign({
      id: vetAccount.accountId,
      email: vetAccount.email,
    });

    receptionistToken = jwtService.sign({
      id: receptionistAccount.accountId,
      email: receptionistAccount.email,
    });

    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
    });
  });

  describe('POST /api/appointments', () => {
    it('[I-01] should create appointment with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          petId: pet.petId,
          employeeId: vet.employeeId,
          services: [{ serviceId: service.serviceId, quantity: 1 }],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(201);

      expect(response.body.appointmentId).toBeDefined();
      expect(response.body.status).toBe('PENDING');

      // Verify DB insert
      const appointment = await dataSource.getRepository(Appointment).findOne({
        where: { appointmentId: response.body.appointmentId },
      });
      expect(appointment).toBeDefined();
      expect(appointment.petId).toBe(pet.petId);
    });

    it('[I-02] should return 400 when petId is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          employeeId: vet.employeeId,
          services: [{ serviceId: service.serviceId, quantity: 1 }],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('[I-03] should return 404 when pet does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          petId: 99999,
          employeeId: vet.employeeId,
          services: [{ serviceId: service.serviceId, quantity: 1 }],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(404);
    });

    it('[I-04] should return 401 when token is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .send({
          petId: pet.petId,
          employeeId: vet.employeeId,
          services: [{ serviceId: service.serviceId, quantity: 1 }],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(401);
    });

    // Multi-service appointment tests
    it('[I-MS-01] should create appointment with multiple services', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          petId: pet.petId,
          employeeId: vet.employeeId,
          services: [
            { serviceId: service.serviceId, quantity: 1 },
            { serviceId: service2.serviceId, quantity: 2, notes: 'Two doses' },
          ],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '11:00',
          notes: 'Multi-service appointment',
        })
        .expect(201);

      expect(response.body.appointmentId).toBeDefined();
      expect(response.body.status).toBe('PENDING');
      // Total estimated cost should be 50 + (75 * 2) = 200
      expect(response.body.estimatedCost).toBe('200.00');
    });

    it('[I-MS-02] should return 400 when services array is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          petId: pet.petId,
          employeeId: vet.employeeId,
          services: [],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(400);
    });

    it('[I-MS-03] should return 404 when one of the services does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          petId: pet.petId,
          employeeId: vet.employeeId,
          services: [
            { serviceId: service.serviceId, quantity: 1 },
            { serviceId: 99999, quantity: 1 },  // Non-existent service
          ],
          appointmentDate: '2026-02-01',
          startTime: '10:00',
          endTime: '10:30',
        })
        .expect(404);
    });
  });

  describe('GET /api/appointments/:id', () => {
    let appointment: Appointment;

    beforeEach(async () => {
      // Create appointment (fields: petId, employeeId, appointmentDate, startTime, endTime, status)
      appointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: vet.employeeId,
        appointmentDate: new Date('2026-02-01'),
        startTime: '10:00',
        endTime: '10:30',
        status: 'PENDING',
        estimatedCost: 50.00,
        appointmentServices: [],
      });
    });

    it('[I-05] should return appointment by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/appointments/${appointment.appointmentId}`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body.appointmentId).toBe(appointment.appointmentId);
      expect(response.body.status).toBe('PENDING');
    });

    it('[I-06] should return 404 for non-existent appointment', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments/99999')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/appointments/:id/confirm', () => {
    let appointment: Appointment;

    beforeEach(async () => {
      appointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: vet.employeeId,
        appointmentDate: new Date('2026-02-01'),
        startTime: '10:00',
        endTime: '10:30',
        status: 'PENDING',
        estimatedCost: 50.00,
        appointmentServices: [],
      });
    });

    it('[I-07] should confirm pending appointment', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/appointments/${appointment.appointmentId}/confirm`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');

      // Verify DB update
      const updated = await dataSource.getRepository(Appointment).findOne({
        where: { appointmentId: appointment.appointmentId },
      });
      expect(updated.status).toBe('CONFIRMED');
    });

    it('[I-08] should return 400 for invalid status transition', async () => {
      // Set appointment to COMPLETED
      await dataSource.getRepository(Appointment).update(
        { appointmentId: appointment.appointmentId },
        { status: 'COMPLETED' }
      );

      await request(app.getHttpServer())
        .put(`/api/appointments/${appointment.appointmentId}/confirm`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    let appointment: Appointment;

    beforeEach(async () => {
      appointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: vet.employeeId,
        appointmentDate: new Date('2026-02-01'),
        startTime: '10:00',
        endTime: '10:30',
        status: 'PENDING',
        estimatedCost: 50.00,
        appointmentServices: [],
      });
    });

    it('[I-09] should delete appointment', async () => {
      await request(app.getHttpServer())
        .delete(`/api/appointments/${appointment.appointmentId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await dataSource.getRepository(Appointment).findOne({
        where: { appointmentId: appointment.appointmentId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/appointments/me', () => {
    beforeEach(async () => {
      // Create appointments for pet owner
      await dataSource.getRepository(Appointment).save([
        {
          petId: pet.petId,
          employeeId: vet.employeeId,
          appointmentDate: new Date('2026-02-01'),
          startTime: '10:00',
          endTime: '10:30',
          status: 'PENDING',
          estimatedCost: 50.00,
          appointmentServices: [],
        },
        {
          petId: pet.petId,
          employeeId: vet.employeeId,
          appointmentDate: new Date('2026-02-02'),
          startTime: '14:00',
          endTime: '14:30',
          status: 'CONFIRMED',
          estimatedCost: 50.00,
          appointmentServices: [],
        },
      ]);
    });

    it('[I-10] should return only pet owner\'s appointments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/appointments/me')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((apt: any) => {
        expect(apt.petId).toBe(pet.petId);
      });
    });
  });
});

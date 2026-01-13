import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { AppointmentService } from '../../../src/entities/appointment-service.entity';

describe('InvoiceController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  let managerToken: string;
  let receptionistToken: string;
  let ownerToken: string;
  let receptionist: Receptionist;
  let veterinarian: Veterinarian;
  let owner: PetOwner;
  let pet: Pet;
  let service: Service;
  let appointment: Appointment;

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
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Manager
    const managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager_inv@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });

    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });

    // Create Receptionist
    const receptionistAccount = await dataSource.getRepository(Account).save({
      email: 'receptionist_inv@test.com',
      passwordHash,
      userType: UserType.RECEPTIONIST,
      isActive: true,
    });

    receptionistToken = jwtService.sign({
      id: receptionistAccount.accountId,
      email: receptionistAccount.email,
      role: receptionistAccount.userType,
    });

    receptionist = await dataSource.getRepository(Receptionist).save({
      accountId: receptionistAccount.accountId,
      fullName: 'Receptionist Invoice',
      phoneNumber: '1234567890',
      hireDate: new Date(),
      salary: 3000,
      userType: UserType.RECEPTIONIST,
      isAvailable: true,
    });

    // Create Veterinarian
    const vetAccount = await dataSource.getRepository(Account).save({
      email: 'vet_inv@test.com',
      passwordHash,
      userType: UserType.VETERINARIAN,
      isActive: true,
    });

    veterinarian = await dataSource.getRepository(Veterinarian).save({
      accountId: vetAccount.accountId,
      fullName: 'Vet Invoice',
      phoneNumber: '1112223333',
      hireDate: new Date(),
      salary: 5000,
      userType: UserType.VETERINARIAN,
      specialization: 'General Practice',
      licenseNumber: 'VET12345',
      isAvailable: true,
    });

    // Create Pet Owner
    const ownerAccount = await dataSource.getRepository(Account).save({
      email: 'owner_inv@test.com',
      passwordHash,
      userType: UserType.PET_OWNER,
      isActive: true,
    });

    ownerToken = jwtService.sign({
      id: ownerAccount.accountId,  // Fixed: auth guard expects 'id', not 'sub'
      email: ownerAccount.email,
    });

    owner = await dataSource.getRepository(PetOwner).save({
      accountId: ownerAccount.accountId,
      fullName: 'Owner Invoice',
      phoneNumber: '9876543210',
    });

    // Create Pet
    pet = await dataSource.getRepository(Pet).save({
      ownerId: owner.petOwnerId,
      name: 'TestPet',
      species: 'Dog',
      breed: 'Labrador',
      age: 3,
      gender: 'Male',
      weight: 25.5,
    });

    // Create Service Category and Service
    const category = await dataSource.getRepository(ServiceCategory).save({
      categoryName: 'Medical',
      description: 'Medical services',
    });

    service = await dataSource.getRepository(Service).save({
      categoryId: category.categoryId,
      serviceName: 'Checkup',
      description: 'Health checkup',
      basePrice: 100.00,
      estimatedDuration: 60,
      requiredStaffType: 'Veterinarian',
      isAvailable: true,
    });

    // Create Completed Appointment
    appointment = await dataSource.getRepository(Appointment).save({
      petId: pet.petId,
      employeeId: veterinarian.employeeId,
      appointmentDate: new Date(),
      startTime: '10:00',
      endTime: '11:00',
      status: AppointmentStatus.COMPLETED,
      actualCost: 100.00,
    });

    // Create AppointmentService junction record
    await dataSource.getRepository(AppointmentService).save({
      appointmentId: appointment.appointmentId,
      serviceId: service.serviceId,
      quantity: 1,
      unitPrice: 100.00,
    });
  });

  describe('POST /api/invoices/generate', () => {
    it('[INV-01] should generate invoice from completed appointment (Receptionist)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentId: appointment.appointmentId,
        })
        .expect(201);

      expect(response.body.invoiceId).toBeDefined();
      expect(response.body.invoiceNumber).toBeDefined();
      expect(response.body.totalAmount).toBeDefined();
      expect(response.body.status).toBe(InvoiceStatus.PENDING);
    });

    it('[INV-02] should return 404 if appointment not found', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentId: 99999,
        })
        .expect(404);
    });

    it('[INV-03] should return 409 if invoice already exists', async () => {
      // Create first invoice
      await request(app.getHttpServer())
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentId: appointment.appointmentId,
        })
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentId: appointment.appointmentId,
        })
        .expect(409);
    });

    it('[INV-04] should return 400 if appointment not completed', async () => {
      // Create pending appointment
      const pendingAppointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '14:00',
        endTime: '15:00',
        status: AppointmentStatus.SCHEDULED,
      });

      await dataSource.getRepository(AppointmentService).save({
        appointmentId: pendingAppointment.appointmentId,
        serviceId: service.serviceId,
        quantity: 1,
        unitPrice: 100.00,
      });

      await request(app.getHttpServer())
        .post('/api/invoices/generate')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          appointmentId: pendingAppointment.appointmentId,
        })
        .expect(400);
    });
  });

  describe('GET /api/invoices', () => {
    beforeEach(async () => {
      // Create separate appointments for invoices
      const appointment1 = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '08:00',
        endTime: '09:00',
        status: AppointmentStatus.COMPLETED,
        actualCost: 100.00,
      });

      const appointment2 = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        status: AppointmentStatus.COMPLETED,
        actualCost: 200.00,
      });

      // Create AppointmentService junction records
      await dataSource.getRepository(AppointmentService).save([
        {
          appointmentId: appointment1.appointmentId,
          serviceId: service.serviceId,
          quantity: 1,
          unitPrice: 100.00,
        },
        {
          appointmentId: appointment2.appointmentId,
          serviceId: service.serviceId,
          quantity: 1,
          unitPrice: 200.00,
        },
      ]);

      // Seed invoices
      await dataSource.getRepository(Invoice).save([
        {
          appointmentId: appointment1.appointmentId,
          invoiceNumber: 'INV-001',
          issueDate: new Date(),
          subtotal: 100.00,
          tax: 10.00,
          totalAmount: 110.00,
          status: InvoiceStatus.PENDING,
        },
        {
          appointmentId: appointment2.appointmentId,
          invoiceNumber: 'INV-002',
          issueDate: new Date(),
          subtotal: 200.00,
          tax: 20.00,
          totalAmount: 220.00,
          status: InvoiceStatus.PAID,
        },
      ]);
    });

    it('[INV-05] should get all invoices (Manager)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('[INV-06] should filter invoices by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices?status=${InvoiceStatus.PENDING}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every(inv => inv.status === InvoiceStatus.PENDING)).toBe(true);
    });
  });

  describe('GET /api/invoices/:id', () => {
    let invoiceId: number;

    beforeEach(async () => {
      // Create separate appointment for this invoice
      const testAppointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '12:00',
        endTime: '13:00',
        status: AppointmentStatus.COMPLETED,
        actualCost: 100.00,
      });

      await dataSource.getRepository(AppointmentService).save({
        appointmentId: testAppointment.appointmentId,
        serviceId: service.serviceId,
        quantity: 1,
        unitPrice: 100.00,
      });

      const invoice = await dataSource.getRepository(Invoice).save({
        appointmentId: testAppointment.appointmentId,
        invoiceNumber: 'INV-TEST',
        issueDate: new Date(),
        subtotal: 100.00,
        tax: 10.00,
        totalAmount: 110.00,
        status: InvoiceStatus.PENDING,
      });
      invoiceId = invoice.invoiceId;
    });

    it('[INV-07] should get invoice by ID (Manager)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.invoiceId).toBe(invoiceId);
      expect(response.body.invoiceNumber).toBe('INV-TEST');
    });

    it('[INV-08] should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .get('/api/invoices/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('GET /api/invoices/me', () => {
    beforeEach(async () => {
      // Create separate appointment for this invoice
      const testAppointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '13:00',
        endTime: '14:00',
        status: AppointmentStatus.COMPLETED,
        actualCost: 100.00,
      });

      await dataSource.getRepository(AppointmentService).save({
        appointmentId: testAppointment.appointmentId,
        serviceId: service.serviceId,
        quantity: 1,
        unitPrice: 100.00,
      });

      // Create invoice for this pet's appointment
      await dataSource.getRepository(Invoice).save({
        appointmentId: testAppointment.appointmentId,
        invoiceNumber: 'INV-PET',
        issueDate: new Date(),
        subtotal: 100.00,
        tax: 10.00,
        totalAmount: 110.00,
        status: InvoiceStatus.PENDING,
      });
    });

    it('[INV-09] should get invoices for current pet owner', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    let invoiceId: number;

    beforeEach(async () => {
      // Create separate appointment for this invoice
      const testAppointment = await dataSource.getRepository(Appointment).save({
        petId: pet.petId,
        employeeId: veterinarian.employeeId,
        appointmentDate: new Date(),
        startTime: '14:00',
        endTime: '15:00',
        status: AppointmentStatus.COMPLETED,
        actualCost: 100.00,
      });

      await dataSource.getRepository(AppointmentService).save({
        appointmentId: testAppointment.appointmentId,
        serviceId: service.serviceId,
        quantity: 1,
        unitPrice: 100.00,
      });

      const invoice = await dataSource.getRepository(Invoice).save({
        appointmentId: testAppointment.appointmentId,
        invoiceNumber: 'INV-DELETE',
        issueDate: new Date(),
        subtotal: 100.00,
        tax: 10.00,
        totalAmount: 110.00,
        status: InvoiceStatus.PENDING,
      });
      invoiceId = invoice.invoiceId;
    });

    it('[INV-10] should delete invoice (Manager)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verify invoice is deleted
      await request(app.getHttpServer())
        .get(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});


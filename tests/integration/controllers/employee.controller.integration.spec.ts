import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account } from '../../../src/entities/account.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { CareStaff } from '../../../src/entities/care-staff.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserType } from '../../../src/entities/types/entity.types';

describe('EmployeeController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerAccount: Account;
  let manager: Manager;
  let receptionistAccount: Account;
  let receptionist: Receptionist;
  let managerToken: string;
  let receptionistToken: string;

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
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create Manager Account (for creating employees)
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      userType: UserType.MANAGER,
      isActive: true,
    });
    
    manager = await dataSource.getRepository(Manager).save({
      accountId: managerAccount.accountId,
      fullName: 'Manager User',
      phoneNumber: '+1234567890',
      address: '123 Manager St',
      hireDate: new Date('2020-01-01'),
      salary: 8000.00,
      isAvailable: true,
      department: 'Operations',
      officeLocation: 'Building A',
    });

    // Create Receptionist Account (for reading lists)
    receptionistAccount = await dataSource.getRepository(Account).save({
      email: 'receptionist@test.com',
      passwordHash: hashedPassword,
      userType: UserType.RECEPTIONIST,
      isActive: true,
    });
    
    receptionist = await dataSource.getRepository(Receptionist).save({
      accountId: receptionistAccount.accountId,
      fullName: 'Receptionist User',
      phoneNumber: '+0987654321',
      address: '456 Reception St',
      hireDate: new Date('2021-01-01'),
      salary: 3000.00,
      isAvailable: true,
      shift: 'Morning',
    });
    
    // Generate Tokens
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
    });

    receptionistToken = jwtService.sign({
      id: receptionistAccount.accountId,
      email: receptionistAccount.email,
    });
  });

  describe('POST /api/employees', () => {
    it('[E-01] should create a Veterinarian (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'newvet@test.com',
          password: 'password123',
          userType: UserType.VETERINARIAN,
          fullName: 'Dr. New Vet',
          phoneNumber: '+1122334455',
          address: '789 Vet St',
          hireDate: new Date().toISOString(),
          salary: 5000.00,
          licenseNumber: 'VET-NEW-001',
          expertise: 'Surgery',
        })
        .expect(201);

      expect(response.body.accountId).toBeDefined();
      expect(response.body.fullName).toBe('Dr. New Vet');
      expect(response.body.licenseNumber).toBe('VET-NEW-001');

      // Verify DB
      const vet = await dataSource.getRepository(Veterinarian).findOne({
        where: { accountId: response.body.accountId },
        relations: ['account'],
      });
      expect(vet).toBeDefined();
      expect(vet.account.email).toBe('newvet@test.com');
      expect(vet.expertise).toBe('Surgery');
    });

    it('[E-02] should create CareStaff (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'carestaff@test.com',
          password: 'password123',
          userType: UserType.CARE_STAFF,
          fullName: 'Care Staff 1',
          phoneNumber: '+1122334466',
          address: '789 Care St',
          hireDate: new Date().toISOString(),
          salary: 2000.00,
          skills: ['Grooming', 'Walking'],
        })
        .expect(201);

      expect(response.body.fullName).toBe('Care Staff 1');
      expect(response.body.skills).toContain('Grooming');

      // Verify DB
      const careStaff = await dataSource.getRepository(CareStaff).findOne({
        where: { accountId: response.body.accountId },
      });
      expect(careStaff).toBeDefined();
    });

    it('[E-03] should return 403 when non-Manager tries to create employee', async () => {
      await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          email: 'hacker@test.com',
          password: 'password123',
          userType: UserType.VETERINARIAN,
          fullName: 'Hacker',
          phoneNumber: '+0000000000',
          hireDate: new Date().toISOString(),
          salary: 1000.00,
        })
        .expect(403);
    });

    it('[E-04] should return 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          // email missing
          password: 'password123',
          userType: UserType.VETERINARIAN,
        })
        .expect(400);
    });
  });

  describe('GET /api/employees', () => {
    // Setup some data
    beforeEach(async () => {
      // Manager & Receptionist created in beforeEach(top)
      // Add a Veterinarian
      const hashedPassword = await bcrypt.hash('password123', 10);
      const vetAccount = await dataSource.getRepository(Account).save({
        email: 'vet@test.com',
        passwordHash: hashedPassword,
        userType: UserType.VETERINARIAN,
        isActive: true,
      });
      await dataSource.getRepository(Veterinarian).save({
        accountId: vetAccount.accountId,
        fullName: 'Dr. Smith',
        phoneNumber: '+9988776655',
        hireDate: new Date('2022-01-01'),
        salary: 6000.00,
        licenseNumber: 'VET-001',
        isAvailable: true,
      });
    });

    it('[E-05] should get all employees', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/employees')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Manager, Receptionist, Veterinarian = 3
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('[E-06] should filter by role (VETERINARIAN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/employees?role=${UserType.VETERINARIAN}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const vets = response.body.filter(e => e.account.userType === UserType.VETERINARIAN);
      expect(vets.length).toBeGreaterThanOrEqual(1);
      const nonVets = response.body.filter(e => e.account.userType !== UserType.VETERINARIAN);
      expect(nonVets.length).toBe(0);
    });
  });

  describe('GET /api/employees/veterinarians', () => {
    beforeEach(async () => {
       const hashedPassword = await bcrypt.hash('password123', 10);
       const vetAccount = await dataSource.getRepository(Account).save({
        email: 'vet2@test.com',
        passwordHash: hashedPassword,
        userType: UserType.VETERINARIAN,
        isActive: true,
      });
      await dataSource.getRepository(Veterinarian).save({
        accountId: vetAccount.accountId,
        fullName: 'Dr. Jones',
        phoneNumber: '+111111111',
        hireDate: new Date('2022-01-01'),
        salary: 6000.00,
        licenseNumber: 'VET-002',
      });
    });

    it('[E-08] should get all veterinarians', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/employees/veterinarians')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);
      
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].licenseNumber).toBeDefined();
    });
  });

  describe('GET /api/employees/care-staff', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const csAccount = await dataSource.getRepository(Account).save({
       email: 'cs@test.com',
       passwordHash: hashedPassword,
       userType: UserType.CARE_STAFF,
       isActive: true,
     });
     await dataSource.getRepository(CareStaff).save({
       accountId: csAccount.accountId,
       fullName: 'Staff Member',
       phoneNumber: '+222222222',
       hireDate: new Date('2022-01-01'),
       salary: 2000.00,
       skills: ['Cleaning'],
     });
   });

   it('[E-09] should get all care staff', async () => {
     const response = await request(app.getHttpServer())
       .get('/api/employees/care-staff')
       .set('Authorization', `Bearer ${receptionistToken}`)
       .expect(200);
     
     expect(response.body.length).toBeGreaterThanOrEqual(1);
     expect(response.body[0].skills).toBeDefined();
   });
  });

  describe('GET /api/employees/available', () => {
    it('[E-07] should get available employees', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/employees/available')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.every(e => e.isAvailable === true)).toBe(true);
    });
  });
});

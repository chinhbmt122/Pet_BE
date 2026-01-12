import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account } from '../../../src/entities/account.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('ServiceController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerAccount: Account;
  let manager: Manager;
  let category: ServiceCategory;
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
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Manager account
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      userType: 'MANAGER',
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
    
    // Service category
    category = await dataSource.getRepository(ServiceCategory).save({
      categoryName: 'Medical',
      description: 'Medical services',
      isActive: true,
    });
    
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
    });
  });

  describe('POST /api/services', () => {
    it('[SC-01] should create service', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serviceName: 'Vaccination',
          categoryId: category.categoryId,
          description: 'Pet vaccination service',
          basePrice: 75.00,
          estimatedDuration: 20,
          requiredStaffType: 'Veterinarian',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.serviceName).toBe('Vaccination');
      expect(response.body.basePrice).toBe(75.00);
    });

    it('[SC-02] should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serviceName: 'Incomplete Service',
        })
        .expect(400);
    });
  });

  describe('GET /api/services', () => {
    beforeEach(async () => {
      await dataSource.getRepository(Service).save([
        {
          serviceName: 'Checkup',
          categoryId: category.categoryId,
          basePrice: 50.00,
          estimatedDuration: 30,
          requiredStaffType: 'Veterinarian',
          description: 'General checkup',
          isAvailable: true,
        },
        {
          serviceName: 'Grooming',
          categoryId: category.categoryId,
          basePrice: 40.00,
          estimatedDuration: 60,
          requiredStaffType: 'CareStaff',
          description: 'Pet grooming',
          isAvailable: true,
        },
      ]);
    });

    it('[SC-03] should get all services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/services')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('[SC-04] should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/services?categoryId=${category.categoryId}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/services/:id', () => {
    let service: Service;

    beforeEach(async () => {
      service = await dataSource.getRepository(Service).save({
        serviceName: 'Test Service',
        categoryId: category.categoryId,
        basePrice: 100.00,
        estimatedDuration: 45,
        requiredStaffType: 'Veterinarian',
        description: 'Test description',
        isAvailable: true,
      });
    });

    it('[SC-05] should get service by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/services/${service.serviceId}`)
        .expect(200);

      expect(response.body.id).toBe(service.serviceId);
      expect(response.body.serviceName).toBe('Test Service');
    });

    it('[SC-06] should return 404 for non-existent service', async () => {
      await request(app.getHttpServer())
        .get('/api/services/99999')
        .expect(404);
    });
  });

  describe('PUT /api/services/:id', () => {
    let service: Service;

    beforeEach(async () => {
      service = await dataSource.getRepository(Service).save({
        serviceName: 'Original Name',
        categoryId: category.categoryId,
        basePrice: 50.00,
        estimatedDuration: 30,
        requiredStaffType: 'Veterinarian',
        description: 'Original description',
        isAvailable: true,
      });
    });

    it('[SC-07] should update service', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/services/${service.serviceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serviceName: 'Updated Name',
          basePrice: 75.00,
        })
        .expect(200);

      expect(response.body.serviceName).toBe('Updated Name');
      expect(response.body.basePrice).toBe(75.00);
    });

    it('[SC-08] should return 404 for non-existent service', async () => {
      await request(app.getHttpServer())
        .put('/api/services/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serviceName: 'Updated',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/services/:id', () => {
    let service: Service;

    beforeEach(async () => {
      service = await dataSource.getRepository(Service).save({
        serviceName: 'To Delete',
        categoryId: category.categoryId,
        basePrice: 50.00,
        estimatedDuration: 30,
        requiredStaffType: 'Veterinarian',
        description: 'Will be deleted',
        isAvailable: true,
      });
    });

    it('[SC-09] should delete service', async () => {
      await request(app.getHttpServer())
        .delete(`/api/services/${service.serviceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const deleted = await dataSource.getRepository(Service).findOne({
        where: { serviceId: service.serviceId },
      });
      expect(deleted.isAvailable).toBe(false);
    });

    it('[SC-10] should return 404 for non-existent service', async () => {
      await request(app.getHttpServer())
        .delete('/api/services/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});

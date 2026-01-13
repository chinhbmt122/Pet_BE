import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';

describe('ServiceCategoryController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerToken: string;
  let managerAccount: Account;

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
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager_sc@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });

    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });
  });

  describe('POST /api/service-categories', () => {
    it('[SC-01] should create a service category (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/service-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          categoryName: 'Grooming',
          description: 'Pet grooming services',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.categoryName).toBe('Grooming');
      expect(response.body.isActive).toBe(true);
    });

    it('[SC-02] should return 409 if category name already exists', async () => {
      // Create first
      await request(app.getHttpServer())
        .post('/api/service-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          categoryName: 'Medical',
          description: 'Medical services',
        })
        .expect(201);

      // Try duplicate
      await request(app.getHttpServer())
        .post('/api/service-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          categoryName: 'Medical',
          description: 'Another medical',
        })
        .expect(409);
    });
  });

  describe('GET /api/service-categories', () => {
    beforeEach(async () => {
      // Seed categories
      await dataSource.getRepository(ServiceCategory).save([
        { categoryName: 'Grooming', description: 'Grooming services', isActive: true },
        { categoryName: 'Medical', description: 'Medical services', isActive: true },
        { categoryName: 'Boarding', description: 'Boarding services', isActive: false },
      ]);
    });

    it('[SC-03] should get all active categories (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/service-categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Only active
      expect(response.body.every(c => c.isActive === true)).toBe(true);
    });

    it('[SC-04] should get all categories including inactive when requested', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/service-categories?includeInactive=true')
        .expect(200);

      expect(response.body.length).toBe(3); // All categories
    });
  });

  describe('GET /api/service-categories/:id', () => {
    let categoryId: number;

    beforeEach(async () => {
      const category = await dataSource.getRepository(ServiceCategory).save({
        categoryName: 'Training',
        description: 'Training services',
      });
      categoryId = category.categoryId;
    });

    it('[SC-05] should get category by ID (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/service-categories/${categoryId}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.categoryName).toBe('Training');
    });

    it('[SC-06] should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .get('/api/service-categories/99999')
        .expect(404);
    });
  });

  describe('PUT /api/service-categories/:id', () => {
    let categoryId: number;

    beforeEach(async () => {
      const category = await dataSource.getRepository(ServiceCategory).save({
        categoryName: 'Wellness',
        description: 'Wellness services',
      });
      categoryId = category.categoryId;
    });

    it('[SC-07] should update category (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/service-categories/${categoryId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Updated wellness services',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated wellness services');
    });

    it('[SC-08] should toggle category active status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/service-categories/${categoryId}/toggle-active`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false); // Was true, now false
    });
  });

  describe('DELETE /api/service-categories/:id', () => {
    let categoryId: number;

    beforeEach(async () => {
      const category = await dataSource.getRepository(ServiceCategory).save({
        categoryName: 'Temporary',
        description: 'Temp category',
      });
      categoryId = category.categoryId;
    });

    it('[SC-09] should delete category (Manager only)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/service-categories/${categoryId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await dataSource.getRepository(ServiceCategory).findOne({
        where: { categoryId },
      });
      expect(deleted).toBeNull();
    });

    it('[SC-10] should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .delete('/api/service-categories/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});

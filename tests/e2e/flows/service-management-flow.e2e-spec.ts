import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createTestApp } from '../../integration/test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { Employee } from '../../../src/entities/employee.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Service } from '../../../src/entities/service.entity';

describe('Critical Flow: Service Catalog Management', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let managerToken: string;

    beforeAll(async () => {
        app = await createTestApp();
        dataSource = app.get(DataSource);

        // ===== Setup: Create Manager account =====
        const hashedPassword = await bcrypt.hash('Manager123!', 10);

        const managerAccount = await dataSource.getRepository(Account).save({
            email: `manager-${Date.now()}@petcenter.com`,
            passwordHash: hashedPassword,
            phoneNumber: '0901234567',
            fullName: 'Service Manager',
            userType: UserType.MANAGER,
        });

        await dataSource.getRepository(Employee).save({
            accountId: managerAccount.accountId,
            fullName: 'Service Manager',
            phoneNumber: '+1234567890',
            address: '123 Manager St',
            hireDate: new Date('2024-01-01'),
            salary: 20000000,
            department: 'Management',
            status: 'ACTIVE',
        });

        // Login as manager
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: managerAccount.email,
                password: 'Manager123!',
            })
            .expect(200);

        managerToken = loginResponse.body.accessToken;
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('Flow 1: Service Category Management', () => {
        it('should create and manage service categories', async () => {
            const timestamp = Date.now();
            
            // Create category
            const createResponse = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Grooming-${timestamp}`,
                    description: 'Pet grooming services',
                })
                .expect(201);

            expect(createResponse.body.id).toBeDefined();
            expect(createResponse.body.categoryName).toBe(`Grooming-${timestamp}`);
            expect(createResponse.body.isActive).toBe(true);

            // Retrieve all categories
            const allResponse = await request(app.getHttpServer())
                .get('/api/service-categories')
                .expect(200);

            expect(allResponse.body.length).toBeGreaterThanOrEqual(1);

            // Update category
            const updateResponse = await request(app.getHttpServer())
                .put(`/api/service-categories/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ description: 'Updated description' })
                .expect(200);

            expect(updateResponse.body.description).toBe('Updated description');

            // Get by ID
            const getByIdResponse = await request(app.getHttpServer())
                .get(`/api/service-categories/${createResponse.body.id}`)
                .expect(200);

            expect(getByIdResponse.body.id).toBe(createResponse.body.id);
        });
    });

    describe('Flow 2: Service CRUD Operations', () => {
        it('should create, update, and retrieve services', async () => {
            const timestamp = Date.now();
            
            // Setup: Create category
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Services-${timestamp}`,
                    description: 'Test category',
                })
                .expect(201);

            // Create service
            const createResponse = await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `Basic Grooming-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Bath and brush',
                    basePrice: 150000,
                    estimatedDuration: 60,
                    requiredStaffType: 'CareStaff',
                    isBoardingService: false,
                })
                .expect(201);

            expect(createResponse.body.id).toBeDefined();
            expect(Number(createResponse.body.basePrice)).toBe(150000);

            // Retrieve all services
            const allResponse = await request(app.getHttpServer())
                .get('/api/services')
                .expect(200);

            expect(allResponse.body.length).toBeGreaterThanOrEqual(1);

            // Update service
            const updateResponse = await request(app.getHttpServer())
                .put(`/api/services/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ basePrice: 180000 })
                .expect(200);

            expect(Number(updateResponse.body.basePrice)).toBe(180000);
        });
    });

    describe('Flow 3: Service Filtering', () => {
        it('should filter services by category and price range', async () => {
            const timestamp = Date.now();
            
            // Setup
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Filter-${timestamp}`,
                    description: 'Filter test',
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `FilterService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Test',
                    basePrice: 150000,
                    estimatedDuration: 60,
                    requiredStaffType: 'CareStaff',
                })
                .expect(201);

            // Filter by category
            const categoryResponse = await request(app.getHttpServer())
                .get(`/api/services/category/${category.body.id}`)
                .expect(200);

            expect(categoryResponse.body.length).toBeGreaterThanOrEqual(1);

            // Filter by price range
            const priceResponse = await request(app.getHttpServer())
                .get('/api/services/price-range')
                .query({ min: 100000, max: 200000 })
                .expect(200);

            expect(priceResponse.body.length).toBeGreaterThanOrEqual(1);

            // Search by name
            const searchResponse = await request(app.getHttpServer())
                .get('/api/services/search')
                .query({ q: 'Filter' })
                .expect(200);

            expect(searchResponse.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Flow 4: Service Availability', () => {
        it('should toggle service availability', async () => {
            const timestamp = Date.now();
            
            // Setup
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Avail-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            const service = await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `AvailService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Test',
                    basePrice: 100000,
                    estimatedDuration: 45,
                    requiredStaffType: 'Any',
                })
                .expect(201);

            // Mark unavailable
            const toggleResponse = await request(app.getHttpServer())
                .put(`/api/services/${service.body.id}/availability`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ isAvailable: false })
                .expect(200);

            expect(toggleResponse.body.isAvailable).toBe(false);

            // Verify not in available list
            const availableResponse = await request(app.getHttpServer())
                .get('/api/services')
                .expect(200);

            const isPresent = availableResponse.body.some((s: any) => s.id === service.body.id);
            expect(isPresent).toBe(false);

            // Re-enable
            const enableResponse = await request(app.getHttpServer())
                .put(`/api/services/${service.body.id}/availability`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ isAvailable: true })
                .expect(200);

            expect(enableResponse.body.isAvailable).toBe(true);
        });
    });

    describe('Flow 5: Price Calculation', () => {
        it('should calculate service price with pet size', async () => {
            const timestamp = Date.now();
            
            // Setup
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Price-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            const service = await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `PriceService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Test',
                    basePrice: 180000,
                    estimatedDuration: 60,
                    requiredStaffType: 'CareStaff',
                })
                .expect(201);

            // Calculate for small pet
            const smallResponse = await request(app.getHttpServer())
                .post(`/api/services/${service.body.id}/calculate-price`)
                .query({ petSize: 'small' })
                .expect(201);

            expect(smallResponse.body).toHaveProperty('basePrice');
            expect(smallResponse.body).toHaveProperty('finalPrice');

            // Calculate for large pet
            const largeResponse = await request(app.getHttpServer())
                .post(`/api/services/${service.body.id}/calculate-price`)
                .query({ petSize: 'large' })
                .expect(201);

            expect(Number(largeResponse.body.finalPrice)).toBeGreaterThanOrEqual(
                Number(smallResponse.body.finalPrice)
            );
        });
    });

    describe('Flow 6: Staff Type Filtering', () => {
        it('should filter services by required staff type', async () => {
            const timestamp = Date.now();
            
            // Setup
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Staff-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `VetService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Vet service',
                    basePrice: 200000,
                    estimatedDuration: 30,
                    requiredStaffType: 'Veterinarian',
                })
                .expect(201);

            // Filter by staff type
            const vetResponse = await request(app.getHttpServer())
                .get('/api/services/staff-type/Veterinarian')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(vetResponse.body.length).toBeGreaterThanOrEqual(1);
            vetResponse.body.forEach((s: Service) => {
                expect(s.requiredStaffType).toBe('Veterinarian');
            });
        });
    });

    describe('Flow 7: Boarding Services', () => {
        it('should create and retrieve boarding services', async () => {
            const timestamp = Date.now();
            
            // Setup
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Boarding-${timestamp}`,
                    description: 'Boarding services',
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `OvernightBoarding-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Overnight care',
                    basePrice: 300000,
                    estimatedDuration: 480, // Max allowed is 480 minutes (8 hours)
                    requiredStaffType: 'CareStaff',
                    isBoardingService: true,
                })
                .expect(201);

            // Get boarding services
            const boardingResponse = await request(app.getHttpServer())
                .get('/api/services/boarding')
                .expect(200);

            expect(boardingResponse.body.length).toBeGreaterThanOrEqual(1);
            boardingResponse.body.forEach((s: Service) => {
                expect(s.isBoardingService).toBe(true);
            });
        });
    });

    describe('Flow 8: Error Scenarios', () => {
        it('should prevent duplicate service names', async () => {
            const timestamp = Date.now();
            
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Dupe-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `UniqueService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'First',
                    basePrice: 100000,
                    estimatedDuration: 30,
                    requiredStaffType: 'Any',
                })
                .expect(201);

            // Try duplicate
            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `UniqueService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'Duplicate',
                    basePrice: 100000,
                    estimatedDuration: 30,
                    requiredStaffType: 'Any',
                })
                .expect(409);
        });

        it('should return 404 for non-existent service', async () => {
            await request(app.getHttpServer())
                .get('/api/services/99999')
                .expect(404);
        });

        it('should validate service data', async () => {
            const timestamp = Date.now();
            
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Valid-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            // Invalid: negative price
            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `InvalidPrice-${timestamp}`,
                    categoryId: category.body.id,
                    basePrice: -100,
                    estimatedDuration: 60,
                    requiredStaffType: 'Any',
                })
                .expect(400);

            // Invalid: duration below minimum
            await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `InvalidDuration-${timestamp}`,
                    categoryId: category.body.id,
                    basePrice: 100000,
                    estimatedDuration: 10,
                    requiredStaffType: 'Any',
                })
                .expect(400);
        });
    });

    describe('Flow 9: Category Status Management', () => {
        it('should toggle category active status', async () => {
            const timestamp = Date.now();
            
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Toggle-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            // Toggle to inactive
            const toggleResponse = await request(app.getHttpServer())
                .put(`/api/service-categories/${category.body.id}/toggle-active`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(toggleResponse.body.isActive).toBe(false);

            // Verify not in active list
            const activeResponse = await request(app.getHttpServer())
                .get('/api/service-categories')
                .expect(200);

            const isPresent = activeResponse.body.some(
                (c: any) => c.id === category.body.id
            );
            expect(isPresent).toBe(false);

            // Toggle back to active
            const reactivateResponse = await request(app.getHttpServer())
                .put(`/api/service-categories/${category.body.id}/toggle-active`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(reactivateResponse.body.isActive).toBe(true);
        });
    });

    describe('Flow 10: Service Deletion', () => {
        it('should delete a service', async () => {
            const timestamp = Date.now();
            
            const category = await request(app.getHttpServer())
                .post('/api/service-categories')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    categoryName: `Delete-${timestamp}`,
                    description: 'Test',
                })
                .expect(201);

            const service = await request(app.getHttpServer())
                .post('/api/services')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    serviceName: `TempService-${timestamp}`,
                    categoryId: category.body.id,
                    description: 'To be deleted',
                    basePrice: 50000,
                    estimatedDuration: 30,
                    requiredStaffType: 'Any',
                })
                .expect(201);

            // Delete service (soft delete - marks as unavailable)
            const deleteResponse = await request(app.getHttpServer())
                .delete(`/api/services/${service.body.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(deleteResponse.body.deleted).toBe(true);

            // Verify still exists but unavailable
            const checkResponse = await request(app.getHttpServer())
                .get(`/api/services/${service.body.id}`)
                .expect(200);

            expect(checkResponse.body.isAvailable).toBe(false);
        });
    });
});

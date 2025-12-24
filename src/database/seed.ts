import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account } from '../entities/account.entity';
import { Manager } from '../entities/manager.entity';
import { Veterinarian } from '../entities/veterinarian.entity';
import { CareStaff } from '../entities/care-staff.entity';
import { Receptionist } from '../entities/receptionist.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Pet } from '../entities/pet.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Service } from '../entities/service.entity';
import { Cage } from '../entities/cage.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import {
  UserType,
  CageSize,
  CageStatus,
  VaccineCategory,
} from '../entities/types/entity.types';

/**
 * Seed Database with Test Data
 *
 * Order of seeding (respecting foreign key dependencies):
 * 1. Accounts (base)
 * 2. Employees (depends on Account)
 * 3. PetOwners (depends on Account)
 * 4. Pets (depends on PetOwner)
 * 5. ServiceCategories (independent)
 * 6. Services (depends on ServiceCategory)
 * 7. Cages (independent)
 * 8. VaccineTypes (independent)
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ====== 1. ACCOUNTS ======
    console.log('📦 Seeding accounts...');
    const accountRepo = queryRunner.manager.getRepository(Account);

    const passwordHash = await bcrypt.hash('Password@123', 10);

    const accounts = await accountRepo.save([
      // Manager
      {
        email: 'manager@pawlovers.com',
        passwordHash,
        userType: UserType.MANAGER,
        isActive: true,
      },
      // Veterinarians
      {
        email: 'vet1@pawlovers.com',
        passwordHash,
        userType: UserType.VETERINARIAN,
        isActive: true,
      },
      {
        email: 'vet2@pawlovers.com',
        passwordHash,
        userType: UserType.VETERINARIAN,
        isActive: true,
      },
      // Care Staff
      {
        email: 'care1@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },
      {
        email: 'care2@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },
      // Receptionist
      {
        email: 'reception@pawlovers.com',
        passwordHash,
        userType: UserType.RECEPTIONIST,
        isActive: true,
      },
      // Pet Owners
      {
        email: 'owner1@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner2@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner3@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${accounts.length} accounts`);

    // ====== 2. EMPLOYEES (using concrete child entities) ======
    console.log('📦 Seeding employees...');

    // Manager
    const managerRepo = queryRunner.manager.getRepository(Manager);
    const manager = await managerRepo.save({
      accountId: accounts[0].accountId,
      fullName: 'Nguyễn Văn Quản Lý',
      phoneNumber: '0901234567',
      address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
      hireDate: new Date('2020-01-15'),
      salary: 25000000,
      isAvailable: true,
    });
    console.log('✅ Created 1 manager');

    // Veterinarians
    const vetRepo = queryRunner.manager.getRepository(Veterinarian);
    const vets = await vetRepo.save([
      {
        accountId: accounts[1].accountId,
        fullName: 'BS. Trần Thị Lan',
        phoneNumber: '0902345678',
        address: '456 Lê Văn Lương, Q.7, TP.HCM',
        hireDate: new Date('2021-03-01'),
        salary: 20000000,
        isAvailable: true,
        licenseNumber: 'VET-2021-001',
        expertise: 'Nội khoa thú nhỏ',
      },
      {
        accountId: accounts[2].accountId,
        fullName: 'BS. Phạm Minh Tuấn',
        phoneNumber: '0903456789',
        address: '789 Phạm Văn Đồng, Q.Thủ Đức, TP.HCM',
        hireDate: new Date('2022-06-15'),
        salary: 18000000,
        isAvailable: true,
        licenseNumber: 'VET-2022-015',
        expertise: 'Phẫu thuật',
      },
    ]);
    console.log(`✅ Created ${vets.length} veterinarians`);

    // Care Staff
    const careStaffRepo = queryRunner.manager.getRepository(CareStaff);
    const careStaff = await careStaffRepo.save([
      {
        accountId: accounts[3].accountId,
        fullName: 'Lê Thị Hồng',
        phoneNumber: '0904567890',
        address: '321 Hoàng Diệu, Q.4, TP.HCM',
        hireDate: new Date('2023-01-10'),
        salary: 8000000,
        isAvailable: true,
        skills: ['Tắm spa', 'Cắt tỉa lông', 'Chăm sóc móng'],
      },
      {
        accountId: accounts[4].accountId,
        fullName: 'Trần Văn Nam',
        phoneNumber: '0905678901',
        address: '654 Nguyễn Huệ, Q.1, TP.HCM',
        hireDate: new Date('2023-04-01'),
        salary: 7500000,
        isAvailable: true,
        skills: ['Lưu trú khách sạn', 'Dắt dạo thú cưng'],
      },
    ]);
    console.log(`✅ Created ${careStaff.length} care staff`);

    // Receptionist
    const receptionistRepo = queryRunner.manager.getRepository(Receptionist);
    const receptionist = await receptionistRepo.save({
      accountId: accounts[5].accountId,
      fullName: 'Nguyễn Thị Mai',
      phoneNumber: '0906789012',
      address: '987 Trần Hưng Đạo, Q.5, TP.HCM',
      hireDate: new Date('2022-09-01'),
      salary: 10000000,
      isAvailable: true,
    });
    console.log('✅ Created 1 receptionist');

    // ====== 3. PET OWNERS ======
    console.log('📦 Seeding pet owners...');
    const petOwnerRepo = queryRunner.manager.getRepository(PetOwner);

    const petOwners = await petOwnerRepo.save([
      {
        accountId: accounts[6].accountId,
        fullName: 'Nguyễn Thị Minh Anh',
        phoneNumber: '0912345678',
        address: '111 Lê Lợi, Q.1, TP.HCM',
        preferredContactMethod: 'Phone',
        emergencyContact: '0987654321',
      },
      {
        accountId: accounts[7].accountId,
        fullName: 'Trần Quốc Đại',
        phoneNumber: '0923456789',
        address: '222 Nguyễn Trãi, Q.5, TP.HCM',
        preferredContactMethod: 'Email',
        emergencyContact: '0976543210',
      },
      {
        accountId: accounts[8].accountId,
        fullName: 'Lê Hoàng Long',
        phoneNumber: '0934567890',
        address: '333 Võ Văn Tần, Q.3, TP.HCM',
        preferredContactMethod: 'Zalo',
        emergencyContact: undefined,
      },
    ]);
    console.log(`✅ Created ${petOwners.length} pet owners`);

    // ====== 4. PETS ======
    console.log('📦 Seeding pets...');
    const petRepo = queryRunner.manager.getRepository(Pet);

    const pets = await petRepo.save([
      // Owner 1's pets
      {
        ownerId: petOwners[0].petOwnerId,
        name: 'Miu',
        species: 'Cat',
        breed: 'Mèo Ba Tư',
        gender: 'Female',
        birthDate: new Date('2022-03-15'),
        weight: 4.5,
        color: 'Trắng xám',
        specialNotes: 'Dị ứng thức ăn biển',
      },
      {
        ownerId: petOwners[0].petOwnerId,
        name: 'Lucky',
        species: 'Dog',
        breed: 'Golden Retriever',
        gender: 'Male',
        birthDate: new Date('2021-07-22'),
        weight: 28.5,
        color: 'Vàng kem',
      },
      // Owner 2's pets
      {
        ownerId: petOwners[1].petOwnerId,
        name: 'Bông',
        species: 'Dog',
        breed: 'Poodle',
        gender: 'Female',
        birthDate: new Date('2023-01-10'),
        weight: 5.2,
        color: 'Trắng',
      },
      // Owner 3's pets
      {
        ownerId: petOwners[2].petOwnerId,
        name: 'Rex',
        species: 'Dog',
        breed: 'Husky Siberia',
        gender: 'Male',
        birthDate: new Date('2020-11-05'),
        weight: 23.0,
        color: 'Xám trắng',
        specialNotes: 'Cần không gian mát mẻ',
      },
      {
        ownerId: petOwners[2].petOwnerId,
        name: 'Mèo Mun',
        species: 'Cat',
        breed: 'Mèo Đen',
        gender: 'Male',
        birthDate: new Date('2022-10-31'),
        weight: 5.0,
        color: 'Đen tuyền',
      },
    ]);
    console.log(`✅ Created ${pets.length} pets`);

    // ====== 5. SERVICE CATEGORIES ======
    console.log('📦 Seeding service categories...');
    const categoryRepo = queryRunner.manager.getRepository(ServiceCategory);

    const categories = await categoryRepo.save([
      {
        categoryName: 'Khám bệnh & Điều trị',
        description: 'Dịch vụ khám chữa bệnh cho thú cưng',
      },
      {
        categoryName: 'Tiêm phòng & Xét nghiệm',
        description: 'Tiêm vaccine và các xét nghiệm y tế',
      },
      {
        categoryName: 'Spa & Làm đẹp',
        description: 'Tắm, cắt tỉa lông, làm đẹp cho thú cưng',
      },
      {
        categoryName: 'Khách sạn thú cưng',
        description: 'Dịch vụ lưu trú cho thú cưng',
      },
      { categoryName: 'Phẫu thuật', description: 'Các dịch vụ phẫu thuật' },
    ]);
    console.log(`✅ Created ${categories.length} service categories`);

    // ====== 6. SERVICES ======
    console.log('📦 Seeding services...');
    const serviceRepo = queryRunner.manager.getRepository(Service);

    const services = await serviceRepo.save([
      // Khám bệnh
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Khám tổng quát',
        description: 'Kiểm tra sức khỏe định kỳ',
        basePrice: 150000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Khám chuyên khoa',
        description: 'Khám theo chuyên khoa cụ thể',
        basePrice: 250000,
        estimatedDuration: 45,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      // Tiêm phòng
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Tiêm vaccine 5 bệnh',
        description: 'Vaccine phòng 5 bệnh nguy hiểm',
        basePrice: 200000,
        estimatedDuration: 15,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Tiêm vaccine dại',
        description: 'Vaccine phòng bệnh dại',
        basePrice: 150000,
        estimatedDuration: 15,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Xét nghiệm máu',
        description: 'Xét nghiệm công thức máu',
        basePrice: 300000,
        estimatedDuration: 20,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      // Spa
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Tắm + Sấy khô',
        description: 'Tắm và sấy lông cho thú cưng',
        basePrice: 120000,
        estimatedDuration: 60,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
      },
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Cắt tỉa tạo kiểu',
        description: 'Cắt tỉa lông và tạo kiểu cho thú cưng',
        basePrice: 200000,
        estimatedDuration: 90,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
      },
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Combo Spa Full',
        description: 'Tắm + Sấy + Cắt + Massage',
        basePrice: 350000,
        estimatedDuration: 120,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
      },
      // Khách sạn
      {
        categoryId: categories[3].categoryId,
        serviceName: 'Lưu trú qua đêm',
        description: 'Dịch vụ lưu trú qua đêm',
        basePrice: 250000,
        estimatedDuration: 1440,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: true,
      },
      {
        categoryId: categories[3].categoryId,
        serviceName: 'Lưu trú VIP',
        description: 'Phòng VIP với tiện nghi cao cấp',
        basePrice: 400000,
        estimatedDuration: 1440,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: true,
      },
      // Phẫu thuật
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Triệt sản',
        description: 'Phẫu thuật triệt sản cho thú cưng',
        basePrice: 1500000,
        estimatedDuration: 120,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Nhổ răng',
        description: 'Phẫu thuật nhổ răng sâu/hư',
        basePrice: 500000,
        estimatedDuration: 60,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
    ]);
    console.log(`✅ Created ${services.length} services`);

    // ====== 7. CAGES ======
    console.log('📦 Seeding cages...');
    const cageRepo = queryRunner.manager.getRepository(Cage);

    const cages = await cageRepo.save([
      {
        cageNumber: 'S-01',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 1',
      },
      {
        cageNumber: 'S-02',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 1',
      },
      {
        cageNumber: 'M-01',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 1',
      },
      {
        cageNumber: 'M-02',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 1',
      },
      {
        cageNumber: 'L-01',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 1',
      },
      {
        cageNumber: 'L-02',
        size: CageSize.LARGE,
        status: CageStatus.MAINTENANCE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 1',
      },
      {
        cageNumber: 'VIP-01',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 650000,
        location: 'Khu VIP - Tầng 2',
      },
    ]);
    console.log(`✅ Created ${cages.length} cages`);

    // ====== 8. VACCINE TYPES ======
    console.log('📦 Seeding vaccine types...');
    const vaccineRepo = queryRunner.manager.getRepository(VaccineType);

    const vaccines = await vaccineRepo.save([
      {
        vaccineName: 'Vaccine 5 in 1 (DHPP)',
        targetSpecies: 'Dog',
        category: VaccineCategory.CORE,
        manufacturer: 'Nobivac',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 12,
        description:
          'Phòng 5 bệnh: Parvovirus, Distemper, Hepatitis, Parainfluenza, Leptospirosis',
      },
      {
        vaccineName: 'Vaccine 7 in 1',
        targetSpecies: 'Dog',
        category: VaccineCategory.CORE,
        manufacturer: 'Vanguard',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 12,
        description: 'Phòng 7 bệnh nguy hiểm cho chó',
      },
      {
        vaccineName: 'Vaccine Dại',
        targetSpecies: 'Both',
        category: VaccineCategory.CORE,
        manufacturer: 'Rabisin',
        recommendedAgeMonths: 3,
        boosterIntervalMonths: 12,
        description: 'Phòng bệnh dại - bắt buộc theo quy định',
      },
      {
        vaccineName: 'Vaccine FVRCP',
        targetSpecies: 'Cat',
        category: VaccineCategory.CORE,
        manufacturer: 'Felocell',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 12,
        description:
          'Phòng viêm mũi khí quản, calicivirus, panleukopenia cho mèo',
      },
      {
        vaccineName: 'Vaccine FeLV',
        targetSpecies: 'Cat',
        category: VaccineCategory.NON_CORE,
        manufacturer: 'Purevax',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 12,
        description: 'Phòng bệnh bạch cầu cho mèo',
      },
      {
        vaccineName: 'Vaccine Kennel Cough',
        targetSpecies: 'Dog',
        category: VaccineCategory.NON_CORE,
        manufacturer: 'Bronchi-Shield',
        recommendedAgeMonths: 4,
        boosterIntervalMonths: 12,
        description: 'Phòng bệnh ho cũi cho chó',
      },
    ]);
    console.log(`✅ Created ${vaccines.length} vaccine types`);

    await queryRunner.commitTransaction();
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Clear all data from database (for testing)
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  console.log('🧹 Clearing database...');

  const entities = dataSource.entityMetadatas;

  for (const entity of entities.reverse()) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
    );
  }

  console.log('✅ Database cleared');
}

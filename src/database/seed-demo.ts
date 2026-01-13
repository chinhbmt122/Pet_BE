import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account } from '../entities/account.entity';
import { Employee } from '../entities/employee.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Pet } from '../entities/pet.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Service } from '../entities/service.entity';
import { Cage } from '../entities/cage.entity';
import { VaccineType } from '../entities/vaccine-type.entity';
import { Appointment } from '../entities/appointment.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { VaccinationHistory } from '../entities/vaccination-history.entity';
import {
  UserType,
  CageSize,
  CageStatus,
  VaccineCategory,
  AppointmentStatus,
  CageAssignmentStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '../entities/types/entity.types';

/**
 * COMPREHENSIVE SEED DATA FOR DEMO - January 14, 2026
 *
 * This seed file creates realistic, comprehensive data for all features:
 * - 12 Accounts (staff + customers)
 * - 1 Manager, 3 Vets, 3 Care Staff, 1 Receptionist
 * - 6 Pet Owners with 15+ Pets (dogs, cats, birds, hamsters)
 * - 5 Service Categories with 18 Services
 * - 25 Appointments (all statuses, spread across dates)
 * - 20 Cages with various states
 * - Medical Records with treatments and follow-ups
 * - Invoices with different payment methods
 * - Vaccination history
 * - Work schedules
 */

export async function seedDemoDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting DEMO database seeding for January 14, 2026...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Helper functions
    const formatTime = (hours: number, minutes: number = 0): string => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };

    const getDateOffset = (daysOffset: number): Date => {
      const date = new Date('2026-01-14'); // Demo date
      date.setDate(date.getDate() + daysOffset);
      return date;
    };

    const generateInvoiceNumber = (index: number): string => {
      return `INV-202601-${String(index).padStart(4, '0')}`;
    };

    // ====== 1. ACCOUNTS ======
    console.log('📦 Seeding accounts...');
    const accountRepo = queryRunner.manager.getRepository(Account);
    const passwordHash = await bcrypt.hash('Password@123', 10);

    const accounts = await accountRepo.save([
      // Manager (1)
      {
        email: 'manager@pawlovers.com',
        passwordHash,
        userType: UserType.MANAGER,
        isActive: true,
      },

      // Veterinarians (3)
      {
        email: 'vet.lan@pawlovers.com',
        passwordHash,
        userType: UserType.VETERINARIAN,
        isActive: true,
      },
      {
        email: 'vet.tuan@pawlovers.com',
        passwordHash,
        userType: UserType.VETERINARIAN,
        isActive: true,
      },
      {
        email: 'vet.minh@pawlovers.com',
        passwordHash,
        userType: UserType.VETERINARIAN,
        isActive: true,
      },

      // Care Staff (3)
      {
        email: 'care.hong@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },
      {
        email: 'care.nam@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },
      {
        email: 'care.huong@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },

      // Receptionist (1)
      {
        email: 'reception@pawlovers.com',
        passwordHash,
        userType: UserType.RECEPTIONIST,
        isActive: true,
      },

      // Pet Owners (6)
      {
        email: 'owner.minhanh@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner.quocdai@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner.hoanglong@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner.hongnhung@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner.minhphuc@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner.thanhha@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${accounts.length} accounts`);

    // ====== 2. EMPLOYEES ======
    console.log('📦 Seeding employees...');
    const employeeRepo = queryRunner.manager.getRepository(Employee);

    const employees = await employeeRepo.save([
      // Manager
      {
        accountId: accounts[0].accountId,
        fullName: 'Nguyễn Văn Quản Lý',
        phoneNumber: '0901234567',
        address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
        hireDate: new Date('2020-01-15'),
        salary: 25000000,
        isAvailable: true,
        licenseNumber: null,
        expertise: null,
        skills: null,
      },
      // Veterinarians
      {
        accountId: accounts[1].accountId,
        fullName: 'BS. Trần Thị Lan',
        phoneNumber: '0902345678',
        address: '456 Lê Văn Lương, Q.7, TP.HCM',
        hireDate: new Date('2021-03-01'),
        salary: 20000000,
        isAvailable: true,
        licenseNumber: 'VET-2021-001',
        expertise: 'Nội khoa thú nhỏ, Da liễu',
        skills: null,
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
        expertise: 'Phẫu thuật, Ngoại khoa',
        skills: null,
      },
      {
        accountId: accounts[3].accountId,
        fullName: 'BS. Lê Hoàng Minh',
        phoneNumber: '0904567890',
        address: '321 Võ Văn Kiệt, Q.5, TP.HCM',
        hireDate: new Date('2023-02-20'),
        salary: 17000000,
        isAvailable: true,
        licenseNumber: 'VET-2023-008',
        expertise: 'Tim mạch, Hô hấp',
        skills: null,
      },
      // Care Staff
      {
        accountId: accounts[4].accountId,
        fullName: 'Lê Thị Hồng',
        phoneNumber: '0905678901',
        address: '654 Hoàng Diệu, Q.4, TP.HCM',
        hireDate: new Date('2023-01-10'),
        salary: 8000000,
        isAvailable: true,
        licenseNumber: null,
        expertise: null,
        skills: ['Tắm spa', 'Cắt tỉa lông', 'Chăm sóc móng'],
      },
      {
        accountId: accounts[5].accountId,
        fullName: 'Trần Văn Nam',
        phoneNumber: '0906789012',
        address: '987 Nguyễn Huệ, Q.1, TP.HCM',
        hireDate: new Date('2023-04-01'),
        salary: 7500000,
        isAvailable: true,
        licenseNumber: null,
        expertise: null,
        skills: ['Lưu trú khách sạn', 'Dắt dạo thú cưng'],
      },
      {
        accountId: accounts[6].accountId,
        fullName: 'Phạm Thị Hương',
        phoneNumber: '0907890123',
        address: '123 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
        hireDate: new Date('2024-01-15'),
        salary: 7000000,
        isAvailable: true,
        licenseNumber: null,
        expertise: null,
        skills: ['Tắm spa', 'Massage thú cưng', 'Vệ sinh tai mắt'],
      },
      // Receptionist
      {
        accountId: accounts[7].accountId,
        fullName: 'Nguyễn Thị Mai',
        phoneNumber: '0908901234',
        address: '456 Trần Hưng Đạo, Q.5, TP.HCM',
        hireDate: new Date('2022-09-01'),
        salary: 10000000,
        isAvailable: true,
        licenseNumber: null,
        expertise: null,
        skills: null,
      },
    ]);
    console.log(`✅ Created ${employees.length} employees`);

    // ====== 3. PET OWNERS ======
    console.log('📦 Seeding pet owners...');
    const petOwnerRepo = queryRunner.manager.getRepository(PetOwner);

    const petOwners = await petOwnerRepo.save([
      {
        accountId: accounts[8].accountId,
        fullName: 'Nguyễn Thị Minh Anh',
        phoneNumber: '0912345678',
        address: '111 Lê Lợi, Q.1, TP.HCM',
        preferredContactMethod: 'Phone',
        emergencyContact: '0987654321',
      },
      {
        accountId: accounts[9].accountId,
        fullName: 'Trần Quốc Đại',
        phoneNumber: '0923456789',
        address: '222 Nguyễn Trãi, Q.5, TP.HCM',
        preferredContactMethod: 'Email',
        emergencyContact: '0976543210',
      },
      {
        accountId: accounts[10].accountId,
        fullName: 'Lê Hoàng Long',
        phoneNumber: '0934567890',
        address: '333 Võ Văn Tần, Q.3, TP.HCM',
        preferredContactMethod: 'Zalo',
        emergencyContact: '0965432109',
      },
      {
        accountId: accounts[11].accountId,
        fullName: 'Võ Thị Hồng Nhung',
        phoneNumber: '0945678901',
        address: '444 Cách Mạng Tháng 8, Q.10, TP.HCM',
        preferredContactMethod: 'Phone',
        emergencyContact: '0954321098',
      },
      {
        accountId: accounts[12].accountId,
        fullName: 'Đặng Minh Phúc',
        phoneNumber: '0956789012',
        address: '555 Hai Bà Trưng, Q.1, TP.HCM',
        preferredContactMethod: 'Email',
        emergencyContact: '0943210987',
      },
      {
        accountId: accounts[13].accountId,
        fullName: 'Phan Thanh Hà',
        phoneNumber: '0967890123',
        address: '666 Lý Tự Trọng, Q.1, TP.HCM',
        preferredContactMethod: 'Phone',
        emergencyContact: '0932109876',
      },
    ]);
    console.log(`✅ Created ${petOwners.length} pet owners`);

    // ====== 4. PETS (15+ diverse pets) ======
    console.log('📦 Seeding pets...');
    const petRepo = queryRunner.manager.getRepository(Pet);

    const pets = await petRepo.save([
      // Owner 1 - Nguyễn Thị Minh Anh
      {
        ownerId: petOwners[0].petOwnerId,
        name: 'Miu Miu',
        species: 'Cat',
        breed: 'Mèo Ba Tư',
        gender: 'Female',
        birthDate: new Date('2022-03-15'),
        weight: 4.5,
        color: 'Trắng xám',
        specialNotes: 'Dị ứng thức ăn biển, cần thức ăn hypoallergenic',
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
        specialNotes: 'Rất thân thiện, thích chơi bóng',
      },

      // Owner 2 - Trần Quốc Đại
      {
        ownerId: petOwners[1].petOwnerId,
        name: 'Bông',
        species: 'Dog',
        breed: 'Poodle',
        gender: 'Female',
        birthDate: new Date('2023-01-10'),
        weight: 5.2,
        color: 'Trắng',
        specialNotes: 'Cần cắt lông thường xuyên',
      },
      {
        ownerId: petOwners[1].petOwnerId,
        name: 'Bi',
        species: 'Dog',
        breed: 'Chihuahua',
        gender: 'Male',
        birthDate: new Date('2023-08-20'),
        weight: 2.1,
        color: 'Nâu',
        specialNotes: 'Rất nhút nhát, dễ sợ',
      },

      // Owner 3 - Lê Hoàng Long
      {
        ownerId: petOwners[2].petOwnerId,
        name: 'Rex',
        species: 'Dog',
        breed: 'Husky Siberia',
        gender: 'Male',
        birthDate: new Date('2020-11-05'),
        weight: 23.0,
        color: 'Xám trắng',
        specialNotes: 'Cần không gian mát mẻ, năng động cao',
      },
      {
        ownerId: petOwners[2].petOwnerId,
        name: 'Mèo Mun',
        species: 'Cat',
        breed: 'Mèo Đen Châu Âu',
        gender: 'Male',
        birthDate: new Date('2022-10-31'),
        weight: 5.0,
        color: 'Đen tuyền',
        specialNotes: 'Hiếu động, thích trèo cao',
      },

      // Owner 4 - Võ Thị Hồng Nhung
      {
        ownerId: petOwners[3].petOwnerId,
        name: 'Bí Ngô',
        species: 'Cat',
        breed: 'Mèo Anh Lông Ngắn',
        gender: 'Male',
        birthDate: new Date('2023-05-20'),
        weight: 4.0,
        color: 'Cam vằn',
        specialNotes: 'Rất thích chơi đuổi bắt, năng động',
      },
      {
        ownerId: petOwners[3].petOwnerId,
        name: 'Oreo',
        species: 'Hamster',
        breed: 'Syrian Hamster',
        gender: 'Male',
        birthDate: new Date('2024-01-10'),
        weight: 0.15,
        color: 'Đen trắng',
        specialNotes: 'Cần giữ trong chuồng có bánh xe chạy',
      },
      {
        ownerId: petOwners[3].petOwnerId,
        name: 'Mèo Vện',
        species: 'Cat',
        breed: 'Mèo Ta',
        gender: 'Female',
        birthDate: new Date('2021-06-15'),
        weight: 3.8,
        color: 'Vàng vện',
        specialNotes: 'Rất ngoan, ít kén ăn',
      },

      // Owner 5 - Đặng Minh Phúc
      {
        ownerId: petOwners[4].petOwnerId,
        name: 'Sóc',
        species: 'Dog',
        breed: 'Corgi',
        gender: 'Female',
        birthDate: new Date('2022-08-15'),
        weight: 12.0,
        color: 'Vàng nâu trắng',
        specialNotes: 'Chân ngắn, cần vận động vừa phải',
      },
      {
        ownerId: petOwners[4].petOwnerId,
        name: 'Chip Chip',
        species: 'Bird',
        breed: 'Vẹt Yến Phụng',
        gender: 'Male',
        birthDate: new Date('2023-06-01'),
        weight: 0.03,
        color: 'Xanh vàng',
        specialNotes: 'Biết nói vài từ đơn giản: "Chào", "Bye"',
      },
      {
        ownerId: petOwners[4].petOwnerId,
        name: 'Mochi',
        species: 'Dog',
        breed: 'Shiba Inu',
        gender: 'Female',
        birthDate: new Date('2021-12-25'),
        weight: 10.5,
        color: 'Vàng',
        specialNotes: 'Rất thân thiện với trẻ em',
      },

      // Owner 6 - Phan Thanh Hà
      {
        ownerId: petOwners[5].petOwnerId,
        name: 'Latte',
        species: 'Cat',
        breed: 'Mèo Munchkin',
        gender: 'Female',
        birthDate: new Date('2023-03-10'),
        weight: 3.2,
        color: 'Nâu sữa',
        specialNotes: 'Chân ngắn, cần hỗ trợ leo trèo',
      },
      {
        ownerId: petOwners[5].petOwnerId,
        name: 'Max',
        species: 'Dog',
        breed: 'Beagle',
        gender: 'Male',
        birthDate: new Date('2022-05-18'),
        weight: 11.5,
        color: 'Nâu trắng đen',
        specialNotes: 'Rất thích đánh hơi, tính tò mò cao',
      },
      {
        ownerId: petOwners[5].petOwnerId,
        name: 'Simba',
        species: 'Cat',
        breed: 'Maine Coon',
        gender: 'Male',
        birthDate: new Date('2021-09-12'),
        weight: 7.2,
        color: 'Nâu vàng',
        specialNotes: 'Giống mèo lớn, hiền lành',
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

    // ====== 6. SERVICES (18 services) ======
    console.log('📦 Seeding services...');
    const serviceRepo = queryRunner.manager.getRepository(Service);

    const services = await serviceRepo.save([
      // Khám bệnh (4)
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Khám tổng quát',
        description: 'Kiểm tra sức khỏe định kỳ',
        basePrice: 150000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Khám chuyên khoa',
        description: 'Khám theo chuyên khoa cụ thể',
        basePrice: 250000,
        estimatedDuration: 45,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Điều trị bệnh ngoài da',
        description: 'Điều trị các bệnh về da như nấm, ghẻ, viêm da',
        basePrice: 350000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Khám cấp cứu',
        description: 'Khám bệnh và xử lý cấp cứu',
        basePrice: 500000,
        estimatedDuration: 60,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },

      // Tiêm phòng & Xét nghiệm (4)
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Tiêm vaccine 5 bệnh',
        description: 'Vaccine phòng 5 bệnh nguy hiểm',
        basePrice: 200000,
        estimatedDuration: 15,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Tiêm vaccine dại',
        description: 'Vaccine phòng bệnh dại',
        basePrice: 150000,
        estimatedDuration: 15,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Xét nghiệm máu',
        description: 'Xét nghiệm công thức máu',
        basePrice: 300000,
        estimatedDuration: 20,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[1].categoryId,
        serviceName: 'Xét nghiệm phân',
        description: 'Phát hiện ký sinh trùng',
        basePrice: 200000,
        estimatedDuration: 15,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },

      // Spa & Làm đẹp (4)
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Tắm + Sấy khô',
        description: 'Tắm và sấy lông cho thú cưng',
        basePrice: 120000,
        estimatedDuration: 60,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: false,
      },
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Cắt tỉa tạo kiểu',
        description: 'Cắt tỉa lông và tạo kiểu cho thú cưng',
        basePrice: 200000,
        estimatedDuration: 90,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: false,
      },
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Combo Spa Full',
        description: 'Tắm + Sấy + Cắt + Massage',
        basePrice: 350000,
        estimatedDuration: 120,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: false,
      },
      {
        categoryId: categories[2].categoryId,
        serviceName: 'Vệ sinh tai mắt',
        description: 'Vệ sinh tai, mắt, móng',
        basePrice: 80000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: false,
      },

      // Khách sạn (3)
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
      {
        categoryId: categories[3].categoryId,
        serviceName: 'Dắt dạo thú cưng',
        description: 'Dịch vụ dắt dạo cho thú cưng lưu trú',
        basePrice: 50000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
        isBoardingService: false,
      },

      // Phẫu thuật (3)
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Triệt sản',
        description: 'Phẫu thuật triệt sản cho thú cưng',
        basePrice: 1500000,
        estimatedDuration: 120,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Nhổ răng',
        description: 'Phẫu thuật nhổ răng sâu/hư',
        basePrice: 500000,
        estimatedDuration: 60,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Mổ lấy dị vật',
        description: 'Phẫu thuật lấy dị vật trong đường tiêu hóa',
        basePrice: 2500000,
        estimatedDuration: 180,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
        isBoardingService: false,
      },
    ]);
    console.log(`✅ Created ${services.length} services`);

    // ====== 7. CAGES (20 cages) ======
    console.log('📦 Seeding cages...');
    const cageRepo = queryRunner.manager.getRepository(Cage);

    const cages = await cageRepo.save([
      // Small cages (8)
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
        cageNumber: 'S-03',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 1',
      },
      {
        cageNumber: 'S-04',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 2',
      },
      {
        cageNumber: 'S-05',
        size: CageSize.SMALL,
        status: CageStatus.MAINTENANCE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 2',
      },
      {
        cageNumber: 'S-06',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 2',
      },
      {
        cageNumber: 'S-07',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 2',
      },
      {
        cageNumber: 'S-08',
        size: CageSize.SMALL,
        status: CageStatus.AVAILABLE,
        dailyRate: 250000,
        location: 'Khu A - Tầng 3',
      },

      // Medium cages (7)
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
        cageNumber: 'M-03',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 1',
      },
      {
        cageNumber: 'M-04',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 2',
      },
      {
        cageNumber: 'M-05',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 2',
      },
      {
        cageNumber: 'M-06',
        size: CageSize.MEDIUM,
        status: CageStatus.RESERVED,
        dailyRate: 350000,
        location: 'Khu B - Tầng 2',
      },
      {
        cageNumber: 'M-07',
        size: CageSize.MEDIUM,
        status: CageStatus.AVAILABLE,
        dailyRate: 350000,
        location: 'Khu B - Tầng 3',
      },

      // Large cages & VIP (5)
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
        notes: 'Đang sửa chữa hệ thống điều hòa',
      },
      {
        cageNumber: 'L-03',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 2',
      },
      {
        cageNumber: 'VIP-01',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 650000,
        location: 'Khu VIP - Tầng 2',
        notes: 'Phòng VIP với điều hòa, camera',
      },
      {
        cageNumber: 'VIP-02',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 750000,
        location: 'Khu VIP - Tầng 2',
        notes: 'Phòng VIP Deluxe',
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
      {
        vaccineName: 'Vaccine Lyme',
        targetSpecies: 'Dog',
        category: VaccineCategory.NON_CORE,
        manufacturer: 'Vanguard',
        recommendedAgeMonths: 3,
        boosterIntervalMonths: 12,
        description: 'Phòng bệnh Lyme do ve gây ra',
      },
      {
        vaccineName: 'Vaccine FIP',
        targetSpecies: 'Cat',
        category: VaccineCategory.OPTIONAL,
        manufacturer: 'Primucell',
        recommendedAgeMonths: 4,
        boosterIntervalMonths: 12,
        description: 'Phòng viêm phúc mạc truyền nhiễm ở mèo',
      },
      {
        vaccineName: 'Vaccine Bordetella',
        targetSpecies: 'Dog',
        category: VaccineCategory.NON_CORE,
        manufacturer: 'Nobivac KC',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 6,
        description: 'Phòng bệnh viêm khí quản do Bordetella',
      },
      {
        vaccineName: 'Vaccine Chlamydia',
        targetSpecies: 'Cat',
        category: VaccineCategory.OPTIONAL,
        manufacturer: 'Felocell CVR-C',
        recommendedAgeMonths: 2,
        boosterIntervalMonths: 12,
        description: 'Phòng bệnh Chlamydia ở mèo',
      },
    ]);
    console.log(`✅ Created ${vaccines.length} vaccine types`);

    // ====== 9. WORK SCHEDULES (Full Week Coverage) ======
    console.log('📦 Seeding work schedules for FULL WEEK...');
    const scheduleRepo = queryRunner.manager.getRepository(WorkSchedule);

    const schedules = await scheduleRepo.save([
      // === MONDAY Jan 12 (-2 days) ===
      {
        employeeId: employees[0].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Manager - Completed',
      },
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'BS. Lan - Completed',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'BS. Tuấn - Completed',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Care Hong - Completed',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Care Nam - Completed',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Care Hương - Completed',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(-2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Receptionist - Completed',
      },

      // === TUESDAY Jan 13 (-1 day) ===
      {
        employeeId: employees[0].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Manager - Completed',
      },
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'BS. Lan - Completed',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'BS. Tuấn - Completed',
      },
      {
        employeeId: employees[3].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'BS. Minh - Completed',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(7, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Care Hong - Early shift Completed',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 0),
        breakStart: formatTime(12, 30),
        breakEnd: formatTime(13, 30),
        isAvailable: false,
        notes: 'Care Nam - Late shift Completed',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Care Hương - Completed',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Receptionist - Completed',
      },

      // === WEDNESDAY Jan 14 (TODAY - Demo Day) ===
      {
        employeeId: employees[0].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Manager - On duty',
      },
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Lan - Full day',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Tuấn - Full day',
      },
      {
        employeeId: employees[3].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(10, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Minh - Late start',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(7, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hong - Early shift',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 0),
        breakStart: formatTime(12, 30),
        breakEnd: formatTime(13, 30),
        isAvailable: true,
        notes: 'Care Nam - Late shift',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 30),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hương - Extended',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Receptionist Mai',
      },

      // === THURSDAY Jan 15 (+1 day) ===
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Lan - Extended for surgery',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 30),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Tuấn - Late surgery',
      },
      {
        employeeId: employees[3].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Minh',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hong',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Nam',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hương',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(1),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Receptionist',
      },

      // === FRIDAY Jan 16 (+2 days) ===
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 30),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Lan - Friday',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Tuấn - Friday late',
      },
      {
        employeeId: employees[3].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'BS. Minh',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hong',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Nam',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Care Hương',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Receptionist',
      },

      // === SATURDAY Jan 17 (+3 days) - Half day ===
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'BS. Lan - Half day',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'BS. Tuấn - Half day',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Care Hong - Half day',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Care Nam - Half day',
      },
      {
        employeeId: employees[6].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Care Hương - Half day',
      },
      {
        employeeId: employees[7].employeeId,
        workDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(13, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Receptionist - Half day',
      },

      // === SUNDAY Jan 18 (+4 days) - Emergency only ===
      {
        employeeId: employees[1].employeeId,
        workDate: getDateOffset(4),
        startTime: formatTime(9, 0),
        endTime: formatTime(15, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'BS. Lan - Emergency on-call',
      },
      {
        employeeId: employees[2].employeeId,
        workDate: getDateOffset(4),
        startTime: formatTime(9, 0),
        endTime: formatTime(16, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'BS. Tuấn - Emergency on-call',
      },
      {
        employeeId: employees[4].employeeId,
        workDate: getDateOffset(4),
        startTime: formatTime(9, 0),
        endTime: formatTime(15, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Care Hong - Light duty',
      },
      {
        employeeId: employees[5].employeeId,
        workDate: getDateOffset(4),
        startTime: formatTime(9, 0),
        endTime: formatTime(15, 0),
        breakStart: undefined,
        breakEnd: undefined,
        isAvailable: true,
        notes: 'Care Nam - Light duty',
      },
    ]);
    console.log(`✅ Created ${schedules.length} work schedules`);

    //====== 10. APPOINTMENTS (60+ appointments across FULL WEEK) ======
    console.log('📦 Seeding appointments for FULL WEEK (Jan 12-18, 2026)...');
    const appointmentRepo = queryRunner.manager.getRepository(Appointment);

    const appointments = (await appointmentRepo.save([
      // ==================== MONDAY Jan 12 (-2 days) - 8 appointments ====================
      {
        petId: pets[4].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(8, 30),
        endTime: formatTime(9, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám tổng quát Rex',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[11].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(9, 15),
        endTime: formatTime(9, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tiêm vaccine 5 bệnh Latte',
        estimatedCost: 200000,
        actualCost: 200000,
      },
      {
        petId: pets[0].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 45),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám da liễu Miu Miu',
        estimatedCost: 250000,
        actualCost: 300000,
      },
      {
        petId: pets[8].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(10, 30),
        endTime: formatTime(11, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tắm Mèo Vện',
        estimatedCost: 120000,
        actualCost: 120000,
      },
      {
        petId: pets[13].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(13, 30),
        endTime: formatTime(14, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám tổng quát Max',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[2].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(14, 0),
        endTime: formatTime(15, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Cắt tỉa lông Bông',
        estimatedCost: 200000,
        actualCost: 200000,
      },
      {
        petId: pets[9].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[15].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(15, 0),
        endTime: formatTime(16, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Nhổ răng sâu Sóc',
        estimatedCost: 500000,
        actualCost: 500000,
      },
      {
        petId: pets[5].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[11].serviceId,
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(16, 0),
        endTime: formatTime(16, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Vệ sinh tai mắt Mèo Mun',
        estimatedCost: 80000,
        actualCost: 80000,
      },

      // ==================== TUESDAY Jan 13 (-1 day) - 10 appointments ====================
      {
        petId: pets[1].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(8, 0),
        endTime: formatTime(8, 15),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tiêm vaccine Lucky',
        estimatedCost: 200000,
        actualCost: 200000,
      },
      {
        petId: pets[7].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[5].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 15),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tiêm vaccine dại Oreo',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[12].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(9, 30),
        endTime: formatTime(10, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám sức khỏe Max',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[6].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(10, 15),
        endTime: formatTime(10, 35),
        status: AppointmentStatus.COMPLETED,
        notes: 'Xét nghiệm máu Simba',
        estimatedCost: 300000,
        actualCost: 300000,
      },
      {
        petId: pets[1].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(10, 30),
        endTime: formatTime(12, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Spa toàn diện Lucky',
        estimatedCost: 350000,
        actualCost: 380000,
      },
      {
        petId: pets[3].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(13, 0),
        endTime: formatTime(14, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tắm Bi',
        estimatedCost: 120000,
        actualCost: 120000,
      },
      {
        petId: pets[11].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[6].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(14, 0),
        endTime: formatTime(14, 20),
        status: AppointmentStatus.COMPLETED,
        notes: 'Xét nghiệm máu trước triệt sản',
        estimatedCost: 300000,
        actualCost: 300000,
      },
      {
        petId: pets[6].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[11].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(14, 30),
        endTime: formatTime(15, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Vệ sinh tai Bí Ngô',
        estimatedCost: 80000,
        actualCost: 80000,
      },
      {
        petId: pets[10].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(15, 0),
        endTime: formatTime(16, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Cắt tỉa Mochi',
        estimatedCost: 200000,
        actualCost: 200000,
      },
      {
        petId: pets[0].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[3].serviceId,
        appointmentDate: getDateOffset(-1),
        startTime: formatTime(16, 0),
        endTime: formatTime(16, 45),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám cấp cứu - Miu bị ngộ độc nhẹ',
        estimatedCost: 500000,
        actualCost: 520000,
      },

      // ==================== WEDNESDAY Jan 14 (TODAY - 0) - 12 appointments 🎯 ====================
      // Morning - COMPLETED
      {
        petId: pets[11].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(7, 0),
        endTime: formatTime(8, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Đã tắm xong cho Latte',
        estimatedCost: 120000,
        actualCost: 120000,
      },
      {
        petId: pets[13].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[5].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(8, 0),
        endTime: formatTime(8, 15),
        status: AppointmentStatus.COMPLETED,
        notes: 'Đã tiêm vaccine dại cho Max',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(8, 30),
        endTime: formatTime(10, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Cắt tỉa Simba hoàn thành',
        estimatedCost: 200000,
        actualCost: 200000,
      },

      // Morning - PENDING
      {
        petId: pets[0].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Kiểm tra sức khỏe định kỳ Miu Miu',
        estimatedCost: 150000,
      },
      {
        petId: pets[6].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(9, 45),
        endTime: formatTime(10, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Tiêm vaccine 5 bệnh Bí Ngô',
        estimatedCost: 200000,
      },

      // Mid-morning - CONFIRMED
      {
        petId: pets[9].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(10, 0),
        endTime: formatTime(11, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tắm cho Sóc',
        estimatedCost: 120000,
      },
      {
        petId: pets[12].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(10, 30),
        endTime: formatTime(11, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Khám tim mạch Max',
        estimatedCost: 250000,
      },

      // Late morning - IN_PROGRESS
      {
        petId: pets[4].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[2].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(11, 0),
        endTime: formatTime(11, 30),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Đang điều trị nấm da Rex',
        estimatedCost: 350000,
      },
      {
        petId: pets[2].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(11, 30),
        endTime: formatTime(13, 0),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Đang cắt tỉa lông Bông',
        estimatedCost: 200000,
      },

      // Afternoon - PENDING
      {
        petId: pets[7].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(14, 0),
        endTime: formatTime(14, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Khám định kỳ Oreo',
        estimatedCost: 150000,
      },

      // Afternoon - CONFIRMED
      {
        petId: pets[1].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(15, 0),
        endTime: formatTime(15, 30),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Khám tổng quát Lucky',
        estimatedCost: 150000,
      },

      // Late afternoon - IN_PROGRESS
      {
        petId: pets[3].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(0),
        startTime: formatTime(15, 30),
        endTime: formatTime(17, 30),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Đang spa full cho Bi',
        estimatedCost: 350000,
      },

      // ==================== THURSDAY Jan 15 (+1 day) - 10 appointments ====================
      {
        petId: pets[5].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(8, 30),
        endTime: formatTime(9, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Khám định kỳ Mèo Mun',
        estimatedCost: 150000,
      },
      {
        petId: pets[8].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tiêm vaccine Mèo Vện',
        estimatedCost: 200000,
      },
      {
        petId: pets[4].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(9, 30),
        endTime: formatTime(10, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Follow-up da liễu Rex',
        estimatedCost: 250000,
      },
      {
        petId: pets[13].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(10, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Spa full Max',
        estimatedCost: 350000,
      },
      {
        petId: pets[10].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[6].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(10, 30),
        endTime: formatTime(10, 50),
        status: AppointmentStatus.PENDING,
        notes: 'Xét nghiệm máu Mochi',
        estimatedCost: 300000,
      },
      {
        petId: pets[0].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(13, 30),
        endTime: formatTime(15, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Cắt tỉa Miu Miu',
        estimatedCost: 200000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(14, 0),
        endTime: formatTime(14, 30),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Khám tổng quát Simba',
        estimatedCost: 150000,
      },
      {
        petId: pets[6].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[11].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(15, 0),
        endTime: formatTime(15, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Vệ sinh tai mắt Bí Ngô',
        estimatedCost: 80000,
      },
      {
        petId: pets[9].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(15, 30),
        endTime: formatTime(16, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Follow-up sau nhổ răng Sóc',
        estimatedCost: 250000,
      },
      {
        petId: pets[11].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[15].serviceId,
        appointmentDate: getDateOffset(1),
        startTime: formatTime(16, 0),
        endTime: formatTime(18, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Triệt sản Latte - đã xét nghiệm',
        estimatedCost: 1500000,
      },

      // ==================== FRIDAY Jan 16 (+2 days) - 9 appointments ====================
      {
        petId: pets[2].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[5].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(8, 0),
        endTime: formatTime(8, 15),
        status: AppointmentStatus.PENDING,
        notes: 'Tiêm vaccine dại Bông',
        estimatedCost: 150000,
      },
      {
        petId: pets[7].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Khám tổng quát Oreo',
        estimatedCost: 150000,
      },
      {
        petId: pets[12].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(9, 45),
        endTime: formatTime(10, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tiêm vaccine Max',
        estimatedCost: 200000,
      },
      {
        petId: pets[1].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(10, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Spa full Lucky',
        estimatedCost: 350000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[16].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(10, 30),
        endTime: formatTime(11, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Nhổ răng sữa Simba',
        estimatedCost: 500000,
      },
      {
        petId: pets[3].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(13, 0),
        endTime: formatTime(14, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Tắm Bi',
        estimatedCost: 120000,
      },
      {
        petId: pets[5].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(14, 30),
        endTime: formatTime(16, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Cắt tỉa Mèo Mun',
        estimatedCost: 200000,
      },
      {
        petId: pets[8].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[7].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(15, 0),
        endTime: formatTime(15, 15),
        status: AppointmentStatus.PENDING,
        notes: 'Xét nghiệm phân Mèo Vện',
        estimatedCost: 200000,
      },
      {
        petId: pets[4].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[3].serviceId,
        appointmentDate: getDateOffset(2),
        startTime: formatTime(16, 30),
        endTime: formatTime(17, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Khám cấp cứu - Rex bị sốt',
        estimatedCost: 500000,
      },

      // ==================== SATURDAY Jan 17 (+3 days) - 6 appointments ====================
      {
        petId: pets[6].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(8, 0),
        endTime: formatTime(8, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Khám sức khỏe Bí Ngô',
        estimatedCost: 150000,
      },
      {
        petId: pets[9].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[4].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tiêm vaccine Sóc',
        estimatedCost: 200000,
      },
      {
        petId: pets[10].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(9, 30),
        endTime: formatTime(11, 30),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Spa full Mochi',
        estimatedCost: 350000,
      },
      {
        petId: pets[11].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 45),
        status: AppointmentStatus.PENDING,
        notes: 'Follow-up sau triệt sản Latte',
        estimatedCost: 250000,
      },
      {
        petId: pets[13].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(11, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Tắm Max',
        estimatedCost: 120000,
      },
      {
        petId: pets[0].petId,
        employeeId: employees[6].employeeId,
        serviceId: services[11].serviceId,
        appointmentDate: getDateOffset(3),
        startTime: formatTime(12, 0),
        endTime: formatTime(12, 30),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Vệ sinh Miu Miu',
        estimatedCost: 80000,
      },

      // ==================== SUNDAY Jan 18 (+4 days) - 5 appointments (Emergency/Urgent) ====================
      {
        petId: pets[1].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[3].serviceId,
        appointmentDate: getDateOffset(4),
        startTime: formatTime(9, 0),
        endTime: formatTime(10, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Cấp cứu - Lucky bị thương',
        estimatedCost: 500000,
      },
      {
        petId: pets[4].petId,
        employeeId: employees[1].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(4),
        startTime: formatTime(10, 30),
        endTime: formatTime(11, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Khám follow-up da liễu Rex',
        estimatedCost: 150000,
      },
      {
        petId: pets[2].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[8].serviceId,
        appointmentDate: getDateOffset(4),
        startTime: formatTime(11, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Tắm Bông',
        estimatedCost: 120000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(4),
        startTime: formatTime(13, 0),
        endTime: formatTime(14, 30),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Cắt tỉa Simba',
        estimatedCost: 200000,
      },
      {
        petId: pets[7].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(4),
        startTime: formatTime(15, 0),
        endTime: formatTime(15, 45),
        status: AppointmentStatus.PENDING,
        notes: 'Khám chuyên khoa Oreo',
        estimatedCost: 250000,
      },

      // ==================== OLDER APPOINTMENTS (for history) ====================
      // 1 week ago
      {
        petId: pets[13].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[0].serviceId,
        appointmentDate: getDateOffset(-7),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Khám sức khỏe Max',
        estimatedCost: 150000,
        actualCost: 150000,
      },
      {
        petId: pets[14].petId,
        employeeId: employees[5].employeeId,
        serviceId: services[9].serviceId,
        appointmentDate: getDateOffset(-7),
        startTime: formatTime(14, 0),
        endTime: formatTime(15, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Cắt tỉa Simba',
        estimatedCost: 200000,
        actualCost: 200000,
      },

      // 10 days ago - Surgery
      {
        petId: pets[11].petId,
        employeeId: employees[3].employeeId,
        serviceId: services[15].serviceId,
        appointmentDate: getDateOffset(-10),
        startTime: formatTime(10, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Triệt sản Latte thành công (old)',
        estimatedCost: 1500000,
        actualCost: 1500000,
      },

      // ==================== CANCELLED APPOINTMENTS ====================
      {
        petId: pets[6].petId,
        employeeId: employees[2].employeeId,
        serviceId: services[1].serviceId,
        appointmentDate: getDateOffset(-4),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 45),
        status: AppointmentStatus.CANCELLED,
        notes: 'Khám chuyên khoa',
        cancellationReason: 'Chủ bận đột xuất',
        estimatedCost: 250000,
        cancelledAt: getDateOffset(-4),
      },
      {
        petId: pets[3].petId,
        employeeId: employees[4].employeeId,
        serviceId: services[10].serviceId,
        appointmentDate: getDateOffset(-6),
        startTime: formatTime(13, 0),
        endTime: formatTime(15, 0),
        status: AppointmentStatus.CANCELLED,
        notes: 'Spa toàn diện',
        cancellationReason: 'Thú cưng ốm',
        estimatedCost: 350000,
        cancelledAt: getDateOffset(-6),
      },
    ])) as Appointment[];
    console.log(`✅ Created ${appointments.length} appointments`);

    // ====== 11. MEDICAL RECORDS ======
    console.log('📦 Seeding medical records...');
    const medicalRecordRepo = queryRunner.manager.getRepository(MedicalRecord);

    const medicalRecords = (await medicalRecordRepo.save([
      // Record from Jan 11 - Miu Miu da liễu
      {
        petId: pets[0].petId,
        veterinarianId: employees[1].employeeId,
        appointmentId: appointments[19].appointmentId,
        examinationDate: getDateOffset(-3),
        diagnosis: 'Viêm da dị ứng, nghi do thức ăn',
        treatment:
          'Kê đơn thuốc kháng histamine, thuốc bôi da, đổi sang thức ăn hypoallergenic',
        medicalSummary: {
          symptoms: ['Ngứa', 'Rụng lông vùng bụng', 'Da đỏ'],
          temperature: '38.5°C',
          prescription: ['Apoquel 5.4mg x2/ngày', 'Dermcare cream'],
        },
        followUpDate: getDateOffset(7),
      },

      // Record from Jan 11 - Sóc nhổ răng
      {
        petId: pets[9].petId,
        veterinarianId: employees[2].employeeId,
        appointmentId: appointments[18].appointmentId,
        examinationDate: getDateOffset(-3),
        diagnosis: 'Sâu răng nặng ở răng hàm',
        treatment: 'Nhổ răng sâu, kháng sinh, giảm đau',
        medicalSummary: {
          procedure: 'Tooth extraction - molar',
          anesthesia: 'Isoflurane',
          totalTime: '45 minutes',
          bloodLoss: 'Minimal',
        },
        followUpDate: getDateOffset(3),
      },

      // Record from Jan 12 - Rex khám tổng quát
      {
        petId: pets[4].petId,
        veterinarianId: employees[1].employeeId,
        appointmentId: appointments[16].appointmentId,
        examinationDate: getDateOffset(-2),
        diagnosis: 'Sức khỏe tốt, cần tiêm vaccine nhắc lại',
        treatment: 'Tư vấn dinh dưỡng, lên lịch tiêm vaccine',
        medicalSummary: {
          weight: '23kg',
          heartRate: '90 bpm',
          temperature: '38.2°C',
          notes: 'Hoạt động tốt, ăn uống bình thường',
        },
        followUpDate: getDateOffset(30),
      },

      // Record from Jan 7 - Latte vaccine
      {
        petId: pets[11].petId,
        veterinarianId: employees[1].employeeId,
        appointmentId: appointments[20].appointmentId,
        examinationDate: getDateOffset(-5),
        diagnosis: 'Khỏe mạnh, tiêm vaccine đúng lịch',
        treatment: 'Tiêm vaccine 5 bệnh, quan sát 30 phút',
        medicalSummary: {
          vaccineType: 'DHPP',
          batchNumber: 'DHPP-2025-11',
          reaction: 'Không có phản ứng bất thường',
        },
        followUpDate: getDateOffset(365),
      },

      // Record from Jan 4 - Triệt sản Latte
      {
        petId: pets[11].petId,
        veterinarianId: employees[3].employeeId,
        appointmentId: appointments[27].appointmentId,
        examinationDate: getDateOffset(-10),
        diagnosis: 'Phẫu thuật triệt sản thành công',
        treatment: 'Gây mê, triệt sản, khâu vết mổ, kháng sinh, giảm đau',
        medicalSummary: {
          surgery: 'Ovariohysterectomy',
          duration: '90 minutes',
          complications: 'None',
          sutures: 'Dissolvable',
          postOpCare: 'E-collar 10 days, antibiotics 7 days',
        },
        followUpDate: getDateOffset(-3),
      },

      // Record from Jan 6 - Max khám tim mạch
      {
        petId: pets[12].petId,
        veterinarianId: employees[1].employeeId,
        appointmentId: appointments[28].appointmentId,
        examinationDate: getDateOffset(-8),
        diagnosis: 'Tình trạng tim mạch bình thường',
        treatment: 'Không cần điều trị, theo dõi định kỳ',
        medicalSummary: {
          heartRate: '95 bpm',
          bloodPressure: '120/80 mmHg',
          ecg: 'Normal sinus rhythm',
          notes: 'Không phát hiện bất thường',
        },
        followUpDate: getDateOffset(180),
      },
    ])) as MedicalRecord[];
    console.log(`✅ Created ${medicalRecords.length} medical records`);

    // ====== 12. VACCINATION HISTORY ======
    console.log('📦 Seeding vaccination history...');
    const vaccinationRepo =
      queryRunner.manager.getRepository(VaccinationHistory);

    const vaccinations = (await vaccinationRepo.save([
      // Latte - vaccine 5 bệnh
      {
        petId: pets[11].petId,
        vaccineTypeId: vaccines[0].vaccineTypeId,
        medicalRecordId: medicalRecords[3].recordId,
        batchNumber: 'DHPP-2025-11',
        site: 'Vai trái',
        administeredBy: employees[1].employeeId,
        reactions: undefined,
        administrationDate: getDateOffset(-5),
        nextDueDate: getDateOffset(360),
        notes: 'Tiêm tốt, không phản ứng',
      },

      // Max - vaccine dại
      {
        petId: pets[13].petId,
        vaccineTypeId: vaccines[2].vaccineTypeId,
        medicalRecordId: undefined,
        batchNumber: 'RAB-2026-01',
        site: 'Vai phải',
        administeredBy: employees[2].employeeId,
        reactions: undefined,
        administrationDate: getDateOffset(0),
        nextDueDate: getDateOffset(365),
        notes: 'Hẹn nhắc lại sau 1 năm',
      },

      // Lucky - vaccine 5 bệnh (old)
      {
        petId: pets[1].petId,
        vaccineTypeId: vaccines[0].vaccineTypeId,
        medicalRecordId: undefined,
        batchNumber: 'DHPP-2025-01',
        site: 'Vai trái',
        administeredBy: employees[1].employeeId,
        reactions: undefined,
        administrationDate: getDateOffset(-30),
        nextDueDate: getDateOffset(335),
        notes: 'Tiêm nhắc lại định kỳ',
      },

      // Miu Miu - vaccine FVRCP
      {
        petId: pets[0].petId,
        vaccineTypeId: vaccines[3].vaccineTypeId,
        medicalRecordId: undefined,
        batchNumber: 'FVRCP-2025-12',
        site: 'Vai phải',
        administeredBy: employees[1].employeeId,
        reactions: undefined,
        administrationDate: getDateOffset(-60),
        nextDueDate: getDateOffset(305),
        notes: 'Vaccine cơ bản cho mèo',
      },

      // Rex - vaccine 7 bệnh
      {
        petId: pets[4].petId,
        vaccineTypeId: vaccines[1].vaccineTypeId,
        medicalRecordId: undefined,
        batchNumber: 'V7-2025-10',
        site: 'Vai trái',
        administeredBy: employees[2].employeeId,
        reactions: 'Hơi uể oải sau tiêm 2h, tự hồi phục',
        administrationDate: getDateOffset(-90),
        nextDueDate: getDateOffset(275),
        notes: 'Theo dõi phản ứng vaccine',
      },
    ])) as VaccinationHistory[];
    console.log(`✅ Created ${vaccinations.length} vaccination records`);

    // ====== 13. CAGE ASSIGNMENTS ======
    console.log('📦 Seeding cage assignments...');
    const cageAssignmentRepo =
      queryRunner.manager.getRepository(CageAssignment);

    const cageAssignments = await cageAssignmentRepo.save([
      // ACTIVE - Rex in Medium cage (3 days, checkout in 4 days)
      {
        cageId: cages[8].cageId,
        petId: pets[4].petId,
        checkInDate: getDateOffset(-3),
        expectedCheckOutDate: getDateOffset(4),
        dailyRate: 350000,
        assignedById: employees[5].employeeId,
        status: CageAssignmentStatus.ACTIVE,
        notes: 'Husky cần giữ mát, dắt dạo 2 lần/ngày',
      },

      // ACTIVE - Bông in Small cage VIP (checked in today, 5 days)
      {
        cageId: cages[19].cageId,
        petId: pets[2].petId,
        checkInDate: getDateOffset(0),
        expectedCheckOutDate: getDateOffset(5),
        dailyRate: 650000,
        assignedById: employees[5].employeeId,
        status: CageAssignmentStatus.ACTIVE,
        notes: 'VIP - chăm sóc đặc biệt, thức ăn cao cấp',
      },

      // ACTIVE - Mèo Mun in Small cage
      {
        cageId: cages[1].cageId,
        petId: pets[5].petId,
        checkInDate: getDateOffset(-1),
        expectedCheckOutDate: getDateOffset(2),
        dailyRate: 250000,
        assignedById: employees[4].employeeId,
        status: CageAssignmentStatus.ACTIVE,
        notes: 'Mèo hiếu động, cần đồ chơi',
      },

      // COMPLETED - Lucky previous stay
      {
        cageId: cages[9].cageId,
        petId: pets[1].petId,
        checkInDate: getDateOffset(-15),
        expectedCheckOutDate: getDateOffset(-8),
        actualCheckOutDate: getDateOffset(-8),
        dailyRate: 350000,
        assignedById: employees[5].employeeId,
        status: CageAssignmentStatus.COMPLETED,
        notes: 'Lưu trú trong kỳ nghỉ của chủ - đã checkout',
      },

      // COMPLETED - Simba old stay
      {
        cageId: cages[15].cageId,
        petId: pets[14].petId,
        checkInDate: getDateOffset(-20),
        expectedCheckOutDate: getDateOffset(-13),
        actualCheckOutDate: getDateOffset(-13),
        dailyRate: 450000,
        assignedById: employees[5].employeeId,
        status: CageAssignmentStatus.COMPLETED,
        notes: 'Mèo lớn, ăn nhiều, đã hoàn thành',
      },
    ]);

    // Update cage statuses to OCCUPIED for active assignments
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[8].cageId },
      { status: CageStatus.OCCUPIED },
    );
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[19].cageId },
      { status: CageStatus.OCCUPIED },
    );
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[1].cageId },
      { status: CageStatus.OCCUPIED },
    );

    console.log(`✅ Created ${cageAssignments.length} cage assignments`);

    // ====== 14. INVOICES & INVOICE ITEMS ======
    console.log('📦 Seeding invoices and invoice items...');
    const invoiceRepo = queryRunner.manager.getRepository(Invoice);

    const invoices = (await invoiceRepo.save([
      // Invoice 1 - Completed today (Latte tắm)
      {
        appointmentId: appointments[6].appointmentId,
        invoiceNumber: generateInvoiceNumber(1),
        issueDate: getDateOffset(0),
        subtotal: 120000,
        discount: 0,
        tax: 0,
        totalAmount: 120000,
        status: InvoiceStatus.PAID,
        notes: 'Thanh toán tiền mặt',
        paidAt: getDateOffset(0),
      },

      // Invoice 2 - Completed today (Max vaccine)
      {
        appointmentId: appointments[7].appointmentId,
        invoiceNumber: generateInvoiceNumber(2),
        issueDate: getDateOffset(0),
        subtotal: 150000,
        discount: 0,
        tax: 0,
        totalAmount: 150000,
        status: InvoiceStatus.PAID,
        notes: 'Thanh toán VNPay',
        paidAt: getDateOffset(0),
      },

      // Invoice 3 - Yesterday (Lucky spa)
      {
        appointmentId: appointments[14].appointmentId,
        invoiceNumber: generateInvoiceNumber(3),
        issueDate: getDateOffset(-1),
        subtotal: 350000,
        discount: 0,
        tax: 0,
        totalAmount: 380000,
        status: InvoiceStatus.PAID,
        notes: 'Có phụ phí massage',
        paidAt: getDateOffset(-1),
      },

      // Invoice 4 - Yesterday (Oreo vaccine)
      {
        appointmentId: appointments[15].appointmentId,
        invoiceNumber: generateInvoiceNumber(4),
        issueDate: getDateOffset(-1),
        subtotal: 200000,
        discount: 20000,
        tax: 0,
        totalAmount: 180000,
        status: InvoiceStatus.PAID,
        notes: 'Khách hàng thân thiết giảm 20k',
        paidAt: getDateOffset(-1),
      },

      // Invoice 5 - Jan 12 (Rex khám)
      {
        appointmentId: appointments[16].appointmentId,
        invoiceNumber: generateInvoiceNumber(5),
        issueDate: getDateOffset(-2),
        subtotal: 150000,
        discount: 0,
        tax: 0,
        totalAmount: 150000,
        status: InvoiceStatus.PAID,
        notes: 'Chuyển khoản',
        paidAt: getDateOffset(-2),
      },

      // Invoice 6 - Jan 12 (Mèo Vện cắt tỉa)
      {
        appointmentId: appointments[17].appointmentId,
        invoiceNumber: generateInvoiceNumber(6),
        issueDate: getDateOffset(-2),
        subtotal: 200000,
        discount: 0,
        tax: 0,
        totalAmount: 200000,
        status: InvoiceStatus.PAID,
        notes: 'Tiền mặt',
        paidAt: getDateOffset(-2),
      },

      // Invoice 7 - Jan 11 (Sóc nhổ răng)
      {
        appointmentId: appointments[18].appointmentId,
        invoiceNumber: generateInvoiceNumber(7),
        issueDate: getDateOffset(-3),
        subtotal: 500000,
        discount: 0,
        tax: 0,
        totalAmount: 550000,
        status: InvoiceStatus.PAID,
        notes: 'Có phụ phí thuốc giảm đau',
        paidAt: getDateOffset(-3),
      },

      // Invoice 8 - Jan 11 (Miu Miu da liễu)
      {
        appointmentId: appointments[19].appointmentId,
        invoiceNumber: generateInvoiceNumber(8),
        issueDate: getDateOffset(-3),
        subtotal: 250000,
        discount: 0,
        tax: 0,
        totalAmount: 300000,
        status: InvoiceStatus.PAID,
        notes: 'Có tính phí thuốc',
        paidAt: getDateOffset(-3),
      },

      // Invoice 9 - Jan 7 (Latte vaccine)
      {
        appointmentId: appointments[20].appointmentId,
        invoiceNumber: generateInvoiceNumber(9),
        issueDate: getDateOffset(-5),
        subtotal: 200000,
        discount: 0,
        tax: 0,
        totalAmount: 200000,
        status: InvoiceStatus.PAID,
        notes: 'VNPay',
        paidAt: getDateOffset(-5),
      },

      // Invoice 10 - Jan 7 (Bông tắm)
      {
        appointmentId: appointments[21].appointmentId,
        invoiceNumber: generateInvoiceNumber(10),
        issueDate: getDateOffset(-5),
        subtotal: 120000,
        discount: 0,
        tax: 0,
        totalAmount: 120000,
        status: InvoiceStatus.PAID,
        notes: 'Tiền mặt',
        paidAt: getDateOffset(-5),
      },

      // Invoice 11 - Jan 4 (Triệt sản Latte)
      {
        appointmentId: appointments[27].appointmentId,
        invoiceNumber: generateInvoiceNumber(11),
        issueDate: getDateOffset(-10),
        subtotal: 1500000,
        discount: 0,
        tax: 0,
        totalAmount: 1650000,
        status: InvoiceStatus.PAID,
        notes: 'Phẫu thuật + thuốc + chăm sóc sau mổ',
        paidAt: getDateOffset(-10),
      },

      // Invoice 12 - Jan 6 (Max khám tim)
      {
        appointmentId: appointments[28].appointmentId,
        invoiceNumber: generateInvoiceNumber(12),
        issueDate: getDateOffset(-8),
        subtotal: 250000,
        discount: 0,
        tax: 0,
        totalAmount: 250000,
        status: InvoiceStatus.PAID,
        notes: 'Chuyển khoản',
        paidAt: getDateOffset(-8),
      },

      // Invoice 13 - Pending (for confirmed appointment tomorrow)
      {
        appointmentId: appointments[9].appointmentId,
        invoiceNumber: generateInvoiceNumber(13),
        issueDate: getDateOffset(0),
        subtotal: 350000,
        discount: 0,
        tax: 0,
        totalAmount: 350000,
        status: InvoiceStatus.PENDING,
        notes: 'Chưa thanh toán - hẹn ngày mai',
        paidAt: undefined,
      },
    ])) as Invoice[];
    console.log(`✅ Created ${invoices.length} invoices`);

    // ====== 15. PAYMENTS ======
    console.log('📦 Seeding payments...');
    const paymentRepo = queryRunner.manager.getRepository(Payment);

    const payments = (await paymentRepo.save([
      // Payment 1 - Cash (Latte tắm)
      {
        invoiceId: invoices[0].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 120000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Thanh toán tại quầy',
      },

      // Payment 2 - VNPay (Max vaccine)
      {
        invoiceId: invoices[1].invoiceId,
        paymentMethod: PaymentMethod.VNPAY,
        amount: 150000,
        transactionId: 'VNPAY-20260114-001',
        idempotencyKey: `vnpay-${Date.now()}-1`,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: getDateOffset(0),
        receivedBy: undefined,
        gatewayResponse: {
          responseCode: '00',
          message: 'Success',
          bankCode: 'NCB',
        },
        refundAmount: 0,
        notes: 'Thanh toán online',
      },

      // Payment 3 - Cash (Lucky spa)
      {
        invoiceId: invoices[2].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 380000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Có phụ phí',
      },

      // Payment 4 - Cash (Oreo vaccine - có giảm giá)
      {
        invoiceId: invoices[3].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 180000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Khách hàng thân thiết',
      },

      // Payment 5 - Bank Transfer (Rex)
      {
        invoiceId: invoices[4].invoiceId,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        amount: 150000,
        transactionId: 'BANK-20260112-001',
        idempotencyKey: `bank-${Date.now()}-2`,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: getDateOffset(-2),
        receivedBy: undefined,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Chuyển khoản ngân hàng',
      },

      // Payment 6 - Cash (Mèo Vện)
      {
        invoiceId: invoices[5].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 200000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: undefined,
      },

      // Payment 7 - Cash (Sóc)
      {
        invoiceId: invoices[6].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 550000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Phẫu thuật',
      },

      // Payment 8 - Cash (Miu Miu)
      {
        invoiceId: invoices[7].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 300000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Điều trị da',
      },

      // Payment 9 - VNPay (Latte vaccine)
      {
        invoiceId: invoices[8].invoiceId,
        paymentMethod: PaymentMethod.VNPAY,
        amount: 200000,
        transactionId: 'VNPAY-20260107-002',
        idempotencyKey: `vnpay-${Date.now()}-3`,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: getDateOffset(-5),
        receivedBy: undefined,
        gatewayResponse: {
          responseCode: '00',
          message: 'Success',
          bankCode: 'VCB',
        },
        refundAmount: 0,
        notes: undefined,
      },

      // Payment 10 - Cash (Bông tắm)
      {
        invoiceId: invoices[9].invoiceId,
        paymentMethod: PaymentMethod.CASH,
        amount: 120000,
        transactionId: undefined,
        idempotencyKey: undefined,
        paymentStatus: PaymentStatus.PENDING,
        paidAt: undefined,
        receivedBy: employees[7].employeeId,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: undefined,
      },

      // Payment 11 - Bank Transfer (Triệt sản Latte - số tiền lớn)
      {
        invoiceId: invoices[10].invoiceId,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        amount: 1650000,
        transactionId: 'BANK-20260104-003',
        idempotencyKey: `bank-${Date.now()}-4`,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: getDateOffset(-10),
        receivedBy: undefined,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: 'Phẫu thuật lớn',
      },

      // Payment 12 - Bank Transfer (Max)
      {
        invoiceId: invoices[11].invoiceId,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        amount: 250000,
        transactionId: 'BANK-20260106-004',
        idempotencyKey: `vnpay-${Date.now()}-5`,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: getDateOffset(-8),
        receivedBy: undefined,
        gatewayResponse: undefined,
        refundAmount: 0,
        notes: undefined,
      },
    ])) as Payment[];

    // Mark all payments as SUCCESS and set paidAt
    for (const payment of payments) {
      if (payment.paymentMethod === PaymentMethod.CASH) {
        payment.paymentStatus = PaymentStatus.SUCCESS;
        if (!payment.paidAt) {
          payment.paidAt = new Date();
        }
      }
    }
    await queryRunner.manager.save(Payment, payments);
    console.log(`✅ Created ${payments.length} payments`);

    // ====== 16. CLEAR DATABASE FUNCTION ======
    console.log('✅ All seed data created successfully!');

    await queryRunner.commitTransaction();
    console.log('🎉 DEMO DATABASE SEEDING COMPLETED!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - ${accounts.length} Accounts`);
    console.log(`   - ${employees.length} Employees`);
    console.log(`   - ${petOwners.length} Pet Owners`);
    console.log(`   - ${pets.length} Pets`);
    console.log(`   - ${categories.length} Service Categories`);
    console.log(`   - ${services.length} Services`);
    console.log(`   - ${cages.length} Cages`);
    console.log(`   - ${vaccines.length} Vaccine Types`);
    console.log(`   - ${schedules.length} Work Schedules`);
    console.log(`   - ${appointments.length} Appointments`);
    console.log(`   - ${medicalRecords.length} Medical Records`);
    console.log(`   - ${vaccinations.length} Vaccination Records`);
    console.log(`   - ${cageAssignments.length} Cage Assignments`);
    console.log(`   - ${invoices.length} Invoices`);
    console.log(`   - ${payments.length} Payments`);
    console.log('');
    console.log('🔐 Test Accounts (Password: Password@123):');
    console.log('   Manager:      manager@pawlovers.com');
    console.log(
      '   Vets:         vet.lan@pawlovers.com, vet.tuan@pawlovers.com, vet.minh@pawlovers.com',
    );
    console.log(
      '   Care Staff:   care.hong@pawlovers.com, care.nam@pawlovers.com, care.huong@pawlovers.com',
    );
    console.log('   Receptionist: reception@pawlovers.com');
    console.log('   Pet Owners:   owner.minhanh@gmail.com (và 5 owners khác)');
    console.log('');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Clear database function
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  console.log('🧹 Clearing database...');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query('SET session_replication_role = replica;');

    const tables = [
      'payments',
      'invoice_items',
      'invoices',
      'vaccination_history',
      'medical_records',
      'cage_assignments',
      'appointment_services',
      'appointments',
      'work_schedules',
      'cages',
      'services',
      'service_categories',
      'vaccine_types',
      'pets',
      'pet_owners',
      'employees',
      'accounts',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`,
      );
    }

    await queryRunner.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Database cleared');
  } finally {
    await queryRunner.release();
  }
}

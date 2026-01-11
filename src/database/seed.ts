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
import { Appointment } from '../entities/appointment.entity';
import { CageAssignment } from '../entities/cage-assignment.entity';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { Invoice } from '../entities/invoice.entity';
import {
  UserType,
  CageSize,
  CageStatus,
  VaccineCategory,
  AppointmentStatus,
  CageAssignmentStatus,
  InvoiceStatus,
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
 * 7. Appointments (depends on Pets, Employees, Services)
 * 8. Cages (independent)
 * 9. CageAssignments (depends on Cages, Pets, Employees)
 * 10. Invoices (depends on Appointments)
 * 11. VaccineTypes (independent)
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // TODO: Seed appointments
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
      {
        email: 'owner4@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      {
        email: 'owner5@gmail.com',
        passwordHash,
        userType: UserType.PET_OWNER,
        isActive: true,
      },
      // Additional Care Staff
      {
        email: 'care3@pawlovers.com',
        passwordHash,
        userType: UserType.CARE_STAFF,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${accounts.length} accounts`);

    // ====== 2. EMPLOYEES (using concrete child entities) ======
    console.log('📦 Seeding employees...');

    // Manager
    const managerRepo = queryRunner.manager.getRepository(Manager);
    await managerRepo.save({
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
      {
        accountId: accounts[9].accountId,
        fullName: 'Phạm Thị Hương',
        phoneNumber: '0907890123',
        address: '123 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
        hireDate: new Date('2024-01-15'),
        salary: 7000000,
        isAvailable: true,
        skills: ['Tắm spa', 'Massage thú cưng', 'Vệ sinh tai mắt'],
      },
    ]);
    console.log(`✅ Created ${careStaff.length} care staff`);

    // Receptionist
    const receptionistRepo = queryRunner.manager.getRepository(Receptionist);
    await receptionistRepo.save({
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
      {
        accountId: accounts[10].accountId,
        fullName: 'Võ Thị Hồng Nhung',
        phoneNumber: '0945678901',
        address: '444 Cách Mạng Tháng 8, Q.10, TP.HCM',
        preferredContactMethod: 'Phone',
        emergencyContact: '0965432109',
      },
      {
        accountId: accounts[11].accountId,
        fullName: 'Đặng Minh Phúc',
        phoneNumber: '0956789012',
        address: '555 Hai Bà Trưng, Q.1, TP.HCM',
        preferredContactMethod: 'Zalo',
        emergencyContact: '0954321098',
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
      // Owner 4's pets
      {
        ownerId: petOwners[3].petOwnerId,
        name: 'Bí Ngô',
        species: 'Cat',
        breed: 'Mèo Anh Lông Ngắn',
        gender: 'Male',
        birthDate: new Date('2023-05-20'),
        weight: 4.0,
        color: 'Cam vằn',
        specialNotes: 'Rất thích chơi đuổi bắt',
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
        specialNotes: 'Cần giữ trong chuồng có bánh xe',
      },
      // Owner 5's pets
      {
        ownerId: petOwners[4].petOwnerId,
        name: 'Sóc',
        species: 'Dog',
        breed: 'Corgi',
        gender: 'Female',
        birthDate: new Date('2022-08-15'),
        weight: 12.0,
        color: 'Vàng nâu trắng',
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
        specialNotes: 'Biết nói vài từ đơn giản',
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
      // Thêm 3 services mới để đạt 15
      {
        categoryId: categories[4].categoryId,
        serviceName: 'Mổ lấy dị vật',
        description: 'Phẫu thuật lấy dị vật trong đường tiêu hóa',
        basePrice: 2500000,
        estimatedDuration: 180,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[0].categoryId,
        serviceName: 'Điều trị bệnh ngoài da',
        description: 'Điều trị các bệnh về da như nấm, ghẻ, viêm da',
        basePrice: 350000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'Veterinarian',
      },
      {
        categoryId: categories[3].categoryId,
        serviceName: 'Dắt dạo thú cưng',
        description: 'Dịch vụ dắt dạo cho thú cưng lưu trú',
        basePrice: 50000,
        estimatedDuration: 30,
        isAvailable: true,
        requiredStaffType: 'CareStaff',
      },
    ]);
    console.log(`✅ Created ${services.length} services`);

    // ====== 7. APPOINTMENTS ======
    console.log('📦 Seeding appointments...');
    const appointmentRepo = queryRunner.manager.getRepository(Appointment);

    // Helper function to format time
    const formatTime = (hours: number, minutes: number = 0): string => {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    };

    // Helper function to get date offset from today
    const getDateOffset = (daysOffset: number): Date => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date;
    };

    const appointments: Appointment[] = await appointmentRepo.save([
      // Pending Appointments
      {
        petId: pets[0].petId, // Miu (Cat)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan
        serviceId: services[0].serviceId, // Khám tổng quát
        appointmentDate: getDateOffset(1),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Kiểm tra sức khỏe định kỳ',
        estimatedCost: services[0].basePrice,
      },
      {
        petId: pets[2].petId, // Bông (Dog)
        employeeId: vets[1].employeeId, // BS. Phạm Minh Tuấn
        serviceId: services[2].serviceId, // Tiêm vaccine 5 bệnh
        appointmentDate: getDateOffset(2),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 15),
        status: AppointmentStatus.PENDING,
        notes: 'Tiêm phòng lần đầu',
        estimatedCost: services[2].basePrice,
      },
      {
        petId: pets[1].petId, // Lucky (Dog)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng
        serviceId: services[7].serviceId, // Combo Spa Full
        appointmentDate: getDateOffset(3),
        startTime: formatTime(14, 0),
        endTime: formatTime(16, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Yêu cầu cắt lông ngắn',
        estimatedCost: services[7].basePrice,
      },

      // Confirmed Appointments
      {
        petId: pets[3].petId, // Rex (Husky)
        employeeId: careStaff[1].employeeId, // Trần Văn Nam
        serviceId: services[5].serviceId, // Tắm + Sấy khô
        appointmentDate: getDateOffset(1),
        startTime: formatTime(13, 0),
        endTime: formatTime(14, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Sử dụng sản phẩm dành cho lông dày',
        estimatedCost: services[5].basePrice,
      },
      {
        petId: pets[4].petId, // Mèo Mun (Cat)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan
        serviceId: services[3].serviceId, // Tiêm vaccine dại
        appointmentDate: getDateOffset(2),
        startTime: formatTime(11, 0),
        endTime: formatTime(11, 15),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tiêm vaccine dại định kỳ',
        estimatedCost: services[3].basePrice,
      },
      {
        petId: pets[1].petId, // Lucky (Dog)
        employeeId: vets[1].employeeId, // BS. Phạm Minh Tuấn
        serviceId: services[4].serviceId, // Xét nghiệm máu
        appointmentDate: getDateOffset(4),
        startTime: formatTime(9, 30),
        endTime: formatTime(9, 50),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Xét nghiệm trước phẫu thuật',
        estimatedCost: services[4].basePrice,
      },

      // In Progress Appointments
      {
        petId: pets[2].petId, // Bông (Dog)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng
        serviceId: services[6].serviceId, // Cắt tỉa tạo kiểu
        appointmentDate: getDateOffset(0),
        startTime: formatTime(10, 0),
        endTime: formatTime(11, 30),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Cắt kiểu Poodle Teddy Bear',
        estimatedCost: services[6].basePrice,
      },
      {
        petId: pets[0].petId, // Miu (Cat)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan
        serviceId: services[1].serviceId, // Khám chuyên khoa
        appointmentDate: getDateOffset(0),
        startTime: formatTime(14, 30),
        endTime: formatTime(15, 15),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Khám da liễu - ngứa nhiều',
        estimatedCost: services[1].basePrice,
      },

      // Additional appointments for care1@pawlovers.com (careStaff[0]) - TODAY
      // PENDING appointments
      {
        petId: pets[1].petId, // Lucky (Dog)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[5].serviceId, // Tắm + Sấy khô
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(8, 0),
        endTime: formatTime(9, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Tắm sạch cho chó Golden Retriever',
        estimatedCost: services[5].basePrice,
      },
      {
        petId: pets[3].petId, // Rex (Husky)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[6].serviceId, // Cắt tỉa tạo kiểu
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(13, 0),
        endTime: formatTime(14, 30),
        status: AppointmentStatus.PENDING,
        notes: 'Cắt tỉa lông cho Husky',
        estimatedCost: services[6].basePrice,
      },
      {
        petId: pets[4].petId, // Mèo Mun (Cat)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[7].serviceId, // Combo Spa Full
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(15, 0),
        endTime: formatTime(17, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Spa toàn diện cho mèo Ba Tư',
        estimatedCost: services[7].basePrice,
      },

      // IN_PROGRESS appointment
      {
        petId: pets[5].petId, // Chó Bông
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[5].serviceId, // Tắm + Sấy khô
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(11, 0),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Đang tắm cho chó Poodle',
        estimatedCost: services[5].basePrice,
      },

      // COMPLETED appointments
      {
        petId: pets[0].petId, // Miu (Cat)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[5].serviceId, // Tắm + Sấy khô
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(7, 0),
        endTime: formatTime(8, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Đã hoàn thành tắm cho mèo Anh lông ngắn',
        estimatedCost: services[5].basePrice,
        actualCost: services[5].basePrice,
      },
      {
        petId: pets[2].petId, // Bông (Dog)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng (care1)
        serviceId: services[6].serviceId, // Cắt tỉa tạo kiểu
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(9, 0),
        endTime: formatTime(10, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Đã hoàn thành cắt tỉa lông kiểu Poodle',
        estimatedCost: services[6].basePrice,
        actualCost: services[6].basePrice,
      },

      // Completed Appointments
      {
        petId: pets[3].petId, // Rex (Husky)
        employeeId: vets[1].employeeId, // BS. Phạm Minh Tuấn
        serviceId: services[0].serviceId, // Khám tổng quát
        appointmentDate: getDateOffset(-3),
        startTime: formatTime(10, 0),
        endTime: formatTime(10, 30),
        status: AppointmentStatus.COMPLETED,
        notes: 'Sức khỏe tốt, đã tiêm phòng đầy đủ',
        estimatedCost: services[0].basePrice,
        actualCost: services[0].basePrice,
      },
      {
        petId: pets[1].petId, // Lucky (Dog)
        employeeId: careStaff[1].employeeId, // Trần Văn Nam
        serviceId: services[5].serviceId, // Tắm + Sấy khô
        appointmentDate: getDateOffset(-5),
        startTime: formatTime(15, 0),
        endTime: formatTime(16, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Hoàn thành tốt, thú cưng rất ngoan',
        estimatedCost: services[5].basePrice,
        actualCost: services[5].basePrice,
      },
      {
        petId: pets[4].petId, // Mèo Mun (Cat)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan
        serviceId: services[2].serviceId, // Tiêm vaccine 5 bệnh
        appointmentDate: getDateOffset(-7),
        startTime: formatTime(9, 0),
        endTime: formatTime(9, 15),
        status: AppointmentStatus.COMPLETED,
        notes: 'Đã tiêm vaccine, hẹn tiêm nhắc lại sau 1 tháng',
        estimatedCost: services[2].basePrice,
        actualCost: services[2].basePrice,
      },
      {
        petId: pets[2].petId, // Bông (Dog)
        employeeId: careStaff[0].employeeId, // Lê Thị Hồng
        serviceId: services[7].serviceId, // Combo Spa Full
        appointmentDate: getDateOffset(-10),
        startTime: formatTime(13, 0),
        endTime: formatTime(15, 0),
        status: AppointmentStatus.COMPLETED,
        notes: 'Spa toàn diện, thú cưng rất thích thú',
        estimatedCost: services[7].basePrice,
        actualCost: 380000, // Có phụ phí dịch vụ thêm
      },

      // Cancelled Appointment
      {
        petId: pets[0].petId, // Miu (Cat)
        employeeId: vets[1].employeeId, // BS. Phạm Minh Tuấn
        serviceId: services[1].serviceId, // Khám chuyên khoa
        appointmentDate: getDateOffset(-2),
        startTime: formatTime(16, 0),
        endTime: formatTime(16, 45),
        status: AppointmentStatus.CANCELLED,
        notes: 'Đã đặt lịch khám',
        cancellationReason: 'Chủ thú cưng bận đột xuất',
        estimatedCost: services[1].basePrice,
        cancelledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },

      // ====== APPOINTMENTS FOR VET1 (TODAY) - Testing workflow ======
      // PENDING - waiting for confirmation
      {
        petId: pets[5].petId, // Bí Ngô (Cat)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan (vet1@pawlovers.com)
        serviceId: services[0].serviceId, // Khám tổng quát
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(8, 30),
        endTime: formatTime(9, 0),
        status: AppointmentStatus.PENDING,
        notes: 'Mèo bỏ ăn 2 ngày, cần khám gấp',
        estimatedCost: services[0].basePrice,
      },
      // CONFIRMED - ready to start
      {
        petId: pets[7].petId, // Sóc (Corgi)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan (vet1@pawlovers.com)
        serviceId: services[2].serviceId, // Tiêm vaccine 5 bệnh
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(9, 30),
        endTime: formatTime(9, 45),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Tiêm phòng định kỳ hàng năm',
        estimatedCost: services[2].basePrice,
      },
      // CONFIRMED - ready to start
      {
        petId: pets[1].petId, // Lucky (Dog)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan (vet1@pawlovers.com)
        serviceId: services[0].serviceId, // Khám tổng quát
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(10, 30),
        endTime: formatTime(11, 0),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Khám sức khỏe định kỳ tháng 12',
        estimatedCost: services[0].basePrice,
      },
      // IN_PROGRESS - currently examining
      {
        petId: pets[3].petId, // Rex (Husky)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan (vet1@pawlovers.com)
        serviceId: services[13].serviceId, // Điều trị bệnh ngoài da
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(11, 30),
        endTime: formatTime(12, 0),
        status: AppointmentStatus.IN_PROGRESS,
        notes: 'Ngứa nhiều vùng lưng và cổ, nghi nấm da',
        estimatedCost: services[13].basePrice,
      },
      // COMPLETED - done today
      {
        petId: pets[9].petId, // Mochi (Dog)
        employeeId: vets[0].employeeId, // BS. Trần Thị Lan (vet1@pawlovers.com)
        serviceId: services[3].serviceId, // Tiêm vaccine dại
        appointmentDate: getDateOffset(0), // TODAY
        startTime: formatTime(7, 30),
        endTime: formatTime(7, 45),
        status: AppointmentStatus.COMPLETED,
        notes: 'Tiêm vaccine dại, thú cưng khỏe mạnh',
        estimatedCost: services[3].basePrice,
        actualCost: services[3].basePrice,
      },
    ]);
    console.log(`✅ Created ${appointments.length} appointments`);

    console.log(`✅ Created ${appointments.length} appointments`);

    // ====== 8. CAGES ======
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
      // Thêm 13 cages mới
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
        cageNumber: 'L-03',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 1',
      },
      {
        cageNumber: 'L-04',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 2',
      },
      {
        cageNumber: 'L-05',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 450000,
        location: 'Khu C - Tầng 2',
      },
      {
        cageNumber: 'VIP-02',
        size: CageSize.LARGE,
        status: CageStatus.AVAILABLE,
        dailyRate: 650000,
        location: 'Khu VIP - Tầng 2',
      },
      {
        cageNumber: 'VIP-03',
        size: CageSize.LARGE,
        status: CageStatus.RESERVED,
        dailyRate: 750000,
        location: 'Khu VIP - Tầng 2',
      },
    ]);
    console.log(`✅ Created ${cages.length} cages`);

    // ====== 9. CAGE ASSIGNMENTS ======
    console.log('📦 Seeding cage assignments...');
    const cageAssignmentRepo =
      queryRunner.manager.getRepository(CageAssignment);

    const cageAssignments = await cageAssignmentRepo.save([
      // Active Assignment 1: Rex (Husky) in Medium Cage
      {
        cageId: cages[2].cageId, // M-01
        petId: pets[3].petId, // Rex (Husky)
        checkInDate: getDateOffset(-3), // Checked in 3 days ago
        expectedCheckOutDate: getDateOffset(4), // Expected checkout in 4 days
        dailyRate: cages[2].dailyRate,
        assignedById: careStaff[1].employeeId, // Trần Văn Nam
        status: CageAssignmentStatus.ACTIVE,
        notes: 'Cần không gian thoáng mát, dắt dạo 2 lần/ngày',
      },
      // Active Assignment 2: Bông (Poodle) in Small Cage
      {
        cageId: cages[1].cageId, // S-02
        petId: pets[2].petId, // Bông (Poodle)
        checkInDate: getDateOffset(-1), // Checked in yesterday
        expectedCheckOutDate: getDateOffset(5), // Expected checkout in 5 days
        dailyRate: cages[1].dailyRate,
        assignedById: careStaff[0].employeeId, // Lê Thị Hồng
        status: CageAssignmentStatus.ACTIVE,
        notes: 'Thú cưng rất ngoan, không kén ăn',
      },
      // Active Assignment 3: Mèo Mun in Small Cage (VIP treatment)
      {
        cageId: cages[6].cageId, // VIP-01
        petId: pets[4].petId, // Mèo Mun
        checkInDate: getDateOffset(0), // Checked in today
        expectedCheckOutDate: getDateOffset(7), // 7 days stay
        dailyRate: cages[6].dailyRate,
        assignedById: careStaff[1].employeeId, // Trần Văn Nam
        status: CageAssignmentStatus.ACTIVE,
        notes: 'Khách VIP - chú ý chăm sóc đặc biệt, thức ăn cao cấp',
      },
      // Completed Assignment 1: Lucky was here before
      {
        cageId: cages[3].cageId, // M-02
        petId: pets[1].petId, // Lucky (Golden Retriever)
        checkInDate: getDateOffset(-15),
        expectedCheckOutDate: getDateOffset(-8),
        actualCheckOutDate: getDateOffset(-8),
        dailyRate: cages[3].dailyRate,
        assignedById: careStaff[1].employeeId,
        status: CageAssignmentStatus.COMPLETED,
        notes: 'Lưu trú trong kỳ nghỉ của chủ - đã trả thú cưng',
      },
      // Completed Assignment 2: Miu's previous stay
      {
        cageId: cages[0].cageId, // S-01
        petId: pets[0].petId, // Miu (Cat)
        checkInDate: getDateOffset(-20),
        expectedCheckOutDate: getDateOffset(-17),
        actualCheckOutDate: getDateOffset(-17),
        dailyRate: cages[0].dailyRate,
        assignedById: careStaff[0].employeeId,
        status: CageAssignmentStatus.COMPLETED,
        notes: 'Lưu trú ngắn ngày - hoàn thành tốt',
      },
    ]);

    // Update cage statuses to OCCUPIED for active assignments
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[1].cageId },
      { status: CageStatus.OCCUPIED },
    );
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[2].cageId },
      { status: CageStatus.OCCUPIED },
    );
    await queryRunner.manager.update(
      Cage,
      { cageId: cages[6].cageId },
      { status: CageStatus.OCCUPIED },
    );

    console.log(`✅ Created ${cageAssignments.length} cage assignments`);

    // ====== 9. WORK SCHEDULES ======
    console.log('📦 Seeding work schedules...');
    const scheduleRepo = queryRunner.manager.getRepository(WorkSchedule);

    const schedules = await scheduleRepo.save([
      // Care Staff 1 (Lê Thị Hồng - care1@pawlovers.com) - TODAY
      {
        employeeId: careStaff[0].employeeId,
        workDate: getDateOffset(0), // TODAY
        startTime: formatTime(7, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Ca sáng - chiều, phụ trách tắm spa và cắt tỉa',
      },
      // Care Staff 2 (Trần Văn Nam) - TODAY
      {
        employeeId: careStaff[1].employeeId,
        workDate: getDateOffset(0), // TODAY
        startTime: formatTime(8, 0),
        endTime: formatTime(18, 0),
        breakStart: formatTime(12, 30),
        breakEnd: formatTime(13, 30),
        isAvailable: true,
        notes: 'Ca sáng - chiều, phụ trách lưu trú và dắt dạo',
      },
      // Vet 1 (BS. Trần Thị Lan) - TODAY
      {
        employeeId: vets[0].employeeId,
        workDate: getDateOffset(0), // TODAY
        startTime: formatTime(8, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Ca sáng - chiều, phụ trách khám bệnh',
      },
      // Care Staff 1 - TOMORROW
      {
        employeeId: careStaff[0].employeeId,
        workDate: getDateOffset(1), // TOMORROW
        startTime: formatTime(7, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: true,
        notes: 'Ca sáng - chiều',
      },
      // Care Staff 1 - YESTERDAY (completed)
      {
        employeeId: careStaff[0].employeeId,
        workDate: getDateOffset(-1), // YESTERDAY
        startTime: formatTime(7, 0),
        endTime: formatTime(17, 0),
        breakStart: formatTime(12, 0),
        breakEnd: formatTime(13, 0),
        isAvailable: false,
        notes: 'Ca đã hoàn thành',
      },
    ]);

    console.log(`✅ Created ${schedules.length} work schedules`);

    // ====== 10. INVOICES ======
    console.log('📦 Seeding invoices...');
    const invoiceRepo = queryRunner.manager.getRepository(Invoice);

    // Helper function to generate invoice number
    const generateInvoiceNumber = (index: number): string => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const num = String(index).padStart(4, '0');
      return `INV-${year}${month}-${num}`;
    };

    const invoices = await invoiceRepo.save([
      // Invoice for completed appointment 1 (Rex - Khám tổng quát) - PAID
      {
        appointmentId: appointments[8].appointmentId,
        invoiceNumber: generateInvoiceNumber(1),
        issueDate: getDateOffset(-3),
        subtotal: services[0].basePrice,
        discount: 0,
        tax: 0,
        totalAmount: services[0].basePrice,
        status: InvoiceStatus.PENDING,
        notes: 'Thanh toán bằng tiền mặt',
        paidAt: getDateOffset(-3),
      },
      // Invoice for completed appointment 2 (Lucky - Tắm + Sấy) - PAID
      {
        appointmentId: appointments[9].appointmentId,
        invoiceNumber: generateInvoiceNumber(2),
        issueDate: getDateOffset(-5),
        subtotal: services[5].basePrice,
        discount: 10000, // Giảm giá 10k
        tax: 0,
        totalAmount: services[5].basePrice - 10000,
        status: InvoiceStatus.PENDING,
        notes: 'Khách hàng thân thiết - giảm 10k',
      },
      // Invoice for completed appointment 3 (Mèo Mun - Vaccine) - PAID
      {
        appointmentId: appointments[10].appointmentId,
        invoiceNumber: generateInvoiceNumber(3),
        issueDate: getDateOffset(-7),
        subtotal: services[2].basePrice,
        discount: 0,
        tax: 0,
        totalAmount: services[2].basePrice,
        status: InvoiceStatus.PENDING,
        notes: 'Thanh toán chuyển khoản',
        paidAt: getDateOffset(-7),
      },
      // Invoice for completed appointment 4 (Bông - Spa Full) - PAID với phụ phí
      {
        appointmentId: appointments[11].appointmentId,
        invoiceNumber: generateInvoiceNumber(4),
        issueDate: getDateOffset(-10),
        subtotal: services[7].basePrice,
        discount: 0,
        tax: 0,
        totalAmount: 380000, // Có phụ phí thêm
        status: InvoiceStatus.PENDING,
        notes: 'Thêm dịch vụ massage +30k',
        paidAt: getDateOffset(-10),
      },
    ]);
    console.log(`✅ Created ${invoices.length} invoices`);

    // ====== 11. VACCINE TYPES ======
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
      // Thêm 4 vaccine types mới để đạt 10
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

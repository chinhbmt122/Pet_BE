// /**
//  * Example: How to Use Authentication in Other Controllers
//  *
//  * This file demonstrates how to protect routes and access authenticated users
//  * in other controllers throughout the application.
//  */

// import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// import { RouteConfig } from '../middleware/decorators/route.decorator';
// import { GetUser } from '../middleware/decorators/user.decorator';
// import { Account, UserType } from '../entities/account.entity';

// /**
//  * EXAMPLE 1: Public Route (No Authentication)
//  */
// @ApiTags('Example')
// @Controller('api/example')
// export class ExampleController {
//   @Get('public')
//   @RouteConfig({ message: 'Public endpoint', requiresAuth: false })
//   publicEndpoint() {
//     return { message: 'This endpoint is accessible without authentication' };
//   }

//   /**
//    * EXAMPLE 2: Protected Route (Authentication Required)
//    * The AuthGuard is already configured globally in app.module.ts
//    * Just set requiresAuth: true in RouteConfig
//    */
//   @Get('protected')
//   @RouteConfig({ message: 'Protected endpoint', requiresAuth: true })
//   @ApiBearerAuth() // Shows lock icon in Swagger UI
//   protectedEndpoint() {
//     return { message: 'This endpoint requires authentication' };
//   }

//   /**
//    * EXAMPLE 3: Get Current User Information
//    * Use @GetUser() decorator to access the authenticated user
//    */
//   @Get('me')
//   @RouteConfig({ message: 'Get current user', requiresAuth: true })
//   @ApiBearerAuth()
//   getCurrentUser(@GetUser() user: Account) {
//     return {
//       message: 'Current user info',
//       user: {
//         accountId: user.accountId,
//         email: user.email,
//         fullName: user.fullName,
//         userType: user.userType,
//       },
//     };
//   }

//   /**
//    * EXAMPLE 4: Role-Based Access Control (RBAC)
//    * Only specific roles can access this endpoint
//    */
//   @Post('admin-only')
//   @RouteConfig({
//     message: 'Admin only action',
//     requiresAuth: true,
//     roles: [UserType.MANAGER], // Only managers can access
//   })
//   @ApiBearerAuth()
//   adminOnlyAction(@GetUser() user: Account, @Body() data: any) {
//     return {
//       message: `Action performed by ${user.fullName}`,
//       userRole: user.userType,
//     };
//   }

//   /**
//    * EXAMPLE 5: Multiple Roles Allowed
//    * Veterinarians and Managers can access
//    */
//   @Get('medical-staff')
//   @RouteConfig({
//     message: 'Medical staff endpoint',
//     requiresAuth: true,
//     roles: [UserType.VETERINARIAN, UserType.MANAGER],
//   })
//   @ApiBearerAuth()
//   medicalStaffEndpoint(@GetUser() user: Account) {
//     return {
//       message: 'Medical staff data',
//       staffName: user.fullName,
//       role: user.userType,
//     };
//   }

//   /**
//    * EXAMPLE 6: Pet Owner Only
//    */
//   @Get('my-pets')
//   @RouteConfig({
//     message: 'Get my pets',
//     requiresAuth: true,
//     roles: [UserType.PET_OWNER],
//   })
//   @ApiBearerAuth()
//   getMyPets(@GetUser() user: Account) {
//     // User is guaranteed to be a pet owner
//     return {
//       message: `Pets for ${user.fullName}`,
//       ownerId: user.accountId,
//     };
//   }
// }

// /**
//  * TESTING WITH SWAGGER:
//  *
//  * 1. Start the application: npm run start:dev
//  * 2. Open Swagger UI: http://localhost:3000/api/docs
//  * 3. Register or login via /api/auth/login
//  * 4. Copy the accessToken from the response
//  * 5. Click "Authorize" button at the top of Swagger
//  * 6. Enter: Bearer <your_token>
//  * 7. Now you can test protected endpoints
//  */

// /**
//  * TESTING WITH POSTMAN/CURL:
//  *
//  * 1. Login:
//  *    POST http://localhost:3000/api/auth/login
//  *    Body: { "email": "user@example.com", "password": "password123" }
//  *
//  * 2. Copy the accessToken from response
//  *
//  * 3. Use token in protected requests:
//  *    GET http://localhost:3000/api/example/protected
//  *    Headers: Authorization: Bearer <your_token>
//  */

// /**
//  * USING AccountService in Other Services:
//  */
// import { Injectable } from '@nestjs/common';
// import { AccountService } from './account.service';

// @Injectable()
// export class ExampleService {
//   constructor(private readonly accountService: AccountService) {}

//   async checkUserRole(
//     userId: number,
//     requiredRole: UserType,
//   ): Promise<boolean> {
//     // Use AccountService methods in other services
//     return await this.accountService.verifyRole(userId, requiredRole);
//   }

//   async getUserInfo(userId: number): Promise<Account> {
//     return await this.accountService.getAccountById(userId);
//   }
// }

// /**
//  * SECURITY BEST PRACTICES:
//  *
//  * 1. Always validate that the authenticated user has permission for the resource
//  *    Example: When updating a pet, verify the pet belongs to the user
//  *
//  * 2. Don't expose sensitive data in API responses
//  *    - Never return password hashes
//  *    - Use DTOs to control response structure
//  *
//  * 3. Implement rate limiting for auth endpoints (TODO)
//  *
//  * 4. Log security events (failed logins, role violations)
//  *
//  * 5. Use HTTPS in production
//  *
//  * 6. Rotate JWT secrets regularly
//  *
//  * 7. Set appropriate token expiration times
//  */

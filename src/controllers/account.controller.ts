import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import {
  LoginDto,
  LoginResponseDto,
  AccountResponseDto,
  ChangePasswordDto,
} from '../dto/account';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { Account, UserType } from '../entities/account.entity';
import { PetOwner } from '../entities/pet-owner.entity';
import { Employee } from '../entities/employee.entity';

/**
 * AccountController
 *
 * Handles authentication and account management endpoints:
 * - Login / Logout (via AuthService)
 * - Get profile
 * - Change password
 * - Activate / Deactivate account
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AccountController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
  ) {}

  // ==================== Auth Endpoints (AuthService) ====================

  /**
   * POST /api/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'User login', requiresAuth: false })
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'User logout', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200 })
  async logout(@Body() body: { token?: string }): Promise<{ message: string }> {
    await this.authService.logout(body.token || '');
    return { message: 'Logout successful' };
  }

  // ==================== Account Endpoints (AccountService) ====================

  /**
   * GET /api/auth/account/:id
   */
  @Get('account/:id')
  @RouteConfig({
    message: 'Get account by ID',
    requiresAuth: true,
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getAccountById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<Account> {
    const user = req.user;
    return this.accountService.getAccountById(id, user);
  }

  /**
   * GET /api/auth/account/:id/full-profile
   */
  @Get('account/:id/full-profile')
  @RouteConfig({ message: 'Get full profile', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account with profile (PetOwner or Employee)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getFullProfile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<{ account: Account; profile: PetOwner | Employee | null }> {
    const user = req.user;
    return this.accountService.getFullProfile(id, user);
  }

  /**
   * PUT /api/auth/account/:id/change-password
   */
  @Put('account/:id/change-password')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'Change password', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change account password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  @ApiResponse({ status: 401, description: 'Old password incorrect' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const user = req.user;
    await this.accountService.changePassword(
      id,
      dto.oldPassword,
      dto.newPassword,
      user,
    );
    return { message: 'Password changed successfully' };
  }

  /**
   * PUT /api/auth/account/:id/activate
   */
  @Put('account/:id/activate')
  @RouteConfig({
    message: 'Activate account (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate an account' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async activateAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Account> {
    return this.accountService.activateAccount(id);
  }

  /**
   * PUT /api/auth/account/:id/deactivate
   */
  @Put('account/:id/deactivate')
  @RouteConfig({
    message: 'Deactivate account (Manager only)',
    requiresAuth: true,
    roles: [UserType.MANAGER],
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an account' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deactivateAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Account> {
    return this.accountService.deactivateAccount(id);
  }
}

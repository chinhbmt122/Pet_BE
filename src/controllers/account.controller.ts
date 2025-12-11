import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ResetPasswordDto,
  LoginResponseDto,
  AccountResponseDto,
} from '../dto/account';
import { RouteConfig } from '../middleware/decorators/route.decorator';
import { UserType } from '../entities/account.entity';
import { GetUser } from '../middleware/decorators/user.decorator';
import { Account } from '../entities/account.entity';

/**
 * AccountController
 *
 * Handles authentication and account management endpoints.
 * Routes: POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout
 */
@ApiTags('Account')
@Controller('api/auth')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * POST /api/auth/login
   * Authenticates user credentials and returns session token.
   * @throws AuthenticationException if credentials invalid
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'User login', requiresAuth: false })
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await this.accountService.login(loginDto.email, loginDto.password);
  }

  /**
   * POST /api/auth/register
   * Creates new user account with validation.
   * @throws ValidationException, DuplicateAccountException
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RouteConfig({ message: 'Register new account', requiresAuth: false })
  @ApiOperation({ summary: 'Register new account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<Account> {
    return await this.accountService.register(registerDto);
  }

  /**
   * POST /api/auth/logout
   * Invalidates user session and clears authentication token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'User logout', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { token?: string }): Promise<{ message: string }> {
    await this.accountService.logout(body.token || '');
    return { message: 'Logout successful' };
  }

  /**
   * GET /api/auth/profile/:id
   * Retrieves account information by ID.
   * @throws AccountNotFoundException
   */
  @Get('profile/:id')
  @RouteConfig({ message: 'Get account by ID', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Account retrieved',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Account> {
    return await this.accountService.getAccountById(id);
  }

  /**
   * PUT /api/auth/profile/:id
   * Updates user profile information.
   * @throws AccountNotFoundException, ValidationException
   */
  @Put('profile/:id')
  @RouteConfig({ message: 'Update account profile', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update account profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<Account> {
    return await this.accountService.updateProfile(id, updateDto);
  }

  /**
   * PUT /api/auth/change-password/:id
   * Changes user password after validating old password.
   * @throws AuthenticationException, WeakPasswordException
   */
  @Put('change-password/:id')
  @RouteConfig({ message: 'Change password', requiresAuth: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Invalid old password' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.accountService.changePassword(
      id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  /**
   * POST /api/auth/reset-password
   * Initiates password reset process and sends reset link via email.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RouteConfig({ message: 'Reset password', requiresAuth: false })
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.accountService.resetPassword(resetPasswordDto.email);
    return {
      message:
        'If an account exists with this email, a password reset link has been sent',
    };
  }
}

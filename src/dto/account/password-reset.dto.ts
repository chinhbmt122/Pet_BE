import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Request Password Reset DTO
 */
export class RequestPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  email: string;
}

/**
 * Confirm Password Reset DTO
 */
export class ConfirmPasswordResetDto {
  @ApiProperty({ example: 'abc123xyz456...' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(6, { message: i18nValidationMessage('validation.minLength') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  newPassword: string;
}

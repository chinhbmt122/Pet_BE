import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPass123!' })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: i18nValidationMessage('validation.custom.passwordStrength'),
  })
  newPassword: string;
}

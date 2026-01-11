import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Utility class for throwing exceptions with i18n support
 *
 * Usage:
 * throw I18nException.notFound('errors.notFound.pet', { id: petId });
 * throw I18nException.badRequest('errors.badRequest.cannotDeletePaidInvoice');
 * throw I18nException.unauthorized('errors.unauthorized.oldPasswordIncorrect');
 */
export class I18nException {
  /**
   * Throws NotFoundException with i18n key
   */
  static notFound(i18nKey: string, args?: Record<string, any>): never {
    throw new NotFoundException({
      i18nKey,
      args,
    });
  }

  /**
   * Throws BadRequestException with i18n key
   */
  static badRequest(i18nKey: string, args?: Record<string, any>): never {
    throw new BadRequestException({
      i18nKey,
      args,
    });
  }

  /**
   * Throws UnauthorizedException with i18n key
   */
  static unauthorized(i18nKey: string, args?: Record<string, any>): never {
    throw new UnauthorizedException({
      i18nKey,
      args,
    });
  }

  /**
   * Throws ForbiddenException with i18n key
   */
  static forbidden(i18nKey: string, args?: Record<string, any>): never {
    throw new ForbiddenException({
      i18nKey,
      args,
    });
  }

  /**
   * Throws ConflictException with i18n key
   */
  static conflict(i18nKey: string, args?: Record<string, any>): never {
    throw new ConflictException({
      i18nKey,
      args,
    });
  }
}

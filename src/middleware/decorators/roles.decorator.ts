import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 *
 * Marks routes with required roles for RBAC.
 * Usage: @Roles('Manager', 'Veterinarian')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

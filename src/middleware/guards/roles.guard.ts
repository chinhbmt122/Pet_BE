import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RolesGuard (RBAC)
 *
 * Implements role-based access control.
 * Checks if user has required role(s) for the endpoint.
 * Use with @Roles() decorator on controllers/routes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // TODO: Implement role verification
    // const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    // if (!hasRole) {
    //   throw new ForbiddenException('Insufficient permissions');
    // }
    throw new Error('Role verification not implemented');
  }
}

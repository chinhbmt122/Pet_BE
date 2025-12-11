import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import express from 'express';
import { RouteConfig } from '../decorators/route.decorator';
import { Account } from 'src/entities/account.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // Auth guard should already have validated the token and set the user in the request
  // and the user is valid
  canActivate(context: ExecutionContext): boolean {
    const routeConfig = this.reflector.get(RouteConfig, context.getHandler());
    if (!routeConfig?.requiresAuth) return true;

    const roles = routeConfig.roles || [];
    if (roles.length === 0) return true; // No role restrictions

    const request = context.switchToHttp().getRequest<express.Request>();
    const user = request['user'] as Account;
    return roles.includes(user.userType);
  }
}

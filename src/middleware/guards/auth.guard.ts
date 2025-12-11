import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import express from 'express';
import { RouteConfig } from '../decorators/route.decorator';
import { AccountService } from 'src/services/account.service';
import { JwtPayload } from 'src/dto/JWTTypes';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private accountService: AccountService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<express.Request>();

    const routeConfig = this.reflector.get(RouteConfig, context.getHandler());
    if (!routeConfig?.requiresAuth) return true;

    const token = this.extractTokenFromHeader(request);
    if (!token)
      throw new HttpException(
        'Unauthorized: No token provided',
        HttpStatus.UNAUTHORIZED,
      );

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      const user = await this.accountService.getAccountById(payload.id);
      if (!user) {
        throw new HttpException(
          'Unauthorized: User not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      request['user'] = user;
    } catch {
      throw new HttpException(
        'Unauthorized: Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: express.Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

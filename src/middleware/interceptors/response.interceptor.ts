import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from 'src/dto/api-response.dto';
import {
  RouteConfig as RouteConfigDecorator,
  type RouteConfig as RouteConfigType,
} from '../decorators/route.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return (next.handle() as Observable<T>).pipe(
      map((data: T) => {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context.switchToHttp().getRequest<Request>();
        const routeConfig = this.reflector.get<RouteConfigType | undefined>(
          RouteConfigDecorator,
          context.getHandler(),
        );
        return new ApiResponseDto<T>(
          response.statusCode,
          routeConfig?.message ?? '',
          data,
          request.originalUrl ?? request.url,
        );
      }),
    );
  }
}

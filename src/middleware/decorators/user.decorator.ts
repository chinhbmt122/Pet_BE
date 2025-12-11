import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Account } from 'src/entities/account.entity';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Express.Request>();
    if (!request || !request['user']) {
      throw new HttpException(
        'User not found in request',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return request['user'] as Account;
  },
);

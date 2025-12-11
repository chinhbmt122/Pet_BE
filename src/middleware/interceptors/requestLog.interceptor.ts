// Source - https://stackoverflow.com/a
// Posted by hojin
// Retrieved 2025-11-26, License - CC BY-SA 4.0

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method } = request;
    const userAgent = request.get('user-agent') || '';
    this.logger.log(
      `Incoming Request: ${method} ${request.headers.host}${request.baseUrl} - ${userAgent} ${ip}`,
    );
    // console.log(request);

    next();
  }
}

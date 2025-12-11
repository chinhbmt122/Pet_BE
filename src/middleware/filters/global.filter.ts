import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/dto/api-response.dto';

@Catch(Error, HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  // This method handles exceptions thrown in the application

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error('Exception caught by GlobalExceptionFilter:', exception);
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = exception.message;

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const responseMessage = (exceptionResponse as any).message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        }
      }

      response.status(status).json({
        statusCode: status,
        message: message,
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    } else {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;

      response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    }
  }
}

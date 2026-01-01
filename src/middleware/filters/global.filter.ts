import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/dto/api-response.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
@Catch(Error, HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract language from request (set by i18n middleware)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const lang = 'vi';

    console.error('Exception caught by GlobalExceptionFilter:', exception);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = exception.message;

      // Handle i18n translation
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Check if it's an i18n key-based error
        if ('i18nKey' in exceptionResponse) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const i18nKey = (exceptionResponse as any).i18nKey;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const args = (exceptionResponse as any).args || {};
          message = await this.i18n.translate(i18nKey, {
            lang,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            args,
          });
        }
        // Handle validation errors (array of messages)
        else if ('message' in exceptionResponse) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const responseMessage = (exceptionResponse as any).message;
          if (Array.isArray(responseMessage)) {
            // Translate each validation message if it has i18nKey
            const translatedMessages = await Promise.all(
              responseMessage.map((msg: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (typeof msg === 'object' && msg && msg.i18nKey) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  return this.i18n.translate(msg.i18nKey as string, {
                    lang,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    args: (msg.args || {}) as Record<string, any>,
                  });
                }
                return typeof msg === 'string' ? msg : JSON.stringify(msg);
              }),
            );
            message = translatedMessages.join(', ');
          } else if (typeof responseMessage === 'string') {
            message = responseMessage;
          }
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
      const message = this.i18n.translate('errors.internal.serverError', {
        lang,
      });

      response.status(status).json({
        statusCode: status,
        message: message,
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    }
  }
}

import { Reflector } from '@nestjs/core';
import { UserType } from 'src/entities/account.entity';

export interface RouteConfig {
  message: string;
  version?: string;
  requiresAuth?: boolean;
  roles?: UserType[];
}

export const RouteConfig = Reflector.createDecorator<RouteConfig>();

// export function RouteConfig(config: RouteConfig): MethodDecorator {
//   return applyDecorators(SetMetadata('routeConfig', config));
// }

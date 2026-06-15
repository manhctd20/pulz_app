import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayload } from './jwt.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);

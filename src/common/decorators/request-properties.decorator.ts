import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request.userId;
  },
);

export const CurrentUserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request.role;
  },
);

export const CurrentPublicShopId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request.publicShopId;
  },
);

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request.tenant;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';

export const CurrentRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IRequestWithUser => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request;
  },
);

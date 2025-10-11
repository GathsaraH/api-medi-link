import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IRequestWithUser } from "../interfaces/request-with-user.interface";

export const TenantCode = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
  return request.tenant.tenantCode;
});

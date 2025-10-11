import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IRequestWithUser } from "../interfaces/request-with-user.interface";

export const CurrentRequest = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: IRequestWithUser = ctx.switchToHttp().getRequest();
  return request;
});

export const UserInRequest = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: IRequestWithUser = ctx.switchToHttp().getRequest();
  return request.user;
});

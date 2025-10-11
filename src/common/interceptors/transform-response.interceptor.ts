import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SerialLoggerService } from "@/core/logging/seri-logger.service";

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  constructor(private readonly logger: SerialLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers["x-request-id"];

    return next.handle().pipe(
      map(async data => {
        const resolvedData = await data;
        const response = {
          success: true,
          data: resolvedData,
        };
        this.logger.log(`Request ID: ${requestId} - Response: ${JSON.stringify(response)}`);
        return response;
      }),
      map(responsePromise => responsePromise),
    );
  }
}
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SerialLoggerService } from "@/core/logging/seri-logger.service";

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  constructor(private logger: SerialLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();
    const requestId = request.headers["x-request-id"];
    const { method, url, body } = request;

    // Immediate logging when the request hits the service
    this.logger.log(`Request ID: ${requestId} - ${method} ${url} - Request Body: ${JSON.stringify(body)}`);

    return next.handle().pipe(
      map(async data => {
        const duration = Date.now() - start;
        let bodyString: string;

        try {
          bodyString = JSON.stringify(body);
        } catch (error) {
          bodyString = "Could not stringify body";
          this.logger.error(`Request ID: ${requestId} - Error stringifying request body`, error);
        }

        const resolvedData = await data;
        const logMessage = {
          requestId,
          method,
          url,
          duration: `${duration}ms`,
          requestBody: bodyString,
          response: resolvedData,
        };

        // Log the response after processing
        this.logger.log(`Request ID: ${requestId} - Response: ${JSON.stringify(logMessage)}`);

        return resolvedData;
      }),
      map(responsePromise => responsePromise),
    );
  }
}

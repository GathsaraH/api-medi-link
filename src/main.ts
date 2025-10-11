import "dotenv/config";
import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { useContainer } from "class-validator";
import { AppModule } from "./app.module";
import validationOptions from "./utils/validation-options";
import { ResolvePromisesInterceptor } from "./core/interceptor/serializer.interceptor";
import { setupSwagger } from "./core/configs/swagger/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
// @ts-expect-error: Override global fetch for Node.js compatibility
global.fetch = (...args: any[]) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


// Modified bootstrap function in your NestJS main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });
  
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // Get allowed origins from config
  const allowedOrigins = configService.get<string>("app.allowOrigins", { infer: true })?.split(",") || [];
  
  // Apply security middleware
  app.use(helmet());
  app.use(cookieParser());
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Electron, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
        return;
      }

      // Check if origin is from Electron app (localhost with port in range 30011-50000)
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost') {
          const port = parseInt(url.port);
          if (port >= 30011 && port <= 50000) {
            callback(null, true);
            return;
          }
        }
      } catch (error) {
        // Invalid URL, continue to rejection
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "bypass-tunnel-reminder", "x-tenant-code"],
    exposedHeaders: ["Set-Cookie"],
  });

  // Rest of your bootstrap code...
  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.getOrThrow<string>("app.apiPrefix", { infer: true }), {
    exclude: ["/"],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ResolvePromisesInterceptor(), new ClassSerializerInterceptor(app.get(Reflector)));
  setupSwagger(app);
  
  await app.listen(configService.getOrThrow<number>("app.port", { infer: true }), () =>
    logger.debug(`Server is running on ${configService.getOrThrow<number>("app.port", { infer: true })}`),
  );
}
void bootstrap();

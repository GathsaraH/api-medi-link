import { registerAs } from "@nestjs/config";
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from "class-validator";
import validateConfig from "src/utils/validate-config";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsNotEmpty()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsNotEmpty()
  APP_PORT: number;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsNotEmpty()
  API_PREFIX: string;

  @IsString()
  @IsNotEmpty()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsNotEmpty()
  APP_HEADER_LANGUAGE: string;

  @IsString({ each: true })
  @IsNotEmpty()
  ALLOWED_ORIGINS: string;
}

export default registerAs("app", () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    name: process.env.APP_NAME || "app",
    workingDirectory: process.env.PWD || process.cwd(),
    backendDomain: process.env.BACKEND_DOMAIN ?? "http://localhost",
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : process.env.PORT ? parseInt(process.env.PORT, 10) : 5601,
    apiPrefix: process.env.API_PREFIX || "api",
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || "en",
    headerLanguage: process.env.APP_HEADER_LANGUAGE || "x-custom-lang",
    allowOrigins: process.env.ALLOWED_ORIGINS || "",
  };
});

import { Module } from "@nestjs/common";
import { SerialLoggerService } from "./seri-logger.service";

@Module({
  providers: [SerialLoggerService],
  exports: [SerialLoggerService],
})
export class SerialLoggerModule {}

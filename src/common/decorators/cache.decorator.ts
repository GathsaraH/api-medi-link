import { SetMetadata } from "@nestjs/common";

export const Cache = (ttl: number) => SetMetadata("cache", { ttl });

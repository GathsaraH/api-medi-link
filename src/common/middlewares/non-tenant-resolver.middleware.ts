// import { Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
// import { Request, Response, NextFunction } from "express";
// import { PublicPrismaService } from "@/core/configs/database/public-prisma.service";

// @Injectable()
// /**
//  * Create separate middleware for tenant context because
//  * We have two Roles that are not tenant specific (SUPER_ADMIN and CONSULTANT)
//  * So we need to check if the role is SUPER_ADMIN or CONSULTANT
//  * and get the tenant code from the request header
//  * and get the tenant from the database and set the tenant in the request
//  */
// export class NonTenantResolverMiddleware implements NestMiddleware {
//   constructor(private readonly publicPrisma: PublicPrismaService) {}

//   async use(request: Request, response: Response, next: NextFunction) {
//     // Only apply to non-tenant specific roles
//     if (request["isSuperAdmin"] || request["isConsultant"]) {
//       // Get tenant code from header
//       const tenantCode = request.headers["x-tenant-code"] as string;
//       if (tenantCode) {
//         try {
//           // Get the tenant data
//           const tenant = await this.publicPrisma.tenant.findUnique({
//             where: { code: tenantCode },
//             include: { datasource: true },
//           });

//           if (!tenant) {
//             // We do not throw an error here, as the tenant may not exist
//             return next();
//           }

//           request["tenant"] = {
//             tenantCode: tenant.code,
//             datasourceUrl: tenant.datasource.url,
//             tenantId: tenant.id,
//           };
//         } catch (error) {
//           throw new BadRequestException(`Invalid tenant context: ${error.message}`);
//         }
//       }
//     }

//     next();
//   }
// }

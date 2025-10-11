// import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { Webhook } from "svix";
// import { Request } from "express";

// @Injectable()
// export class ClerkWebhookValidationGuard implements CanActivate {
//   private readonly webhook: Webhook;

//   constructor(private readonly configService: ConfigService) {
//     this.webhook = new Webhook(this.configService.getOrThrow<string>("clerk.clerkWebhookSecret", { infer: true }));
//   }

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest<Request>();
//     const payload = JSON.stringify(request.body);
//     const headers = {
//       "svix-id": request.headers["svix-id"] as string,
//       "svix-timestamp": request.headers["svix-timestamp"] as string,
//       "svix-signature": request.headers["svix-signature"] as string,
//     };

//     try {
//       // This will throw an error if the signature is invalid. So we catch it and throw a 401
//       // If it's valid, we return true and the request will continue
//       await this.webhook.verify(payload, headers);
//       return true;
//     } catch (err) {
//       throw new UnauthorizedException("Invalid webhook signature", { cause: err });
//     }
//   }
// }

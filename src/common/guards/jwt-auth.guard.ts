import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtTokenService } from '@/modules/auth/jwt/jwt-token.service';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';
import { IS_PUBLIC_KEY } from '@/common/decorators/public-route.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IRequestWithUser>();
    
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header missing or malformed');
    }

    const token = authHeader.substring(7);

    try {
      // Verify the JWT token
      const payload = await this.jwtTokenService.verifyAccessToken(token);

      // Validate user exists and get user info
      const validation = await this.authService.validateUserById(
        payload.userId,
        payload.tenantCode,
      );

      // Attach user information to request
      request.user = {
        id: validation.user.id,
        email: validation.user.email,
        emailAddresses: [{ emailAddress: validation.user.email }],
      };
      request.userId = validation.user.id;
      request.role = validation.user.role;
      request.authType = 'jwt';

      // If tenant user, attach tenant info
      if (validation.tenant) {
        request.tenant = validation.tenant;
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
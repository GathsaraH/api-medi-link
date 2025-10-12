import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import { JwtConfig } from '@/core/configs/jwt/jwt-config.type';

export interface JwtTokenPayload {
  sub: string; // user ID
  userId: string;
  email: string;
  role: string;
  tenantCode?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtTokenService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt');
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(payload: Omit<JwtTokenPayload, 'type' | 'iat' | 'exp'>): Promise<TokenPair> {
    const accessTokenPayload: JwtTokenPayload = {
      ...payload,
      type: 'access',
    };

    const refreshTokenPayload: JwtTokenPayload = {
      ...payload,
      type: 'refresh',
    };

    const accessToken = sign(
      accessTokenPayload, 
      this.jwtConfig.jwtSecret, 
      { 
        expiresIn: this.jwtConfig.jwtExpiresIn,
      } as SignOptions
    );

    const refreshToken = sign(
      refreshTokenPayload, 
      this.jwtConfig.jwtRefreshSecret, 
      { 
        expiresIn: this.jwtConfig.jwtRefreshExpiresIn,
      } as SignOptions
    );

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(this.jwtConfig.jwtExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtTokenPayload> {
    try {
      const payload = await new Promise<JwtTokenPayload>((resolve, reject) => {
        verify(token, this.jwtConfig.jwtSecret, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded as JwtTokenPayload);
        });
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtTokenPayload> {
    try {
      const payload = await new Promise<JwtTokenPayload>((resolve, reject) => {
        verify(token, this.jwtConfig.jwtRefreshSecret, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded as JwtTokenPayload);
        });
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate new access token from refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // Remove JWT specific fields and regenerate tokens
    const { iat, exp, type, ...userPayload } = payload;
    
    return this.generateTokenPair(userPayload);
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 60 * 60;
      case 'd':
        return timeValue * 24 * 60 * 60;
      default:
        return 3600; // Default to 1 hour
    }
  }
}
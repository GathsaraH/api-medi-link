import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PublicPrismaService } from '@/core/configs/database/public-prisma.service';
import { TenantPrismaFactory } from '@/core/configs/database/tenant-prisma-factory';
import { JwtTokenService, TokenPair } from './jwt/jwt-token.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma-public/prisma/client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  medicalCenterId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    medicalCenter: {
      id: string;
      name: string;
      address: string;
    };
  };
  tokens: TokenPair;
  tenantCode?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly publicPrisma: PublicPrismaService,
    private readonly tenantPrismaFactory: TenantPrismaFactory,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Register a new system user (for public screen authentication)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.publicPrisma.systemUsers.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { phoneNumber: registerDto.phoneNumber },
        ],
      },
      include: { medicalCenter: true },
    });

    if (!existingUser) {
      throw new ConflictException(
        'User with this email, phone number, or SLMC number not  exists',
      );
    }

    // Check if medical center exists
    const medicalCenter = await this.publicPrisma.medicalCenter.findUnique({
      where: { id: registerDto.medicalCenterId },
    });

    if (!medicalCenter) {
      throw new BadRequestException('Medical center not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Store hashed password and other details
    await this.publicPrisma.systemUsers.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
      },
    });

    // Generate tokens
    const tokens = await this.jwtTokenService.generateTokenPair({
      sub: existingUser.id,
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        medicalCenter: {
          id: existingUser.medicalCenter.id,
          name: existingUser.medicalCenter.name,
          address: existingUser.medicalCenter.address,
        },
      },
      tokens,
    };
  }

  /**
   * Login system user (for public screen authentication)
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find user by email
    const user = await this.publicPrisma.systemUsers.findUnique({
      where: { email: loginDto.email },
      include: {
        medicalCenter: true,
      },
    });

    if (!user || user.isArchive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.jwtTokenService.generateTokenPair({
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        medicalCenter: {
          id: user.medicalCenter.id,
          name: user.medicalCenter.name,
          address: user.medicalCenter.address,
        },
      },
      tokens,
    };
  }

  /**
   * Login tenant user (for multi-tenant authentication)
   */
  async loginTenant(
    loginDto: LoginDto & { tenantCode: string },
  ): Promise<AuthResponse> {
    // Get tenant information
    const tenant = await this.publicPrisma.tenant.findUnique({
      where: { code: loginDto.tenantCode },
      include: {
        dataSource: true,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

    // Get tenant database connection
    const tenantPrisma = await this.tenantPrismaFactory.getPooledPrismaInstance(
      tenant.dataSource.url,
    );

    // Find user in tenant database
    const user = await tenantPrisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || user.isArchive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For tenant users, we might not have password field in tenant schema
    // This would depend on your specific implementation
    // For now, we'll assume email-based authentication or integration with external auth

    // Generate tokens with tenant information
    const tokens = await this.jwtTokenService.generateTokenPair({
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantCode: tenant.code,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role,
        medicalCenter: {
          id: 'tenant-center', // This would come from tenant's medical center
          name: 'Tenant Medical Center',
          address: 'Tenant Address',
        },
      },
      tokens,
      tenantCode: tenant.code,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      return await this.jwtTokenService.refreshAccessToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate user by ID (used by middleware)
   */
  async validateUserById(userId: string, tenantCode?: string): Promise<any> {
    if (tenantCode) {
      // Validate tenant user
      const tenant = await this.publicPrisma.tenant.findUnique({
        where: { code: tenantCode },
        include: { dataSource: true },
      });

      if (!tenant) {
        throw new UnauthorizedException('Invalid tenant');
      }

      const tenantPrisma =
        await this.tenantPrismaFactory.getPooledPrismaInstance(
          tenant.dataSource.url,
        );

      const user = await tenantPrisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.isArchive) {
        throw new UnauthorizedException('User not found or archived');
      }

      return {
        user,
        tenant: {
          tenantCode: tenant.code,
          datasourceUrl: tenant.dataSource.url,
          tenantId: tenant.id,
        },
      };
    } else {
      // Validate system user
      const user = await this.publicPrisma.systemUsers.findUnique({
        where: { id: userId },
        include: {
          medicalCenter: true,
        },
      });

      if (!user || user.isArchive) {
        throw new UnauthorizedException('User not found or archived');
      }

      return { user };
    }
  }

  /**
   * Logout user (optional - for token blacklisting if implemented)
   */
  async logout(userId: string): Promise<{ message: string }> {
    // Here you could implement token blacklisting if needed
    // For now, we'll just return a success message
    return { message: 'Logged out successfully' };
  }
}

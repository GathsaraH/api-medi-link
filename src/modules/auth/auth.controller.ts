import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
import { PublicRoute } from '@/common/decorators/public-route.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IRequestWithUser } from '@/common/interfaces/request-with-user.interface';
import { 
  CurrentUserId, 
  CurrentUserRole, 
  CurrentTenant 
} from '@/common/decorators/request-properties.decorator';
import { UserRole } from '@prisma-public/prisma/client';
import { ITenantInfo } from '@/common/interfaces/request-with-user.interface';

class LoginRequestDto {
  email: string;
  password: string;
}

class TenantLoginRequestDto extends LoginRequestDto {
  tenantCode: string;
}

class RegisterRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  slmcNumber?: string;
  medicalCenterId: string;
}

class RefreshTokenDto {
  refreshToken: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @PublicRoute()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new system user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists',
  })
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login system user (public screen)' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('login/tenant')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login tenant user (multi-tenant)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant user successfully logged in',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials or tenant',
  })
  async loginTenant(@Body() loginDto: TenantLoginRequestDto): Promise<AuthResponse> {
    return this.authService.loginTenant(loginDto);
  }

  @Post('refresh')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async logout(@CurrentUserId() userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async getProfile(
    @CurrentUserId() userId: string,
    @CurrentUserRole() role: UserRole,
    @CurrentTenant() tenant?: ITenantInfo,
    @Request() req?: IRequestWithUser,
  ) {
    const validation = await this.authService.validateUserById(
      userId, 
      tenant?.tenantCode
    );

    return {
      user: {
        id: validation.user.id,
        firstName: validation.user.firstName,
        lastName: validation.user.lastName,
        email: validation.user.email,
        role: validation.user.role,
        ...(validation.user.medicalCenter && {
          medicalCenter: {
            id: validation.user.medicalCenter.id,
            name: validation.user.medicalCenter.name,
            address: validation.user.medicalCenter.address,
          },
        }),
      },
      tenant: validation.tenant,
      authType: req?.authType || 'jwt',
    };
  }

  @Get('validate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async validateToken() {
    return {
      valid: true,
      message: 'Token is valid',
    };
  }
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateOnboardMedicalCenterDto {
  @ApiProperty({
    name: 'medicalCenterName',
    description: 'Name of the medical center',
    example: 'City Hospital',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  medicalCenterName: string;
  @ApiProperty({
    name: 'address',
    description: 'Address of the medical center',
    example: '123 Main St, Springfield',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  address: string;
  @ApiProperty({
    name: 'phoneNumber',
    description: 'Contact phone number of the medical center',
    example: '+94773245095',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    name: 'doctorName',
    description: 'Name of the doctor',
    example: 'Dr. John Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  doctorName: string;
  @ApiProperty({
    name: 'slmcNumber',
    description: 'SLMC Number of the doctor',
    example: 'SLMC123456',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  slmcNumber: string;
  @ApiProperty({
    name: 'firstName',
    description: 'First name of the doctor',
    example: 'John',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @ApiProperty({
    name: 'lastName',
    description: 'Last name of the doctor',
    example: 'Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
  @ApiProperty({
    name: 'email',
    description: 'Email address of the doctor',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty({
    name: 'password',
    description: 'Password for the doctor account',
    example: 'securepassword',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class SignupDto {
  @ApiProperty({ example: 'Raul Semicek' })
  @IsString()
  name!: string

  @ApiProperty({ example: 'raul@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiProperty({ example: 'Pulselane Labs' })
  @IsString()
  organizationName!: string
}

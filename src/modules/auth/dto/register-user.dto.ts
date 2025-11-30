import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail({}, { message: 'El formato del correo no es válido' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;
}
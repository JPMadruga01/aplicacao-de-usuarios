import { 
    IsEmail, 
    IsNotEmpty, 
    IsString,
    MinLength,
} from "class-validator";

export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
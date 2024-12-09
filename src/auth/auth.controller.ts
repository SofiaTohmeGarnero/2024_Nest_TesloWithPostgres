import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  //Para acceder a este endpoint debo:
  // 1. usar el endpoint de login (o register para un usuario nuevo) y obtener el token
  // 2. ir al endpoint de private > tab Auth > seleccionar Bearer Token > pegar el valor del token obtenido en el paso anterior
  // 3. send
  @Get('private')
  @UseGuards(AuthGuard()) //con estos decoradores hago privada la ruta
  testingPrivateRoute() {
    return 'Hola accediste a una ruta privada';
  }
}

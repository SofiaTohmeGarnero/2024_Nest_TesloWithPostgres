import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Headers,
  /* SetMetadata, */
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, RawHeaders, RoleProtected } from './decorators';
import { User } from './entities/user.entity';
import { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';

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
  testingPrivateRoute(
    @Req() request: Express.Request, //no es muy sugar la sintaxis pero puedo obtener todo lo que viene de la request, incluso el user como: const {user} = request
    @GetUser() user: User,
    @GetUser('email') userEmail: string, //el ('email') es la data que recibe el decorator
    //para usar el decorador @GetUser debo usar @UseGuards(AuthGuard()) que hace la ruta privada y nos obliga a que le pasemos un token y con eso la request identifica el usuario

    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      message: 'Hola accediste a una ruta privada',
      user,
      userEmail,
      rawHeaders,
      headers,
    };
  }

  @Get('private2')
  //@SetMetadata('roles', ['admin', 'super-user'])  //se usa bastante poco pq pude introducir muchos errores ya que son todos valores hardcodeados que pueden escribirse mal
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin) //solucionamos el problema de la linea 59 usando nuestro custom decorator y un enum con los valores permitidos
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}

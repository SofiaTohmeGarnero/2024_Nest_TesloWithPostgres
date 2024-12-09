import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([User]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'), //usamos el modulo de configService, pero tmb funcionaría con la var de entorno de manera directa (process.env.JWT_SECRET)
          signOptions: {
            expiresIn: '2h',
          },
        };
      },
    }),

    /*     
    JwtModule.register({
      El problema es que puede ser que process.env.JWT_SECRET no esté definido 
      en el momento en el cual la aplicación está montándose.
      Entonces sería mejor que este módulo fuera montado de manera asíncrona 
      y así asegurarme de que siempre voy a tener un valor aquí
      
      secret: process.env.JWT_SECRET,
      signOptions:{
        expiresIn: '2h'
      }
    }) 
    */
  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}

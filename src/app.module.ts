//import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { ServeStaticModule } from '@nestjs/serve-static';

import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),

    /* Esto lo usaríamos si quisieramos mostrar las img desde la carpeta public/products
    pero de esa manera no tenemos control de a quien mostramos nuestras img, por eso creamos la api:files que aloja las img en la carpeta static/products,
    y que nos permite crear una url segura api/files/product/fileName.jpg y manejar autorización y autenticación.

    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'),
    }), 
    */

    ProductsModule,

    CommonModule,

    SeedModule,

    FilesModule,

    AuthModule,
  ],
})
export class AppModule {}

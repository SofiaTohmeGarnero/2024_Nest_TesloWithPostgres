import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector, //para obtener la metadata y de ahi los roles
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(
      'roles',
      context.getHandler(),
    );

    console.log({ validRoles }); //>> { validRoles: [ 'admin', 'super-user' ] } que son los que seteamos en el controller como metadata

    return true;
  }
}

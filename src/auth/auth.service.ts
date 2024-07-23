import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from '../dto';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { env } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('AuthService');

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('mongodb conectado');
  }

  signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { name, email, password } = registerUserDto;
    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });
      if (user) {
        throw new RpcException({
          status: 400,
          message: 'Usuario ya existe',
        });
      }
      const newUser = await this.user.create({
        data: {
          name,
          email,
          password: bcrypt.hashSync(password, 10),
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...rest } = newUser;
      return {
        user: rest,
        token: this.signJwt(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'Usuario no valido',
        });
      }
      const isPassValid = bcrypt.compareSync(password, user.password);
      if (!isPassValid) {
        throw new RpcException({
          status: 400,
          message: 'Contraseña no valido',
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...rest } = user;
      return {
        user: rest,
        token: this.signJwt(rest),
      };
    } catch (error) {
      console.log({ error });
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      console.log(token);
      const payload = await this.jwtService.verifyAsync(token, {
        secret: env.jwtSecret,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { iat, exp, ...user } = payload;
      return {
        user: user,
        token: await this.jwtService.sign(user),
      };
    } catch (error) {
      throw new RpcException({
        status: 401,
        message: 'Token invalido',
      });
    }
  }
}

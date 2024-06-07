import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserEntity,
  UserJwt,
  TokenResetEntity
} from '@app/shared';

import { crypt, decrypt } from './auth.utils';

import { ExistingUserDTO, NewUserDTO, ChangePasswordDto, GoogleAuthDTO } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TokenResetEntity)
    private readonly tokenResetRepository: Repository<TokenResetEntity>,
    @Inject('MAIL_SERVICE')
    private readonly mailerService: ClientProxy,

    private readonly jwtService: JwtService,
  ) { }

  async getUsers(page: number = 1, limit: number = 5) {
    const [users, totalItem] = await this.usersRepository.findAndCount({
      select: ['id', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      message: 'Users retrieved successfully',
      result: users,
      meta: {
        totalItems: totalItem,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItem / limit),
        currentPage: page,
      }
    }
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new RpcException({
        message: 'User not found',
        statusCode: 404,
      });
    }

    return {
      message: 'User retrieved successfully',
      result: user,
    }
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password'],
    })
  }

  async hashPassword(password: string): Promise<string> {
    return crypt(password);
  }

  async register(newUser: Readonly<NewUserDTO>) {
    const { name, email, password, phone, provider, providerId } = newUser;

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new RpcException({
        message: 'An account with that email already exists!',
        statusCode: 409,
      });
    }

    const id = uuid();
    const hashedPassword = password ? await this.hashPassword(password) : null;

    const savedUser = await this.usersRepository.save({
      id: id,
      name,
      phone: phone || null,
      email,
      password: hashedPassword,
      isActive: provider && providerId ? true : false,
    });

    if (!savedUser) {
      throw new RpcException({
        message: 'Could not save user',
        statusCode: 400,
      });
    }
    delete savedUser.password;

    await this.tokenResetRepository.save({
      userId: savedUser.id,
      user: savedUser,
      resetToken: null,
      createdAt: null,
      expiredAt: null,
    });

    const jwt = await this.jwtService.signAsync({ user: savedUser });
    this.mailerService.send({
      cmd: 'send-email'
    }, {
      name: savedUser.name,
      email: savedUser.email,
      token: jwt,
    }).subscribe();


    return {
      message: 'User created',
      result: {
        token: jwt,
        user: savedUser,
      },
    };
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return password === decrypt(hashedPassword);
  }

  async updateProfile(userData: Readonly<NewUserDTO>) {
    const { id, name, email, password, phone } = userData;
    const hashedPassword = password ? await this.hashPassword(password) : null;

    await this.usersRepository.update(id, {
      name,
      email,
      password: hashedPassword,
      phone,
    });

    return {
      message: 'Profile updated.',
    };
  }

  async deleteUser(id: string) {
    await this.usersRepository.delete(id);
    return {
      message: 'User deleted.',
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);

    const doesUserExist = !!user;

    if (!doesUserExist) return null;

    const doesPasswordMatch = await this.doesPasswordMatch(
      password,
      user.password,
    );

    if (!doesPasswordMatch) return null;

    return user;
  }

  async verifyEmail(token: string) {
    const { user } = await this.verifyJwt(token);

    if (!user) {
      throw new RpcException({
        message: 'Invalid token',
        statusCode: 401,
      });
    }

    await this.usersRepository.update(user.id, { isActive: true });
    return {
      message: 'Email verified.',
    };
  }

  async login(existingUser: Readonly<ExistingUserDTO>) {
    const { email, password } = existingUser;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new RpcException({
        message: 'Invalid credentials',
        statusCode: 401,
      });
    }

    delete user.password;

    const jwt = await this.jwtService.signAsync({ user });

    return {
      message: 'Login successful',
      result: {
        token: jwt,
        user: user,
      }
    };
  }

  async loginGoogle(googleData: Readonly<GoogleAuthDTO>) {

    if (!googleData) throw new RpcException({
      message: 'Invalid google data',
      statusCode: 401,
    });

    const userExists = await this.findByEmail(googleData.email);

    if (!userExists) {
      return this.register(googleData);
    }

    delete userExists.password;
    const jwt = await this.jwtService.signAsync({ user: userExists });
    return {
      message: 'Login successful',
      result: {
        token: jwt,
        user: userExists,
      }
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword, userId } = changePasswordDto;
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) throw new RpcException({
      message: 'User not found',
      statusCode: 404,
    });

    const doesPasswordMatch = await this.doesPasswordMatch(oldPassword, user.password);
    if (!doesPasswordMatch) throw new RpcException({
      message: 'Invalid password',
      statusCode: 401,
    });

    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(user.id, { password: hashedPassword });

    return {
      message: 'Password changed',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.findByEmail(email);

    if (!user) throw new RpcException({
      message: 'Cannot find user.',
      statusCode: 401
    });

    const code = Math.floor(Math.random() * 9000) + 1000;

    await this.tokenResetRepository.update(user.id, {
      resetToken: code,
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    this.mailerService.send({
      cmd: 'send-verification-code'
    }, {
      userId: user.id,
      email: user.email,
      name: user.name,
      code: code
    }).subscribe();
    return {
      message: 'Code sent!'
    }
  }

  async verifyForgotPassword(code: number, userId: string) {
    const tokenReset = await this.tokenResetRepository.findOne({
      where: {
        resetToken: code,
        user: { id: userId }
      }
    });

    if (!tokenReset) throw new RpcException({
      message: 'Invalid code or user mismatch',
      statusCode: 401,
    });

    if (tokenReset.expiredAt < new Date()) throw new RpcException({
      message: 'Code expired, try again.',
      statusCode: 401,
    });

    return {
      message: 'Code verified',
    };
  }

  async resetPassword(newPassword: string, userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new RpcException({
      message: 'User not found',
      statusCode: 404,
    });

    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(user.id, { password: hashedPassword });

    return {
      message: 'Password reset successful',
    };
  }

  async verifyJwt(jwt: string): Promise<{ user: UserEntity; exp: number }> {
    if (!jwt) {
      throw new RpcException({
        message: 'Invalid token',
        statusCode: 401,
      });
    }

    try {
      const { user, exp } = await this.jwtService.verifyAsync(jwt);
      return { user, exp };
    } catch (error) {
      throw new RpcException({
        message: 'Invalid token',
        statusCode: 401,
      });
    }
  }

  async getUserFromHeader(jwt: string): Promise<UserJwt> {
    if (!jwt) return;

    try {
      return this.jwtService.decode(jwt) as UserJwt;
    } catch (error) {
      throw new RpcException({
        message: 'Invalid token',
        statusCode: 401,
      });
    }
  }
}
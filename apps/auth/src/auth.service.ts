import {
  ConflictException,
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import {
  UserEntity,
  UserJwt,
  UserRepositoryInterface,
} from '@app/shared';

import { crypt, decrypt } from './auth.utils';

import { ExistingUserDTO } from './dtos/existing-user.dto';
import { NewUserDTO } from './dtos/new-user.dto';
import { AuthServiceInterface } from './interfaces/auth.service.interface';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    @Inject('UsersRepositoryInterface')
    private readonly usersRepository: UserRepositoryInterface,
    @Inject('MAIL_SERVICE') 
    private readonly mailerService: ClientProxy,

    private readonly jwtService: JwtService,
  ) { }

  async getUsers(): Promise<UserEntity[]> {
    return await this.usersRepository.findAll();
  }

  async getUserById(id: number): Promise<UserEntity> {
    return await this.usersRepository.findOneById(id);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.usersRepository.findByCondition({
      where: { email },
      select: ['id', 'name', 'email', 'password'],
    });
  }

  async findById(id: number): Promise<UserEntity> {
    return this.usersRepository.findOneById(id);
  }

  async hashPassword(password: string): Promise<string> {
    return crypt(password);
  }

  async register(newUser: Readonly<NewUserDTO>): Promise<UserEntity> {
    const { name, email, password, phone } = newUser;

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with that email already exists!');
    }

    const id = uuid();
    const hashedPassword = await this.hashPassword(password);

    const savedUser = await this.usersRepository.save({
      id: id,
      name,
      phone,
      email,
      password: hashedPassword,
    });

    if (!savedUser) {
      throw new BadRequestException('Could not save user');
    }
  
    this.mailerService.send({
      cmd: 'send-email'
    }, {  
      name: savedUser.name,
      email: savedUser.email,
      token: uuid(),
    }).subscribe();

    delete savedUser.password;
    return savedUser;
  }

  async doesPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return password === decrypt(hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
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

  async login(existingUser: Readonly<ExistingUserDTO>) {
    const { email, password } = existingUser;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException();
    }

    delete user.password;

    const jwt = await this.jwtService.signAsync({ user });

    return { token: jwt, user };
  }

  async verifyJwt(jwt: string): Promise<{ user: UserEntity; exp: number }> {
    if (!jwt) {
      throw new UnauthorizedException();
    }

    try {
      const { user, exp } = await this.jwtService.verifyAsync(jwt);
      return { user, exp };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async getUserFromHeader(jwt: string): Promise<UserJwt> {
    if (!jwt) return;

    try {
      return this.jwtService.decode(jwt) as UserJwt;
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
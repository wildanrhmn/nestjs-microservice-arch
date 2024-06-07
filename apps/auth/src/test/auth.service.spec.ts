import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity, TokenResetEntity } from '@app/shared';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { mocked } from 'jest-mock';

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Repository<UserEntity>;
    let tokenResetRepository: Repository<TokenResetEntity>;
    let jwtService: JwtService;
    let mailerService: ClientProxy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: {
                        findOne: jest.fn(),
                        findAndCount: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TokenResetEntity),
                    useValue: {
                        save: jest.fn(),
                        update: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: 'MAIL_SERVICE',
                    useValue: {
                        send: jest.fn().mockReturnThis(),
                        subscribe: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                        verifyAsync: jest.fn(),
                        decode: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        tokenResetRepository = module.get<Repository<TokenResetEntity>>(getRepositoryToken(TokenResetEntity));
        jwtService = module.get<JwtService>(JwtService);
        mailerService = module.get<ClientProxy>('MAIL_SERVICE');
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(tokenResetRepository).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(mailerService).toBeDefined();
    });

    describe('getUserById', () => {
        it('should return a user if found', async () => {
            const mockUser = {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                password: 'dummyPassword', // Assuming a dummy password
                phone: '1234567890',       // Assuming a dummy phone number
                isActive: true,            // Assuming the user is active
                createdAt: new Date(),     // Using current date for creation
                updatedAt: new Date()      // Using current date for last update
            };
            mocked(userRepository.findOne).mockResolvedValue(mockUser);
            const result = await service.getUserById('1');
            expect(result.result).toEqual(mockUser);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                select: ['id', 'name', 'email', 'isActive', 'createdAt', 'updatedAt'],
            });
        });

        it('should throw an error if no user is found', async () => {
            mocked(userRepository.findOne).mockResolvedValue(null);
            await expect(service.getUserById('1')).rejects.toThrow('User not found');
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const newUserDTO = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                phone: '1234567890',
                provider: 'local',
                providerId: null
            };

            mocked(userRepository.findOne).mockResolvedValue(null);
            mocked(userRepository.save).mockImplementation(user => Promise.resolve({ ...user, id: '1' }));
            mocked(jwtService.signAsync).mockResolvedValue('mockJwtToken');

            const result = await service.register(newUserDTO);

            expect(result.message).toEqual('User created');
            expect(result.result.user).toEqual(expect.objectContaining({
                name: 'John Doe',
                email: 'john.doe@example.com',
                isActive: false
            }));
            expect(result.result.token).toEqual('mockJwtToken');
            expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: expect.any(String),
                isActive: false
            }));
        });

        it('should throw an error if user already exists', async () => {
            const newUserDTO = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                phone: '1234567890',
                provider: 'local',
                providerId: null
            };

            mocked(userRepository.findOne).mockResolvedValue({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'hashedPassword',
                isActive: true,
                phone: '1234567890', // Add a dummy phone number
                createdAt: new Date(), // Add current date for createdAt
                updatedAt: new Date() // Add current date for updatedAt
            });

            await expect(service.register(newUserDTO)).rejects.toThrow('An account with that email already exists!');
        });
    });

    describe('login', () => {
        it('should successfully log in a user with correct credentials', async () => {
            const existingUserDTO = {
                email: 'john.doe@example.com',
                password: 'password123'
            };

            mocked(userRepository.findOne).mockResolvedValue({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'hashedPassword',
                isActive: true,
                phone: '1234567890',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            service.doesPasswordMatch = jest.fn().mockResolvedValue(true);
            mocked(jwtService.signAsync).mockResolvedValue('mockJwtToken');

            const result = await service.login(existingUserDTO);

            expect(result.message).toEqual('Login successful');
            expect(result.result.token).toEqual('mockJwtToken');
            expect(result.result.user).toEqual(expect.objectContaining({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                isActive: true
            }));
        });

        it('should throw an error if credentials are invalid', async () => {
            const existingUserDTO = {
                email: 'john.doe@example.com',
                password: 'wrongPassword'
            };

            mocked(userRepository.findOne).mockResolvedValue({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'hashedPassword',
                isActive: true,
                phone: '1234567890',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            service.doesPasswordMatch = jest.fn().mockResolvedValue(false);

            await expect(service.login(existingUserDTO)).rejects.toThrow('Invalid credentials');
        });
    });

    describe('loginGoogle', () => {
        it('should successfully log in a user with Google data', async () => {
            const googleAuthDTO = {
                email: 'john.doe@example.com',
                name: 'John Doe',
                providerId: 'googleProviderId', // Example provider ID
                provider: 'google',             // Specify the provider
                picture: 'urlToProfilePicture'  // URL to the profile picture
            };

            mocked(userRepository.findOne).mockResolvedValue({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                isActive: true,
                password: 'hashedPassword',
                phone: '1234567890',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mocked(jwtService.signAsync).mockResolvedValue('mockJwtToken');

            const result = await service.loginGoogle(googleAuthDTO);

            expect(result.message).toEqual('Login successful');
            expect(result.result.token).toEqual('mockJwtToken');
            expect(result.result.user).toEqual(expect.objectContaining({
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                isActive: true
            }));
        });
    });

    describe('verifyEmail', () => {
        it('should verify user email and activate the user', async () => {
            const token = 'validToken';
            const user = {
                id: '1',
                name: 'John Doe',
                password: 'hashedPassword',
                email: 'john.doe@example.com',
                isActive: false,
                phone: '1234567890',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            service.verifyJwt = jest.fn().mockResolvedValue({ user, exp: Date.now() + 1000 });
            mocked(userRepository.update).mockResolvedValue({
                raw: {},
                generatedMaps: []
            });

            const result = await service.verifyEmail(token);

            expect(result.message).toEqual('Email verified.');
            expect(userRepository.update).toHaveBeenCalledWith('1', { isActive: true });
        });

        it('should throw an error if token is invalid', async () => {
            const token = 'invalidToken';
            service.verifyJwt = jest.fn().mockRejectedValue(new Error('Invalid token'));
            await expect(service.verifyEmail(token)).rejects.toThrow('Invalid token');
        });
    });
});

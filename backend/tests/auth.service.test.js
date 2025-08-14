const { describe, test, expect, beforeEach } = require('@jest/globals');

// Import the auth service (adjust path as needed)
const AuthService = require('../src/services/auth.service');

// Mock dependencies
jest.mock('../src/models/user.model', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ id: 'mock-user-id' })),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(() => 'hashed-password'),
}));

describe('Auth Service', () => {
  let authService;
  const UserModel = require('../src/models/user.model');
  const bcrypt = require('bcrypt');
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    authService = new AuthService();
  });
  
  describe('login', () => {
    test('should return token when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'worker',
      };
      UserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      
      // Act
      const result = await authService.login('test@example.com', 'password123');
      
      // Assert
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toEqual({
        token: 'mock-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });
    
    test('should throw error when user not found', async () => {
      // Arrange
      UserModel.findOne.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login('test@example.com', 'password123'))
        .rejects
        .toThrow('Invalid credentials');
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
    
    test('should throw error when password is incorrect', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
      };
      UserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      // Act & Assert
      await expect(authService.login('test@example.com', 'wrong-password'))
        .rejects
        .toThrow('Invalid credentials');
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });
  });
  
  describe('register', () => {
    test('should create a new user and return token', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'newpass123',
        firstName: 'New',
        lastName: 'User',
        role: 'hirer',
      };
      
      const mockCreatedUser = {
        _id: 'new-user-123',
        ...userData,
        password: 'hashed-password',
      };
      
      UserModel.findOne.mockResolvedValue(null);
      UserModel.create.mockResolvedValue(mockCreatedUser);
      
      // Act
      const result = await authService.register(userData);
      
      // Assert
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(UserModel.create).toHaveBeenCalled();
      expect(result).toEqual({
        token: 'mock-token',
        user: {
          id: mockCreatedUser._id,
          email: mockCreatedUser.email,
          firstName: mockCreatedUser.firstName,
          lastName: mockCreatedUser.lastName,
          role: mockCreatedUser.role,
        },
      });
    });
    
    test('should throw error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password',
      };
      
      UserModel.findOne.mockResolvedValue({ email: 'existing@example.com' });
      
      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('Email already in use');
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });
  
  describe('verifyToken', () => {
    test('should return user data when token is valid', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
      };
      UserModel.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await authService.verifyToken('valid-token');
      
      // Assert
      expect(result).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
    
    test('should throw error when user not found', async () => {
      // Arrange
      UserModel.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.verifyToken('invalid-token'))
        .rejects
        .toThrow('User not found');
    });
  });
}); 
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt.types';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  UpdateMeDto,
} from './dto';

type UserPublic = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshDto) {
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    const accessToken = await this.signAccess({ sub: user.id, email: user.email });
    return { accessToken };
  }

  async me(userId: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toPublic(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserPublic> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    return this.toPublic(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Password is incorrect');
    // Cascade: habits, check-ins, group memberships đều `onDelete: Cascade` trong schema.
    // Group nào user là owner sẽ FAIL nếu còn member khác → cần xoá group thủ công trước.
    await this.prisma.group.deleteMany({ where: { ownerId: userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: Date;
  }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(payload),
      this.signRefresh(payload),
    ]);
    return { accessToken, refreshToken, user: this.toPublic(user) };
  }

  private signAccess(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    });
  }

  private signRefresh(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '30d'),
    });
  }

  private toPublic(user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: Date;
  }): UserPublic {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

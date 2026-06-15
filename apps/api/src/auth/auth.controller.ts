import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RefreshDto, RegisterDto } from './dto';
import { JwtPayload } from './jwt.types';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản mới', description: 'Rate limit: 3 req/IP/phút' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập', description: 'Rate limit: 5 req/IP/phút' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Rate limit: 10 req/IP/phút' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Thông tin user hiện tại' })
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }
}

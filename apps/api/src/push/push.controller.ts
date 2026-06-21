import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.types';
import { PushService } from './push.service';

const RegisterPushTokenSchema = z.object({
  token: z.string().min(1).max(200),
});
class RegisterPushTokenDto extends createZodDto(RegisterPushTokenSchema) {}

@ApiTags('push')
@ApiBearerAuth('access-token')
@Controller('push')
export class PushController {
  constructor(private push: PushService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lưu Expo push token của user hiện tại' })
  registerToken(@CurrentUser() user: JwtPayload, @Body() dto: RegisterPushTokenDto) {
    return this.push.saveToken(user.sub, dto.token);
  }

  @Delete('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá push token (vd khi user tắt notification)' })
  clearToken(@CurrentUser() user: JwtPayload) {
    return this.push.clearToken(user.sub);
  }
}

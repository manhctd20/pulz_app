import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.types';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@ApiBearerAuth('access-token')
@Controller('groups/:id/leaderboard')
export class LeaderboardController {
  constructor(private leaderboard: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Bảng xếp hạng theo nhóm + period (today/week/all)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'all'],
    example: 'week',
  })
  forGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('period') period?: string,
  ) {
    return this.leaderboard.forGroup(user.sub, id, period);
  }
}

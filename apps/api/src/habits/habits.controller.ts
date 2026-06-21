import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.types';
import { CheckInDto, CreateHabitDto, UpdateHabitDto } from './dto';
import { HabitsService } from './habits.service';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@Controller('habits')
export class HabitsController {
  constructor(private habits: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'List habits của user (kèm streak + doneToday)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.habits.list(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo habit mới' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateHabitDto) {
    return this.habits.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa habit (chỉ owner habit)' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habits.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá habit (cascade check-ins)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.habits.remove(user.sub, id);
  }

  @Post(':id/checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle check-in hôm nay (idempotent theo ngày UTC) + note tuỳ chọn' })
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CheckInDto,
  ) {
    return this.habits.toggleCheckIn(user.sub, id, dto?.note);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Lịch sử check-in N ngày gần nhất + currentStreak / longestStreak / totalDone',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  history(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.habits.history(user.sub, id, days ?? 30);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.types';
import { CreateHabitDto } from '../habits/dto';
import { HabitsService } from '../habits/habits.service';
import { CreateGroupDto, JoinGroupDto, UpdateGroupDto } from './dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth('access-token')
@Controller('groups')
export class GroupsController {
  constructor(
    private groups: GroupsService,
    private habits: HabitsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List nhóm user thuộc (kèm aggregate today + avatars)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.groups.listForUser(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhóm mới với code 6 ký tự auto-gen' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.sub, dto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join nhóm bằng invite code' })
  join(@CurrentUser() user: JwtPayload, @Body() dto: JoinGroupDto) {
    return this.groups.join(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhóm: members + shared habits + stats' })
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.groups.detail(user.sub, id);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rời nhóm (owner không rời được, phải delete)' })
  leave(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.groups.leave(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá nhóm (chỉ owner)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.groups.remove(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Đổi tên nhóm (chỉ owner)' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groups.update(user.sub, id, dto);
  }

  @Post(':id/habits')
  @ApiOperation({ summary: 'Tạo habit chung cho cả nhóm (chỉ owner)' })
  createSharedHabit(
    @CurrentUser() user: JwtPayload,
    @Param('id') groupId: string,
    @Body() dto: CreateHabitDto,
  ) {
    return this.habits.createShared(user.sub, groupId, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kick member khỏi nhóm (chỉ owner, không kick chính mình)' })
  kickMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groups.kickMember(user.sub, groupId, targetUserId);
  }
}

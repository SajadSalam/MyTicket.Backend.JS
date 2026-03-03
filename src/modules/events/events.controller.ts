import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/users.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventsFilterDto } from './dtos/events-filter.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Event } from './events.entity';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @ApiOperation({ summary: 'List events (paginated)' })
  @ApiPaginatedResponse(Event)
  @Get()
  findAll(@Query() filter: EventsFilterDto) {
    return this.service.findAll(filter);
  }

  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({ status: 200, description: 'Event found', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.service.findOne(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  @ApiOperation({ summary: 'Create event (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created', type: Event })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateEventDto) {
    const event = await this.service.create(dto);
    return { event, message: 'Event created successfully' };
  }

  @ApiOperation({ summary: 'Update event (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    const existing = await this.service.findOne(id);
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    await this.service.update(id, dto);
    return { message: 'Event updated successfully' };
  }

  @ApiOperation({ summary: 'Delete event (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.service.delete(id);
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Event not found');
    }
    return { message: 'Event deleted successfully' };
  }
}

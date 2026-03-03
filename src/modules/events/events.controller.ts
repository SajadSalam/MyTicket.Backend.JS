import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
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
import { EventCategoryPricing } from './event-category-pricing.entity';
import { CreateCategoryPricingDto } from './dtos/create-category-pricing.dto';
import { UpdateCategoryPricingDto } from './dtos/update-category-pricing.dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventsFilterDto } from './dtos/events-filter.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Event } from './events.entity';
import { EventsService } from './events.service';

const ADMIN_GUARDS = [UseGuards(JwtAuthGuard, RolesGuard), Roles(UserRole.ADMIN)];

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  // ─── Events CRUD ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List events (paginated)' })
  @ApiPaginatedResponse(Event)
  @Get()
  findAll(@Query() filter: EventsFilterDto) {
    return this.service.findAll(filter);
  }

  @ApiOperation({ summary: 'Get event by id (includes category pricings)' })
  @ApiResponse({ status: 200, description: 'Event found', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.service.findOne(id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  @ApiOperation({ summary: 'Create event (Admin only) — status starts as DRAFT' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Event created', type: Event })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateEventDto) {
    const event = await this.service.create(dto);
    return { event, message: 'Event created successfully' };
  }

  @ApiOperation({ summary: 'Update event details (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    const existing = await this.service.findOne(id);
    if (!existing) throw new NotFoundException('Event not found');
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
    if ((result.affected ?? 0) === 0) throw new NotFoundException('Event not found');
    return { message: 'Event deleted successfully' };
  }

  // ─── Status transitions ───────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Publish event (Admin only)',
    description:
      'Moves event from DRAFT → PUBLISHED. Requires at least one category pricing to be set.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event published', type: Event })
  @ApiResponse({ status: 400, description: 'Validation error (already published, no pricings, etc.)' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    const event = await this.service.publish(id);
    return { event, message: 'Event published successfully' };
  }

  @ApiOperation({
    summary: 'Unpublish event — revert to DRAFT (Admin only)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event reverted to draft', type: Event })
  @ApiResponse({ status: 400, description: 'Already draft or cancelled' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    const event = await this.service.unpublish(id);
    return { event, message: 'Event reverted to draft' };
  }

  @ApiOperation({ summary: 'Cancel event (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Event cancelled', type: Event })
  @ApiResponse({ status: 400, description: 'Already cancelled' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    const event = await this.service.cancel(id);
    return { event, message: 'Event cancelled' };
  }

  // ─── Category Pricing ─────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'List category pricings for an event',
    description: 'Returns all category pricings configured for the event.',
  })
  @ApiResponse({ status: 200, type: [EventCategoryPricing] })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id/categories')
  listCategoryPricings(@Param('id') id: string) {
    return this.service.listCategoryPricings(id);
  }

  @ApiOperation({
    summary: 'Add category pricing to event (Admin only)',
    description:
      'Assigns a price to a Seatsio category on this event. Category key must exist in the event template.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, type: EventCategoryPricing })
  @ApiResponse({ status: 400, description: 'Category key not in template' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Pricing already exists for this category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/categories')
  createCategoryPricing(
    @Param('id') id: string,
    @Body() dto: CreateCategoryPricingDto,
  ) {
    return this.service.createCategoryPricing(id, dto);
  }

  @ApiOperation({ summary: 'Update a category pricing (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: EventCategoryPricing })
  @ApiResponse({ status: 404, description: 'Event or pricing not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/categories/:pricingId')
  updateCategoryPricing(
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
    @Body() dto: UpdateCategoryPricingDto,
  ) {
    return this.service.updateCategoryPricing(id, pricingId, dto);
  }

  @ApiOperation({ summary: 'Delete a category pricing (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Category pricing deleted' })
  @ApiResponse({ status: 404, description: 'Event or pricing not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id/categories/:pricingId')
  async deleteCategoryPricing(
    @Param('id') id: string,
    @Param('pricingId') pricingId: string,
  ) {
    await this.service.deleteCategoryPricing(id, pricingId);
    return { message: 'Category pricing deleted successfully' };
  }
}

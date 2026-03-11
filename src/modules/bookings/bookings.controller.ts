import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/users.entity';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { AdminBookingsFilterDto } from './dtos/admin-bookings-filter.dto';
import { BookingsFilterDto } from './dtos/bookings-filter.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── Public (Customer) Endpoints ────────────────────────────────────────────

  @ApiOperation({
    summary: 'Create a booking',
    description:
      'Validates event and seats, computes total from category pricings, creates booking and Amwal payment. Returns redirect URL for customer to complete payment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created, redirect URL returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Event not published, invalid seats, or no pricing',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Post()
  async create(@Body() dto: CreateBookingDto) {
    const result = await this.bookingsService.create(dto);
    return {
      bookingId: result.bookingId,
      redirectUrl: result.redirectUrl,
      message: 'Redirect the customer to redirectUrl to complete payment',
    };
  }

  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking with event and payment details',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.getByIdOrFail(id);
  }

  @ApiOperation({
    summary: 'List bookings by event or status (public)',
    description:
      'Basic public listing filtered by event and/or status. For full admin search, use GET /bookings with an admin token.',
  })
  @ApiPaginatedResponse(Booking)
  @Get('filter/public')
  async findPublic(@Query() filter: BookingsFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const { data, total } = await this.bookingsService.findAll({
      page,
      limit,
      eventId: filter.eventId,
      status: filter.status,
    });
    return createPaginatedResponse(data, total, page, limit);
  }

  // ─── Admin Endpoints ─────────────────────────────────────────────────────────

  @ApiOperation({
    summary: '[Admin] List all bookings (paginated)',
    description:
      'Returns a paginated list of bookings. Supports filtering by event, status, customer search (name/email/phone), and date range.',
  })
  @ApiBearerAuth()
  @ApiPaginatedResponse(Booking)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Query() filter: AdminBookingsFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const { data, total } = await this.bookingsService.findAllAdmin(filter);
    return createPaginatedResponse(data, total, page, limit);
  }

  @ApiOperation({
    summary: '[Admin] Get booking by ID (full details)',
    description:
      'Returns full booking details including event, template, and payment information.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/details')
  async findOneAdmin(@Param('id') id: string) {
    return this.bookingsService.getByIdOrFail(id);
  }

  @ApiOperation({
    summary: '[Admin] Cancel a booking',
    description:
      'Cancels a pending or confirmed booking. Releases held/booked seats in Seatsio and marks the associated payment as cancelled.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Booking cancelled', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Booking is already cancelled or failed',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }

  @ApiOperation({
    summary: '[Admin] Manually confirm a booking',
    description:
      'Manually confirms a pending booking — useful when the Amwal payment webhook was not received. Books the seats in Seatsio and marks the payment as paid.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Booking confirmed', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Booking is already confirmed, cancelled, or failed',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.bookingsService.confirmBooking(id);
  }
}

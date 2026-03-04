import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsFilterDto } from './dtos/bookings-filter.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

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

  @ApiOperation({ summary: 'List bookings (paginated)' })
  @ApiPaginatedResponse(Booking)
  @Get()
  async findAll(@Query() filter: BookingsFilterDto) {
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

  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking with event and payment',
    type: Booking,
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.getByIdOrFail(id);
  }
}

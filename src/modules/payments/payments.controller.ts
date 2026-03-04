import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/users.entity';
import { AmwalCallbackDto } from './dtos/amwal-callback.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'Amwal payment callback (webhook)',
    description:
      'Server-to-server callback from PayTabs/Amwal. Do not require auth.',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @Post('callback')
  async callback(@Body() dto: AmwalCallbackDto) {
    await this.paymentsService.handleCallback(dto);
    return { received: true };
  }

  @ApiOperation({
    summary: 'Get payment status by transaction reference (Admin)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Payment status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':tranRef/status')
  async getStatus(@Param('tranRef') tranRef: string) {
    return this.paymentsService.getStatusByTranRef(tranRef);
  }
}

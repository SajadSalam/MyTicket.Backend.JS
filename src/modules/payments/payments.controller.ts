import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AmwalCallbackDto } from './dtos/amwal-callback.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'Amwal payment callback (webhook)',
    description:
      'Server-to-server JSON POST from PayTabs/Amwal. No auth required.',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  // Override the global ValidationPipe: forbidNonWhitelisted:false so unexpected
  // Amwal fields (threeDSDetails, paymentChannel, etc.) don't cause a 400.
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  )
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
  @Get(':tranRef/status')
  async getStatus(@Param('tranRef') tranRef: string) {
    return this.paymentsService.getStatusByTranRef(tranRef);
  }
}

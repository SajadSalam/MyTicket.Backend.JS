import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AmwalCustomerDetailsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zip?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ip?: string;
}

export class AmwalShippingDetailsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zip?: string;
}

export class AmwalPaymentResultDto {
  /**
   * Response status: A = Approved, H = Hold, P = Pending, V = Voided,
   * E = Error, D = Declined
   */
  @ApiProperty() @IsString() response_status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() response_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() response_message?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() acquirer_ref?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cvv_result?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avs_result?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() transaction_time?: string;
}

export class AmwalPaymentInfoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() payment_method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() card_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() card_scheme?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() payment_description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expiryMonth?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expiryYear?: number;
}

export class AmwalCallbackDto {
  @ApiProperty({ description: 'PayTabs transaction reference' })
  @IsString()
  tran_ref: string;

  @ApiProperty({ description: 'Cart ID — equals our bookingId' })
  @IsString()
  cart_id: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() merchant_id?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() profile_id?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() cart_description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cart_currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cart_amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tran_currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tran_total?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tran_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tran_class?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ipn_trace?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentChannel?: string;

  @ApiPropertyOptional({ type: AmwalCustomerDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AmwalCustomerDetailsDto)
  customer_details?: AmwalCustomerDetailsDto;

  @ApiPropertyOptional({ type: AmwalShippingDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AmwalShippingDetailsDto)
  shipping_details?: AmwalShippingDetailsDto;

  @ApiProperty({ type: AmwalPaymentResultDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AmwalPaymentResultDto)
  payment_result: AmwalPaymentResultDto;

  @ApiPropertyOptional({ type: AmwalPaymentInfoDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AmwalPaymentInfoDto)
  payment_info?: AmwalPaymentInfoDto;

  @ApiPropertyOptional({ description: '3DS details' })
  @IsOptional()
  @IsObject()
  threeDSDetails?: Record<string, unknown>;
}

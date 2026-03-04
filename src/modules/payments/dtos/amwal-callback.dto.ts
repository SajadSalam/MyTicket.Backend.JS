import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class AmwalCustomerDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;
}

export class AmwalPaymentResultDto {
  /** A = Approved, H = Hold, P = Pending, V = Voided, E = Error, D = Declined */
  @ApiProperty()
  @IsString()
  response_status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  response_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  response_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acquirer_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acquirer_rrn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  transaction_time?: string;
}

export class AmwalPaymentInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  card_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  card_scheme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_description?: string;
}

export class AmwalCallbackDto {
  @ApiProperty()
  @IsString()
  tran_ref: string;

  @ApiProperty()
  @IsString()
  cart_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cart_description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cart_currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cart_amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customer_details?: AmwalCustomerDetailsDto;

  @ApiProperty()
  @IsObject()
  payment_result: AmwalPaymentResultDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payment_info?: AmwalPaymentInfoDto;
}

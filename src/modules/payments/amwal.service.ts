import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  AmwalCreateOrderRequest,
  AmwalCreateOrderResponse,
  AmwalQueryRequest,
  AmwalQueryResponse,
} from './interfaces/amwal-api.interface';
import { PaymentStatus } from './payment.entity';

export interface CreateOrderResult {
  tranRef: string;
  redirectUrl: string;
  cartId: string;
  trace?: string;
  merchantId?: number;
}

export interface QueryStatusResult {
  status: PaymentStatus;
  amount: number;
  transactionTime?: string;
}

@Injectable()
export class AmwalService {
  private readonly logger = new Logger(AmwalService.name);
  private readonly baseUrl: string;
  private readonly serverKey: string;
  private readonly profileId: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('AMWAL_BASE_URL') ??
      'https://secure-iraq.paytabs.com';
    this.serverKey = this.config.getOrThrow<string>('AMWAL_SERVER_KEY');
    const pid = this.config.getOrThrow<string>('AMWAL_PROFILE_ID');
    this.profileId = parseInt(pid, 10);
    if (Number.isNaN(this.profileId)) {
      throw new Error('AMWAL_PROFILE_ID must be a number');
    }
  }

  async createOrder(
    cartId: string,
    amount: number,
    cartDescription: string,
    callbackUrl: string,
    returnUrl: string,
  ): Promise<CreateOrderResult> {
    const url = `${this.baseUrl}/payment/request`;
    const body: AmwalCreateOrderRequest = {
      profile_id: this.profileId,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: cartId,
      cart_description: cartDescription,
      cart_currency: 'IQD',
      cart_amount: amount,
      callback: callbackUrl,
      return: returnUrl,
    };

    this.logger.log(
      `Creating Amwal payment for cart ${cartId}, amount ${amount} IQD`,
    );

    const response = await firstValueFrom(
      this.httpService.post<AmwalCreateOrderResponse>(url, body, {
        headers: {
          authorization: this.serverKey,
          'Content-Type': 'application/json',
        },
      }),
    ).catch((err) => {
      const message =
        err.response?.data != null
          ? JSON.stringify(err.response.data)
          : err.message;
      this.logger.error(`Amwal create order failed: ${message}`);
      throw err;
    });

    const data = response.data;
    if (!data?.tran_ref || !data?.redirect_url) {
      throw new Error(
        `Amwal invalid response: missing tran_ref or redirect_url`,
      );
    }

    this.logger.log(`Amwal payment created. TranRef: ${data.tran_ref}`);

    return {
      tranRef: data.tran_ref,
      redirectUrl: data.redirect_url,
      cartId: data.cart_id ?? cartId,
      trace: data.trace,
      merchantId: data.merchantId,
    };
  }

  async queryStatus(tranRef: string): Promise<QueryStatusResult> {
    const url = `${this.baseUrl}/payment/query`;
    const body: AmwalQueryRequest = {
      profile_id: this.profileId,
      tran_ref: tranRef,
    };

    this.logger.log(`Querying Amwal payment status for TranRef: ${tranRef}`);

    const response = await firstValueFrom(
      this.httpService.post<AmwalQueryResponse>(url, body, {
        headers: {
          authorization: this.serverKey,
          'Content-Type': 'application/json',
        },
      }),
    ).catch((err) => {
      const message =
        err.response?.data != null
          ? JSON.stringify(err.response.data)
          : err.message;
      this.logger.error(`Amwal query failed: ${message}`);
      throw err;
    });

    const data = response.data;
    const status = this.parseResponseStatus(
      data?.payment_result?.response_status,
    );
    const amount = parseFloat(data?.cart_amount ?? '0') || 0;
    const transactionTime = data?.payment_result?.transaction_time;

    return {
      status,
      amount,
      transactionTime,
    };
  }

  /** Map Amwal response_status to our PaymentStatus */
  parseResponseStatus(responseStatus: string | undefined): PaymentStatus {
    switch (responseStatus?.toUpperCase()) {
      case 'A':
        return PaymentStatus.PAID;
      case 'H':
      case 'P':
        return PaymentStatus.PENDING;
      case 'V':
        return PaymentStatus.CANCELLED;
      case 'E':
      case 'D':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}

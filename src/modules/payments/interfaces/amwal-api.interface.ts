/** Request body for POST {baseUrl}/payment/request */
export interface AmwalCreateOrderRequest {
  profile_id: number;
  tran_type: string;
  tran_class: string;
  cart_id: string;
  cart_description: string;
  cart_currency: string;
  cart_amount: number;
  callback: string;
  return: string;
}

/** Response from POST {baseUrl}/payment/request */
export interface AmwalCreateOrderResponse {
  tran_ref: string;
  tran_type?: string;
  cart_id?: string;
  cart_description?: string;
  cart_currency?: string;
  cart_amount?: string;
  tran_total?: string;
  callback?: string;
  return?: string;
  redirect_url: string;
  serviceId?: number;
  paymentChannel?: string;
  profileId?: number;
  merchantId?: number;
  trace?: string;
}

/** Request body for POST {baseUrl}/payment/query */
export interface AmwalQueryRequest {
  profile_id: number;
  tran_ref: string;
}

/** Response from POST {baseUrl}/payment/query */
export interface AmwalQueryResponse {
  tran_ref?: string;
  cart_id?: string;
  cart_description?: string;
  cart_currency?: string;
  cart_amount?: string;
  customer_details?: Record<string, unknown>;
  payment_result?: {
    response_status: string;
    response_code?: string;
    response_message?: string;
    acquirer_message?: string;
    acquirer_rrn?: string;
    transaction_time?: string;
  };
  payment_info?: Record<string, unknown>;
}

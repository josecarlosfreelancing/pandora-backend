import { Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from './auth/decorators/public.decorator';
import { StripePaymentService } from './payment/stripe-payment.service';

// https://wanago.io/2021/07/05/api-nestjs-stripe-events-webhooks/

interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

@Controller('webhook')
export class WebhookController {
  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Public()
  @Post()
  async handleIncomingEvents(
    @Headers('stripe-signature') stripeSignature: string,
    @Req() request: RequestWithRawBody,
  ): Promise<void> {
    if (stripeSignature) {
      return await this.stripePaymentService.handleStripeWebhookEvent(
        stripeSignature,
        request.rawBody,
      );
    } else {
      // Otherwise do nothing.
    }
  }
}

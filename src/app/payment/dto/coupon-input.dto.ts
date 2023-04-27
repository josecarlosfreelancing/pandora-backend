import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CouponInputArg {
  @Field()
  paymentMethodId: string;

  @Field({ nullable: true })
  coupon?: string;
}

import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CouponOutputDto {
  @Field()
  newPrice: number;
}

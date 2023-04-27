import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../../helpers/default-schema-option.tools';
import { DefaultModel } from '../../helpers/default.model';
import { UserId } from '../../user/model/user.model';
import { TransactionRefund } from './transaction-refund.model';

export type TransactionId = string;
export type StripeSessionId = string;
export type StripePaymentIntentId = string;
export type StripeSubscriptionId = string;

// todo how to handle end of subscription
@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Transaction extends DefaultModel {
  @Prop({ required: true })
  @Field(() => Int)
  price: number;

  @Prop({ required: true })
  @Field()
  stripePriceId: string;

  @Prop()
  @Field(() => String, { nullable: true })
  couponUsed?: string;

  @Prop()
  @Field({ nullable: true })
  stripeSubscriptionId?: StripeSubscriptionId;

  @Prop()
  @Field({ nullable: true })
  refund?: TransactionRefund;

  @Prop({ required: true })
  @Field()
  buyerId: UserId;
}

@InputType()
export class TransactionInput extends Transaction {}

export type TransactionCreatePayload = Omit<Transaction, 'createdAt' | 'updatedAt' | '_id'> & {
  _id?: TransactionId;
};

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

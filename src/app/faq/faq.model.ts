import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class FAQ extends DefaultModel {
  @Prop({ required: true })
  @Field(() => String)
  question: string;

  @Prop({ required: true })
  @Field(() => String)
  answer: string;
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);

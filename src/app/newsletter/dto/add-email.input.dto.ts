import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@ArgsType()
export class AddEmailNewsletterArg {
  @IsEmail()
  @Field()
  email: string;
}

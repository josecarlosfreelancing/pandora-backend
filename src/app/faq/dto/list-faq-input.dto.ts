import { ArgsType, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';

export enum ListFaqInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(ListFaqInputSortFields, {
  name: 'ListFaqInputSortFields',
});

@ArgsType()
@InputType()
export class ListFaqQueryArgs extends createPaginationArgs(ListFaqInputSortFields) {}

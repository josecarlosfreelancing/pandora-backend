import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { graphqlToMongoPagination } from '../helpers/pagination/pagination-args.graphql';
import { AppLogger } from '../logging/logging.service';
import { Category } from './category.model';
import { CategoryService } from './category.service';
import { ListCategoriesQueryArgs } from './dto/list-categories-input.dto';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private logger: AppLogger, private categoryService: CategoryService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [Category])
  async categories(
    @Args() { filter, ...pagination }: ListCategoriesQueryArgs,
  ): Promise<Category[]> {
    this.logger.verbose('categories');
    return await this.categoryService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
  }
}

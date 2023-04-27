import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { AnalyticService } from '../analytic/analytic.service';
import { ListEventsPossible } from '../analytic/types';
import { CategoryId } from '../category/category.model';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { UserId } from '../user/model/user.model';
import { DealType } from './deal-type';
import { Deal, DealId } from './deal.model';
import { CreateDealInputDto } from './dto/create-deal-input.dto';

export class DealService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Deal.name) private model: Model<Deal>,
    private readonly analyticService: AnalyticService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async getById(id: DealId): Promise<Deal | null> {
    return await this.model.findOne({ _id: id }).lean().exec();
  }

  async getByIdOrThrow(id: DealId): Promise<Deal> {
    const doc = await this.getById(id);
    if (!doc) {
      throw Error(`DealId not found with id ${id}`);
    }
    return doc;
  }

  async create(form: CreateDealInputDto, type: DealType): Promise<Deal> {
    return (await this.model.create({ ...form, type })).toObject();
  }

  async getMany(
    filter?: DealFilter,
    pagination?: MongoPagination<Deal>,
    currentUserId?: UserId,
  ): Promise<Deal[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<Deal>(query, pagination).lean().exec();
    for (const dealId in filter?.ids) {
      await this.analyticService.create(
        {
          key: ListEventsPossible.DealPageShown,
          dealId,
        },
        currentUserId,
      );
    }
    return docs;
  }

  async exists(dealIds: DealId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: dealIds } });
    return result === dealIds.length;
  }

  createDataloaderById(): DataLoader<DealId, Deal> {
    return new DataLoader<DealId, Deal>(async (dealIds: DealId[]) => {
      const deals = await this.getMany({ ids: dealIds });
      const dealsById = keyBy(deals, (g) => g._id);
      return assertAllExisting(
        Deal.name,
        dealIds,
        dealIds.map((dealId) => dealsById[dealId]),
      );
    });
  }

  async increaseRedeemAmunt(dealId: DealId): Promise<void> {
    await this.model.findOneAndUpdate({ _id: dealId }, { $inc: { redeemedAmount: 1 } }).exec();
  }

  async validateIdsExist(dealIds: DealId[]): Promise<DealId[]> {
    const deals = await this.getMany({ ids: dealIds });
    const dealPerId = keyBy(deals, (g) => g._id);
    const missing = dealIds.filter((id) => !dealPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `Deal with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return dealIds;
  }
}

export interface DealFilter {
  ids?: DealId[];
  categoriesIds?: CategoryId[];
  keyword?: string;
}

const filterToMongoFilter = (filter: DealFilter): FilterQuery<Deal> => {
  const { ids, categoriesIds, keyword } = filter;
  const query: FilterQuery<Deal> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { companyDesc: { $regex: keyword, $options: 'i' } },
      { companyName: { $regex: keyword, $options: 'i' } },
    ];
  }
  if (categoriesIds) {
    query.categoriesIds = { $in: categoriesIds };
  }
  return query;
};

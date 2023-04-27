import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { FAQ } from './faq.model';

export class FaqService {
  constructor(private logger: AppLogger, @InjectModel(FAQ.name) private model: Model<FAQ>) {
    this.logger.setContext(this.constructor.name);
  }

  async create(question: string, answer: string): Promise<FAQ> {
    return (await this.model.create({ question, answer })).toObject();
  }

  async getMany(pagination?: MongoPagination<FAQ>): Promise<FAQ[]> {
    this.logger.verbose('getMany');
    const mongoFilter: FilterQuery<FAQ> = {};
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<FAQ>(query, pagination).lean().exec();
    return docs;
  }
}

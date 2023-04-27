import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from '../logging/logging.service';
import { Newsletter } from './newsletter.model';

export class NewsletterService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Newsletter.name) private model: Model<Newsletter>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(email: string): Promise<Newsletter> {
    return (await this.model.create({ email })).toObject();
  }
}

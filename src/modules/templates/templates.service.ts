import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  createPaginatedResponse,
} from '../../common/dto';
import { SeatioService } from '../seatio/seatio.service';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { TemplateDto } from './dtos/template-dto';
import { TemplatesFilterDto } from './dtos/templates-filter.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { Template, TemplateCategory } from './templates.entity';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private readonly repo: Repository<Template>,
    private readonly seatioService: SeatioService,
  ) {}

  async create(dto: CreateTemplateDto): Promise<Template> {
    const categories: TemplateCategory[] = dto.categories.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      accessible: c.accessible ?? false,
    }));

    let seatioChartKey: string;
    try {
      const chart = await this.seatioService.createChart(dto.name, categories);
      seatioChartKey = chart.key;
      this.logger.log(
        `Seatsio chart created [key: ${seatioChartKey}] for template "${dto.name}"`,
      );
    } catch (err) {
      this.logger.error('Failed to create Seatsio chart', err);
      throw new InternalServerErrorException(
        'Could not create the seating chart in Seatsio. Please try again.',
      );
    }

    const template = this.repo.create({
      name: dto.name,
      notes: dto.notes ?? null,
      categories,
      seatioChartKey,
    });

    return this.repo.save(template);
  }

  async findAll(
    filter: TemplatesFilterDto,
  ): Promise<PaginatedResponseDto<TemplateDto>> {
    const qb = this.repo
      .createQueryBuilder('template')
      .orderBy('template.createdAt', 'DESC')
      .skip(filter.offset)
      .take(filter.limit ?? 10);

    if (filter.search?.trim()) {
      qb.andWhere('template.name ILIKE :search', {
        search: `%${filter.search.trim()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    const seatioCharts = await Promise.all(
      data.map(async (template) => {
        const seatioChart = await this.seatioService.retrieveChart(
          template.seatioChartKey,
        );
        return new TemplateDto(template, seatioChart);
      }),
    );

    return createPaginatedResponse(
      seatioCharts,
      total,
      filter.page ?? 1,
      filter.limit ?? 10,
    );
  }

  async findOne(id: string): Promise<TemplateDto | null> {
    const template = await this.repo.findOneBy({ id });
    if (!template) return null;
    const seatioChart = await this.seatioService.retrieveChart(
      template.seatioChartKey,
    );
    return new TemplateDto(template, seatioChart);
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<void> {
    const update: Partial<Template> = {};

    if (dto.name !== undefined) update.name = dto.name;
    if (dto.notes !== undefined) update.notes = dto.notes;
    if (
      dto.categories !== undefined &&
      dto.categories !== null &&
      dto.categories.length > 0
    ) {
      update.categories = dto.categories.map((c) => ({
        key: c.key as string | number,
        label: c.label as string,
        color: c.color as string,
        accessible: c.accessible ?? false,
      }));
    }

    await this.repo.update(id, update);
  }

  delete(id: string): Promise<DeleteResult> {
    return this.repo.delete(id);
  }
}

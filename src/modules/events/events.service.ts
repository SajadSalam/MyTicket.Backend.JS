import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  createPaginatedResponse,
} from '../../common/dto';
import { SeatioService } from '../seatio/seatio.service';
import { TemplatesService } from '../templates/templates.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventsFilterDto } from './dtos/events-filter.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Event } from './events.entity';

interface SeatsioErrorResponse {
  status: number;
  messages: string[];
}

function isSeatsioError(err: unknown): err is SeatsioErrorResponse {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'messages' in err &&
    Array.isArray((err as SeatsioErrorResponse).messages)
  );
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
    private readonly templatesService: TemplatesService,
    private readonly seatioService: SeatioService,
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    const template = await this.templatesService.findOne(dto.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with id "${dto.templateId}" not found`,
      );
    }

    let seatioEventKey: string;
    try {
      const seatioEvent = await this.seatioService.createEvent(
        template.seatioChartKey,
      );
      seatioEventKey = seatioEvent.key;
      this.logger.log(
        `Seatsio event created [key: ${seatioEventKey}] for chart [${template.seatioChartKey}]`,
      );
    } catch (err: unknown) {
      if (isSeatsioError(err) && err.status === 400 && err.messages.length) {
        throw new BadRequestException(err.messages);
      }
      this.logger.error('Failed to create Seatsio event', err);
      throw new InternalServerErrorException(
        'Could not create the seating event in Seatsio. Please try again.',
      );
    }

    const event = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      content: dto.content ?? null,
      mainImage: dto.mainImage ?? null,
      images: dto.images ?? [],
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      bookingStartDate: new Date(dto.bookingStartDate),
      bookingEndDate: new Date(dto.bookingEndDate),
      tags: dto.tags ?? [],
      location: dto.location ?? null,
      lat: dto.lat != null ? String(dto.lat) : null,
      lng: dto.lng != null ? String(dto.lng) : null,
      templateId: template.id,
      seatioEventKey,
    });

    return this.repo.save(event);
  }

  async findAll(filter: EventsFilterDto): Promise<PaginatedResponseDto<Event>> {
    const qb = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.template', 'template')
      .orderBy('event.startDate', 'DESC')
      .skip(filter.offset)
      .take(filter.limit ?? 10);

    if (filter.search?.trim()) {
      qb.andWhere('event.name ILIKE :search', {
        search: `%${filter.search.trim()}%`,
      });
    }

    if (filter.tags?.trim()) {
      const tagList = filter.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        tagList.forEach((tag, i) => {
          qb.andWhere(`event.tags LIKE :tag${i}`, {
            [`tag${i}`]: `%${tag}%`,
          });
        });
      }
    }

    const [data, total] = await qb.getManyAndCount();
    return createPaginatedResponse(
      data,
      total,
      filter.page ?? 1,
      filter.limit ?? 10,
    );
  }

  findOne(id: string): Promise<Event | null> {
    return this.repo.findOne({ where: { id }, relations: ['template'] });
  }

  async update(id: string, dto: UpdateEventDto): Promise<void> {
    const update: Partial<Event> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.content !== undefined) update.content = dto.content;
    if (dto.mainImage !== undefined) update.mainImage = dto.mainImage;
    if (dto.images !== undefined) update.images = dto.images;
    if (dto.startDate !== undefined) update.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) update.endDate = new Date(dto.endDate);
    if (dto.bookingStartDate !== undefined)
      update.bookingStartDate = new Date(dto.bookingStartDate);
    if (dto.bookingEndDate !== undefined)
      update.bookingEndDate = new Date(dto.bookingEndDate);
    if (dto.tags !== undefined) update.tags = dto.tags;
    if (dto.location !== undefined) update.location = dto.location;
    if (dto.lat !== undefined) update.lat = String(dto.lat);
    if (dto.lng !== undefined) update.lng = String(dto.lng);
    await this.repo.update(id, update);
  }

  delete(id: string): Promise<DeleteResult> {
    return this.repo.delete(id);
  }
}

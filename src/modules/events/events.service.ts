import {
  BadRequestException,
  ConflictException,
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
import { EventCategoryPricing } from './event-category-pricing.entity';
import { CreateCategoryPricingDto } from './dtos/create-category-pricing.dto';
import { UpdateCategoryPricingDto } from './dtos/update-category-pricing.dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventsFilterDto } from './dtos/events-filter.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Event, EventStatus } from './events.entity';

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
    @InjectRepository(EventCategoryPricing)
    private readonly pricingRepo: Repository<EventCategoryPricing>,
    private readonly templatesService: TemplatesService,
    private readonly seatioService: SeatioService,
  ) {}

  // ─── Events ───────────────────────────────────────────────────────────────

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
      status: EventStatus.DRAFT,
    });

    return this.repo.save(event);
  }

  async findAll(filter: EventsFilterDto): Promise<PaginatedResponseDto<Event>> {
    const qb = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.template', 'template')
      .leftJoinAndSelect('event.categoryPricings', 'categoryPricings')
      .orderBy('event.startDate', 'DESC')
      .skip(filter.offset)
      .take(filter.limit ?? 10);

    if (filter.search?.trim()) {
      qb.andWhere('event.name ILIKE :search', {
        search: `%${filter.search.trim()}%`,
      });
    }

    if (filter.status) {
      qb.andWhere('event.status = :status', { status: filter.status });
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
    return this.repo.findOne({
      where: { id },
      relations: ['template', 'categoryPricings'],
    });
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

  // ─── Publish / Unpublish ──────────────────────────────────────────────────

  async publish(id: string): Promise<Event> {
    const event = await this.findOne(id);
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === EventStatus.PUBLISHED) {
      throw new BadRequestException('Event is already published');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cancelled events cannot be published');
    }

    const pricings = await this.pricingRepo.find({ where: { eventId: id } });
    if (pricings.length === 0) {
      throw new BadRequestException(
        'Cannot publish event without at least one category pricing. Please add category pricing first.',
      );
    }

    await this.repo.update(id, { status: EventStatus.PUBLISHED });
    return (await this.findOne(id))!;
  }

  async unpublish(id: string): Promise<Event> {
    const event = await this.findOne(id);
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === EventStatus.DRAFT) {
      throw new BadRequestException('Event is already in draft state');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cancelled events cannot be changed to draft');
    }

    await this.repo.update(id, { status: EventStatus.DRAFT });
    return (await this.findOne(id))!;
  }

  async cancel(id: string): Promise<Event> {
    const event = await this.findOne(id);
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is already cancelled');
    }

    await this.repo.update(id, { status: EventStatus.CANCELLED });
    return (await this.findOne(id))!;
  }

  // ─── Category Pricing ─────────────────────────────────────────────────────

  async listCategoryPricings(eventId: string): Promise<EventCategoryPricing[]> {
    await this.getEventOrFail(eventId);
    return this.pricingRepo.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  async createCategoryPricing(
    eventId: string,
    dto: CreateCategoryPricingDto,
  ): Promise<EventCategoryPricing> {
    const event = await this.getEventOrFail(eventId);

    const categoryExists = event.template?.categories?.some(
      (c) => String(c.key) === String(dto.categoryKey),
    );
    if (!categoryExists) {
      throw new BadRequestException(
        `Category key "${dto.categoryKey}" does not exist in the event template`,
      );
    }

    const existing = await this.pricingRepo.findOne({
      where: { eventId, categoryKey: dto.categoryKey },
    });
    if (existing) {
      throw new ConflictException(
        `Pricing for category "${dto.categoryKey}" already exists. Use PUT to update it.`,
      );
    }

    const pricing = this.pricingRepo.create({
      eventId,
      categoryKey: dto.categoryKey,
      categoryLabel: dto.categoryLabel,
      price: String(dto.price),
      currency: dto.currency ?? 'IQD',
      description: dto.description ?? null,
    });

    return this.pricingRepo.save(pricing);
  }

  async updateCategoryPricing(
    eventId: string,
    pricingId: string,
    dto: UpdateCategoryPricingDto,
  ): Promise<EventCategoryPricing> {
    await this.getEventOrFail(eventId);

    const pricing = await this.pricingRepo.findOne({
      where: { id: pricingId, eventId },
    });
    if (!pricing) throw new NotFoundException('Category pricing not found');

    if (dto.categoryLabel !== undefined) pricing.categoryLabel = dto.categoryLabel;
    if (dto.price !== undefined) pricing.price = String(dto.price);
    if (dto.currency !== undefined) pricing.currency = dto.currency;
    if (dto.description !== undefined) pricing.description = dto.description;

    return this.pricingRepo.save(pricing);
  }

  async deleteCategoryPricing(
    eventId: string,
    pricingId: string,
  ): Promise<void> {
    await this.getEventOrFail(eventId);

    const result = await this.pricingRepo.delete({ id: pricingId, eventId });
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Category pricing not found');
    }
  }

  private async getEventOrFail(id: string): Promise<Event> {
    const event = await this.findOne(id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
}

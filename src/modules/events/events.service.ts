import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  createPaginatedResponse,
} from '../../common/dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventsFilterDto } from './dtos/events-filter.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { Event } from './events.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
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
    });
    return this.repo.save(event);
  }

  async findAll(filter: EventsFilterDto): Promise<PaginatedResponseDto<Event>> {
    const qb = this.repo
      .createQueryBuilder('event')
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
    return this.repo.findOneBy({ id });
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

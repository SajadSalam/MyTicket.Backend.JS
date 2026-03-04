import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChangeObjectStatusResult,
  Chart,
  ChartListParams,
  CreateEventParams,
  Dict,
  Event,
  EventObjectInfo,
  Lister,
  Page,
  Region,
  SeatsioClient,
  StatusChange,
  StatusChangeJson,
} from 'seatsio';
import { ObjectOrObjects } from 'seatsio/dist/src/Events/Events';

export interface ChartCategory {
  /** Unique identifier used by Seatsio. Can be a number (e.g. 1) or a string (e.g. 'VIP'). */
  key: string | number;
  /** Human-readable label shown in the chart legend. */
  label: string;
  /** Hex color for seats in this category (e.g. '#FF5733'). */
  color: string;
  /** Whether seats in this category are wheelchair accessible. Defaults to false. */
  accessible?: boolean;
}

export interface EventCreationOptions {
  /** Optional custom key for the event. Auto-generated if omitted. */
  key?: string;
  /** Optional human-readable name for the event. */
  name?: string;
}

export interface CreateChartAndEventResult {
  chart: Chart;
  event: Event;
}

@Injectable()
export class SeatioService implements OnModuleInit {
  private readonly logger = new Logger(SeatioService.name);
  private client: SeatsioClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.getOrThrow<string>('SEATSIO_SECRET_KEY');
    const regionStr = this.config.get<string>('SEATSIO_REGION', 'EU');
    const region = this.resolveRegion(regionStr);

    this.client = new SeatsioClient(region, secretKey);
    this.logger.log(
      `Seatsio client initialized [region: ${regionStr.toUpperCase()}]`,
    );
  }

  private resolveRegion(region: string): Region {
    switch (region.toUpperCase()) {
      case 'NA':
        return Region.NA();
      case 'SA':
        return Region.SA();
      case 'OC':
        return Region.OC();
      default:
        return Region.EU();
    }
  }

  private buildEventParams(options: EventCreationOptions): CreateEventParams {
    const params = new CreateEventParams();
    if (options.key) params.withKey(options.key);
    if (options.name) params.withName(options.name);
    return params;
  }

  // ─── Charts ──────────────────────────────────────────────────────────────

  /**
   * Create a new seating chart.
   * Optionally supply a name and an initial set of categories to seed the chart legend.
   */
  createChart(name?: string, categories?: ChartCategory[]): Promise<Chart> {
    const seatsioCategories =
      categories?.map((c) => ({
        key: c.key,
        label: c.label,
        color: c.color,
        accessible: c.accessible ?? false,
      })) ?? null;
    return this.client.charts.create(name ?? null, null, seatsioCategories);
  }

  /** Retrieve a chart by its key. */
  retrieveChart(chartKey: string): Promise<Chart> {
    return this.client.charts.retrieve(chartKey);
  }

  /** Retrieve a chart together with all its associated events. */
  retrieveChartWithEvents(chartKey: string): Promise<Chart> {
    return this.client.charts.retrieveWithEvents(chartKey);
  }

  /** List all charts as an async iterator. Use in a `for await` loop. */
  listAllCharts(
    params?: ChartListParams,
  ): ReturnType<typeof this.client.charts.listAll> {
    return this.client.charts.listAll(params ?? null);
  }

  /** Retrieve the first page of charts. */
  listChartsFirstPage(pageSize?: number): Promise<Page<Chart>> {
    return this.client.charts.listFirstPage(null, pageSize ?? null);
  }

  /** Retrieve the chart page that starts after the given chart ID. */
  listChartsPageAfter(
    afterId: number,
    pageSize?: number,
  ): Promise<Page<Chart>> {
    return this.client.charts.listPageAfter(afterId, null, pageSize ?? null);
  }

  /** List all category definitions attached to a chart. */
  listCategories(chartKey: string): Promise<any> {
    return this.client.charts.listCategories(chartKey);
  }

  // ─── Events ──────────────────────────────────────────────────────────────

  /** Create a single seating event for a chart. */
  createEvent(
    chartKey: string,
    options: EventCreationOptions = {},
  ): Promise<Event> {
    const params = this.buildEventParams(options);
    return this.client.events.create(chartKey, params);
  }

  /**
   * Create multiple seating events for a chart in a single API call.
   * Pass an array of options (one per event); omit `key` to auto-generate.
   */
  createMultipleEvents(
    chartKey: string,
    options: EventCreationOptions[],
  ): Promise<Event[]> {
    const params = options.map((opt) => this.buildEventParams(opt));
    return this.client.events.createMultiple(chartKey, params);
  }

  /** Retrieve a single event by its key. */
  retrieveEvent(eventKey: string): Promise<Event> {
    return this.client.events.retrieve(eventKey);
  }

  /** List all events as an async iterator. Use in a `for await` loop. */
  listAllEvents(): ReturnType<typeof this.client.events.listAll> {
    return this.client.events.listAll();
  }

  /** Retrieve the first page of events. */
  listEventsFirstPage(pageSize?: number): Promise<Page<Event>> {
    return this.client.events.listFirstPage(pageSize ?? null);
  }

  /** Retrieve the event page that starts after the given event ID. */
  listEventsPageAfter(
    afterId: number,
    pageSize?: number,
  ): Promise<Page<Event>> {
    return this.client.events.listPageAfter(afterId, pageSize ?? null);
  }

  // ─── Convenience ─────────────────────────────────────────────────────────

  /**
   * Create a chart and immediately create one event for it.
   * This is the most common setup pattern for a new ticketed event.
   */
  async createChartAndEvent(
    chartName?: string,
    eventOptions: EventCreationOptions = {},
    categories?: ChartCategory[],
  ): Promise<CreateChartAndEventResult> {
    const chart = await this.createChart(chartName, categories);
    const event = await this.createEvent(chart.key, eventOptions);
    this.logger.debug(`Created chart [${chart.key}] and event [${event.key}]`);
    return { chart, event };
  }

  // ─── Booking ─────────────────────────────────────────────────────────────

  /**
   * Book one or more seat objects on an event.
   * Booked seats become non-selectable on the rendered chart.
   * Optionally pass a `holdToken` to confirm a previously held selection.
   */
  bookObjects(
    eventKey: string,
    objects: ObjectOrObjects,
    holdToken?: string,
    orderId?: string,
  ): Promise<ChangeObjectStatusResult> {
    return this.client.events.book(
      eventKey,
      objects,
      holdToken ?? null,
      orderId ?? null,
    );
  }

  /**
   * Release one or more seat objects on an event back to `free`.
   * Free seats become selectable again on the rendered chart.
   */
  releaseObjects(
    eventKey: string,
    objects: ObjectOrObjects,
    holdToken?: string,
  ): Promise<ChangeObjectStatusResult> {
    return this.client.events.release(eventKey, objects, holdToken ?? null);
  }

  /**
   * Place one or more seat objects on hold using a hold token.
   * Held seats are temporarily locked for a specific buyer session.
   */
  holdObjects(
    eventKey: string,
    objects: ObjectOrObjects,
    holdToken: string,
  ): Promise<ChangeObjectStatusResult> {
    return this.client.events.hold(eventKey, objects, holdToken);
  }

  /**
   * Set a custom status on one or more seat objects.
   * Use this when you need statuses beyond the built-in `booked` / `free`.
   */
  changeObjectStatus(
    eventKey: string,
    objects: ObjectOrObjects,
    status: string,
    holdToken?: string,
  ): Promise<ChangeObjectStatusResult> {
    return this.client.events.changeObjectStatus(
      eventKey,
      objects,
      status,
      holdToken ?? null,
    );
  }

  /**
   * Retrieve detailed info (status, category, label, etc.) for specific seat objects.
   * Returns a dictionary keyed by object label.
   */
  retrieveObjectInfos(
    eventKey: string,
    objects: string[],
  ): Promise<Dict<EventObjectInfo>> {
    try {
      return this.client.events.retrieveObjectInfos(eventKey, objects);
    } catch (error: unknown) {
      console.error(error);
      throw new InternalServerErrorException('Failed to retrieve object infos');
    }
  }

  // ─── Reports ─────────────────────────────────────────────────────────────

  /** Get event object report grouped by status (e.g. `booked`, `free`). Optionally filter to a single status. */
  getReportByStatus(
    eventKey: string,
    status?: string,
  ): Promise<Dict<EventObjectInfo[]>> {
    return this.client.eventReports.byStatus(eventKey, status ?? null);
  }

  /** Get event object report grouped by category label. Optionally filter to a specific label. */
  getReportByCategoryLabel(
    eventKey: string,
    label?: string,
  ): Promise<Dict<EventObjectInfo[]>> {
    return this.client.eventReports.byCategoryLabel(eventKey, label ?? null);
  }

  /** Get event object report grouped by category key. Optionally filter to a specific key. */
  getReportByCategoryKey(
    eventKey: string,
    categoryKey?: string,
  ): Promise<Dict<EventObjectInfo[]>> {
    return this.client.eventReports.byCategoryKey(
      eventKey,
      categoryKey ?? null,
    );
  }

  /** Get event object report grouped by object label. Optionally filter to a specific label. */
  getReportByLabel(
    eventKey: string,
    label?: string,
  ): Promise<Dict<EventObjectInfo[]>> {
    return this.client.eventReports.byLabel(eventKey, label ?? null);
  }

  /** Get event object report grouped by order ID. Optionally filter to a specific order. */
  getReportByOrderId(
    eventKey: string,
    orderId?: string,
  ): Promise<Dict<EventObjectInfo[]>> {
    return this.client.eventReports.byOrderId(eventKey, orderId ?? null);
  }

  // ─── Status Changes ───────────────────────────────────────────────────────

  /**
   * Get a `Lister` for all status changes on an event.
   * Supports `.all()` (async iterator), `.firstPage()`, `.pageAfter()`, and `.pageBefore()`.
   *
   * @example
   * for await (const change of seatioService.statusChanges(eventKey).all()) { ... }
   */
  statusChanges(eventKey: string): Lister<StatusChange, StatusChangeJson> {
    return this.client.events.statusChanges(eventKey);
  }

  /**
   * Get a `Lister` for status changes of a single seat object on an event.
   * Supports the same pagination methods as `statusChanges()`.
   */
  statusChangesForObject(
    eventKey: string,
    objectId: string,
  ): Lister<StatusChange, StatusChangeJson> {
    return this.client.events.statusChangesForObject(eventKey, objectId);
  }
}

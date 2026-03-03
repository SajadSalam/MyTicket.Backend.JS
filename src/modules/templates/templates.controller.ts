import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/users.entity';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { TemplatesFilterDto } from './dtos/templates-filter.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { Template } from './templates.entity';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @ApiOperation({ summary: 'List templates (paginated)' })
  @ApiPaginatedResponse(Template)
  @Get()
  findAll(@Query() filter: TemplatesFilterDto) {
    return this.service.findAll(filter);
  }

  @ApiOperation({ summary: 'Get template by id' })
  @ApiResponse({ status: 200, description: 'Template found', type: Template })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.service.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  @ApiOperation({
    summary: 'Create template (Admin only)',
    description:
      'Creates a template record and provisions a matching chart in Seatsio with the supplied categories.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Template created', type: Template })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    const template = await this.service.create(dto);
    return { template, message: 'Template created successfully' };
  }

  @ApiOperation({ summary: 'Update template (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    const existing = await this.service.findOne(id);
    if (!existing) {
      throw new NotFoundException('Template not found');
    }
    await this.service.update(id, dto);
    return { message: 'Template updated successfully' };
  }

  @ApiOperation({ summary: 'Delete template (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.service.delete(id);
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Template not found');
    }
    return { message: 'Template deleted successfully' };
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDictionaryDto,
  UpdateDictionaryDto,
  CreateDictionaryItemDto,
  UpdateDictionaryItemDto,
  QueryDictionaryDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DictionariesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Dictionary Operations ====================

  async create(createDto: CreateDictionaryDto) {
    // Check uniqueness
    const exists = await this.prisma.dictionary.findUnique({
      where: { code: createDto.code },
    });
    if (exists) {
      throw new ConflictException(`Dictionary with code "${createDto.code}" already exists`);
    }

    return this.prisma.dictionary.create({
      data: createDto,
    });
  }

  async findAll(query: QueryDictionaryDto) {
    const { page = 1, pageSize = 10, keyword } = query;
    const where: Prisma.DictionaryWhereInput = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.dictionary.count({ where }),
      this.prisma.dictionary.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const dictionary = await this.prisma.dictionary.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!dictionary) {
      throw new NotFoundException(`Dictionary with ID "${id}" not found`);
    }

    return dictionary;
  }

  async findByCode(code: string) {
    const dictionary = await this.prisma.dictionary.findUnique({
      where: { code },
      include: {
        items: {
          where: { status: true },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!dictionary) {
      throw new NotFoundException(`Dictionary with code "${code}" not found`);
    }

    return dictionary;
  }

  async update(id: string, updateDto: UpdateDictionaryDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.dictionary.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.dictionary.delete({
      where: { id },
    });
  }

  // ==================== Item Operations ====================

  async getItems(dictionaryId: string) {
    await this.findOne(dictionaryId); // Ensure dictionary exists
    return this.prisma.dictionaryItem.findMany({
      where: { dictionaryId },
      orderBy: { sort: 'asc' },
    });
  }

  async createItem(dictionaryId: string, createDto: CreateDictionaryItemDto) {
    await this.findOne(dictionaryId); // Ensure dictionary exists

    // Check duplicate value in this dictionary
    const exists = await this.prisma.dictionaryItem.findFirst({
      where: {
        dictionaryId,
        value: createDto.value,
      },
    });

    if (exists) {
      throw new ConflictException(
        `Item with value "${createDto.value}" already exists in this dictionary`,
      );
    }

    return this.prisma.dictionaryItem.create({
      data: {
        ...createDto,
        dictionaryId,
      },
    });
  }

  async updateItem(dictionaryId: string, itemId: string, updateDto: UpdateDictionaryItemDto) {
    const item = await this.prisma.dictionaryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.dictionaryId !== dictionaryId) {
      throw new NotFoundException(`Dictionary Item not found`);
    }

    // If updating value, check uniqueness
    if (updateDto.value && updateDto.value !== item.value) {
      const exists = await this.prisma.dictionaryItem.findFirst({
        where: {
          dictionaryId,
          value: updateDto.value,
        },
      });
      if (exists) {
        throw new ConflictException(
          `Item with value "${updateDto.value}" already exists in this dictionary`,
        );
      }
    }

    return this.prisma.dictionaryItem.update({
      where: { id: itemId },
      data: updateDto,
    });
  }

  async removeItem(dictionaryId: string, itemId: string) {
    const item = await this.prisma.dictionaryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.dictionaryId !== dictionaryId) {
      throw new NotFoundException(`Dictionary Item not found`);
    }

    return this.prisma.dictionaryItem.delete({
      where: { id: itemId },
    });
  }
}

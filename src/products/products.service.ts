import { PaginationDto } from './../common/dto/pagination.dto';
import {
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger('ProductsService');

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Database connected');
    }

    async create(createProductDto: CreateProductDto) {
        // this.product viene del schema de prisma
        // que podemos usar gracias a la extension de la clase PrismaClient
        return this.product.create({
            data: createProductDto,
        });
    }

    async findAll(paginationDto: PaginationDto) {
        const { limit, page } = paginationDto;
        const totalPages = await this.product.count({
            where: { available: true },
        });
        const lastPage = Math.ceil(totalPages / limit);

        return {
            data: await this.product.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    available: true,
                },
            }),
            meta: {
                total: totalPages,
                page: page,
                lastPage: lastPage,
            },
        };
    }

    async findOne(id: number) {
        const product = await this.product.findFirst({
            where: { id, available: true },
        });

        if (!product) {
            throw new NotFoundException(`Product with id #${id} not found`);
        }

        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        const { id: __, ...data } = updateProductDto;
        try {
            await this.findOne(id);

            return await this.product.update({
                where: { id },
                data: data,
            });
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async remove(id: number) {
        await this.findOne(id);

        const product = await this.product.update({
            where: { id },
            data: {
                available: false,
            },
        });

        return product;
    }
}

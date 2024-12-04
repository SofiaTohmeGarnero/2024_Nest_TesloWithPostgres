import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products.map(({ images, ...rest }) => ({
      ...rest,
      images: images.map((img) => img.url),
    }));
  }

  async findOne(searchTerm: string) {
    let product: Product;

    if (isUUID(searchTerm)) {
      product = await this.productRepository.findOneBy({ id: searchTerm });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: searchTerm.toUpperCase(),
          slug: searchTerm.toLowerCase(),
        })
        .leftJoinAndSelect('product.images', 'productImages') //esto agrega las relaciones con las otras tablas en el obj que se devuelve, si usamos createQueryBuilder
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with "${searchTerm}" not found`);
    }
    return product;
  }

  /** Este metodo se crea para regresar las imágenes "aplandas", es decir como ["url1", "url2"], y no como [{id: 1, url: "url1"}, {id: 2, url: "url2"}] */
  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...restToUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id: id,
      ...restToUpdate,
    });

    if (!product)
      throw new NotFoundException(`Product with id: ${id} not found`);

    //Create query runner: lo vamos a utilizar para crear una transacción
    //Transacción: Una serie de queries que pueden impactar la base de datos (actualizar, eliminar, insertar).
    /**
     * Recien cuando explícitamente dicen Si quiero hacer el commit de esa transacción, se va a impactar la base de datos físicamente.
     *
     * Entonces, cada vez que utilicen una transacción, hay que asegurarse de hacer el commit de la transacción o el rollback de la transacción,
     * y también liberar el query erróneo para decir OK, elimínalo, porque si no mantiene esa conexión también en el query runner.
     */

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //Si me llegan images en el updateProductDto, debo borrar las viejas que ya tenia en la ddbb para guardar las nuevas
      if (images) {
        //1° De la tabla ProductImage voy borrar todas las imágenes cuyo product.id sea igual al id del producto al que estoy actualizando
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        //2° Agrego al product las images nuevas, pero no se ha impactando la ddbb aún
        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction(); //Aca se impacta la ddbb
      await queryRunner.release(); //Aca se desconecta de la ddbb

      //Ahora busco en la ddbb el producto (ya actualizado) por el id para retornarlo
      //se hace pq si no vinieran images en el updateProductDto y devuelvo product, yo solo hice el preload de restToUpdate (sin images) entonces no devolvería el campo (vacío o con registros viejos)
      return this.findOnePlain(id);

      //await this.productRepository.save(product); Esto se usaba cdo no teniamos relación entre tablas (sin query runner)
      //return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const { affected } = await this.productRepository.delete(id);
    if (affected === 0) {
      throw new BadRequestException(`Product with id "${id}" not found`);
    }
    return;
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'unexpected error, check server logs',
    );
  }

  async removeAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleExceptions(error);
    }
  }
}

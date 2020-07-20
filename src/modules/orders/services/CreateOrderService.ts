import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

import { IProduct as IProductFromOrder } from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists.');
    }

    const productsValidation = await this.productsRepository.findAllById(
      products,
    );

    if (productsValidation.length === 0 || productsValidation === undefined) {
      throw new AppError(`Product does not exists.`, 400);
    }

    const producstInOrder: IProductFromOrder[] = [];
    const productsUpdate: IProduct[] = [];

    products.forEach(prod => {
      const result = productsValidation.filter(product => {
        return product.id === prod.id;
      });

      if (!result) {
        throw new AppError(`Product ${prod.id} does not exists.`, 400);
      }

      if (result[0].quantity - prod.quantity < 0) {
        throw new AppError(
          `Insufficient quantity of product ${result[0].name}`,
          400,
        );
      }

      producstInOrder.push({
        product_id: result[0].id,
        price: result[0].price,
        quantity: prod.quantity,
      });

      productsUpdate.push({
        id: result[0].id,
        quantity: result[0].quantity - prod.quantity,
      });
    });

    const order = await this.ordersRepository.create({
      customer,
      products: producstInOrder,
    });

    await this.productsRepository.updateQuantity(productsUpdate);

    return order;
  }
}

export default CreateOrderService;

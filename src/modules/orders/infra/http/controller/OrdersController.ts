import { Request, Response } from 'express';

import { container } from 'tsyringe';

import Order from '@modules/orders/infra/typeorm/entities/Order';
import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

interface IProductsResponse {
  id: string;
  quantity: number;
}

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    // TODO
    const { id } = request.params;
    const findOrder = container.resolve(FindOrderService);

    const order = await findOrder.execute({ id });

    return response.json(order);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    // TODO
    const { customer_id, products } = request.body;
    const createOrder = container.resolve(CreateOrderService);

    const order: Order = await createOrder.execute({ customer_id, products });

    const productsToReturn: IProductsResponse[] = [];

    order.order_products.forEach(product => {
      productsToReturn.push({
        id: product.id,
        quantity: product.quantity,
      });
    });

    return response.json(order);
  }
}

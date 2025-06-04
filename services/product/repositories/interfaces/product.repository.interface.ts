import { BaseRepositoryInterface } from '../../../../common/repositories/interfaces/base.repository.interface';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPriceInfo {
  _id: string;
  name: string;
  price: number;
}

export interface ProductWithAccount extends Product {
  account: {
    _id: string;
    name: string;
    email: string;
    // ... other account fields
  };
}

export interface ProductRepositoryInterface extends BaseRepositoryInterface<Product> {
  findByCategory(category: string): Promise<Product[]>;
  findByName(name: string): Promise<Product[]>;
  findPriceByName(name: string): Promise<ProductPriceInfo | null>;
  updateStock(id: string, quantity: number): Promise<Product | null>;
  getProductWithAccount(productId: string): Promise<ProductWithAccount | null>;
} 
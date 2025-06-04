# Moleculer Microservices Project

โปรเจคนี้เป็นตัวอย่างการสร้าง Microservices ด้วย Moleculer โดยใช้ TypeScript และรองรับหลายฐานข้อมูล (MongoDB และ PostgreSQL)

## โครงสร้างโปรเจค

```
services/
├── common/
│   ├── decorators/
│   │   └── cache.decorator.ts
│   └── repositories/
│       ├── mongodb.base.repository.ts
│       └── postgres.base.repository.ts
├── product/
│   ├── models/
│   │   └── product.model.ts
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   └── product.repository.interface.ts
│   │   └── product.repository.ts
│   └── product.service.ts
├── order/
│   ├── models/
│   │   └── order.entity.ts
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   └── order.repository.interface.ts
│   │   └── order.repository.ts
│   └── order.service.ts
└── user/
    ├── models/
    │   └── user.model.ts
    ├── repositories/
    │   ├── interfaces/
    │   │   └── user.repository.interface.ts
    │   └── user.repository.ts
    └── user.service.ts
```

## คุณสมบัติหลัก

1. **Repository Pattern**
   - แยก business logic ออกจาก data access logic
   - รองรับหลายฐานข้อมูล (MongoDB และ PostgreSQL)
   - Type safety ด้วย TypeScript interfaces

2. **Caching**
   - ใช้ decorator สำหรับ caching
   - รองรับ TTL และ custom cache keys
   - ใช้ Moleculer's built-in caching

3. **Service Communication**
   - ใช้ NATS สำหรับ service communication
   - รองรับการเรียกใช้ระหว่าง services
   - Type safety สำหรับ service calls

4. **Type Safety**
   - ใช้ TypeScript interfaces
   - Strict type checking
   - Better IDE support

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
npm install
```

2. ตั้งค่า environment variables:
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=moleculer-demo
POSTGRES_URI=postgres://localhost:5432
POSTGRES_DB=moleculer-demo
```

3. รัน services:
```bash
npm run dev
```

## ตัวอย่างการใช้งาน

### Product Service

```typescript
// สร้างสินค้าใหม่
const product = await broker.call('product.create', {
  name: 'iPhone',
  description: 'Latest iPhone model',
  price: 29999,
  category: 'Electronics',
  stock: 10
});

// ค้นหาสินค้าตามชื่อ
const products = await broker.call('product.find', {
  name: 'iPhone'
});

// ดึงข้อมูลสินค้าพร้อม account
const productWithAccount = await broker.call('product.getWithAccount', {
  id: 'product123'
});
```

### Order Service

```typescript
// สร้างคำสั่งซื้อใหม่
const order = await broker.call('order.create', {
  userId: 'user123',
  items: [
    {
      productId: 'product123',
      quantity: 1,
      price: 29999
    }
  ]
});

// อัพเดทสถานะคำสั่งซื้อ
const updatedOrder = await broker.call('order.updateStatus', {
  id: 'order123',
  status: 'processing'
});

// ดึงข้อมูลคำสั่งซื้อพร้อม user
const orderWithUser = await broker.call('order.getWithUser', {
  id: 'order123'
});
```

## การทดสอบ

```bash
# รัน unit tests
npm test

# รัน integration tests
npm run test:integration
```

## การ Deploy

1. Build TypeScript:
```bash
npm run build
```

2. รันใน production:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 
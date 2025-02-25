export class IdoSellService {
  private readonly API_URL = 'https://kmxfashion.pl/api/admin/v5';
  private readonly API_KEY = 'YXBwbGljYXRpb240OmpJRjhsQXpMbExVUDArMUtJd2RVaGZrZk1MUlFCRDR0b1VUTGxOLzM0Sm1wSFlJWCtwRHVUd1lzUFFXU2hCQXE=';

  async getProducts(): Promise<Product[]> {
    const params = {
      page: 1,
      limit: 100, // możemy dostosować
      shopId: 1,
      active: 1,
      productIsVisible: 'y',
      orderBy: 'productPriority',
      orderDir: 'desc'
    };

    const response = await fetch(
      `${this.API_URL}/products/products?${new URLSearchParams(params).toString()}`,
      {
        headers: {
          'X-API-KEY': this.API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    const data: ApiResponse = await response.json();
    if (data.errors) {
      throw new Error(data.errors.faultString);
    }

    return data.response.products;
  }

  async updateProductPriorities(updates: Array<{
    productId: string;
    nodeId: number;
    priority: number;
  }>): Promise<void> {
    const updateData = {
      params: {
        products: updates.map(update => ({
          productId: update.productId,
          productPriorityInMenuNodes: [{
            productMenuNodeId: update.nodeId,
            productPriority: update.priority,
            shopId: 1,
            productMenuTreeId: 1
          }]
        }))
      }
    };

    const response = await fetch(`${this.API_URL}/products/products`, {
      method: 'PUT',
      headers: {
        'X-API-KEY': this.API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors.faultString);
    }
  }
} 
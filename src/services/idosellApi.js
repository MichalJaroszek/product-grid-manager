export class IdoSellService {
  constructor() {
    this.API_URL = '/api/admin/v5';
    this.API_KEY = 'YXBwbGljYXRpb240OmpJRjhsQXpMbExVUDArMUtJd2RVaGZrZk1MUlFCRDR0b1VUTGxOLzM0Sm1wSFlJWCtwRHVUd1lzUFFXU2hCQXE=';
    // Tryb testowy domyślnie włączony
    this.TEST_MODE = true;
  }

  async getProducts() {
    // Testujemy kilka różnych produktów
    const testIds = [5235, 5180, 5212];
    
    try {
      for (const id of testIds) {
        const result = await this.fetchProducts([id]);
        console.log(`Test produktu ${id}:`, {
          id: id,
          znaleziony: result.length > 0,
          szczegóły: result[0],
          url: `${this.API_URL}/products/products?shopId=1&productIds=${id}`
        });
      }

      // Spróbujmy też pobrać wszystkie na raz
      const allAtOnce = await this.fetchProducts(testIds);
      console.log('Test wszystkich produktów razem:', {
        ids: testIds,
        znalezione: allAtOnce.map(p => p.productId),
        brakujące: testIds.filter(id => !allAtOnce.some(p => p.productId === id))
      });

      return allAtOnce;
    } catch (error) {
      console.error('Błąd podczas testowania produktów:', error);
      throw error;
    }
  }

  async fetchProducts(productIds) {
    const params = {
      shopId: 1,
      productIds: productIds.join(','),
      // Dodajemy parametry do wyszukiwania nieaktywnych produktów
      includeInactive: 'yes',
      includeArchived: 'yes',
      fields: [
        'productId',
        'productName',
        'productPriority',
        'productIsVisible',
        'productIsDeleted',
        'productStatus',
        'productAddingTime',
        'productModificationTime',
        'isActive'
      ].join(',')
    };

    console.log('Zapytanie do API:', {
      url: `${this.API_URL}/products/products`,
      params: params,
      ids: productIds
    });

    const response = await fetch(
      `${this.API_URL}/products/products?${new URLSearchParams(params)}`,
      {
        headers: {
          'X-API-KEY': this.API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Błąd HTTP:', response.status, response.statusText);
      const text = await response.text();
      console.error('Odpowiedź:', text);
      return [];
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('Błąd API:', {
        ids: productIds,
        error: result.errors,
        rawResponse: result
      });
      return [];
    }

    // Pokaż szczegóły odpowiedzi
    console.log('Odpowiedź API:', {
      requestedIds: productIds,
      receivedIds: result.results?.map(p => p.productId),
      details: result.results?.map(p => ({
        id: p.productId,
        name: p.productName,
        status: p.productStatus,
        active: p.isActive,
        visible: p.productIsVisible,
        deleted: p.productIsDeleted,
        added: p.productAddingTime,
        modified: p.productModificationTime
      }))
    });

    return result.results || [];
  }

  async updateProductPriorities(updates) {
    if (this.TEST_MODE) {
      console.log('TRYB TESTOWY: Zmiany nie zostały wysłane do API');
      console.log('Dane do wysłania:', updates);
      return;
    }

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
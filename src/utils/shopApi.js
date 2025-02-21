const API_KEY = 'YXBwbGljYXRpb240OmpJRjhsQXpMbExVUDArMUtJd2RVaGZrZk1MUlFCRDR0b1VUTGxOLzM0Sm1wSFlJWCtwRHVUd1lzUFFXU2hCQXE=';
const SHOP_URL = 'https://www.kmxfashion.pl';
// Używamy publicznego proxy CORS
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const fetchProductsFromShop = async () => {
  try {
    // Budujemy URL z parametrami
    const apiUrl = new URL(`${SHOP_URL}/webapi/rest/products/list`);
    apiUrl.searchParams.append('page', '1');
    apiUrl.searchParams.append('limit', '1000');
    apiUrl.searchParams.append('response_format', 'xml');
    
    // Dodajemy proxy do URL
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl.toString())}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.text();
    console.log('Received data:', data.substring(0, 200));
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}; 
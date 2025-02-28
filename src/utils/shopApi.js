const API_KEY = 'YXBwbGljYXRpb240OmpJRjhsQXpMbExVUDArMUtJd2RVaGZrZk1MUlFCRDR0b1VUTGxOLzM0Sm1wSFlJWCtwRHVUd1lzUFFXU2hCQXE=';
const SHOP_URL = 'https://kmxfashion.pl';
// Używamy publicznego proxy CORS
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Funkcja pomocnicza do przygotowania URL API
// eslint-disable-next-line no-unused-vars
const prepareApiUrl = (endpoint) => {
  // Budujemy URL z odpowiednim endpointem API
  const apiUrl = new URL(`${SHOP_URL}/api/admin/v5${endpoint}`);
  
  // Zwracamy URL bez proxy dla żądań POST - proxy będzie użyte w konfiguracji serwera
  return apiUrl.toString();
};

export const fetchProductsFromShop = async () => {
  try {
    // Budujemy URL z parametrami
    const apiUrl = new URL(`${SHOP_URL}/api/admin/v5/products/list`);
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

// Funkcja do aktualizacji priorytetów produktów w sklepie
export const updateProductPriorities = async (productsWithPriorities) => {
  try {
    // Zamiast bezpośredniego połączenia, używamy naszego serwera proxy na porcie 3001
    const apiUrl = 'http://localhost:3001/api/products/products';
    console.log('API URL (przez proxy):', apiUrl);
    console.log('Docelowy adres API: https://kmxfashion.pl/api/admin/v5/products/products');

    // Wyświetlamy informacje o produktach dla debugowania
    console.log('Produkty przed przetworzeniem:', JSON.stringify(productsWithPriorities.map(p => ({
      id: p.id,
      menuItems: p.menuItems ? p.menuItems.map(i => ({
        textId: i.textId,
        level: i.level
      })) : []
    })), null, 2));

    // Groupa produkty po ID (zamiast tworzyć osobne wpisy dla każdego rozmiaru)
    // Zgodnie z odpowiedzią z supportu IdoSell, API akceptuje tylko priorytety dla głównego produktu
    const groupedProducts = [];
    const processedIds = new Set();

    productsWithPriorities.forEach(product => {
      if (processedIds.has(product.id)) return;
      processedIds.add(product.id);
      groupedProducts.push(product);
    });

    console.log(`Przetwarzam ${groupedProducts.length} unikalnych produktów (po grupowaniu)`);

    // Przygotowanie danych zgodnie z formatem wymaganym przez API IdoSell
    // WAŻNE: Wysyłamy absolutne minimum danych, aby uniknąć nadpisywania innych pól produktu
    const payload = {
      params: {
        products: groupedProducts.map(product => {
          // Wybieramy tylko węzeł menu z ID 440 (który na pewno działa)
          const productPriority = 920; // Domyślna wartość priorytetu
          
          // Sprawdzamy, czy produkt ma węzeł menu 440 i pobieramy jego priorytet
          let menuNodePriority = productPriority;
          if (product.menuItems && product.menuItems.length > 0) {
            const kurtkiNode = product.menuItems.find(item => 
              item.textId === 'SKLEP\\Kurtki i Płaszcze' || 
              (item.nodeId === 440 || item.id === 440)
            );
            
            if (kurtkiNode && kurtkiNode.level !== undefined && kurtkiNode.level !== null) {
              menuNodePriority = parseInt(kurtkiNode.level);
              console.log(`Znaleziono węzeł menu "Kurtki i Płaszcze" dla produktu ${product.id} z priorytetem ${menuNodePriority}`);
            } else {
              console.log(`Nie znaleziono węzła menu "Kurtki i Płaszcze" dla produktu ${product.id}, używam domyślnego priorytetu: ${menuNodePriority}`);
            }
          }

          // Tworzymy obiekt produktu zgodnie ze wzorcem CURL który działa
          console.log(`Przygotowanie danych dla produktu ${product.id} z priorytetem ${menuNodePriority} dla węzła 440`);
          return {
            productId: parseInt(product.id),
            // TYLKO productPriorityInMenuNodes, żadnych innych pól!
            productPriorityInMenuNodes: [
              {
                productMenuNodeId: 440,  // Używamy tylko jednego węzła który na pewno działa
                productPriority: menuNodePriority,
                shopId: 1,
                productMenuTreeId: 1
              }
            ]
          };
        })
      }
    };

    console.log('Dane do wysłania:', JSON.stringify(payload, null, 2));

    // Wysyłanie danych do API przez serwer proxy
    const response = await fetch(apiUrl, {
      method: 'PUT',  // Metoda PUT zgodnie z przykładem curl
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        'X-Action-Type': 'update-priorities-only' // Dodatkowy nagłówek informujący o celu zapytania
      },
      body: JSON.stringify(payload)
    });

    // Sprawdzenie odpowiedzi
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Błąd podczas aktualizacji priorytetów produktów:', response.status, errorText);
      throw new Error(`Błąd podczas aktualizacji priorytetów produktów: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Odpowiedź z API po aktualizacji priorytetów:', data);
    return data;
  } catch (error) {
    console.error('Błąd podczas aktualizacji priorytetów produktów:', error);
    throw error;
  }
}; 
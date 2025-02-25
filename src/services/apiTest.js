const fs = require('fs');

const testAPI = async () => {
  const API_KEY = 'YXBwbGljYXRpb240OmpJRjhsQXpMbExVUDArMUtJd2RVaGZrZk1MUlFCRDR0b1VUTGxOLzM0Sm1wSFlJWCtwRHVUd1lzUFFXU2hCQXE=';
  const BASE_URL = 'https://kmxfashion.pl/api/admin/v5';

  try {
    const results = {
      test1: null
    };

    // Test z jednym produktem
    console.log('Pobieranie jednego produktu...');
    const params = {
      page: 1,
      limit: 1,          // tylko 1 produkt
      shopId: 1,         // ID sklepu
      active: 1,         // tylko aktywne
      productIsVisible: 'y', // tylko widoczne
      orderBy: 'productId', // sortowanie po ID
      orderDir: 'desc'      // malejąco
    };

    const getResponse = await fetch(
      `${BASE_URL}/products/products?${new URLSearchParams(params).toString()}`, 
      {
        method: 'GET',
        headers: {
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      }
    );
    
    results.test1 = await getResponse.json();

    // Zapisujemy wyniki do pliku
    fs.writeFileSync(
      'api_test_results.json', 
      JSON.stringify(results, null, 2)
    );

    console.log('Wyniki zostały zapisane do pliku api_test_results.json');

    // Wyświetlamy szczegółowe informacje o jednym produkcie
    if (results.test1.response?.products?.[0]) {
      const product = results.test1.response.products[0];
      console.log('\nSzczegóły produktu:');
      console.log('ID:', product.productId);
      console.log('Priorytet:', product.productPriority);
      console.log('Widoczność:', product.productIsVisible);
      
      if (product.productMenu) {
        console.log('\nMenu:');
        product.productMenu.forEach(menu => {
          const polName = menu.menuItemDescriptionsLangData.find(lang => lang.langId === 'pol');
          if (polName) {
            console.log(`- Węzeł: ${polName.menuItemTextId}`);
            console.log(`  ID węzła: ${menu.menuItemId}`);
          }
        });
      }

      // Wyświetlamy inne ważne informacje
      console.log('\nInne informacje:');
      console.log('Nazwa:', product.productName);
      console.log('Kod:', product.productCode);
      console.log('Aktywny:', product.productIsActive);
      console.log('W sklepie:', product.shopId);
    }

  } catch (error) {
    console.error('Błąd podczas testowania API:', error);
  }
};

testAPI(); 
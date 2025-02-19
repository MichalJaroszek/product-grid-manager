const BASE_URL = 'https://webapi.iai-shop.com/api/';

export const fetchProductsFromShop = async (shopConfig) => {
  try {
    console.log('Rozpoczynam pobieranie produktów ze sklepu...');
    
    // Parametry dla WebAPI IdoSell
    const params = {
      method: 'products_data',
      parameters: JSON.stringify({
        authenticate: {
          userLogin: shopConfig.login,
          authenticateKey: shopConfig.apiKey
        },
        settings: {
          languages: ['pol'],
          returnProducts: ['all'],
          includeAttributes: ['priority_menu']
        }
      })
    };

    // Wywołanie API
    const response = await fetch(`${BASE_URL}${shopConfig.shopId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API error: ${data.error.message}`);
    }

    // Konwertuj odpowiedź na format XML
    const xmlData = convertToXML(data.products);
    console.log('Pobrano produkty:', xmlData);
    
    return xmlData;
  } catch (error) {
    console.error('Błąd podczas pobierania produktów:', error);
    throw error;
  }
};

// Funkcja pomocnicza do konwersji danych z API na format XML
const convertToXML = (products) => {
  const productsXML = products.map(product => `
    <product>
      <id>${product.product_id}</id>
      <images>
        <icons>
          <icon>
            <url>${product.icon_url || ''}</url>
          </icon>
        </icons>
      </images>
      <iaiext:priority_menu>
        <site>
          <menu>
            ${product.categories.map(cat => `
              <item>
                <textId>${cat.category_id}</textId>
                <level>${cat.position || 0}</level>
              </item>
            `).join('')}
          </menu>
        </site>
      </iaiext:priority_menu>
    </product>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<offer xmlns:iof="http://www.iai-shop.com/developers/iof.phtml" 
       xmlns:iaiext="http://www.iai-shop.com/developers/iof/extensions.phtml">
  <products>
    ${productsXML}
  </products>
</offer>`;
};

export const updateProductPriorities = async (shopId, products) => {
  try {
    const xmlData = generateUpdateXML(products);
    
    const response = await fetch(`${API_URL}/shop/${shopId}/products/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: xmlData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Błąd podczas aktualizacji priorytetów:', error);
    throw error;
  }
};

const generateUpdateXML = (products) => {
  // Generowanie XML-a do aktualizacji priorytetów
  const xmlContent = products.map(product => `
    <product>
      <id>${product.id}</id>
      <priority_menu>
        ${product.menuItems.map(item => `
          <item>
            <textId>${item.textId}</textId>
            <level>${item.level}</level>
          </item>
        `).join('')}
      </priority_menu>
    </product>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
    <products>
      ${xmlContent}
    </products>`;
};
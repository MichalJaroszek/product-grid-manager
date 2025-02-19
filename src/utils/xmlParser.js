import { XMLParser } from 'fast-xml-parser';

export const parseXMLFile = async (source, isText = false) => {
  try {
    let xmlText;
    if (isText) {
      xmlText = source;
    } else {
      console.log('Rozpoczynam pobieranie pliku XML...');
      const response = await fetch(`/${source}`);
      console.log('Plik pobrany, status:', response.status);
      xmlText = await response.text();
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
      preserveOrder: false,
      trimValues: true,
      parseTagValue: true,
      allowBooleanAttributes: true,
      cdataPropName: '__cdata',
      ignoreDeclaration: true
    });
    
    const result = parser.parse(xmlText);
    console.log('Sparsowany XML:', result);

    // Dostęp do produktów
    const productsArray = Array.isArray(result.offer.products.product) 
      ? result.offer.products.product 
      : [result.offer.products.product];

    console.log('Tablica produktów:', productsArray);

    // Przetwórz dane XML na format potrzebny aplikacji
    const products = productsArray.map(product => ({
      id: product.id,
      iconUrl: product.images?.icons?.icon?.url,
      menuItems: Array.isArray(product['iaiext:priority_menu']?.site?.menu?.item)
        ? product['iaiext:priority_menu'].site.menu.item
        : [product['iaiext:priority_menu']?.site?.menu?.item],
      originalData: product
    }));

    // Zbierz unikalne węzły menu
    const menuNodes = [...new Set(
      products.flatMap(product => 
        product.menuItems.map(item => item.textId)
      )
    )];

    return { products, menuNodes };
  } catch (error) {
    console.error('Błąd podczas parsowania XML:', error);
    throw error;
  }
}; 
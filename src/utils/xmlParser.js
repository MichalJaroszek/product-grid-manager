import { XMLParser } from 'fast-xml-parser';

export const parseXMLFile = async (source, isText = false) => {
  try {
    let xmlText;
    if (isText) {
      xmlText = source;
    } else {
      const response = await fetch(source);
      xmlText = await response.text();
    }

    const options = {
      attributeNamePrefix: "",
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      parseAttributeValue: false,
      trimValues: true,
      processEntities: false,
      isArray: (name) => ['product', 'iaiext:item'].includes(name)
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlText);

    if (!result?.offer?.products?.product) {
      throw new Error('Nieprawidłowa struktura pliku XML');
    }

    // Wyciągamy tylko potrzebne dane i zachowujemy oryginalny XML
    const products = result.offer.products.product
      .map(product => ({
        id: product.id,
        iconUrl: product.images?.icons?.icon?.url,
        codeOnCard: product.code_on_card,
        menuItems: extractMenuItems(product),
        originalData: product,
        __originalXML: xmlText // Dodajemy oryginalny XML do każdego produktu
      }))
      .filter(product => product.menuItems.length > 0);

    const menuNodes = [...new Set(
      products.flatMap(p => p.menuItems.map(i => i.textId))
    )].filter(Boolean).sort();

    return { products, menuNodes };
  } catch (error) {
    console.error('Błąd podczas parsowania XML:', error);
    throw error;
  }
};

// Wydzielona funkcja do ekstrakcji menu items
const extractMenuItems = (product) => {
  try {
    const navigation = product['iaiext:navigation'];
    const items = navigation?.['iaiext:site']?.['iaiext:menu']?.[0]?.['iaiext:item'] || [];
    return items.map(item => ({
      textId: item.textid,
      name: item.name || item.textid,
      level: parseInt(item['iaiext:priority_menu']) || 0
    }));
  } catch {
    return [];
  }
}; 
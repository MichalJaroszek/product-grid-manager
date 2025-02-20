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
    
    // Dodajemy filtrowanie aby upewnić się, że mamy wszystkie węzły
    return items
      .filter(item => item.textid) // upewniamy się że item ma textid
      .map(item => {
        // Wyciągamy zarówno pełną ścieżkę jak i sam węzeł
        const pathParts = item.textid.split('\\');
        const items = [];
        
        // Dodajemy każdy poziom ścieżki jako osobny item
        let currentPath = '';
        pathParts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}\\${part}` : part;
          items.push({
            textId: currentPath,
            name: currentPath,
            level: parseInt(item['iaiext:priority_menu']) || 0
          });
        });
        
        return items;
      })
      .flat() // spłaszczamy tablicę
      .filter((item, index, self) => 
        // Usuwamy duplikaty
        index === self.findIndex(t => t.textId === item.textId)
      );
  } catch (error) {
    console.error('Błąd podczas ekstrakcji menu items:', error);
    return [];
  }
}; 
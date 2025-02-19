import { XMLBuilder } from 'fast-xml-parser';

export const generateNewXML = (allProducts, orderedProducts, selectedNode) => {
  try {
    // Stwórz kopię oryginalnych danych produktów
    const updatedProducts = allProducts.map(product => ({
      ...product.originalData,
      'iaiext:priority_menu': {
        ...product.originalData['iaiext:priority_menu'],
        site: {
          ...product.originalData['iaiext:priority_menu']?.site,
          menu: {
            item: product.menuItems.map(item => ({
              textId: item.textId,
              level: item.level
            }))
          }
        }
      }
    }));

    // Przygotuj obiekt do serializacji
    const xmlObj = {
      offer: {
        'file_format': 'IOF',
        'generated': new Date().toISOString().replace('T', ' ').substring(0, 19),
        'iaiext:currency': 'PLN',
        'xmlns:iof': 'http://www.iai-shop.com/developers/iof.phtml',
        'version': '3.0',
        'extensions': 'yes',
        'xmlns:iaiext': 'http://www.iai-shop.com/developers/iof/extensions.phtml',
        products: {
          product: updatedProducts
        }
      }
    };

    // Konfiguracja buildera
    const builder = new XMLBuilder({
      attributeNamePrefix: '',
      ignoreAttributes: false,
      format: true,
      suppressEmptyNodes: false,
      suppressBooleanAttributes: false
    });

    const xmlString = builder.build(xmlObj);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlString}`;
  } catch (error) {
    console.error('Błąd podczas generowania XML:', error);
    return null;
  }
}; 
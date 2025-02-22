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
      parseAttributeValue: true,
      trimValues: true,
      processEntities: false,
      isArray: (name, jpath) => {
        // Upewniamy się, że te elementy zawsze będą tablicami
        if (['product', 'iaiext:item', 'item'].includes(name)) return true;
        // Wymuszamy tablicę dla menu w priority_menu
        if (name === 'menu' && jpath.includes('priority_menu')) return true;
        // Wymuszamy tablicę dla site w priority_menu
        if (name === 'site' && jpath.includes('priority_menu')) return true;
        return false;
      },
      tagValueProcessor: (tagName, tagValue, jPath, hasAttributes, isLeafNode) => {
        return tagValue;
      },
      attributeValueProcessor: (attrName, attrValue, jPath) => {
        return attrValue;
      }
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlText);

    console.log('Raw XML:', xmlText.substring(0, 1000)); // Pokaż początek XML
    console.log('Parsed XML structure:', JSON.stringify(result.offer.products.product[0], null, 2));

    if (!result?.offer?.products?.product) {
      throw new Error('Nieprawidłowa struktura pliku XML');
    }

    const products = result.offer.products.product
      // Najpierw filtrujemy produkty po widoczności
      .filter(product => {
        const isVisible = product['iaiext:visibility']?.['iaiext:site']?.visible === 'yes';
        console.log(`Product ${product.id} visibility:`, isVisible);
        return isVisible;
      })
      .map(product => {
        console.log('Processing visible product:', product.id);
        console.log('Priority menu section:', JSON.stringify(product['iaiext:priority_menu'], null, 2));
        
        return {
          id: product.id,
          iconUrl: product.images?.icons?.icon?.url,
          codeOnCard: product.code_on_card,
          menuItems: extractMenuItems(product),
          originalData: product,
          __originalXML: xmlText
        };
      })
      .filter(product => product.menuItems.length > 0);

    return { 
      products, 
      menuNodes: [...new Set(
        products.flatMap(p => p.menuItems.map(i => i.textId))
      )].filter(Boolean).sort() 
    };
  } catch (error) {
    console.error('Błąd podczas parsowania XML:', error);
    throw error;
  }
};

const extractMenuItems = (product) => {
  try {
    const navigation = product['iaiext:navigation'];
    const navigationItems = navigation?.['iaiext:site']?.['iaiext:menu']?.[0]?.['iaiext:item'] || [];
    
    console.log('Raw product data:', JSON.stringify(product, null, 2));
    
    const priorityMenuItems = product['iaiext:priority_menu']?.site?.[0]?.menu?.[0]?.item || [];
    console.log('Priority menu items before processing:', priorityMenuItems);
    
    console.log('Priority menu structure:', {
      priorityMenu: product['iaiext:priority_menu'],
      site: product['iaiext:priority_menu']?.site,
      menu: product['iaiext:priority_menu']?.site?.[0]?.menu,
      items: product['iaiext:priority_menu']?.site?.[0]?.menu?.[0]?.item
    });
    
    const priorityMap = new Map(
      priorityMenuItems.map(item => {
        const textId = item.textId || item.textid;
        const level = parseInt(item.level) || 930;
        console.log('Processing priority item:', { textId, level, originalItem: item });
        return [textId.replace(/\\\\/g, '\\'), level];
      })
    );
    
    console.log('Final priority map:', Object.fromEntries(priorityMap));
    
    return navigationItems
      .filter(item => item.textid || item.textId)
      .map(item => {
        const pathParts = (item.textid || item.textId).split('\\');
        const items = [];
        
        let currentPath = '';
        pathParts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}\\${part}` : part;
          const priority = priorityMap.get(currentPath);
          console.log('Getting priority for path:', currentPath, 'Priority:', priority);
          items.push({
            textId: currentPath,
            name: currentPath,
            level: priority !== undefined ? priority : 930
          });
        });
        
        return items;
      })
      .flat()
      .filter((item, index, self) => 
        index === self.findIndex(t => t.textId === item.textId)
      );
  } catch (error) {
    console.error('Błąd podczas ekstrakcji menu items:', error);
    console.error('Product data:', JSON.stringify(product, null, 2));
    return [];
  }
}; 
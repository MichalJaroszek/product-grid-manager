export const generateNewXML = (allProducts, orderedProducts, selectedNode) => {
  try {
    console.log('Debug generateNewXML:');
    console.log('selectedNode:', selectedNode);
    console.log('orderedProducts:', orderedProducts.map(p => p.id));
    console.log('Original XML length:', allProducts[0].__originalXML.length);

    if (!allProducts?.[0]?.__originalXML) {
      throw new Error('Brak oryginalnego XML');
    }

    const priorityMap = new Map(
      orderedProducts.map((product, index) => [product.id, index + 1])
    );

    let updatedXML = allProducts[0].__originalXML;

    // Znajdźmy i zaktualizujmy produkty
    const productsToUpdate = orderedProducts.map(product => {
      const productRegex = new RegExp(`<product[^>]*?id="${product.id}"[^>]*>([\\s\\S]*?)</product>`, 'g');
      const match = productRegex.exec(updatedXML);
      
      if (!match) {
        console.warn(`Product ${product.id} not found in XML!`);
        return null;
      }

      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      const productXML = match[0];
      const newPriority = priorityMap.get(product.id);

      console.log(`Product ${product.id} found with priority ${newPriority}:`, {
        startIndex,
        endIndex,
        length: productXML.length
      });

      // Aktualizuj priorytety w XML produktu
      let updatedProductXML = productXML;

      // Aktualizuj version_priority
      updatedProductXML = updatedProductXML.replace(
        /(iaiext:version_priority=")[^"]*"/,
        `$1${newPriority}"`
      );

      // Aktualizuj priority_menu dla wybranego węzła
      const menuUpdates = [
        {
          regex: new RegExp(`(<iaiext:item[^>]*?textid="${selectedNode.replace('\\', '\\\\')}"[^>]*)iaiext:priority_menu="[^"]*"`, 'g'),
          replacement: `$1iaiext:priority_menu="${newPriority}"`
        },
        {
          regex: new RegExp(`(<iaiext:node_path_translation[^>]*?name="${selectedNode.replace('\\', '\\\\')}"[^>]*)iaiext:priority_menu="[^"]*"`, 'g'),
          replacement: `$1iaiext:priority_menu="${newPriority}"`
        },
        {
          regex: new RegExp(`(<item[^>]*?textId="${selectedNode.replace('\\', '\\\\')}"[^>]*)level="[^"]*"`, 'g'),
          replacement: `$1level="${newPriority}"`
        }
      ];

      menuUpdates.forEach(update => {
        updatedProductXML = updatedProductXML.replace(update.regex, update.replacement);
      });

      return {
        id: product.id,
        priority: newPriority,
        xml: updatedProductXML,
        startIndex,
        endIndex
      };
    }).filter(Boolean);

    // Sortujemy produkty od końca
    productsToUpdate.sort((a, b) => b.startIndex - a.startIndex);

    // Aktualizujemy XML
    productsToUpdate.forEach(product => {
      console.log(`Updating product ${product.id} with priority ${product.priority}`);
      updatedXML = updatedXML.substring(0, product.startIndex) +
                   product.xml +
                   updatedXML.substring(product.endIndex);
    });

    console.log('Final XML length:', updatedXML.length);

    // Aktualizuj datę wygenerowania
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    updatedXML = updatedXML.replace(
      /(generated=")[^"]*"/,
      `$1${currentDate}"`
    );

    return updatedXML;
  } catch (error) {
    console.error('Błąd podczas generowania XML:', error);
    throw error;
  }
}; 
export const generateNewXML = (originalProducts, products, nodes) => {
  try {
    let xmlText = originalProducts[0].__originalXML;

    // Dla każdego produktu
    products.forEach(product => {
      const productXML = new RegExp(
        `<product[^>]*?id="${product.id}"[\\s\\S]*?</product>`,
        'g'
      );

      const matches = xmlText.match(productXML);
      if (!matches) return;

      let updatedProductXML = matches[0];

      // Znajdujemy sekcję priority_menu
      const priorityMenuRegex = /<iaiext:priority_menu>[\s\S]*?<\/iaiext:priority_menu>/;
      const priorityMenuMatch = updatedProductXML.match(priorityMenuRegex);
      
      if (priorityMenuMatch) {
        let priorityMenuSection = priorityMenuMatch[0];
        
        // Aktualizujemy priorytety dla wszystkich zmodyfikowanych węzłów
        nodes.forEach(nodePath => {
          const menuItem = product.menuItems.find(item => item.textId === nodePath);
          if (!menuItem) return;

          console.log(`Updating priority for product ${product.id}, node ${nodePath} to ${menuItem.level}`);

          // Escapujemy backslashe w ścieżce dla wyrażenia regularnego
          const escapedNodePath = nodePath.replace(/\\/g, '\\\\');
          
          // Aktualizujemy priorytet w sekcji priority_menu
          const itemRegex = new RegExp(
            `(<item[^>]*?textId="${escapedNodePath}"[^>]*?)(level="\\d+")`,
            'g'
          );
          
          priorityMenuSection = priorityMenuSection.replace(
            itemRegex,
            `$1level="${menuItem.level}"`
          );
        });

        // Zamieniamy całą sekcję priority_menu
        updatedProductXML = updatedProductXML.replace(
          priorityMenuRegex,
          priorityMenuSection
        );
      }

      // Aktualizujemy cały produkt w XML
      xmlText = xmlText.replace(matches[0], updatedProductXML);
    });

    return xmlText;
  } catch (error) {
    console.error('Błąd podczas generowania XML:', error);
    throw new Error('Nie udało się wygenerować pliku XML');
  }
}; 
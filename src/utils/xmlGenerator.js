export const generateNewXML = (originalProducts, products, nodes) => {
  try {
    let xmlText = originalProducts[0].__originalXML;

    // Dla każdego produktu
    products.forEach(product => {
      // Znajdujemy cały blok produktu
      const productStart = xmlText.indexOf(`<product id="${product.id}"`);
      const productEnd = xmlText.indexOf('</product>', productStart) + '</product>'.length;
      
      if (productStart === -1 || productEnd === -1) return;
      
      const originalProductXML = xmlText.substring(productStart, productEnd);
      let updatedProductXML = originalProductXML;

      // Znajdujemy sekcję priority_menu
      const priorityStart = updatedProductXML.indexOf('<iaiext:priority_menu>');
      const priorityEnd = updatedProductXML.indexOf('</iaiext:priority_menu>') + '</iaiext:priority_menu>'.length;
      
      if (priorityStart !== -1 && priorityEnd !== -1) {
        const priorityMenuSection = updatedProductXML.substring(priorityStart, priorityEnd);
        let updatedPrioritySection = priorityMenuSection;

        // Aktualizujemy priorytety dla wszystkich zmodyfikowanych węzłów
        nodes.forEach(nodePath => {
          const menuItem = product.menuItems.find(item => item.textId === nodePath);
          if (!menuItem) return;

          console.log(`Updating priority for product ${product.id}, node ${nodePath} to ${menuItem.level}`);

          // Znajdujemy i aktualizujemy konkretny item
          const itemStart = updatedPrioritySection.indexOf(`textId="${nodePath}"`);
          if (itemStart !== -1) {
            const itemBeforeLevel = updatedPrioritySection.substring(0, itemStart).lastIndexOf('<item');
            const itemEndTag = updatedPrioritySection.indexOf('>', itemStart) + 1;
            
            if (itemBeforeLevel !== -1 && itemEndTag !== -1) {
              const itemTag = updatedPrioritySection.substring(itemBeforeLevel, itemEndTag);
              const updatedItemTag = itemTag.replace(
                /level="\d+"/,
                `level="${menuItem.level}"`
              );
              updatedPrioritySection = updatedPrioritySection.substring(0, itemBeforeLevel) +
                updatedItemTag +
                updatedPrioritySection.substring(itemEndTag);
            }
          }
        });

        // Zamieniamy zaktualizowaną sekcję priority_menu
        updatedProductXML = updatedProductXML.substring(0, priorityStart) +
          updatedPrioritySection +
          updatedProductXML.substring(priorityEnd);
      }

      // Aktualizujemy cały produkt w XML
      xmlText = xmlText.substring(0, productStart) +
        updatedProductXML +
        xmlText.substring(productEnd);
    });

    // Dodajmy weryfikację
    console.log('Verification of updates:');
    products.forEach(product => {
      nodes.forEach(nodePath => {
        const menuItem = product.menuItems.find(item => item.textId === nodePath);
        if (menuItem) {
          const searchText = `textId="${nodePath}" level="${menuItem.level}"`;
          const found = xmlText.includes(searchText);
          console.log(`Product ${product.id}, node ${nodePath}, level ${menuItem.level}: ${found ? 'OK' : 'FAILED'}`);
        }
      });
    });

    return xmlText;
  } catch (error) {
    console.error('Błąd podczas generowania XML:', error);
    throw new Error('Nie udało się wygenerować pliku XML');
  }
}; 
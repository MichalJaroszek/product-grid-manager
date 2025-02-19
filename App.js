import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { DragDropContext } from 'react-beautiful-dnd';
import { parseXMLFile } from './utils/xmlParser';
import ProductGrid from './components/ProductGrid';
import MenuSelector from './components/MenuSelector';
import { generateNewXML } from './utils/xmlGenerator';

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background-color: #45a049;
  }
`;

function App() {
  const [products, setProducts] = useState([]);
  const [menuNodes, setMenuNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Wczytaj plik XML przy starcie aplikacji
    loadXMLFile();
  }, []);

  const loadXMLFile = async () => {
    const result = await parseXMLFile('products_export.xml');
    setProducts(result.products);
    setMenuNodes(result.menuNodes);
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    const nodeProducts = products.filter(product => 
      product.menuItems.some(item => item.textId === nodeId)
    );
    
    // Sortuj produkty według priorytetu
    const sorted = nodeProducts.sort((a, b) => {
      const aPriority = a.menuItems.find(item => item.textId === nodeId).level;
      const bPriority = b.menuItems.find(item => item.textId === nodeId).level;
      return bPriority - aPriority;
    });
    
    setFilteredProducts(sorted);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFilteredProducts(items);
  };

  const handleSave = () => {
    const newXML = generateNewXML(products, filteredProducts, selectedNode);
    // Zapisz nowy plik XML
    const blob = new Blob([newXML], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated_products.xml';
    a.click();
  };

  return (
    <AppContainer>
      <MenuSelector nodes={menuNodes} onSelect={handleNodeSelect} />
      <DragDropContext onDragEnd={handleDragEnd}>
        <ProductGrid products={filteredProducts} />
      </DragDropContext>
      <SaveButton onClick={handleSave}>Zapisz kolejność</SaveButton>
    </AppContainer>
  );
}

export default App; 
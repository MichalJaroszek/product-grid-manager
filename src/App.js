import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import { parseXMLFile } from './utils/xmlParser';
import ProductGrid from './components/ProductGrid';
import MenuSelector from './components/MenuSelector';
import { generateNewXML } from './utils/xmlGenerator';

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MainContent = styled.div`
  flex: 1;
`;

const ActionButton = styled.button`
  padding: 12px 20px;
  background-color: ${props => props.variant === 'primary' ? '#000000' : '#333333'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#333333' : '#000000'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

function App() {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [modifiedProducts, setModifiedProducts] = useState([]);
  const [modifiedNodes, setModifiedNodes] = useState(new Set());
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('App mounted, loading XML file...');
    loadXMLFile();
  }, []);

  const loadXMLFile = async () => {
    console.log('Rozpoczynam ładowanie pliku XML...');
    const result = await parseXMLFile('products_export.xml');
    console.log('Wynik parsowania:', result);
    setModifiedProducts(result.products);
    setNodes(result.menuNodes);
    if (result.menuNodes.length > 0) {
      setSelectedNode(result.menuNodes[0]);
    }
  };

  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    const nodeProducts = modifiedProducts.filter(product => 
      product.menuItems.some(item => item.textId === node)
    );
    
    if (nodeProducts.length > 0) {
      const sorted = nodeProducts.sort((a, b) => {
        const aPriority = a.menuItems.find(item => item.textId === node)?.level || 0;
        const bPriority = b.menuItems.find(item => item.textId === node)?.level || 0;
        return aPriority - bPriority;
      });
      
      setFilteredProducts([...sorted]);
    } else {
      setFilteredProducts([]);
    }
  }, [modifiedProducts]);

  const handleProductsReorder = useCallback((newProducts) => {
    if (!selectedNode) return;

    setModifiedNodes(prev => new Set([...prev, selectedNode]));

    const newFilteredProducts = newProducts.map((product, index) => ({
      ...product,
      menuItems: product.menuItems.map(item => ({
        ...item,
        level: item.textId === selectedNode ? index + 1 : item.level
      }))
    }));

    setFilteredProducts(newFilteredProducts);
    setModifiedProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      newFilteredProducts.forEach(filteredProduct => {
        const index = updatedProducts.findIndex(p => p.id === filteredProduct.id);
        if (index !== -1) {
          updatedProducts[index] = {
            ...updatedProducts[index],
            menuItems: filteredProduct.menuItems
          };
        }
      });
      return updatedProducts;
    });
  }, [selectedNode]);

  const handleSave = () => {
    try {
      if (!modifiedProducts.length) {
        throw new Error('Brak produktów do zapisania');
      }

      let currentXML = modifiedProducts[0].__originalXML;

      [...modifiedNodes].forEach(node => {
        const nodeProducts = modifiedProducts.filter(product => 
          product.menuItems.some(item => item.textId === node)
        ).sort((a, b) => {
          const aPriority = a.menuItems.find(item => item.textId === node)?.level || 0;
          const bPriority = b.menuItems.find(item => item.textId === node)?.level || 0;
          return aPriority - bPriority;
        });

        currentXML = generateNewXML(
          [{ __originalXML: currentXML }],
          nodeProducts,
          node
        );
      });

      const blob = new Blob([currentXML], { type: 'text/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'updated_products.xml';
      a.click();
      window.URL.revokeObjectURL(url);

      setModifiedNodes(new Set());
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      alert(error.message || 'Wystąpił błąd podczas zapisywania pliku.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const text = await file.text();
        console.log('Wczytywanie pliku XML...');
        const result = await parseXMLFile(text, true);
        setModifiedProducts(result.products);
        setNodes(result.menuNodes);
        setSelectedNode(null);
        setFilteredProducts([]);
        event.target.value = '';
      } catch (error) {
        console.error('Błąd podczas wczytywania pliku:', error);
        alert(error.message || 'Wystąpił błąd podczas wczytywania pliku. Sprawdź format pliku XML.');
        event.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (selectedNode) {
      handleNodeSelect(selectedNode);
    }
  }, [selectedNode, handleNodeSelect]);

  return (
    <AppContainer>
      <SidebarContainer>
        <FileInput 
          type="file" 
          ref={fileInputRef}
          accept=".xml"
          onChange={handleFileUpload}
        />
        <ActionButton 
          variant="secondary"
          onClick={handleUploadClick}
        >
          Wgraj nowy plik XML
        </ActionButton>
        <MenuSelector 
          nodes={nodes}
          activeNode={selectedNode}
          onSelect={handleNodeSelect}
        />
        <ActionButton 
          variant="primary"
          onClick={handleSave}
          disabled={!selectedNode || filteredProducts.length === 0}
        >
          Zapisz kolejność
        </ActionButton>
      </SidebarContainer>
      <MainContent>
        {selectedNode && (
          <ProductGrid 
            products={filteredProducts} 
            onProductsReorder={handleProductsReorder}
          />
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;

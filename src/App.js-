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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const InitialMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 40px;
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
  const [products, setProducts] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [modifiedProducts, setModifiedProducts] = useState([]);
  const [modifiedNodes, setModifiedNodes] = useState(new Set());
  const fileInputRef = useRef(null);

  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    const nodeProducts = modifiedProducts.filter(product => 
      product.menuItems.some(item => item.textId === node)
    );
    
    if (nodeProducts.length > 0) {
      const sorted = nodeProducts.sort((a, b) => {
        // Najpierw porównujemy priorytety
        const aPriority = a.menuItems.find(item => item.textId === node)?.level || 0;
        const bPriority = b.menuItems.find(item => item.textId === node)?.level || 0;
        
        if (bPriority !== aPriority) {
          return bPriority - aPriority; // Wyższy priorytet na górze
        }
        
        // Jeśli priorytety są równe, sortujemy po ID (wyższe ID wyżej)
        return parseInt(b.id) - parseInt(a.id);
      });
      
      setFilteredProducts([...sorted]);
    } else {
      setFilteredProducts([]);
    }
  }, [modifiedProducts]);

  const handleProductsReorder = useCallback((newProducts) => {
    if (!selectedNode) return;

    console.log('Selected node:', selectedNode);
    console.log('Modified nodes before:', [...modifiedNodes]);

    setModifiedNodes(prev => {
      const newNodes = new Set([...prev, selectedNode]);
      console.log('Current node path:', selectedNode);
      
      if (selectedNode === 'SKLEP' || selectedNode === 'SKLEP\\Zobacz Wszystko') {
        const relatedNode = selectedNode === 'SKLEP' ? 'SKLEP\\Zobacz Wszystko' : 'SKLEP';
        newNodes.add(relatedNode);
      }
      if (selectedNode.endsWith('\\Kamizelki')) {
        console.log('Adding Kamizelki node');
        newNodes.add(selectedNode);
      }
      
      console.log('Modified nodes after:', [...newNodes]);
      return newNodes;
    });

    const startPriority = 930;
    
    setModifiedProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      
      newProducts.forEach((product, index) => {
        const productIndex = updatedProducts.findIndex(p => p.id === product.id);
        if (productIndex === -1) return;
        
        const newPriority = startPriority - index;
        
        console.log('Product before update:', {
          id: product.id,
          menuItems: updatedProducts[productIndex].menuItems.map(i => ({
            textId: i.textId,
            level: i.level
          }))
        });
        
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          menuItems: updatedProducts[productIndex].menuItems.map(item => {
            if (item.textId === selectedNode) {
              console.log(`Updating priority for ${product.id} in node ${selectedNode} to ${newPriority}`);
              return { ...item, level: newPriority };
            }
            if ((selectedNode === 'SKLEP' && item.textId === 'SKLEP\\Zobacz Wszystko') ||
                (selectedNode === 'SKLEP\\Zobacz Wszystko' && item.textId === 'SKLEP')) {
              return { ...item, level: newPriority };
            }
            return item;
          })
        };

        console.log('Product after update:', {
          id: product.id,
          menuItems: updatedProducts[productIndex].menuItems.map(i => ({
            textId: i.textId,
            level: i.level
          }))
        });
      });

      console.log('Updated products:', updatedProducts.map(p => ({
        id: p.id,
        menuItems: p.menuItems.map(i => ({
          textId: i.textId,
          level: i.level
        }))
      })));

      return updatedProducts;
    });

    const updatedFilteredProducts = newProducts.map((product, index) => ({
      ...product,
      menuItems: product.menuItems.map(item => {
        if (item.textId === selectedNode) {
          return {
            ...item,
            level: startPriority - index
          };
        }
        if ((selectedNode === 'SKLEP' && item.textId === 'SKLEP\\Zobacz Wszystko') ||
            (selectedNode === 'SKLEP\\Zobacz Wszystko' && item.textId === 'SKLEP')) {
          return {
            ...item,
            level: startPriority - index
          };
        }
        return item;
      })
    })).sort((a, b) => {
      const aPriority = a.menuItems.find(item => item.textId === selectedNode)?.level || 0;
      const bPriority = b.menuItems.find(item => item.textId === selectedNode)?.level || 0;
      
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }
      
      return parseInt(b.id) - parseInt(a.id);
    });

    setFilteredProducts(updatedFilteredProducts);
  }, [selectedNode, modifiedNodes]);

  const handleSave = () => {
    try {
      if (!modifiedProducts.length) {
        throw new Error('Brak produktów do zapisania');
      }

      let currentXML = modifiedProducts[0].__originalXML;
      const allNodes = [...modifiedNodes];

      // Generujemy XML tylko raz, przekazując wszystkie zmodyfikowane węzły
      currentXML = generateNewXML(
        [{ __originalXML: currentXML }],
        modifiedProducts,
        allNodes
      );

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
        const { products: parsedProducts, menuNodes } = await parseXMLFile(text, true);
        setProducts(parsedProducts);
        setModifiedProducts(parsedProducts);
        setNodes(menuNodes);
        setSelectedNode(null);
        setFilteredProducts([]);
        setModifiedNodes(new Set());
        event.target.value = '';
      } catch (error) {
        console.error('Błąd podczas wczytywania pliku:', error);
        alert('Wystąpił błąd podczas wczytywania pliku XML');
        event.target.value = '';
      }
    }
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
          onClick={() => fileInputRef.current?.click()}
        >
          {products ? 'Wgraj nowy plik XML' : 'Wgraj plik XML'}
        </ActionButton>
        {products && (
          <>
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
          </>
        )}
      </SidebarContainer>
      <MainContent>
        {!products ? (
          <InitialMessage>
            Wgraj plik XML aby rozpocząć pracę
          </InitialMessage>
        ) : selectedNode ? (
          <ProductGrid 
            products={filteredProducts} 
            onProductsReorder={handleProductsReorder}
            selectedNode={selectedNode}
          />
        ) : (
          <InitialMessage>
            Wybierz kategorię z menu po lewej stronie
          </InitialMessage>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;

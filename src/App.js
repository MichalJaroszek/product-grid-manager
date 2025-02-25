import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { IdoSellService } from './services/idosellApi';
import ProductGrid from './components/ProductGrid';
import MenuSelector from './components/MenuSelector';

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
`;

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  width: 100%;
`;

const InitialMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 40px;
`;

const FileInput = styled.input`
  display: none;
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

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#333333' : '#000000'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-size: 14px;
`;

const TestModeIndicator = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ff4444;
  color: white;
  text-align: center;
  padding: 5px;
  font-weight: bold;
  z-index: 1000;
`;

const LoadingIndicator = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 1000;
`;

const App = () => {
  const [products, setProducts] = useState([]);
  const [modifiedProducts, setModifiedProducts] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);
  const [nodes, setNodes] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [modifiedNodes, setModifiedNodes] = useState(new Set());
  const [categoryChanges, setCategoryChanges] = useState({});

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idoSellService = new IdoSellService();
      const products = await idoSellService.getProducts();
      
      // Sprawdź duplikaty przed transformacją
      const idCounts = {};
      products.forEach(p => {
        idCounts[p.productId] = (idCounts[p.productId] || 0) + 1;
      });
      
      const duplicates = Object.entries(idCounts)
        .filter(([_, count]) => count > 1)
        .map(([id]) => id);
      
      if (duplicates.length > 0) {
        console.warn('Znaleziono duplikaty ID:', duplicates);
      }

      const transformedProducts = products.map(product => ({
        id: product.productId,
        iconUrl: product.productIcon?.productIconLargeUrl || product.productIcon?.productIconSmallUrl,
        codeOnCard: product.productDisplayedCode,
        menuItems: product.productMenu.map(menu => {
          const polishDesc = menu.menuItemDescriptionsLangData.find(
            lang => lang.langId === 'pol'
          );
          return {
            textId: polishDesc?.menuItemTextId || '',
            name: polishDesc?.menuItemName || '',
            level: product.productPriority,
            menuItemId: menu.menuItemId
          };
        })
      }));

      setProducts(transformedProducts);
      setModifiedProducts(transformedProducts);
      
      const allNodes = Array.from(new Set(
        transformedProducts.flatMap(p => p.menuItems.map(i => i.textId))
      )).sort();
      setNodes(allNodes);
    } catch (error) {
      console.error('Błąd podczas ładowania produktów:', error);
      setError('Wystąpił błąd podczas ładowania produktów');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      const updates = modifiedProducts.flatMap(product => 
        product.menuItems.map(item => ({
          productId: product.id,
          nodeId: item.menuItemId,
          priority: item.level
        }))
      );

      const idoSellService = new IdoSellService();
      
      if (window.confirm('Czy na pewno chcesz zapisać zmiany?')) {
        await idoSellService.updateProductPriorities(updates);
        setProducts(prev => {
          const updated = [...prev];
          modifiedProducts.forEach(modifiedProduct => {
            const index = updated.findIndex(p => p.id === modifiedProduct.id);
            if (index !== -1) {
              updated[index] = modifiedProduct;
            }
          });
          return updated;
        });
        alert('Zmiany zostały zapisane');
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      alert('Wystąpił błąd podczas zapisywania zmian');
    }
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    if (categoryChanges[node]) {
      setModifiedProducts(categoryChanges[node]);
    } else {
      setModifiedProducts(products);
    }
  };

  const handleProductsReorder = useCallback((reorderedProducts) => {
    console.log('Aktualizacja kolejności produktów:', reorderedProducts);
    setModifiedProducts(reorderedProducts);
    if (selectedNode) {
      setCategoryChanges(prev => ({
        ...prev,
        [selectedNode]: reorderedProducts
      }));
    }
  }, [selectedNode]);

  const filteredProducts = selectedNode
    ? modifiedProducts.filter(product => 
        product.menuItems.some(item => item.textId === selectedNode)
      )
    : [];

  return (
    <>
      <TestModeIndicator>
        TRYB TESTOWY - Zmiany nie będą zapisywane w sklepie
      </TestModeIndicator>
      {isLoading && (
        <LoadingIndicator>
          Ładowanie produktów...
        </LoadingIndicator>
      )}
      <AppContainer>
        <SidebarContainer>
          <FileInput 
            type="file" 
            ref={fileInputRef}
            accept=".xml"
            onChange={() => {}} // tymczasowo puste
          />
          <ActionButton 
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {products.length ? 'Wgraj nowy plik XML' : 'Wgraj plik XML'}
          </ActionButton>

          <ActionButton 
            variant="secondary"
            onClick={loadProducts}
            disabled={isLoading}
          >
            {isLoading ? 'Ładowanie...' : 'Pobierz produkty z API'}
          </ActionButton>

          {products.length > 0 && (
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

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}
        </SidebarContainer>

        <MainContent>
          {!products.length ? (
            <InitialMessage>
              Wgraj plik XML lub pobierz produkty z API aby rozpocząć pracę
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
    </>
  );
};

export default App; 
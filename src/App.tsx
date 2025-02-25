import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { IdoSellService } from './services/idosellApi';
import { Product } from './types/idosell';
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

const FileInput = styled.input`
  display: none;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
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

interface TransformedProduct {
  id: string;
  iconUrl?: string;
  codeOnCard?: string;
  menuItems: {
    textId: string;
    name: string;
    level: number;
    menuItemId: number;
  }[];
}

const App = () => {
  const [products, setProducts] = useState<TransformedProduct[]>([]);
  const [modifiedProducts, setModifiedProducts] = useState<TransformedProduct[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [modifiedNodes, setModifiedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [nodes, setNodes] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idoSellService = new IdoSellService();
      const products = await idoSellService.getProducts();
      
      const transformedProducts = products.map(product => ({
        id: product.productId,
        iconUrl: product.iconUrl,
        codeOnCard: product.codeOnCard,
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
      await idoSellService.updateProductPriorities(updates);
      
      alert('Zmiany zostały zapisane');
      setModifiedNodes(new Set());
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      alert('Wystąpił błąd podczas zapisywania zmian');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Implementation of handleFileUpload
  };

  const handleNodeSelect = (node: string) => {
    setSelectedNode(node);
  };

  const handleProductsReorder = (reorderedProducts: TransformedProduct[]) => {
    setModifiedProducts(reorderedProducts);
  };

  const filteredProducts = products.filter(product => selectedNode === null || product.menuItems.some(item => item.textId === selectedNode));

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

        <ActionButton 
          variant="secondary"
          onClick={loadProducts}
          disabled={isLoading}
        >
          {isLoading ? 'Ładowanie...' : 'Pobierz produkty z API'}
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

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
      </SidebarContainer>

      <MainContent>
        {!products ? (
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
  );
};

const ErrorMessage = styled.div`
  color: #dc3545;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-size: 14px;
`;

export default App; 
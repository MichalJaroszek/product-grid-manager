import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { parseXMLFile } from './utils/xmlParser';
import ProductGrid from './components/ProductGrid';
import MenuSelector from './components/MenuSelector';
import { fetchProductsFromShop, updateProductPriorities } from './utils/idoSellAPI';

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
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
  padding: 10px 20px;
  background-color: ${props => props.variant === 'primary' ? '#4CAF50' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#45a049' : '#1976D2'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

function App() {
  const [products, setProducts] = useState([]);
  const [menuNodes, setMenuNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [shopConfig, setShopConfig] = useState(() => {
    const saved = localStorage.getItem('shopConfig');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shopConfig) {
      loadProductsFromShop();
    }
  }, [shopConfig]);

  const loadProductsFromShop = async () => {
    try {
      console.log('Rozpoczynam ładowanie produktów ze sklepu...');
      const xmlData = await fetchProductsFromShop(shopConfig);
      const result = await parseXMLFile(xmlData, true);
      setProducts(result.products);
      setMenuNodes(result.menuNodes);
    } catch (error) {
      console.error('Błąd podczas wczytywania produktów:', error);
      alert('Wystąpił błąd podczas wczytywania produktów. Sprawdź konsolę po więcej szczegółów.');
    }
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    const nodeProducts = products.filter(product => 
      product.menuItems.some(item => item.textId === nodeId)
    );
    
    const sorted = nodeProducts.sort((a, b) => {
      const aPriority = a.menuItems.find(item => item.textId === nodeId).level;
      const bPriority = b.menuItems.find(item => item.textId === nodeId).level;
      return bPriority - aPriority;
    });
    
    setFilteredProducts(sorted);
  };

  const handleProductsReorder = (newFilteredProducts) => {
    const updatedProducts = [...products];
    
    newFilteredProducts.forEach((product, index) => {
      const newPriority = 999 - index;
      const productToUpdate = updatedProducts.find(p => p.id === product.id);
      if (productToUpdate) {
        productToUpdate.menuItems = productToUpdate.menuItems.map(item => {
          if (item.textId === selectedNode) {
            return { ...item, level: newPriority };
          }
          return item;
        });
      }
    });

    setProducts(updatedProducts);
    setFilteredProducts(newFilteredProducts);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await updateProductPriorities(shopConfig.shopId, products);
      alert('Kolejność produktów została zaktualizowana!');
    } catch (error) {
      setError('Nie udało się zaktualizować kolejności produktów');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!shopConfig) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Konfiguracja sklepu</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const config = {
            shopId: e.target.shopId.value,
            login: e.target.login.value,
            apiKey: e.target.apiKey.value
          };
          localStorage.setItem('shopConfig', JSON.stringify(config));
          setShopConfig(config);
        }}>
          <div>
            <label>ID Sklepu: </label>
            <input name="shopId" required />
          </div>
          <div>
            <label>Login WebAPI: </label>
            <input name="login" required />
          </div>
          <div>
            <label>Klucz API: </label>
            <input name="apiKey" type="password" required />
          </div>
          <button type="submit">Zapisz</button>
        </form>
      </div>
    );
  }

  return (
    <AppContainer>
      <SidebarContainer>
        <ActionButton 
          variant="secondary"
          onClick={loadProductsFromShop}
          disabled={isLoading}
        >
          Odśwież produkty
        </ActionButton>
        <MenuSelector 
          nodes={menuNodes} 
          onSelect={handleNodeSelect} 
          activeNode={selectedNode} 
        />
        <ActionButton 
          variant="primary"
          onClick={handleSave}
          disabled={isLoading || !selectedNode || filteredProducts.length === 0}
        >
          {isLoading ? 'Zapisywanie...' : 'Zapisz kolejność'}
        </ActionButton>
      </SidebarContainer>
      <MainContent>
        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </div>
        )}
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

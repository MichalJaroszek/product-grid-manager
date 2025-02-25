import React, { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GridContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ProductCounter = styled.div`
  padding: 10px 20px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const Grid = styled.div`
  width: 100%;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  align-content: start;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
`;

const ProductItem = styled.div`
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  
  &:hover {
    background: #f8f8f8;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  &:active {
    cursor: grabbing;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 240px;
  object-fit: contain;
  border-radius: 4px;
  background: #f5f5f5;
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductId = styled.div`
  font-size: 14px;
  color: #333;
`;

const ProductCode = styled.div`
  font-size: 12px;
  color: #666;
`;

const ProductPriority = styled.div`
  font-size: 14px;
  color: #007bff;
  font-weight: 500;
  margin-top: 2px;
`;

const NoImagePlaceholder = styled.div`
  width: 100%;
  height: 240px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #999;
  font-size: 13px;
`;

const SortableItem = ({ product, selectedNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: product.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const menuItem = product.menuItems.find(item => item.textId === selectedNode);
  const priority = menuItem ? menuItem.level : 'N/A';

  return (
    <ProductItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {product.iconUrl ? (
        <ProductImage 
          src={product.iconUrl} 
          alt="Product"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : (
        <NoImagePlaceholder>Brak zdjęcia</NoImagePlaceholder>
      )}
      <ProductInfo>
        <ProductId>ID: {product.id}</ProductId>
        {product.codeOnCard && (
          <ProductCode>Kod: {product.codeOnCard}</ProductCode>
        )}
        <ProductPriority>Priorytet: {priority}</ProductPriority>
      </ProductInfo>
    </ProductItem>
  );
};

const ProductGrid = ({ products, onProductsReorder, selectedNode }) => {
  const [items, setItems] = useState([]);

  const sortProducts = useCallback((products) => {
    return [...products].sort((a, b) => {
      const aLevel = a.menuItems.find(item => item.textId === selectedNode)?.level || 0;
      const bLevel = b.menuItems.find(item => item.textId === selectedNode)?.level || 0;
      return bLevel - aLevel;
    });
  }, [selectedNode]);

  useEffect(() => {
    setItems(sortProducts(products));
  }, [products, selectedNode, sortProducts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 0,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    console.log('Rozpoczynam przenoszenie:', {
      activeId: active.id,
      overId: over.id
    });

    const oldIndex = items.findIndex(p => p.id === active.id);
    const newIndex = items.findIndex(p => p.id === over.id);

    console.log('Indeksy:', { oldIndex, newIndex });

    const newItems = [...items];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    // Aktualizuj lokalny stan
    setItems(newItems);

    // Aktualizuj priorytety i przekaż do rodzica
    const updatedItems = newItems.map((item, index) => {
      const newItem = {
        ...item,
        menuItems: item.menuItems.map(menuItem => ({
          ...menuItem,
          level: menuItem.textId === selectedNode 
            ? items.length - index 
            : menuItem.level
        }))
      };
      return newItem;
    });

    console.log('Wysyłam zaktualizowane produkty:', updatedItems);
    onProductsReorder(updatedItems);
  };

  return (
    <GridContainer>
      <ProductCounter>
        Liczba produktów w kategorii: {products.length}
      </ProductCounter>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Grid>
          <SortableContext
            items={items.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            {items.map((product) => (
              <SortableItem 
                key={product.id} 
                product={product}
                selectedNode={selectedNode}
              />
            ))}
          </SortableContext>
        </Grid>
      </DndContext>
    </GridContainer>
  );
};

export default ProductGrid; 
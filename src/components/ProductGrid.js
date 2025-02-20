import React from 'react';
import styled from '@emotion/styled';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GridContainer = styled.div`
  padding: 20px;
  min-height: 200px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const ProductList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
`;

const ProductItem = styled.div`
  border: 1px solid #e0e0e0;
  padding: 15px;
  text-align: center;
  background: white;
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  touch-action: none;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-width: 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    border-color: #000000;
  }
`;

const ProductCount = styled.div`
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const ProductId = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;
`;

const ProductCode = styled.div`
  margin: 12px 0 8px;
  font-size: 13px;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const SortableItem = React.memo(({ product }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: product.sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ProductItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ImageContainer>
        <ProductImage 
          src={product.iconUrl} 
          alt={`Product ${product.id}`}
          loading="lazy"
        />
      </ImageContainer>
      <ProductCode>
        Index: {product.codeOnCard}
      </ProductCode>
      <ProductId>ID: {product.id}</ProductId>
    </ProductItem>
  );
});

function ProductGrid({ products, onProductsReorder }) {
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  
  // Używamy useSensors zamiast useMemo
  const sensors = useSensors(mouseSensor, touchSensor);

  const sortableItems = React.useMemo(() => 
    products.map(product => ({
      ...product,
      sortableId: `sortable-${product.id}`
    }))
  , [products]);

  const handleDragEnd = React.useCallback((event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = sortableItems.findIndex(p => p.sortableId === active.id);
      const newIndex = sortableItems.findIndex(p => p.sortableId === over.id);
      onProductsReorder(arrayMove(products, oldIndex, newIndex));
    }
  }, [sortableItems, products, onProductsReorder]);

  if (!products?.length) {
    return <GridContainer>Wybierz kategorię, aby zobaczyć produkty</GridContainer>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <GridContainer>
        <ProductCount>
          Liczba produktów w kategorii: {products.length}
        </ProductCount>
        <SortableContext
          items={sortableItems.map(p => p.sortableId)}
          strategy={verticalListSortingStrategy}
        >
          <ProductList>
            {sortableItems.map((product) => (
              <SortableItem
                key={product.sortableId}
                product={product}
              />
            ))}
          </ProductList>
        </SortableContext>
      </GridContainer>
    </DndContext>
  );
}

export default React.memo(ProductGrid); 
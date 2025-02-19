import React from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GridContainer = styled.div`
  padding: 20px;
  min-height: 200px;
  border: 1px solid #eee;
`;

const ProductList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
`;

const ProductItem = styled.div`
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
  background: white;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s;
  box-sizing: border-box;
  touch-action: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
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

const PositionIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
`;

const ProductId = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #666;
  font-weight: bold;
`;

function SortableItem({ product, index, productsCount }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: product.id.toString() });

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
        <PositionIndicator>
          Pozycja: {index + 1}/{productsCount}
        </PositionIndicator>
        <ProductImage src={product.iconUrl} alt={`Product ${product.id}`} />
      </ImageContainer>
      <ProductId>ID: {product.id}</ProductId>
    </ProductItem>
  );
}

function ProductGrid({ products, onProductsReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!products || products.length === 0) {
    return <GridContainer>Wybierz kategorię, aby zobaczyć produkty</GridContainer>;
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = products.findIndex(p => p.id.toString() === active.id);
      const newIndex = products.findIndex(p => p.id.toString() === over.id);
      
      const newProducts = arrayMove(products, oldIndex, newIndex);
      onProductsReorder(newProducts);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <GridContainer>
        <SortableContext
          items={products.map(p => p.id.toString())}
          strategy={rectSortingStrategy}
        >
          <ProductList>
            {products.map((product, index) => (
              <SortableItem
                key={product.id}
                product={product}
                index={index}
                productsCount={products.length}
              />
            ))}
          </ProductList>
        </SortableContext>
      </GridContainer>
    </DndContext>
  );
}

export default ProductGrid; 
import React from 'react';
import styled from '@emotion/styled';

const MenuContainer = styled.div`
  margin: 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const MenuTitle = styled.h2`
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MenuItem = styled.div`
  padding: 10px;
  cursor: pointer;
  background-color: ${props => props.selected ? '#f5f5f5' : 'white'};
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: ${props => props.selected ? '#000000' : '#333333'};
  border: 1px solid ${props => props.selected ? '#000000' : '#e0e0e0'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.selected ? '#f5f5f5' : '#f8f8f8'};
    border-color: ${props => props.selected ? '#000000' : '#cccccc'};
  }
`;

const MenuSelector = ({ nodes, activeNode, onSelect }) => {
  return (
    <MenuContainer>
      <MenuTitle>Menu</MenuTitle>
      <MenuList>
        {nodes.map((node) => (
          <MenuItem
            key={node}
            selected={node === activeNode}
            onClick={() => onSelect(node)}
          >
            {node}
          </MenuItem>
        ))}
      </MenuList>
    </MenuContainer>
  );
};

export default MenuSelector; 
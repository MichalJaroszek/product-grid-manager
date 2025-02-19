import React from 'react';
import styled from '@emotion/styled';

const MenuContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  padding: 12px 15px;
  background: ${props => props.active ? '#4CAF50' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.active ? '#45a049' : '#f5f5f5'};
  }
`;

const MenuTitle = styled.div`
  padding: 15px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  color: #333;
`;

function MenuSelector({ nodes, onSelect, activeNode }) {
  return (
    <MenuContainer>
      <MenuTitle>Kategorie produktów</MenuTitle>
      <MenuList>
        {nodes.map(node => (
          <MenuItem
            key={node}
            active={node === activeNode}
            onClick={() => onSelect(node)}
          >
            {node}
          </MenuItem>
        ))}
      </MenuList>
    </MenuContainer>
  );
}

export default MenuSelector; 
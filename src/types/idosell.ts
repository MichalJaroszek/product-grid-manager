export interface MenuItemDescription {
  langId: string;
  menuItemName: string;
  menuItemTextId: string;
}

export interface MenuItem {
  menuItemId: number;
  shopId: number;
  menuId: number;
  menuItemDescriptionsLangData: MenuItemDescription[];
}

export interface Product {
  productId: string;
  productName: string;
  productIsVisible: string;
  productPriority: number;
  productMenu: MenuItem[];
  iconUrl?: string;
  codeOnCard?: string;
  productIsActive: string;
}

export interface ApiResponse {
  response: {
    products: Product[];
  };
  errors?: {
    faultCode: number;
    faultString: string;
  };
} 
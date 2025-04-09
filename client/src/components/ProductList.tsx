import { List, ListItem, ListItemText, Typography } from '@mui/material';

interface Product {
  _id?: string;
  name: string;
  description?: string;
  price?: number;
  available?: boolean;
}

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  if (!products?.length) return (
    <Typography color="text.secondary" sx={{ p: 2 }}>
      No products or services listed
    </Typography>
  );

  return (
    <List>
      {products.map((product, index) => (
        <ListItem key={product._id || index}>
          <ListItemText
            primary={product.name}
            secondary={
              <>
                {product.description && <span>{product.description}<br /></span>}
                {product.price && <span>Price: ${product.price.toLocaleString()}</span>}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

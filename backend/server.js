const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Init data files
const dataDir = path.join(__dirname, 'data');
['products', 'orders', 'users', 'admin'].forEach(f => {
  const fp = path.join(dataDir, `${f}.json`);
  if (!fs.existsSync(fp)) {
    const defaults = {
      products: [
        { id: '1', name: 'B30 Black', price: 119.90, originalPrice: 180.00, category: 'sneakers', stock: 15, description: 'Sneaker Dior B30 coloris noir, style streetwear premium.', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', brand: 'Dior', badge: 'sale', sizes: ['39','40','41','42','43','44','45'] },
        { id: '2', name: 'B30 Noir & Blanc', price: 119.90, originalPrice: 180.00, category: 'sneakers', stock: 8, description: 'Sneaker Dior B30 bicolore noir et blanc.', image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', brand: 'Dior', badge: 'sale', sizes: ['39','40','41','42','43','44'] },
        { id: '3', name: 'TN Black', price: 61.00, originalPrice: 120.00, category: 'sneakers', stock: 22, description: 'Nike TN Air Max Plus all black.', image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', brand: 'Nike', badge: 'sale', sizes: ['40','41','42','43','44','45'] },
        { id: '4', name: 'N0CTÀ HOT STEP 2 Black', price: 109.90, originalPrice: 239.00, category: 'sneakers', stock: 5, description: 'Nike x NOCTA Hot Step 2, collab exclusive.', image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', brand: 'Nike', badge: 'sale', sizes: ['41','42','43','44'] },
        { id: '5', name: 'Sneaker CHANEL', price: 124.90, originalPrice: 199.99, category: 'sneakers', stock: 3, description: 'Sneaker Chanel blanc & noir, logo CC.', image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600', brand: 'Chanel', badge: 'new', sizes: ['37','38','39','40','41'] },
        { id: '6', name: 'Veste Zip CP - Black', price: 79.90, originalPrice: 109.99, category: 'vetements', stock: 12, description: 'Veste CP Company zippée, coupe moderne.', image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', brand: 'CP Company', badge: 'new', sizes: ['S','M','L','XL','XXL'] },
        { id: '7', name: 'Zip DIOR - White', price: 79.90, originalPrice: 109.99, category: 'vetements', stock: 7, description: 'Veste Dior zippée blanc, édition exclusive.', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', brand: 'Dior', badge: 'new', sizes: ['S','M','L','XL'] },
        { id: '8', name: 'Maillot Concept Real 2024/2025', price: 35.00, originalPrice: 59.00, category: 'maillots', stock: 20, description: 'Maillot concept Real Madrid rose 2024/2025.', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', brand: 'Adidas', badge: 'sale', sizes: ['S','M','L','XL','XXL'] },
        { id: '9', name: 'Maillot Brésil 2025/2026', price: 35.00, originalPrice: 59.00, category: 'maillots', stock: 18, description: 'Maillot concept Brésil blanc édition spéciale.', image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', brand: 'Nike', badge: 'sale', sizes: ['S','M','L','XL'] },
        { id: '10', name: 'Maillot Chelsea 2024/2025', price: 35.00, originalPrice: 59.00, category: 'maillots', stock: 14, description: 'Maillot Chelsea noir avec détails roses.', image_url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600', brand: 'Nike', badge: 'sale', sizes: ['S','M','L','XL','XXL'] },
        { id: '11', name: 'Chaîne Gucci', price: 45.00, originalPrice: 89.00, category: 'accessoires', stock: 9, description: 'Chaîne épaisse style Gucci, finition argentée.', image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', brand: 'Gucci', badge: 'sale', sizes: ['unique'] },
        { id: '12', name: 'AirPods Pro', price: 89.90, originalPrice: 149.00, category: 'technique', stock: 6, description: 'AirPods Pro réplique premium, qualité sonore excellente.', image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600', brand: 'Apple', badge: 'new', sizes: ['unique'] }
      ],
      orders: [],
      users: [],
      admin: {
        username: 'admin',
        passwordHash: '$2a$10$rOzJqMsE1L3XzY8vK7P4.e9N2mQ5R6T1U8V3W0X4Y7Z2A5B8C1D4E', // password: admin123
        totpSecret: null,
        totpEnabled: false
      }
    };
    fs.writeFileSync(fp, JSON.stringify(defaults[f] || [], null, 2));
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// Serve frontend
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

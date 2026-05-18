const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'shopbear_secret_2024';
const ordersFile = path.join(__dirname, '../data/orders.json');
const productsFile = path.join(__dirname, '../data/products.json');
const usersFile = path.join(__dirname, '../data/users.json');

function authOptional(req, res, next) {
  const auth = req.headers.authorization;
  if (auth) {
    try { req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET); } catch {}
  }
  next();
}

router.post('/', authOptional, (req, res) => {
  const { items, shipping, total, paymentMethod } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Panier vide' });

  const products = JSON.parse(fs.readFileSync(productsFile));
  // Deduct stock
  items.forEach(item => {
    const p = products.find(p => p.id === item.id);
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

  const orders = JSON.parse(fs.readFileSync(ordersFile));
  const order = {
    id: uuidv4(),
    items,
    shipping,
    total,
    paymentMethod: paymentMethod || 'card',
    status: 'en_attente',
    userId: req.user?.id || null,
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

  // Add to user orders if logged in
  if (req.user) {
    const users = JSON.parse(fs.readFileSync(usersFile));
    const u = users.find(u => u.id === req.user.id);
    if (u) { u.orders = u.orders || []; u.orders.push(order.id); fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); }
  }

  res.json({ success: true, orderId: order.id, order });
});

router.get('/my', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const orders = JSON.parse(fs.readFileSync(ordersFile));
    res.json(orders.filter(o => o.userId === decoded.id).reverse());
  } catch { res.status(401).json({ error: 'Token invalide' }); }
});

module.exports = router;

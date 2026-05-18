const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '../data/products.json');

router.get('/', (req, res) => {
  const products = JSON.parse(fs.readFileSync(productsFile));
  const { category, search, sort } = req.query;
  let filtered = [...products];
  if (category && category !== 'all') filtered = filtered.filter(p => p.category === category);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'new') filtered = filtered.filter(p => p.badge === 'new').concat(filtered.filter(p => p.badge !== 'new'));
  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const products = JSON.parse(fs.readFileSync(productsFile));
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
});

module.exports = router;

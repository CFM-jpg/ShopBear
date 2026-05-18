const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'shopbear_secret_2024';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'shopbear_admin_2024';
const adminFile = path.join(__dirname, '../data/admin.json');
const productsFile = path.join(__dirname, '../data/products.json');

const upload = multer({ dest: '/tmp/uploads/' });

function getAdmin() { return JSON.parse(fs.readFileSync(adminFile)); }
function saveAdmin(a) { fs.writeFileSync(adminFile, JSON.stringify(a, null, 2)); }
function getProducts() { return JSON.parse(fs.readFileSync(productsFile)); }
function saveProducts(p) { fs.writeFileSync(productsFile, JSON.stringify(p, null, 2)); }

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), ADMIN_SECRET);
    if (!decoded.admin) return res.status(403).json({ error: 'Accès refusé' });
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

// Setup TOTP - generates secret + QR code
router.post('/setup-totp', async (req, res) => {
  const { password } = req.body;
  const admin = getAdmin();
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

  const secret = speakeasy.generateSecret({ name: 'ShopBear Admin', issuer: 'ShopBear' });
  admin.totpSecret = secret.base32;
  admin.totpEnabled = false;
  saveAdmin(admin);

  const qrUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ qrCode: qrUrl, secret: secret.base32 });
});

// Verify TOTP to enable it
router.post('/verify-totp-setup', (req, res) => {
  const { token } = req.body;
  const admin = getAdmin();
  if (!admin.totpSecret) return res.status(400).json({ error: 'TOTP non configuré' });

  const verified = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (!verified) return res.status(400).json({ error: 'Code invalide' });
  admin.totpEnabled = true;
  saveAdmin(admin);
  res.json({ success: true });
});

// Admin login: step 1 password
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const admin = getAdmin();
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
  res.json({ totpRequired: admin.totpEnabled, totpEnabled: admin.totpEnabled });
});

// Admin login: step 2 TOTP
router.post('/login-totp', async (req, res) => {
  const { password, totpToken } = req.body;
  const admin = getAdmin();
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

  if (admin.totpEnabled) {
    const verified = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: 'base32',
      token: totpToken,
      window: 2
    });
    if (!verified) return res.status(401).json({ error: 'Code TOTP invalide' });
  }

  const token = jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Dashboard stats
router.get('/dashboard', adminAuth, (req, res) => {
  const orders = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/orders.json')));
  const products = getProducts();
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'en_attente').length;
  const lowStock = products.filter(p => p.stock < 5);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  res.json({
    todayRevenue: revenue,
    totalRevenue,
    pendingOrders: pending,
    totalOrders: orders.length,
    lowStock,
    recentOrders: orders.slice(-10).reverse()
  });
});

// Import Excel
router.post('/import-excel', adminAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  try {
    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    const products = getProducts();

    let added = 0;
    rows.forEach(row => {
      if (!row.nom || !row.prix) return;
      const product = {
        id: uuidv4(),
        name: row.nom,
        price: parseFloat(row.prix),
        originalPrice: row.prix_original ? parseFloat(row.prix_original) : parseFloat(row.prix),
        category: (row.categorie || 'autre').toLowerCase(),
        stock: parseInt(row.stock) || 0,
        description: row.description || '',
        image_url: row.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        brand: row.marque || '',
        badge: row.badge || null,
        sizes: row.tailles ? row.tailles.split(',').map(s => s.trim()) : ['unique']
      };
      products.push(product);
      added++;
    });

    saveProducts(products);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, added, total: products.length });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lecture fichier: ' + e.message });
  }
});

// CRUD products
router.get('/products', adminAuth, (req, res) => res.json(getProducts()));

router.post('/products', adminAuth, (req, res) => {
  const products = getProducts();
  const product = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  products.push(product);
  saveProducts(products);
  res.json(product);
});

router.put('/products/:id', adminAuth, (req, res) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
  products[idx] = { ...products[idx], ...req.body };
  saveProducts(products);
  res.json(products[idx]);
});

router.delete('/products/:id', adminAuth, (req, res) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== req.params.id);
  saveProducts(filtered);
  res.json({ success: true });
});

// Orders management
router.get('/orders', adminAuth, (req, res) => {
  const orders = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/orders.json')));
  res.json(orders.reverse());
});

router.put('/orders/:id', adminAuth, (req, res) => {
  const ordersFile = path.join(__dirname, '../data/orders.json');
  const orders = JSON.parse(fs.readFileSync(ordersFile));
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Commande introuvable' });
  orders[idx] = { ...orders[idx], ...req.body };
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
  res.json(orders[idx]);
});

// Update stock
router.put('/stock/:id', adminAuth, (req, res) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
  products[idx].stock = parseInt(req.body.stock);
  saveProducts(products);
  res.json(products[idx]);
});

module.exports = router;

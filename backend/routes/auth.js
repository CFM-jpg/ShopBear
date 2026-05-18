const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'shopbear_secret_2024';
const usersFile = path.join(__dirname, '../data/users.json');

function getUsers() { return JSON.parse(fs.readFileSync(usersFile)); }
function saveUsers(u) { fs.writeFileSync(usersFile, JSON.stringify(u, null, 2)); }

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Champs manquants' });
  const users = getUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email déjà utilisé' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, passwordHash: hash, createdAt: new Date().toISOString(), orders: [] };
  users.push(user);
  saveUsers(users);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Verify token
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch { res.status(401).json({ error: 'Token invalide' }); }
});

module.exports = router;

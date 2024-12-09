const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());



// Serve static files from the React frontend
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.get('/api/example', (req, res) => {
  res.json({ message: 'This is an API route' });
});

// Catch-all handler to serve React's index.html for any route not handled by API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// MongoDB connection
mongoose.connect("mongodb+srv://saivarun:nuraV321@cluster0.8quna.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const TodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const User = mongoose.model('User', UserSchema);
const Todo = mongoose.model('Todo', TodoSchema);

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware for authenticating JWT tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(400).json({ message: 'Username already exists' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// GET todos for the authenticated user
app.get('/todos', authenticateToken, async (req, res) => {
  const todos = await Todo.find({ userId: req.user.userId });
  res.json(todos);
});

// POST a new todo
app.post('/todos', authenticateToken, async (req, res) => {
  const newTodo = new Todo({
    userId: req.user.userId,
    text: req.body.text,
    completed: req.body.completed || false,
  });
  await newTodo.save();
  res.status(201).json(newTodo);
});

// PUT update a todo
app.put('/todos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updatedTodo = await Todo.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    req.body,
    { new: true }
  );
  if (!updatedTodo) return res.status(404).json({ message: 'Todo not found' });
  res.json(updatedTodo);
});

// DELETE a todo
app.delete('/todos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId: req.user.userId });
  if (!deletedTodo) return res.status(404).json({ message: 'Todo not found' });
  res.status(204).send();
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

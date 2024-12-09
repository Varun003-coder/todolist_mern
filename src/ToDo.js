import React, { useState, useEffect } from 'react';

function ToDo() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchTodos();
    }
  }, [token]);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/todos', {
        headers: {
          'Authorization': token,
        },
      });
      const data = await response.json();
      setTodos(data);
      setError('');
    } catch (error) {
      setError('Failed to fetch todos.');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ text: newTodo }),
      });
      const data = await response.json();
      setTodos([...todos, data]);
      setNewTodo('');
      setMessage('Task added successfully!');
    } catch (error) {
      setError('Failed to add todo.');
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
        },
      });
      setTodos(todos.filter((todo) => todo._id !== id));
      setMessage('Task deleted successfully!');
    } catch (error) {
      setError('Failed to delete todo.');
    } finally {
      setLoading(false);
    }
  };

  const completeTodo = async (id) => {
    setLoading(true);
    try {
      const todoToUpdate = todos.find(todo => todo._id === id);
      const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };

      const response = await fetch(`http://localhost:5000/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(updatedTodo),
      });
      const data = await response.json();
      setTodos(todos.map((todo) => (todo._id === id ? data : todo)));
      setMessage('Task status updated!');
    } catch (error) {
      setError('Failed to update todo.');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      setMessage('Registration successful, please log in.');
    } catch (error) {
      setError('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setMessage('Login successful!');
    } catch (error) {
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setTodos([]);
    setMessage('Logged out successfully.');
  };

  return (
    <div>
      <h1>To-Do List</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {message && <div style={{ color: 'green' }}>{message}</div>}
      {loading && <div>Loading...</div>}
      {token ? (
        <div>
          <button onClick={logout}>Logout</button>
          <div>
            <input
              type="text"
              placeholder="Add a new task"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
            <button onClick={addTodo} disabled={!newTodo || loading}>Add</button>
          </div>
          <ul>
            {todos.map((todo) => (
              <li key={todo._id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                {todo.text}
                <button onClick={() => completeTodo(todo._id)} disabled={loading}>
                  {todo.completed ? 'Undo' : 'Complete'}
                </button>
                <button onClick={() => deleteTodo(todo._id)} disabled={loading}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <div>
            <label>Username:</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button onClick={register} disabled={loading || !username || !password}>Register</button>
            <button onClick={login} disabled={loading || !username || !password}>Login</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToDo;

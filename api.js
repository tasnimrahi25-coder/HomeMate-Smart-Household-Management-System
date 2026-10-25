const Api = (() => {
  const KEY = 'homemate_db';
  const SESSION = 'homemate_session';
  const RESOURCES = ['grocery', 'expenses', 'expiry', 'chores', 'maintenance', 'bills', 'recipes'];

  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const load = () => JSON.parse(localStorage.getItem(KEY) || '{"users":[],"data":{}}');
  const save = db => localStorage.setItem(KEY, JSON.stringify(db));

  function seed() {
    return {
      grocery: [
        { id: uid(), name: 'Milk', status: 'purchased', date: day(0) },
        { id: uid(), name: 'Eggs', status: 'purchased', date: day(0) },
        { id: uid(), name: 'Rice', status: 'pending', date: day(1) },
        { id: uid(), name: 'Vegetables', status: 'pending', date: day(2) },
        { id: uid(), name: 'Bread', status: 'pending', date: day(2) },
      ],
      expenses: [
        { id: uid(), title: 'Food', category: 'Food', amount: 3000, date: day(-2) },
        { id: uid(), title: 'Grocery', category: 'Grocery', amount: 2100, date: day(-3) },
        { id: uid(), title: 'Bills', category: 'Bills', amount: 1700, date: day(-5) },
        { id: uid(), title: 'Maintenance', category: 'Maintenance', amount: 850, date: day(-6) },
        { id: uid(), title: 'Others', category: 'Others', amount: 850, date: day(-7) },
      ],
      expiry: [
        { id: uid(), name: 'Milk', expiry: day(1) },
        { id: uid(), name: 'Eggs', expiry: day(2) },
        { id: uid(), name: 'Bread', expiry: day(3) },
        { id: uid(), name: 'Vegetables', expiry: day(5) },
        { id: uid(), name: 'Yogurt', expiry: day(10) },
      ],
      chores: [
        { id: uid(), title: 'Clean Kitchen', who: 'Family', done: true },
        { id: uid(), title: 'Wash Clothes', who: 'Family', done: true },
        { id: uid(), title: 'Clean Bathroom', who: 'Family', done: false },
        { id: uid(), title: 'Water Plants', who: 'Me', done: false },
      ],
      maintenance: [
        { id: uid(), item: 'AC Service', next: day(10), status: 'Upcoming' },
        { id: uid(), item: 'Refrigerator', next: day(17), status: 'Upcoming' },
        { id: uid(), item: 'Water Filter', next: day(25), status: 'Upcoming' },
      ],
      bills: [
        { id: uid(), name: 'Electricity', amount: 2500, status: 'Paid', due: day(-5) },
        { id: uid(), name: 'Internet', amount: 1000, status: 'Paid', due: day(-4) },
        { id: uid(), name: 'Water', amount: 500, status: 'Paid', due: day(-3) },
        { id: uid(), name: 'Gas', amount: 1200, status: 'Pending', due: day(3) },
      ],
      recipes: [
        { id: uid(), name: 'Pasta', emoji: '🍝', time: 30, level: 'Easy', category: 'Lunch', ingredients: ['Flour', 'Tomato', 'Onion'] },
        { id: uid(), name: 'Chicken Curry', emoji: '🍛', time: 45, level: 'Medium', category: 'Dinner', ingredients: ['Chicken', 'Onion', 'Tomato'] },
        { id: uid(), name: 'Vegetable Salad', emoji: '🥗', time: 15, level: 'Easy', category: 'Snacks', ingredients: ['Vegetables', 'Tomato', 'Onion'] },
        { id: uid(), name: 'Omelette', emoji: '🍳', time: 20, level: 'Easy', category: 'Breakfast', ingredients: ['Eggs', 'Onion'] },
        { id: uid(), name: 'Fried Rice', emoji: '🍚', time: 25, level: 'Medium', category: 'Dinner', ingredients: ['Rice', 'Eggs', 'Vegetables'] },
        { id: uid(), name: 'Pancakes', emoji: '🥞', time: 20, level: 'Easy', category: 'Breakfast', ingredients: ['Flour', 'Eggs', 'Milk'] },
      ],
    };
  }

  const wait = v => new Promise(r => setTimeout(() => r(v), 80));
  const fail = m => Promise.reject(new Error(m));

  const me = () => localStorage.getItem(SESSION);
  const userData = db => db.data[me()];

  return {
    register({ name, email, password }) {           
      const db = load();
      if (!name || !email || password.length < 6) return fail('Name, E-mail & 6 dizit password');
      if (db.users.find(u => u.email === email)) return fail('E-mail already exists');
      const user = { id: uid(), name, email, password, phone: '', settings: { notifications: true, dark: false } };
      db.users.push(user);
      db.data[user.id] = seed();
      save(db);
      localStorage.setItem(SESSION, user.id);
      return wait(user);
    },
    login({ email, password }) {                  
      const u = load().users.find(x => x.email === email && x.password === password);
      if (!u) return fail('Incorrect');
      localStorage.setItem(SESSION, u.id);
      return wait(u);
    },
    logout() { localStorage.removeItem(SESSION); },
    currentUser() { return load().users.find(u => u.id === me()) || null; },
    
  
    list(res) {                              
      const db = load();
      return wait(userData(db)[res] || []);
    },
    create(res, body) {                           
      const db = load();
      const item = { id: uid(), ...body };
      userData(db)[res].push(item);
      save(db);
      return wait(item);
    },
    update(res, id, patch) {                    
      const db = load();
      const it = userData(db)[res].find(x => x.id === id);
      if (!it) return fail('Not found');
      Object.assign(it, patch);
      save(db);
      return wait(it);
    },
    remove(res, id) {                              
      const db = load();
      userData(db)[res] = userData(db)[res].filter(x => x.id !== id);
      save(db);
      return wait(true);
    },

  
    async dashboard() {                             
      const d = userData(load());
      const today = day(0);
      const daysLeft = s => Math.round((new Date(s) - new Date(today)) / 864e5);
      const expiring = d.expiry.map(e => ({ ...e, left: daysLeft(e.expiry) }))
        .filter(e => e.left >= 0 && e.left <= 7).sort((a, b) => a.left - b.left);
      const byCat = {};
      d.expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount));
      return wait({
        totalExpense: d.expenses.reduce((s, e) => s + Number(e.amount), 0),
        groceryItems: d.grocery.filter(g => g.status === 'pending').length,
        pendingChores: d.chores.filter(c => !c.done).length,
        expiringSoon: expiring.length,
        upcomingExpiry: expiring.slice(0, 4),
        byCategory: byCat,
      });
    },

    RESOURCES,
  };
<<<<<<< HEAD
})();
=======
})();
>>>>>>> 5caafcad7904b8cb41ba1c8f9c3c9c430f8a1d49

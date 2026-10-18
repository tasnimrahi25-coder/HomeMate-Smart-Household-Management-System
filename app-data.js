(() => {
  const STORAGE_KEY = "homemate.groceries";
  const DEFAULT_GROCERIES = [
    { id: "milk", name: "Milk", purchased: true, date: "12 May" },
    { id: "eggs", name: "Eggs", purchased: true, date: "12 May" },
    { id: "rice", name: "Rice", purchased: false, date: "13 May" },
    { id: "vegetables", name: "Vegetables", purchased: false, date: "14 May" },
    { id: "bread", name: "Bread", purchased: false, date: "14 May" },
    { id: "chicken", name: "Chicken", purchased: false, date: "15 May" },
    { id: "apples", name: "Apples", purchased: true, date: "16 May" },
    { id: "butter", name: "Butter", purchased: true, date: "16 May" }
  ];

  function getGroceries() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      saveGroceries(DEFAULT_GROCERIES);
      return DEFAULT_GROCERIES.map((item) => ({ ...item }));
    }

    const items = JSON.parse(stored);
    if (!Array.isArray(items) || items.some((item) =>
      !item || typeof item.id !== "string" || typeof item.name !== "string" ||
      typeof item.purchased !== "boolean" || typeof item.date !== "string"
    )) {
      throw new Error("Saved grocery data is invalid. Clear the HomeMate grocery storage to continue.");
    }
    return items;
  }

  function saveGroceries(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function addGroceries(names) {
    const items = getGroceries();
    const knownNames = new Set(items.map((item) => item.name.trim().toLowerCase()));
    let added = 0;

    names.forEach((name) => {
      const cleanName = name.trim();
      const normalizedName = cleanName.toLowerCase();
      if (!cleanName || knownNames.has(normalizedName)) return;

      knownNames.add(normalizedName);
      items.push({
        id: `grocery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: cleanName,
        purchased: false,
        date: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date())
      });
      added += 1;
    });

    if (added) saveGroceries(items);
    return added;
  }

  window.HomeMateData = { getGroceries, saveGroceries, addGroceries };
})();
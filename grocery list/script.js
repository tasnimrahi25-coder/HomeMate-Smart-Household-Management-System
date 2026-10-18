const searchInput = document.getElementById('search-input');
const listContainer = document.getElementById('list-container');
const addForm = document.getElementById('add-grocery-form');
const addFormButton = document.getElementById('show-add-form');
const newGroceryName = document.getElementById('new-grocery-name');

function renderGroceries() {
    const groceries = window.HomeMateData.getGroceries();
    listContainer.replaceChildren();

    groceries.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'grocery-row';

        const left = document.createElement('div');
        left.className = 'row-left';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'item-checkbox';
        checkbox.checked = item.purchased;
        checkbox.setAttribute('aria-label', `Mark ${item.name} as purchased`);
        const name = document.createElement('span');
        name.className = 'item-name';
        name.textContent = item.name;
        left.append(checkbox, name);

        const status = document.createElement('span');
        status.className = `status ${item.purchased ? 'purchased' : 'pending'}`;
        status.textContent = item.purchased ? 'Purchased' : 'Pending';
        const date = document.createElement('span');
        date.className = 'date';
        date.textContent = item.date;
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-btn';
        deleteButton.setAttribute('aria-label', `Delete ${item.name}`);
        deleteButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';

        row.dataset.id = item.id;
        row.append(left, status, date, deleteButton);
        listContainer.append(row);
    });

    applySearch();
    updateCounts(groceries);
}

function updateCounts(items) {
    const purchased = items.filter((item) => item.purchased).length;
    document.getElementById('total-count').textContent = items.length;
    document.getElementById('purchased-count').textContent = purchased;
    document.getElementById('remaining-count').textContent = items.length - purchased;
}

function applySearch() {
    const term = searchInput.value.trim().toLowerCase();
    listContainer.querySelectorAll('.grocery-row').forEach((row) => {
        row.hidden = !row.querySelector('.item-name').textContent.toLowerCase().includes(term);
    });
}

listContainer.addEventListener('change', (event) => {
    if (!event.target.matches('.item-checkbox')) return;
    const row = event.target.closest('.grocery-row');
    const groceries = window.HomeMateData.getGroceries();
    const item = groceries.find((entry) => entry.id === row.dataset.id);
    if (!item) return;

    item.purchased = event.target.checked;
    window.HomeMateData.saveGroceries(groceries);
    renderGroceries();

});

listContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.delete-btn');
    if (!button) return;
    const row = button.closest('.grocery-row');
    const groceries = window.HomeMateData.getGroceries().filter((item) => item.id !== row.dataset.id);
    window.HomeMateData.saveGroceries(groceries);
    renderGroceries();
});

searchInput.addEventListener('input', applySearch);
addFormButton.addEventListener('click', () => {
    addForm.hidden = !addForm.hidden;
    if (!addForm.hidden) newGroceryName.focus();
});

addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const itemName = newGroceryName.value.trim();
    if (!itemName) return;
    const addedCount = window.HomeMateData.addGroceries([itemName]);
    if (!addedCount) {
        newGroceryName.setCustomValidity('This item is already on your list.');
        newGroceryName.reportValidity();
        newGroceryName.addEventListener('input', () => newGroceryName.setCustomValidity(''), { once: true });
        return;
    }
    addForm.reset();
    addForm.hidden = true;
    renderGroceries();
});

window.addEventListener('storage', (event) => {
    if (event.key === 'homemate.groceries') renderGroceries();
});

renderGroceries();
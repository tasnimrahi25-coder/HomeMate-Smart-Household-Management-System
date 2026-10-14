const checkboxes = document.querySelectorAll('.item-checkbox');
const searchInput = document.getElementById('search-input');
const groceryRows = document.querySelectorAll('.grocery-row');
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const row = this.closest('.grocery-row');
        const statusSpan = row.querySelector('.status');

        if (this.checked) {
            statusSpan.textContent = 'Purchased';
            statusSpan.className = 'status purchased';
        } else {
            statusSpan.textContent = 'Pending';
            statusSpan.className = 'status pending';
        }
        updateCounts();
    });
});

function updateCounts() {
    const total = document.querySelectorAll('.grocery-row').length;
    const purchased = document.querySelectorAll('.status.purchased').length;
    const remaining = total - purchased;

    document.getElementById('total-count').textContent = total;
    document.getElementById('purchased-count').textContent = purchased;
    document.getElementById('remaining-count').textContent = remaining;
}

const deleteButtons = document.querySelectorAll('.delete-btn');
deleteButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.grocery-row').remove();
        updateCounts();
    });
});
searchInput.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();

    groceryRows.forEach(row => {
        const itemName = row.querySelector('.item-name').textContent.toLowerCase();
        if (itemName.includes(term)) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
});
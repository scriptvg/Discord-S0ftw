// Definición de usuarios y sus permisos
const users = {
    cajero: { password: "cajero123", modules: ["sales"], name: "Carlos (Cajero)" },
    vendedor: { password: "vendedor123", modules: ["sales", "customers"], name: "Valeria (Vendedora)" },
    contador: { password: "contador123", modules: ["invoices", "reports"], name: "Carla (Contadora)" },
    administrador: { password: "admin123", modules: ["inventory", "sales", "invoices", "customers", "reports"], name: "Ana (Administradora)" },
    gerente: { password: "gerente123", modules: ["inventory", "sales", "invoices", "reports"], name: "Gustavo (Gerente)" }
};

let currentUser = null;

// Función para iniciar sesión
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (users[username] && users[username].password === password) {
        currentUser = username;
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('userInfo').textContent = `Usuario: ${users[currentUser].name}`;
        setupTabs();
        loadAllData();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

// Función para configurar las pestañas según los permisos del usuario
function setupTabs() {
    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = '';
    const userModules = users[currentUser].modules;
    userModules.forEach(module => {
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.textContent = module.charAt(0).toUpperCase() + module.slice(1);
        tab.setAttribute('data-tab', module);
        tab.addEventListener('click', () => switchTab(module));
        tabsContainer.appendChild(tab);
    });
    switchTab(userModules[0]);
}

// Función para cambiar entre pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
}

// Función para cargar todos los datos
async function loadAllData() {
    await loadProducts();
    await loadInvoices();
    await loadCustomers();
    renderAvailableProductsTable();
}

// Función para cargar productos
async function loadProducts() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('Productos cargados:', products);
        renderProductTable(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Función para cargar facturas
async function loadInvoices() {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/invoices');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const invoices = await response.json();
        console.log('Facturas cargadas:', invoices);
        renderInvoicesTable(invoices);
    } catch (error) {
        console.error('Error al cargar facturas:', error);
    }
}
// Función para cargar clientes
async function loadCustomers() {
    const response = await fetch('/api/customers');
    const customers = await response.json();
    renderCustomersTable(customers);
}

// Función para renderizar la tabla de productos
function renderProductTable(products) {
    const tableBody = document.querySelector('#productTable tbody');
    tableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>₡${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.category}</td>
            <td>${product.barcode}</td>
        `;
        row.addEventListener('click', () => selectProduct(product));
        tableBody.appendChild(row);
    });
}

// Función para renderizar la tabla de facturas
function renderInvoicesTable(invoices) {
    const tableBody = document.querySelector('#invoicesTable tbody');
    tableBody.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${invoice.customer}</td>
            <td>₡${invoice.total.toFixed(2)}</td>
            <td>${invoice.date}</td>
            <td>${invoice.status}</td>
            <td>
                <button onclick="viewInvoice(${invoice.id})">Ver</button>
                <button onclick="generateElectronicInvoice(${invoice.id})">Generar Factura Electrónica</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para renderizar la tabla de clientes
function renderCustomersTable(customers) {
    const tableBody = document.querySelector('#customersTable tbody');
    tableBody.innerHTML = '';
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.identification}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para renderizar la tabla de productos disponibles para venta
function renderAvailableProductsTable() {
    const tableBody = document.querySelector('#availableProductsTable tbody');
    tableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>₡${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><button onclick="addToCart(${product.id})">Agregar al carrito</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para seleccionar un producto
function selectProduct(product) {
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productForm').setAttribute('data-id', product.id);
}

// Función para guardar cambios en un producto
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const productData = {
        name: form.name.value,
        price: parseFloat(form.price.value),
        stock: parseInt(form.stock.value),
        category: form.category.value,
        barcode: form.barcode.value
    };

    const id = form.getAttribute('data-id');
    let response;
    if (id) {
        // Actualizar producto existente
        response = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    } else {
        // Agregar nuevo producto
        response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    }

    if (response.ok) {
        await loadProducts();
        renderAvailableProductsTable();
        form.reset();
        form.removeAttribute('data-id');
    } else {
        alert('Error al guardar el producto');
    }
});

// Carrito de compras
let cart = [];

// Función para agregar un producto al carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.stock > 0) {
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        product.stock--;
        renderCart();
        renderAvailableProductsTable();
    }
}

// Función para renderizar el carrito
function renderCart() {
    const tableBody = document.querySelector('#cartTable tbody');
    tableBody.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        const row = document.createElement('tr');
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        row.innerHTML = `
            <td>${item.name}</td>
            <td>₡${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₡${itemTotal.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

// Función para finalizar la compra
document.getElementById('checkoutButton').addEventListener('click', async function() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newInvoice = {
        customer: "Cliente de mostrador",
        total: total,
        date: new Date().toISOString().split('T')[0],
        status: "Pendiente",
        items: cart
    };

    const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
    });

    if (response.ok) {
        await loadInvoices();
        cart = [];
        renderCart();
        renderAvailableProductsTable();
        alert('Compra finalizada. Se ha generado una nueva factura.');
    } else {
        alert('Error al procesar la compra');
    }
});

// Función para ver una factura
function viewInvoice(invoiceId) {
    // Implementar lógica para ver detalles de la factura
    alert(`Ver factura ${invoiceId}`);
}

// Función para generar factura electrónica
async function generateElectronicInvoice(invoiceId) {
    const response = await fetch(`/api/generate-electronic-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
    });

    if (response.ok) {
        const result = await response.json();
        alert(`Factura electrónica generada: ${result.electronicInvoiceNumber}`);
        await loadInvoices();
    } else {
        alert('Error al generar la factura electrónica');
    }
}

// Función para generar reportes
document.getElementById('generateReport').addEventListener('click', async function() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, startDate, endDate })
    });

    if (response.ok) {
        const report = await response.json();
        let reportContent = '';
        if (reportType === 'sales') {
            reportContent = `
                <h3>Reporte de Ventas</h3>
                <p>Período: ${startDate} - ${endDate}</p>
                <p>Total de ventas: ₡${report.totalSales.toFixed(2)}</p>
                <p>Número de facturas: ${report.invoiceCount}</p>
            `;
        } else if (reportType === 'inventory') {
            reportContent = `
                <h3>Reporte de Inventario</h3>
                <p>Total de items en stock: ${report.totalItems}</p>
                <p>Valor total del inventario: ₡${report.totalValue.toFixed(2)}</p>
                <p>Productos con bajo stock (menos de 10 unidades):</p>
                <ul>
                    ${report.lowStock.map(product => `<li>${product.name}: ${product.stock}</li>`).join('')}
                </ul>
            `;
        } else if (reportType === 'taxes') {
            reportContent = `
                <h3>Reporte de Impuestos</h3>
                <p>Período: ${startDate} - ${endDate}</p>
                <p>Total de impuestos recaudados: ₡${report.totalTaxes.toFixed(2)}</p>
                <p>Desglose por tipo de impuesto:</p>
                <ul>
                    ${Object.entries(report.taxBreakdown).map(([tax, amount]) => `<li>${tax}: ₡${amount.toFixed(2)}</li>`).join('')}
                </ul>
            `;
        }
        document.getElementById('reportResult').innerHTML = reportContent;
    } else {
        alert('Error al generar el reporte');
    }
});

// Inicializar la aplicación
loadAllData();


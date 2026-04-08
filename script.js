// script.js - LÓGICA COMPLETA DEL POS
import { db } from './firebase-config.js';
import { 
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
    serverTimestamp, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// VARIABLES GLOBALES
let cart = [];
let products = [];
let providers = [];
let invoices = [];
let currentSection = 'ventas';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    updateDate();
    await loadInitialData();
    showSection('ventas');
    setupEventListeners();
});

// CARGAR DATOS INICIALES
async function loadInitialData() {
    // 🔥 CARGAR PRODUCTOS PREDEFINIDOS
    products = await loadProducts();
    providers = await loadProviders();
    invoices = await loadInvoices();
    
    renderInventory();
    renderProviders();
    renderInvoices();
}

// ACTUALIZAR FECHA
function updateDate() {
    const fecha = document.getElementById('fecha');
    fecha.textContent = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// MOSTRAR SECCIONES
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    currentSection = section;
    
    // Renderizar datos según sección
    if (section === 'inventario') renderInventory();
    if (section === 'proveedores') renderProviders();
    if (section === 'facturas') renderInvoices();
    if (section === 'contactos') renderContacts();
}

// EVENT LISTENERS
function setupEventListeners() {
    // Formularios
    document.getElementById('inventoryForm').addEventListener('submit', handleInventoryForm);
    document.getElementById('providerForm').addEventListener('submit', handleProviderForm);
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);
    
    // Búsqueda de productos
    document.getElementById('searchProduct').addEventListener('input', searchProducts);
}

// 🔥 FIREBASE FUNCTIONS
async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading products:", error);
        return [];
    }
}

async function loadProviders() {
    try {
        const querySnapshot = await getDocs(collection(db, "providers"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading providers:", error);
        return [];
    }
}

async function loadInvoices() {
    try {
        const querySnapshot = await getDocs(collection(db, "invoices"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading invoices:", error);
        return [];
    }
}

async function saveProduct(product) {
    try {
        await addDoc(collection(db, "products"), {
            ...product,
            createdAt: serverTimestamp()
        });
        products = await loadProducts();
        renderInventory();
    } catch (error) {
        console.error("Error saving product:", error);
    }
}

async function updateProduct(id, product) {
    try {
        await updateDoc(doc(db, "products", id), product);
        products = await loadProducts();
        renderInventory();
    } catch (error) {
        console.error("Error updating product:", error);
    }
}

async function deleteProduct(id) {
    try {
        await deleteDoc(doc(db, "products", id));
        products = await loadProducts();
        renderInventory();
    } catch (error) {
        console.error("Error deleting product:", error);
    }
}

// RENDERIZAR INVENTARIO
function renderInventory() {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = `
            <tr>
                <td>${product.id.slice(-6)}</td>
                <td>${product.name}</td>
                <td>
                    <span class="${product.stock <= 5 ? 'pulse' : ''}">
                        ${product.stock}
                    </span>
                </td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// RENDERIZAR PROVEEDORES
function renderProviders() {
    const tbody = document.querySelector('#providersTable tbody');
    tbody.innerHTML = '';
    
    providers.forEach(provider => {
        const row = `
            <tr>
                <td>${provider.id.slice(-6)}</td>
                <td>${provider.name}</td>
                <td>${provider.phone}</td>
                <td>${provider.email}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editProvider('${provider.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteProvider('${provider.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// RENDERIZAR FACTURAS
function renderInvoices() {
    const tbody = document.querySelector('#invoicesTable tbody');
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const row = `
            <tr>
                <td>${invoice.id.slice(-6)}</td>
                <td>${invoice.customer || 'Cliente walk-in'}</td>
                <td>$${parseFloat(invoice.total).toFixed(2)}</td>
                <td>${invoice.date?.toDate ? invoice.date.toDate().toLocaleDateString('es-ES') : 'N/A'}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
// FUNCIÓN BÚSQUEDA DE PRODUCTOS (AUTOCOMPLETE)
function searchProducts(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );
    
    // Mostrar resultados en tiempo real
    showSearchResults(filtered);
}

function showSearchResults(products) {
    const cartItems = document.getElementById('cartItems');
    if (products.length === 0) {
        cartItems.innerHTML = '<div class="no-results">No se encontraron productos</div>';
        return;
    }
    
    let resultsHTML = '';
    products.forEach(product => {
        resultsHTML += `
            <div class="search-result" onclick="addToCart('${product.id}')">
                <div>
                    <strong>${product.name}</strong><br>
                    Stock: ${product.stock} | $${product.price}
                </div>
                <i class="fas fa-plus"></i>
            </div>
        `;
    });
    cartItems.innerHTML = resultsHTML;
}

// AGREGAR AL CARRITO
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert('Stock insuficiente');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            quantity: 1
        });
    }
    
    renderCart();
    updateTotal();
}

// RENDERIZAR CARRITO
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Carrito vacío</div>';
        return;
    }
    
    let html = '';
    cart.forEach((item, index) => {
        html += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    $${item.price.toFixed(2)} x ${item.quantity}
                </div>
                <div class="cart-controls">
                    <button onclick="updateCartQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${index}, 1)">+</button>
                    <button onclick="removeFromCart(${index})" class="btn-delete-small">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    cartItems.innerHTML = html;
}

// ACTUALIZAR CANTIDAD CARRITO
function updateCartQuantity(index, change) {
    if (cart[index].quantity + change <= 0) {
        removeFromCart(index);
        return;
    }
    
    const product = products.find(p => p.id === cart[index].id);
    if (cart[index].quantity + change > product.stock) {
        alert('Stock insuficiente');
        return;
    }
    
    cart[index].quantity += change;
    renderCart();
    updateTotal();
}

// ELIMINAR DEL CARRITO
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    updateTotal();
}

// ACTUALIZAR TOTAL
function updateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

// PROCESAR VENTA
async function processSale() {
    if (cart.length === 0) {
        alert('Carrito vacío');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customer = prompt('Nombre del cliente (opcional):') || 'Cliente walk-in';
    
    try {
        // Guardar factura
        await addDoc(collection(db, "invoices"), {
            customer,
            items: cart,
            total,
            date: serverTimestamp()
        });
        
        // Actualizar inventario
        for (let item of cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                await updateDoc(doc(db, "products", product.id), {
                    stock: product.stock - item.quantity
                });
            }
        }
        
        // Limpiar carrito
        cart = [];
        renderCart();
        updateTotal();
        
        // Recargar datos
        products = await loadProducts();
        invoices = await loadInvoices();
        renderInvoices();
        renderInventory();
        
        alert(`✅ Venta procesada: $${total.toFixed(2)}`);
        
    } catch (error) {
        console.error("Error processing sale:", error);
        alert('Error al procesar la venta');
    }
}

// AGREGAR PRODUCTO MANUAL
function addProductManual() {
    const name = prompt('Nombre del producto:');
    const price = parseFloat(prompt('Precio:'));
    
    if (name && price) {
        const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (product) {
            addToCart(product.id);
        } else {
            alert('Producto no encontrado');
        }
    }
}

// MODALES - INVENTARIO
function showInventoryModal(action, productId = null) {
    const modal = document.getElementById('inventoryModal');
    const title = document.getElementById('modalTitle');
    const editId = document.getElementById('editId');
    
    if (action === 'edit' && productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Editar Producto';
            document.getElementById('productName').value = product.name;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productPrice').value = product.price;
            editId.value = productId;
        }
    } else {
        title.textContent = 'Nuevo Producto';
        document.getElementById('inventoryForm').reset();
        editId.value = '';
    }
    
    modal.style.display = 'block';
}

async function handleInventoryForm(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const product = {
        name: document.getElementById('productName').value,
        stock: parseInt(document.getElementById('productStock').value),
        price: parseFloat(document.getElementById('productPrice').value)
    };
    
    if (id) {
        await updateProduct(id, product);
    } else {
        await saveProduct(product);
    }
    
    closeModal('inventoryModal');
}

// MODALES - PROVEEDORES
function showProviderModal(action, providerId = null) {
    const modal = document.getElementById('providerModal');
    const title = document.getElementById('providerTitle');
    const editId = document.getElementById('editProviderId');
    
    if (action === 'edit' && providerId) {
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
            title.textContent = 'Editar Proveedor';
            document.getElementById('providerName').value = provider.name;
            document.getElementById('providerPhone').value = provider.phone;
            document.getElementById('providerEmail').value = provider.email;
            editId.value = providerId;
        }
    } else {
        title.textContent = 'Nuevo Proveedor';
        document.getElementById('providerForm').reset();
        editId.value = '';
    }
    
    modal.style.display = 'block';
}

async function handleProviderForm(e) {
    e.preventDefault();
    const id = document.getElementById('editProviderId').value;
    const provider = {
        name: document.getElementById('providerName').value,
        phone: document.getElementById('providerPhone').value,
        email: document.getElementById('providerEmail').value
    };
    
    if (id) {
        // Actualizar proveedor (implementar función updateProvider)
        await updateProvider(id, provider);
    } else {
        await saveProvider(provider);
    }
    
    closeModal('providerModal');
}

// CONTACTOS FORM
async function handleContactForm(e) {
    e.preventDefault();
    const contact = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        message: document.getElementById('contactMessage').value,
        date: serverTimestamp()
    };
    
    try {
        await addDoc(collection(db, "contacts"), contact);
        alert('✅ Mensaje enviado correctamente');
        document.getElementById('contactForm').reset();
        closeModal('contactModal');
        renderContacts();
    } catch (error) {
        console.error("Error saving contact:", error);
        alert('Error al enviar mensaje');
    }
}

function renderContacts() {
    // Implementar carga de contactos desde Firestore
    console.log('Contactos renderizados');
}

// FUNCIONES AUXILIARES
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// FUNCIONES PENDIENTES (implementar igual que productos)
window.editProduct = async function(id) {
    showInventoryModal('edit', id);
};

window.deleteProduct = async function(id) {
    if (confirm('¿Eliminar este producto?')) {
        await deleteProduct(id);
    }
};

window.editProvider = async function(id) {
    showProviderModal('edit', id);
};

window.deleteProvider = async function(id) {
    if (confirm('¿Eliminar este proveedor?')) {
        await deleteProvider(id);
    }
};

window.viewInvoice = function(id) {
    alert(`Factura ${id.slice(-6)} - Ver detalles completos`);
};

// FUNCIONES PROVEEDORES (implementar)
async function saveProvider(provider) {
    await addDoc(collection(db, "providers"), {
        ...provider,
        createdAt: serverTimestamp()
    });
    providers = await loadProviders();
    renderProviders();
}

async function updateProvider(id, provider) {
    await updateDoc(doc(db, "providers", id), provider);
    providers = await loadProviders();
    renderProviders();
}

async function deleteProvider(id) {
    await deleteDoc(doc(db, "providers", id));
    providers = await loadProviders();
    renderProviders();
}

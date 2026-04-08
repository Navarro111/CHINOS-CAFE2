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

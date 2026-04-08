// init-data.js - EJECUTAR UNA SOLA VEZ
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// PRODUCTOS INICIALES
const initialProducts = [
    { name: "Laptop Dell XPS", stock: 15, price: 1299.99 },
    { name: "iPhone 15 Pro", stock: 25, price: 999.00 },
    { name: "Mouse Logitech", stock: 50, price: 29.99 },
    { name: "Teclado Mecánico", stock: 8, price: 89.99 },
    { name: "Monitor 27\"", stock: 12, price: 299.99 },
    { name: "Café Premium", stock: 100, price: 12.99 }
];

// PROVEEDORES INICIALES
const initialProviders = [
    { name: "TechDistribuciones SA", phone: "+1-555-0101", email: "ventas@techdist.com" },
    { name: "Apple Authorized", phone: "+1-555-0202", email: "apple@distribuidor.com" },
    { name: "Logitech México", phone: "+1-555-0303", email: "contacto@logitech.mx" }
];

async function initData() {
    console.log("🚀 Inicializando datos...");
    
    // Agregar productos
    for (let product of initialProducts) {
        try {
            await addDoc(collection(db, "products"), {
                ...product,
                createdAt: serverTimestamp()
            });
            console.log(`✅ ${product.name} agregado`);
        } catch (e) {
            console.log(`⚠️ ${product.name} ya existe`);
        }
    }
    
    // Agregar proveedores
    for (let provider of initialProviders) {
        try {
            await addDoc(collection(db, "providers"), {
                ...provider,
                createdAt: serverTimestamp()
            });
            console.log(`✅ ${provider.name} agregado`);
        } catch (e) {
            console.log(`⚠️ ${provider.name} ya existe`);
        }
    }
    
    console.log("🎉 Datos iniciales cargados!");
}

initData();

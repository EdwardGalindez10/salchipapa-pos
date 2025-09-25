// Simulación de base de datos
class Database {
    constructor() {
        this.initializeData();
    }
    
    initializeData() {
        if (!localStorage.getItem('mesas')) {
            const mesas = [];
            for (let i = 1; i <= 12; i++) {
                mesas.push({
                    id: i,
                    numero: i,
                    estado: 'libre',
                    pedidoActual: null
                });
            }
            localStorage.setItem('mesas', JSON.stringify(mesas));
        }
        
        if (!localStorage.getItem('pedidos')) {
            localStorage.setItem('pedidos', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('menu')) {
            const menu = {
                salchipapas: [
                    { id: 1, nombre: 'Clásica', precio: 12000, ingredientes: 'Papa a la francesa, salchicha, piña calada, pollo o carne, queso, salsa de la casa' },
                    { id: 2, nombre: 'Mixta', precio: 15000, ingredientes: 'Papa a la francesa, salchicha, piña calada, maíctos, pollo y carne, tocineta, doble queso, salsa de la casa' },
                    { id: 3, nombre: 'Ranchera', precio: 18000, ingredientes: 'Papa a la francesa, salchicha, piña calada, maíctos, costilla, chorizo, tocineta, doble capa de queso, salsa de la casa' },
                    { id: 4, nombre: 'Especial', precio: 20000, ingredientes: 'Papa a la francesa, salchicha, piña calada, maíctos, costilla, chorizo, tocineta, pollo, doble capa de queso, salsa de la casa' },
                    { id: 5, nombre: 'Barrillera', precio: 15000, ingredientes: 'Papa a la francesa, salchicha, doble capa de queso, maíctos, 150 gramos de carne al barril, salsa de casa' },
                    { id: 6, nombre: 'Super Barrillera', precio: 25000, ingredientes: 'Papa a la francesa, salchicha, doble capa de queso, maíctos, 250 gramos de carne al barril, salsa de casa' },
                    { id: 7, nombre: 'XXL', precio: 25000, ingredientes: 'Papa a la francesa, salchicha, piña calada, pollo, carne, maíctos, costilla, chorizo, tocineta, doble capa de queso, salsa de la casa' }
                ],
                sandwiches: [
                    { id: 8, nombre: 'Hawaiano', precio: 10000, ingredientes: 'Pan casero, piña calada, jamón, queso, verduras, salsa de la casa' },
                    { id: 9, nombre: 'Pollo', precio: 15000, ingredientes: 'Pan casero, piña calada, pollo, jamón, queso, verduras, salsa de la casa' },
                    { id: 10, nombre: 'BBQ', precio: 16000, ingredientes: 'Pan casero, piña calada, carne en salsa BBQ, jamón, queso, verduras, salsa de la casa' }
                ],
                perros: [
                    { id: 11, nombre: 'Clásico', precio: 13000, ingredientes: 'Pan, piña calada, salchicha, cebolla caramelizada, ripio, jamón, doble queso, salsas de la casa' },
                    { id: 12, nombre: 'De la Casa', precio: 16000, ingredientes: 'Pan, piña calada, salchicha, cebolla caramelizada, carne, pollo, jamón, doble queso, salsas de la casa' }
                ],
                hamburguesas: [
                    { id: 13, nombre: 'Sencilla', precio: 13000, ingredientes: 'Pan casero, carne, cebolla caramelizada, jamón, queso, verduras, salsa de la casa' },
                    { id: 14, nombre: 'Especial', precio: 15000, ingredientes: 'Pan casero, carne, cebolla caramelizada, tocineta, jamón, queso, verduras, salsa de la casa' },
                    { id: 15, nombre: '4K', precio: 20000, ingredientes: 'Pan casero, carne, cebolla caramelizada, carne desmechada, pollo desmechado, jamón, tocineta, queso, verduras, salsa de la casa' },
                    { id: 16, nombre: 'Doble Carne', precio: 22000, ingredientes: 'Pan casero, doble carne, cebolla caramelizada, tocineta, jamón, queso, verduras, salsa de la casa' },
                    { id: 17, nombre: 'La Barrillera', precio: 25000, ingredientes: 'Pan casero, carne, carne al barril, cebolla caramelizada, tocineta, jamón, queso, verduras, salsa de la casa' }
                ],
                adiciones: [
                    { id: 18, nombre: 'Pollo', precio: 4000 },
                    { id: 19, nombre: 'Carne', precio: 4000 },
                    { id: 20, nombre: 'Tocineta', precio: 2000 },
                    { id: 21, nombre: 'Queso', precio: 2000 },
                    { id: 22, nombre: 'Costilla', precio: 6000 },
                    { id: 23, nombre: 'Carne al Barril', precio: 10000 }
                ],
                bebidas: [
                    { id: 24, nombre: 'Hit Personal', precio: 4000 },
                    { id: 25, nombre: 'Coca Cola', precio: 4000 },
                    { id: 26, nombre: 'Hit en Caja', precio: 7000 },
                    { id: 27, nombre: 'Coca Cola 1.5L', precio: 8000 }
                ]
            };
            localStorage.setItem('menu', JSON.stringify(menu));
        }
    }
    
    getMesas() {
        return JSON.parse(localStorage.getItem('mesas') || '[]');
    }
    
    getMesa(id) {
        const mesas = this.getMesas();
        return mesas.find(m => m.id === id);
    }
    
    updateMesa(mesa) {
        const mesas = this.getMesas();
        const index = mesas.findIndex(m => m.id === mesa.id);
        if (index !== -1) {
            mesas[index] = mesa;
            localStorage.setItem('mesas', JSON.stringify(mesas));
            this.notificarCambios('mesas');
        }
    }
    
    getPedidos() {
        return JSON.parse(localStorage.getItem('pedidos') || '[]');
    }
    
    getPedidosActivos() {
        const pedidos = this.getPedidos();
        return pedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado');
    }
    
    getPedido(id) {
        const pedidos = this.getPedidos();
        return pedidos.find(p => p.id === id);
    }
    
    agregarPedido(pedido) {
        const pedidos = this.getPedidos();
        pedido.id = Date.now();
        pedido.hora = new Date().toLocaleTimeString('es-CO');
        pedido.fecha = new Date().toLocaleDateString('es-CO');
        pedidos.push(pedido);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        
        const mesa = this.getMesa(pedido.mesaId);
        if (mesa) {
            mesa.estado = 'ocupada';
            mesa.pedidoActual = pedido.id;
            this.updateMesa(mesa);
        }
        
        this.notificarCambios('pedidos');
        return pedido.id;
    }
    
    actualizarPedido(pedido) {
        const pedidos = this.getPedidos();
        const index = pedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
            pedidos[index] = pedido;
            localStorage.setItem('pedidos', JSON.stringify(pedidos));
            this.notificarCambios('pedidos');
        }
    }
    
    getMenu() {
        return JSON.parse(localStorage.getItem('menu') || '{}');
    }
    
    // Sistema de notificaciones para tiempo real
    suscribir(evento, callback) {
        if (!this.suscriptores) {
            this.suscriptores = {};
        }
        if (!this.suscriptores[evento]) {
            this.suscriptores[evento] = [];
        }
        this.suscriptores[evento].push(callback);
    }
    
    notificarCambios(evento) {
        if (this.suscriptores && this.suscriptores[evento]) {
            this.suscriptores[evento].forEach(callback => callback());
        }
    }
}

// Crear instancia global de la base de datos
const db = new Database();
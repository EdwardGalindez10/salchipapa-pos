// Variables globales para mesero
let mesaSeleccionada = null;
let pedidoActual = {
    items: [],
    notas: ''
};
let productoSeleccionado = null;

// Inicializar interfaz del mesero
document.addEventListener('DOMContentLoaded', function() {
    // Verificar permisos
    if (!verificarPermisos('mesero')) {
        return;
    }

    inicializarNavegacion();
    cargarMesas();
    cargarMenu();
    actualizarVistaPedido();
    
    // Configurar botones de acciones del pedido
    document.getElementById('btnLimpiarPedido').addEventListener('click', limpiarPedido);
    document.getElementById('btnEnviarCocina').addEventListener('click', enviarPedidoACocina);
    
    // Suscribirse a cambios en tiempo real
    db.suscribir('mesas', cargarMesas);
    
    configurarVistaSegunModulo();
});

// Navegación entre secciones
function inicializarNavegacion() {
    const tabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Actualizar pestañas activas
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar sección correspondiente
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Cargar y mostrar las mesas
function cargarMesas() {
    const mesas = db.getMesas();
    const mesasGrid = document.getElementById('mesas-grid');
    
    mesasGrid.innerHTML = '';
    
    if (mesas.length === 0) {
        mesasGrid.innerHTML = '<p class="empty-state">No hay mesas configuradas</p>';
        return;
    }
    
    mesas.forEach(mesa => {
        const mesaElement = document.createElement('div');
        mesaElement.className = `mesa ${mesa.estado}`;
        mesaElement.innerHTML = `
            <div class="mesa-numero">${mesa.numero}</div>
            <div class="mesa-estado">${mesa.estado.toUpperCase()}</div>
            ${mesa.pedidoActual ? '<div class="mesa-pedido">📋</div>' : ''}
        `;
        
        mesaElement.addEventListener('click', function() {
            seleccionarMesa(mesa);
        });
        
        mesasGrid.appendChild(mesaElement);
    });
}

// Seleccionar una mesa
function seleccionarMesa(mesa) {
    // Quitar selección anterior
    document.querySelectorAll('.mesa').forEach(m => m.classList.remove('selected'));
    
    // Marcar como seleccionada
    event.currentTarget.classList.add('selected');
    mesaSeleccionada = mesa;
    
    // Actualizar información de mesa seleccionada
    document.getElementById('mesa-seleccionada-info').textContent = `Mesa ${mesa.numero} - ${mesa.estado.toUpperCase()}`;
    
    // Cargar pedido existente si la mesa está ocupada
    if (mesa.estado === 'ocupada' && mesa.pedidoActual) {
        const pedido = db.getPedido(mesa.pedidoActual);
        if (pedido && pedido.estado !== 'entregado') {
            pedidoActual = { ...pedido };
        } else {
            pedidoActual = { items: [], notas: '' };
        }
    } else {
        pedidoActual = { items: [], notas: '' };
    }
    
    actualizarVistaPedido();
    
    // Cambiar a la sección de menú
    document.querySelector('.nav-tab[data-target="menu-section"]').click();
}

// Cargar y mostrar el menú
function cargarMenu() {
    const menu = db.getMenu();
    const categoriasMenu = document.getElementById('categorias-menu');
    const productosGrid = document.getElementById('productos-grid');
    
    // Limpiar contenedores
    categoriasMenu.innerHTML = '';
    productosGrid.innerHTML = '';
    
    // Crear botones de categorías
    Object.keys(menu).forEach((categoria, index) => {
        const btn = document.createElement('button');
        btn.className = `categoria-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        btn.setAttribute('data-categoria', categoria);
        
        btn.addEventListener('click', function() {
            document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            mostrarProductos(categoria);
        });
        
        categoriasMenu.appendChild(btn);
    });
    
    // Mostrar productos de la primera categoría por defecto
    if (Object.keys(menu).length > 0) {
        mostrarProductos(Object.keys(menu)[0]);
    }
}

// Mostrar productos de una categoría específica
function mostrarProductos(categoria) {
    const menu = db.getMenu();
    const productos = menu[categoria];
    const productosGrid = document.getElementById('productos-grid');
    
    productosGrid.innerHTML = '';
    
    if (!productos || productos.length === 0) {
        productosGrid.innerHTML = '<div class="empty-state">No hay productos en esta categoría</div>';
        return;
    }
    
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <div class="producto-nombre">${producto.nombre}</div>
            <div class="producto-precio">$${producto.precio.toLocaleString('es-CO')}</div>
            ${producto.ingredientes ? `<div class="producto-ingredientes">${producto.ingredientes}</div>` : ''}
            <button class="btn-agregar" data-id="${producto.id}">Agregar al Pedido</button>
        `;
        
        card.querySelector('.btn-agregar').addEventListener('click', function() {
            if (!mesaSeleccionada) {
                alert('Por favor, selecciona una mesa primero');
                return;
            }
            
            productoSeleccionado = producto;
            mostrarModalPersonalizacion();
        });
        
        productosGrid.appendChild(card);
    });
}

// Mostrar modal de personalización del producto
function mostrarModalPersonalizacion() {
    const modal = document.getElementById('modal-personalizacion');
    const modalTitle = document.getElementById('modal-title');
    const adicionesList = document.getElementById('adiciones-list');
    const notasInput = document.getElementById('notas-pedido');
    
    modalTitle.textContent = `Personalizar: ${productoSeleccionado.nombre}`;
    adicionesList.innerHTML = '';
    notasInput.value = '';
    
    // Cargar adiciones disponibles
    const menu = db.getMenu();
    if (menu.adiciones) {
        menu.adiciones.forEach(adicion => {
            const adicionItem = document.createElement('div');
            adicionItem.className = 'adicion-item';
            adicionItem.innerHTML = `
                <div>
                    <input type="checkbox" id="adicion-${adicion.id}" data-id="${adicion.id}" data-precio="${adicion.precio}">
                    <label for="adicion-${adicion.id}">${adicion.nombre}</label>
                </div>
                <span>+$${adicion.precio.toLocaleString('es-CO')}</span>
            `;
            adicionesList.appendChild(adicionItem);
        });
    }
    
    modal.style.display = 'flex';
    
    // Configurar eventos del modal
    document.getElementById('btn-cerrar-modal').onclick = function() {
        modal.style.display = 'none';
    };
    
    document.getElementById('btn-cancelar').onclick = function() {
        modal.style.display = 'none';
    };
    
    document.getElementById('btn-agregar-pedido').onclick = function() {
        agregarProductoAPedido();
        modal.style.display = 'none';
    };
}

// Agregar producto al pedido actual
function agregarProductoAPedido() {
    const notasInput = document.getElementById('notas-pedido');
    const adicionesSeleccionadas = [];
    
    // Obtener adiciones seleccionadas
    document.querySelectorAll('#adiciones-list input:checked').forEach(input => {
        adicionesSeleccionadas.push({
            id: parseInt(input.getAttribute('data-id')),
            nombre: input.nextElementSibling.textContent,
            precio: parseInt(input.getAttribute('data-precio'))
        });
    });
    
    // Calcular precio total del item
    let precioTotal = productoSeleccionado.precio;
    adicionesSeleccionadas.forEach(adicion => {
        precioTotal += adicion.precio;
    });
    
    // Crear nuevo item
    const nuevoItem = {
        id: Date.now(),
        productoId: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        precio: precioTotal,
        adiciones: adicionesSeleccionadas,
        notas: notasInput.value,
        cantidad: 1
    };
    
    // Verificar si ya existe un item idéntico
    const itemExistente = pedidoActual.items.find(item => 
        item.productoId === nuevoItem.productoId &&
        JSON.stringify(item.adiciones) === JSON.stringify(nuevoItem.adiciones) &&
        item.notas === nuevoItem.notas
    );
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        if (!pedidoActual.items) pedidoActual.items = [];
        pedidoActual.items.push(nuevoItem);
    }
    
    actualizarVistaPedido();
}

// Actualizar la vista del pedido actual
function actualizarVistaPedido() {
    const pedidoItems = document.getElementById('pedido-items');
    const pedidoTotal = document.getElementById('pedido-total');
    const contadorItems = document.getElementById('contador-items');
    
    pedidoItems.innerHTML = '';
    
    if (!pedidoActual.items || pedidoActual.items.length === 0) {
        pedidoItems.innerHTML = '<div class="empty-state">No hay items en el pedido</div>';
        pedidoTotal.textContent = '$0';
        contadorItems.textContent = '0 items';
        return;
    }
    
    let total = 0;
    let totalItems = 0;
    
    pedidoActual.items.forEach((item, index) => {
        totalItems += item.cantidad;
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'pedido-item';
        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-nombre">${item.nombre} x${item.cantidad}</div>
                ${item.adiciones.length > 0 ? 
                    `<div class="item-adiciones">${item.adiciones.map(a => a.nombre).join(', ')}</div>` : ''}
                ${item.notas ? `<div class="item-notas">Notas: ${item.notas}</div>` : ''}
            </div>
            <div class="item-cantidad">
                <button class="btn-cantidad minus" data-index="${index}">-</button>
                <span>${item.cantidad}</span>
                <button class="btn-cantidad plus" data-index="${index}">+</button>
            </div>
            <div class="item-precio">$${subtotal.toLocaleString('es-CO')}</div>
            <button class="btn-eliminar" data-index="${index}">×</button>
        `;
        
        pedidoItems.appendChild(itemElement);
        
        // Configurar eventos
        itemElement.querySelector('.minus').addEventListener('click', function() {
            modificarCantidadItem(index, -1);
        });
        
        itemElement.querySelector('.plus').addEventListener('click', function() {
            modificarCantidadItem(index, 1);
        });
        
        itemElement.querySelector('.btn-eliminar').addEventListener('click', function() {
            eliminarItem(index);
        });
    });
    
    pedidoTotal.textContent = `$${total.toLocaleString('es-CO')}`;
    contadorItems.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
}

// Modificar cantidad de un item
function modificarCantidadItem(index, cambio) {
    const item = pedidoActual.items[index];
    item.cantidad += cambio;
    
    if (item.cantidad <= 0) {
        pedidoActual.items.splice(index, 1);
    }
    
    actualizarVistaPedido();
}

// Eliminar item del pedido
function eliminarItem(index) {
    pedidoActual.items.splice(index, 1);
    actualizarVistaPedido();
}

// Limpiar pedido actual
function limpiarPedido() {
    if (confirm('¿Estás seguro de que quieres limpiar el pedido actual?')) {
        pedidoActual = {
            items: [],
            notas: ''
        };
        actualizarVistaPedido();
    }
}

// Enviar pedido a cocina
function enviarPedidoACocina() {
    if (!mesaSeleccionada) {
        alert('Por favor, selecciona una mesa primero');
        return;
    }
    
    if (!pedidoActual.items || pedidoActual.items.length === 0) {
        alert('El pedido está vacío');
        return;
    }
    
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    
    const pedidoParaEnviar = {
        ...pedidoActual,
        mesaId: mesaSeleccionada.id,
        mesaNumero: mesaSeleccionada.numero,
        mesero: usuario.nombre,
        estado: 'pendiente',
        hora: new Date().toLocaleTimeString('es-CO'),
        fecha: new Date().toLocaleDateString('es-CO')
    };
    
    // Si es un pedido existente, actualizarlo
    if (pedidoActual.id) {
        pedidoParaEnviar.id = pedidoActual.id;
        db.actualizarPedido(pedidoParaEnviar);
    } else {
        // Crear nuevo pedido
        pedidoParaEnviar.id = db.agregarPedido(pedidoParaEnviar);
    }
    
    alert('✅ Pedido enviado a cocina correctamente');
    limpiarPedido();
}
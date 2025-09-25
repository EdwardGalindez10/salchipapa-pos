// Inicializar pantalla de caja
document.addEventListener('DOMContentLoaded', function() {
    // Verificar permisos
    if (!verificarPermisos('caja')) {
        return;
    }

    cargarMesasCaja();
    cargarReportes();
    
    // Suscribirse a cambios
    db.suscribir('mesas', cargarMesasCaja);
    db.suscribir('pedidos', cargarReportes);
    
    configurarVistaSegunModulo();
});

// Cargar mesas para caja
function cargarMesasCaja() {
    const mesas = db.getMesas();
    const mesasGrid = document.getElementById('mesas-caja-grid');
    
    mesasGrid.innerHTML = '';
    
    mesas.forEach(mesa => {
        const mesaElement = document.createElement('div');
        mesaElement.className = `mesa ${mesa.estado}`;
        mesaElement.innerHTML = `
            <div class="mesa-numero">${mesa.numero}</div>
            <div class="mesa-estado">${mesa.estado.toUpperCase()}</div>
        `;
        
        if (mesa.estado === 'ocupada') {
            const btnCuenta = document.createElement('button');
            btnCuenta.className = 'btn-primary';
            btnCuenta.textContent = 'Generar Cuenta';
            btnCuenta.style.marginTop = '10px';
            btnCuenta.addEventListener('click', function() {
                generarCuenta(mesa.id);
            });
            mesaElement.appendChild(btnCuenta);
        }
        
        mesasGrid.appendChild(mesaElement);
    });
}

// Generar cuenta para una mesa
function generarCuenta(mesaId) {
    const mesa = db.getMesa(mesaId);
    if (!mesa || !mesa.pedidoActual) {
        alert('No hay pedido activo para esta mesa');
        return;
    }
    
    const pedido = db.getPedido(mesa.pedidoActual);
    if (!pedido) {
        alert('Error al cargar el pedido');
        return;
    }
    
    const total = pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const modal = document.getElementById('modal-cuenta');
    const cuentaContent = document.getElementById('cuenta-content');
    
    cuentaContent.innerHTML = `
        <h3>Cuenta - Mesa ${mesa.numero}</h3>
        <div class="detalle-cuenta">
            ${pedido.items.map(item => `
                <div class="item-cuenta">
                    <div>${item.nombre} x${item.cantidad}</div>
                    <div>$${(item.precio * item.cantidad).toLocaleString('es-CO')}</div>
                </div>
            `).join('')}
            <div class="total-cuenta">
                <strong>TOTAL: $${total.toLocaleString('es-CO')}</strong>
            </div>
        </div>
    `;
    
    document.getElementById('btn-cerrar-cuenta').onclick = function() {
        pedido.estado = 'entregado';
        db.actualizarPedido(pedido);
        
        mesa.estado = 'libre';
        mesa.pedidoActual = null;
        db.updateMesa(mesa);
        
        modal.style.display = 'none';
        cargarMesasCaja();
        cargarReportes();
        
        alert('Cuenta cerrada correctamente');
    };
    
    document.getElementById('btn-imprimir-cuenta').onclick = function() {
        window.print();
    };
    
    modal.style.display = 'flex';
}

// Cargar reportes
function cargarReportes() {
    const pedidos = db.getPedidos();
    const hoy = new Date().toLocaleDateString('es-CO');
    
    const pedidosHoy = pedidos.filter(p => p.fecha === hoy);
    const mesasActivas = db.getMesas().filter(m => m.estado === 'ocupada').length;
    
    const ventasHoy = pedidosHoy.reduce((total, pedido) => {
        return total + pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }, 0);
    
    document.getElementById('ventas-hoy').textContent = `$${ventasHoy.toLocaleString('es-CO')}`;
    document.getElementById('pedidos-hoy').textContent = pedidosHoy.length;
    document.getElementById('mesas-activas').textContent = mesasActivas;
    
    const historialContent = document.getElementById('historial-pedidos');
    historialContent.innerHTML = '';
    
    const ultimosPedidos = pedidos.slice(-10).reverse();
    
    ultimosPedidos.forEach(pedido => {
        const total = pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        const pedidoElement = document.createElement('div');
        pedidoElement.className = 'pedido-historial';
        pedidoElement.innerHTML = `
            <div class="historial-info">
                <div>Mesa ${pedido.mesaNumero} - ${pedido.fecha} ${pedido.hora}</div>
                <div>Estado: ${pedido.estado}</div>
            </div>
            <div class="historial-total">$${total.toLocaleString('es-CO')}</div>
        `;
        
        historialContent.appendChild(pedidoElement);
    });
}
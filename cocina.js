// Variables globales para cocina
let pedidosActuales = [];
let filtroActual = 'todos';
let busquedaActual = '';

// Inicializar pantalla de cocina
document.addEventListener('DOMContentLoaded', function() {
    // Verificar permisos
    if (!verificarPermisos('cocina')) {
        return;
    }

    // Configurar hora actual
    actualizarHora();
    setInterval(actualizarHora, 60000);

    // Cargar pedidos inicialmente
    cargarPedidosCocina();

    // Configurar auto-actualización
    setInterval(cargarPedidosCocina, 10000);

    // Configurar eventos
    document.getElementById('modal-detalles').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModalDetalles();
        }
    });

    // Suscribirse a cambios en tiempo real
    db.suscribir('pedidos', function() {
        cargarPedidosCocina();
    });

    configurarVistaSegunModulo();
});

// Actualizar hora actual
function actualizarHora() {
    const ahora = new Date();
    const horaElement = document.getElementById('hora-actual');
    if (horaElement) {
        horaElement.textContent = `Hora: ${ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Cargar y mostrar pedidos para cocina
function cargarPedidosCocina() {
    const pedidos = db.getPedidosActivos();
    pedidosActuales = pedidos;
    
    actualizarContadores(pedidos);
    mostrarPedidos(pedidos);
}

// Actualizar contadores de estadísticas
function actualizarContadores(pedidos) {
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const enPreparacion = pedidos.filter(p => p.estado === 'preparacion').length;
    const listos = pedidos.filter(p => p.estado === 'listo').length;
    
    document.getElementById('contador-pendientes').textContent = pendientes;
    document.getElementById('contador-preparacion').textContent = enPreparacion;
    document.getElementById('contador-listos').textContent = listos;
    document.getElementById('contador-total').textContent = pedidos.length;
}

// Mostrar pedidos en la interfaz
function mostrarPedidos(pedidos) {
    const pedidosContainer = document.getElementById('pedidos-cocina');
    
    // Aplicar filtros
    let pedidosFiltrados = aplicarFiltros(pedidos);
    
    if (pedidosFiltrados.length === 0) {
        pedidosContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No hay pedidos</h3>
                <p>${filtroActual !== 'todos' || busquedaActual ? 'Prueba con otros filtros' : 'Los pedidos aparecerán aquí automáticamente'}</p>
            </div>
        `;
        return;
    }

    // Ordenar pedidos: primero los más recientes
    pedidosFiltrados.sort((a, b) => new Date(b.fecha + ' ' + b.hora) - new Date(a.fecha + ' ' + a.hora));

    let html = '';
    
    pedidosFiltrados.forEach(pedido => {
        const total = calcularTotalPedido(pedido);
        const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.hora);
        
        html += `
            <div class="pedido-cocina ${pedido.estado}">
                <div class="pedido-header-cocina">
                    <div class="pedido-info-principal">
                        <div class="pedido-mesa">Mesa ${pedido.mesaNumero}</div>
                        <div class="pedido-hora">${pedido.hora} • ${tiempoTranscurrido}</div>
                    </div>
                    <div class="pedido-estado-badge estado-${pedido.estado}">
                        ${obtenerIconoEstado(pedido.estado)} ${pedido.estado.toUpperCase()}
                    </div>
                </div>
                
                <div class="pedido-mesero">Mesero: <strong>${pedido.mesero}</strong></div>
                
                <div class="pedido-items-cocina">
                    ${pedido.items.map(item => `
                        <div class="item-pedido-cocina">
                            <div class="item-info-cocina">
                                <span class="item-cantidad-cocina">${item.cantidad}x</span>
                                <span class="item-nombre-cocina">${item.nombre}</span>
                            </div>
                            ${item.adiciones.length > 0 ? `
                                <div class="item-adiciones-cocina">
                                    ➕ ${item.adiciones.map(a => a.nombre).join(', ')}
                                </div>
                            ` : ''}
                            ${item.notas ? `
                                <div class="item-notas-cocina">
                                    📝 ${item.notas}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="pedido-total-cocina">
                    Total: <strong>$${total.toLocaleString('es-CO')}</strong>
                </div>
                
                <div class="pedido-acciones">
                    ${pedido.estado === 'pendiente' ? `
                        <button class="btn-accion comenzar" onclick="cambiarEstadoPedido(${pedido.id}, 'preparacion')">
                            🍳 Comenzar Preparación
                        </button>
                    ` : ''}
                    
                    ${pedido.estado === 'preparacion' ? `
                        <button class="btn-accion listo" onclick="cambiarEstadoPedido(${pedido.id}, 'listo')">
                            ✅ Marcar como Listo
                        </button>
                    ` : ''}
                    
                    ${pedido.estado === 'listo' ? `
                        <button class="btn-accion entregado" onclick="cambiarEstadoPedido(${pedido.id}, 'entregado')">
                            🎉 Marcar como Entregado
                        </button>
                    ` : ''}
                    
                    <button class="btn-accion detalles" onclick="verDetallesPedido(${pedido.id})">
                        👁️ Ver Detalles
                    </button>
                </div>
            </div>
        `;
    });
    
    pedidosContainer.innerHTML = html;
}

// Aplicar filtros y búsqueda
function aplicarFiltros(pedidos) {
    let filtrados = pedidos;
    
    // Aplicar filtro de estado
    if (filtroActual !== 'todos') {
        filtrados = filtrados.filter(pedido => pedido.estado === filtroActual);
    }
    
    // Aplicar búsqueda
    if (busquedaActual) {
        const busqueda = busquedaActual.toLowerCase();
        filtrados = filtrados.filter(pedido => 
            pedido.mesaNumero.toString().includes(busqueda) ||
            pedido.mesero.toLowerCase().includes(busqueda) ||
            pedido.items.some(item => 
                item.nombre.toLowerCase().includes(busqueda) ||
                (item.notas && item.notas.toLowerCase().includes(busqueda))
            )
        );
    }
    
    return filtrados;
}

// Filtrar pedidos por estado
function filtrarPedidos(estado) {
    filtroActual = estado;
    
    // Actualizar botones activos
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    mostrarPedidos(pedidosActuales);
}

// Buscar pedidos
function buscarPedidos() {
    busquedaActual = document.getElementById('buscar-pedido').value;
    mostrarPedidos(pedidosActuales);
}

// Cambiar estado de un pedido
function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    const pedido = db.getPedido(pedidoId);
    if (pedido) {
        const estadoAnterior = pedido.estado;
        pedido.estado = nuevoEstado;
        
        // Registrar quien hizo el cambio
        const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
        pedido.ultimaModificacion = {
            por: usuario.nombre,
            hora: new Date().toLocaleTimeString('es-CO'),
            fecha: new Date().toLocaleDateString('es-CO')
        };
        
        db.actualizarPedido(pedido);
        
        // Mostrar notificación
        mostrarNotificacion(`Pedido Mesa ${pedido.mesaNumero} cambiado a ${nuevoEstado}`, 'success');
        
        // Si el pedido se marca como entregado, liberar la mesa
        if (nuevoEstado === 'entregado') {
            const mesa = db.getMesa(pedido.mesaId);
            if (mesa) {
                mesa.estado = 'libre';
                mesa.pedidoActual = null;
                db.updateMesa(mesa);
            }
        }
    }
}

// Ver detalles completos de un pedido
function verDetallesPedido(pedidoId) {
    const pedido = db.getPedido(pedidoId);
    if (!pedido) return;
    
    const total = calcularTotalPedido(pedido);
    const modal = document.getElementById('modal-detalles');
    const contenido = document.getElementById('detalles-content');
    
    contenido.innerHTML = `
        <div class="detalles-pedido">
            <div class="detalle-info">
                <div class="detalle-item">
                    <strong>Mesa:</strong> ${pedido.mesaNumero}
                </div>
                <div class="detalle-item">
                    <strong>Mesero:</strong> ${pedido.mesero}
                </div>
                <div class="detalle-item">
                    <strong>Hora del pedido:</strong> ${pedido.hora} (${pedido.fecha})
                </div>
                <div class="detalle-item">
                    <strong>Estado actual:</strong> <span class="estado-${pedido.estado}">${pedido.estado.toUpperCase()}</span>
                </div>
                ${pedido.ultimaModificacion ? `
                <div class="detalle-item">
                    <strong>Última modificación:</strong> 
                    ${pedido.ultimaModificacion.por} a las ${pedido.ultimaModificacion.hora}
                </div>
                ` : ''}
            </div>
            
            <div class="detalle-items">
                <h4>Items del Pedido:</h4>
                ${pedido.items.map(item => `
                    <div class="detalle-item-producto">
                        <div class="item-header">
                            <span class="item-cantidad">${item.cantidad}x</span>
                            <span class="item-nombre">${item.nombre}</span>
                            <span class="item-precio">$${(item.precio * item.cantidad).toLocaleString('es-CO')}</span>
                        </div>
                        ${item.adiciones.length > 0 ? `
                            <div class="item-adiciones">
                                <strong>Adiciones:</strong> ${item.adiciones.map(a => `${a.nombre} (+$${a.precio.toLocaleString('es-CO')})`).join(', ')}
                            </div>
                        ` : ''}
                        ${item.notas ? `
                            <div class="item-notas">
                                <strong>Notas:</strong> ${item.notas}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="detalle-total">
                <strong>TOTAL: $${total.toLocaleString('es-CO')}</strong>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Cerrar modal de detalles
function cerrarModalDetalles() {
    document.getElementById('modal-detalles').style.display = 'none';
}

// Funciones utilitarias
function calcularTotalPedido(pedido) {
    return pedido.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

function calcularTiempoTranscurrido(horaPedido) {
    const ahora = new Date();
    const [horas, minutos, segundos] = horaPedido.split(':');
    const pedidoDate = new Date();
    pedidoDate.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos || 0));
    
    const diffMs = ahora - pedidoDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Hace ${diffHours} h`;
}

function obtenerIconoEstado(estado) {
    const iconos = {
        'pendiente': '⏳',
        'preparacion': '👨‍🍳',
        'listo': '✅',
        'entregado': '🎉'
    };
    return iconos[estado] || '📋';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Implementación simple de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = mensaje;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
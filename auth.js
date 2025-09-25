// Simulación de base de datos de usuarios
const usuarios = [
    { 
        id: 1, 
        username: 'mesero1', 
        password: '1234', 
        nombre: 'Juan Pérez', 
        rol: 'mesero',
        modulos: ['mesero']
    },
    { 
        id: 2, 
        username: 'mesero2', 
        password: '1234', 
        nombre: 'María García', 
        rol: 'mesero',
        modulos: ['mesero']
    },
    { 
        id: 3, 
        username: 'admin', 
        password: 'admin', 
        nombre: 'Administrador', 
        rol: 'admin',
        modulos: ['mesero', 'cocina', 'caja']
    },
    { 
        id: 4, 
        username: 'cocina', 
        password: 'cocina123', 
        nombre: 'Chef Carlos', 
        rol: 'cocina',
        modulos: ['cocina']
    },
    { 
        id: 5, 
        username: 'caja', 
        password: 'caja123', 
        nombre: 'Ana Finanzas', 
        rol: 'caja',
        modulos: ['caja']
    }
];

// Verificar si el usuario ya está logueado
document.addEventListener('DOMContentLoaded', function() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    const moduloSeleccionado = localStorage.getItem('moduloSeleccionado');
    
    if (usuarioLogueado && moduloSeleccionado && !window.location.pathname.endsWith('index.html')) {
        redirigirAModulo(moduloSeleccionado);
    }
    
    // Configurar formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const modulo = document.getElementById('modulo').value;
            
            if (!username || !password) {
                mostrarError('Por favor, completa todos los campos');
                return;
            }
            
            if (!modulo) {
                mostrarError('Por favor, selecciona un módulo');
                return;
            }
            
            const usuario = usuarios.find(u => u.username === username && u.password === password);
            
            if (usuario) {
                if (!usuario.modulos.includes(modulo)) {
                    mostrarError(`El usuario ${usuario.nombre} no tiene acceso al módulo ${modulo}`);
                    return;
                }
                
                localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
                localStorage.setItem('moduloSeleccionado', modulo);
                
                redirigirAModulo(modulo);
            } else {
                mostrarError('Usuario o contraseña incorrectos');
            }
        });
    }
    
    // Configurar información del usuario en otras páginas
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
        if (usuario) {
            userInfoElement.textContent = usuario.nombre;
        }
    }
    
    configurarVistaSegunModulo();
});

// Redirigir al módulo correspondiente
function redirigirAModulo(modulo) {
    const paginas = {
        'mesero': 'mesero.html',
        'cocina': 'cocina.html',
        'caja': 'caja.html'
    };
    
    if (paginas[modulo]) {
        window.location.href = paginas[modulo];
    }
}

// Función de logout
function logout() {
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('moduloSeleccionado');
    window.location.href = 'index.html';
}

// Cambiar de módulo
function cambiarModulo(nuevoModulo) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    
    if (usuario && usuario.modulos.includes(nuevoModulo)) {
        localStorage.setItem('moduloSeleccionado', nuevoModulo);
        redirigirAModulo(nuevoModulo);
    } else {
        alert('No tienes acceso a este módulo');
    }
}

// Configurar vista según el módulo actual
function configurarVistaSegunModulo() {
    const modulo = localStorage.getItem('moduloSeleccionado');
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    
    if (!usuario) return;
    
    const cambiarModuloBtn = document.getElementById('cambiarModuloBtn');
    if (cambiarModuloBtn && usuario.modulos.length > 1) {
        cambiarModuloBtn.style.display = 'block';
        cambiarModuloBtn.onclick = function() {
            const proximoModulo = obtenerProximoModulo(usuario.modulos, modulo);
            cambiarModulo(proximoModulo);
        };
        cambiarModuloBtn.innerHTML = `🔀 Cambiar a ${obtenerNombreModulo(obtenerProximoModulo(usuario.modulos, modulo))}`;
    }
}

// Obtener el próximo módulo disponible
function obtenerProximoModulo(modulosDisponibles, moduloActual) {
    const indexActual = modulosDisponibles.indexOf(moduloActual);
    const proximoIndex = (indexActual + 1) % modulosDisponibles.length;
    return modulosDisponibles[proximoIndex];
}

// Obtener nombre legible del módulo
function obtenerNombreModulo(modulo) {
    const nombres = {
        'mesero': 'Mesero',
        'cocina': 'Cocina',
        'caja': 'Caja'
    };
    return nombres[modulo] || modulo;
}

// Mostrar mensajes de error
function mostrarError(mensaje) {
    const errorAnterior = document.querySelector('.error-message');
    if (errorAnterior) {
        errorAnterior.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 12px;
        border-radius: 6px;
        margin: 0 0 20px 0;
        border: 1px solid #f5c6cb;
        animation: slideDown 0.3s ease;
    `;
    
    const loginForm = document.getElementById('loginForm');
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Verificar permisos al cargar una página
function verificarPermisos(moduloRequerido) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
    const moduloSeleccionado = localStorage.getItem('moduloSeleccionado');
    
    if (!usuario || !moduloSeleccionado) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (moduloSeleccionado !== moduloRequerido || !usuario.modulos.includes(moduloRequerido)) {
        alert('No tienes permisos para acceder a este módulo');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    return true;
}
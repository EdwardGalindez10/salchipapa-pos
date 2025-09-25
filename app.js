// Funcionalidades generales de la aplicación

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado correctamente: ', registration.scope);
            })
            .catch(function(error) {
                console.log('Error registrando ServiceWorker: ', error);
            });
    });
}

// Solicitar instalación como PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    mostrarBotonInstalacion();
});

function mostrarBotonInstalacion() {
    if (!deferredPrompt) return;
    
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Instalar App';
    installButton.className = 'btn-install';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: #ff6b35;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    `;
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                installButton.remove();
            }
        }
    });
    
    document.body.appendChild(installButton);
}

// Utilidades generales
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
});

// Función para generar IDs únicos
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
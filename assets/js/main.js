/**
 * AIR PREMIER GROUP - Frontend Scripts
 * Carga de contenido dinámico (textos e imágenes) desde Neon.tech y comportamientos generales
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar contenidos e imágenes actualizados desde Neon.tech
    try {
        const response = await fetch('/api/content');
        if (response.ok) {
            const result = await response.json();
            if (result.data && Object.keys(result.data).length > 0) {
                Object.entries(result.data).forEach(([key, content]) => {
                    const el = document.querySelector(`[data-content-key="${key}"]`);
                    if (el && content) {
                        if (el.tagName === 'IMG') {
                            el.src = content;
                        } else {
                            el.innerHTML = content;
                        }
                    }
                });
                console.log('✅ Contenido sincronizado desde Neon.tech');
            }
        }
    } catch (err) {
        console.warn('Nota: usando contenido predeterminado local', err.message);
    }

    // 2. Comportamiento suave de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

/**
 * AIR PREMIER GROUP - Frontend Scripts
 * Carga de contenido dinámico (textos e imágenes) desde Neon.tech, navegación y formulario de contacto con Resend
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

    // 3. Envío del Formulario de Contacto vía Resend API
    const contactForm = document.getElementById('groupContactForm');
    const submitBtn = document.getElementById('contactSubmitBtn');
    const statusDiv = document.getElementById('contactFormStatus');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('contactName')?.value?.trim();
            const email = document.getElementById('contactEmail')?.value?.trim();
            const message = document.getElementById('contactMessage')?.value?.trim();

            if (!name || !email || !message) {
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    statusDiv.style.color = '#f87171';
                    statusDiv.textContent = 'Por favor complete todos los campos.';
                }
                return;
            }

            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Enviar';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando solicitud...';
            }

            if (statusDiv) {
                statusDiv.style.display = 'none';
            }

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });

                const data = await res.json();

                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    if (data.success) {
                        statusDiv.style.color = '#34d399';
                        statusDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + (data.message || '¡Mensaje enviado con éxito!');
                        contactForm.reset();
                    } else {
                        statusDiv.style.color = '#f87171';
                        statusDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + (data.error || 'No se pudo enviar el mensaje.');
                    }
                }
            } catch (err) {
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    statusDiv.style.color = '#f87171';
                    statusDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error de conexión al enviar el mensaje.';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }
});

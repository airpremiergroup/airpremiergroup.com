/**
 * AIR PREMIER GROUP - Panel de Edición en Vivo y Autenticación de Cliente
 * Permite editar textos y cambiar imágenes por DOBLE CLIC en tiempo real y guardar en Neon.tech
 */

(function () {
    let isEditing = false;
    let authToken = sessionStorage.getItem('apg_admin_token') || null;
    let targetImageForUpload = null;

    // Crear input file oculto para cargar imágenes
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.id = 'apg-hidden-file-input';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', handleFileSelected);

    // Inyectar Estilos del Editor, Modal e Imágenes
    const style = document.createElement('style');
    style.textContent = `
        /* Barra de Herramientas de Edición */
        #apg-admin-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 24px;
            z-index: 100000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            border-bottom: 2px solid #38bdf8;
            font-family: 'Montserrat', sans-serif;
            box-sizing: border-box;
        }

        #apg-admin-toolbar .toolbar-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.88rem;
            font-weight: 600;
        }

        #apg-admin-toolbar .toolbar-info .badge {
            background: #0284c7;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .apg-tb-btn-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .apg-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.82rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            font-family: inherit;
        }

        .apg-btn-toggle {
            background: #f59e0b;
            color: #0f172a;
        }
        .apg-btn-toggle.active {
            background: #10b981;
            color: white;
        }

        .apg-btn-save {
            background: #38bdf8;
            color: #0f172a;
        }
        .apg-btn-save:hover {
            background: #0284c7;
            color: white;
        }

        .apg-btn-logout {
            background: #475569;
            color: #ffffff;
        }
        .apg-btn-logout:hover {
            background: #ef4444;
        }

        /* Botón Flotante Discreto de Acceso Admin */
        #apg-admin-trigger-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(15, 23, 42, 0.85);
            color: #94a3b8;
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 30px;
            padding: 8px 14px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            z-index: 9999;
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        #apg-admin-trigger-btn:hover {
            background: #0f172a;
            color: #38bdf8;
            border-color: #38bdf8;
            transform: scale(1.03);
        }

        /* Resaltado de Textos Editables */
        body.apg-editing-active [data-content-key]:not(img) {
            outline: 2px dashed #38bdf8 !important;
            outline-offset: 4px;
            background-color: rgba(56, 189, 248, 0.1) !important;
            border-radius: 4px;
            cursor: text !important;
            transition: background-color 0.2s ease;
        }
        body.apg-editing-active [data-content-key]:not(img):hover {
            background-color: rgba(56, 189, 248, 0.2) !important;
        }

        /* Resaltado de Imágenes Editables */
        body.apg-editing-active img[data-content-key] {
            outline: 3px dashed #f59e0b !important;
            outline-offset: 3px;
            cursor: pointer !important;
            position: relative;
            transition: filter 0.2s, transform 0.2s;
        }
        body.apg-editing-active img[data-content-key]:hover {
            filter: brightness(1.15) drop-shadow(0 0 10px rgba(245, 158, 11, 0.6));
            transform: scale(1.01);
        }

        /* Modal de Login */
        .apg-modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(7, 14, 23, 0.85);
            backdrop-filter: blur(8px);
            z-index: 200000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Montserrat', sans-serif;
        }

        .apg-modal-card {
            background: #0f172a;
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px;
            padding: 32px;
            width: 90%;
            max-width: 420px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.7);
            color: #ffffff;
            position: relative;
        }

        .apg-modal-card h3 {
            font-size: 1.3rem;
            margin-bottom: 8px;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .apg-modal-card p {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 24px;
            font-family: 'Open Sans', sans-serif;
        }

        .apg-form-group {
            margin-bottom: 20px;
        }

        .apg-input {
            width: 100%;
            padding: 12px 16px;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            color: white;
            font-size: 0.95rem;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        .apg-input:focus {
            border-color: #38bdf8;
        }

        .apg-modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .apg-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #0f172a;
            color: #ffffff;
            padding: 14px 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 300000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.9rem;
            animation: apgSlideIn 0.3s ease;
        }

        @keyframes apgSlideIn {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Inicializar UI al cargar
    document.addEventListener('DOMContentLoaded', () => {
        setupTriggerButton();
        if (authToken) {
            renderAdminToolbar();
        }
    });

    // Helper: Toast de Notificación
    function showToast(message, isError = false) {
        const oldToast = document.querySelector('.apg-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = 'apg-toast';
        if (isError) toast.style.borderLeftColor = '#ef4444';
        toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check'}" style="color: ${isError ? '#ef4444' : '#10b981'}"></i> <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Botón flotante discreto para abrir login
    function setupTriggerButton() {
        if (document.getElementById('apg-admin-trigger-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'apg-admin-trigger-btn';
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso Cliente / Edición';
        btn.onclick = () => {
            if (authToken) {
                renderAdminToolbar();
                showToast('Sesión de administrador activa');
            } else {
                showLoginModal();
            }
        };
        document.body.appendChild(btn);

        // Atajo de teclado: Ctrl + Shift + E
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                btn.click();
            }
        });
    }

    // Modal de Login
    function showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'apg-modal-backdrop';
        modal.id = 'apg-login-modal';
        modal.innerHTML = `
            <div class="apg-modal-card">
                <h3><i class="fa-solid fa-user-shield" style="color: #38bdf8;"></i> Modo Administrador</h3>
                <p>Ingrese su contraseña de gestión para habilitar la edición de contenidos e imágenes en vivo.</p>
                <form id="apg-login-form">
                    <div class="apg-form-group">
                        <input type="password" id="apg-admin-pass" class="apg-input" placeholder="Contraseña de Administrador" required autofocus />
                    </div>
                    <div class="apg-modal-actions">
                        <button type="button" class="apg-btn apg-btn-logout" id="apg-cancel-login">Cancelar</button>
                        <button type="submit" class="apg-btn apg-btn-save"><i class="fa-solid fa-key"></i> Entrar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('apg-cancel-login').onclick = () => modal.remove();

        document.getElementById('apg-login-form').onsubmit = async (e) => {
            e.preventDefault();
            const password = document.getElementById('apg-admin-pass').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();

                if (data.success && data.token) {
                    authToken = data.token;
                    sessionStorage.setItem('apg_admin_token', authToken);
                    modal.remove();
                    renderAdminToolbar();
                    showToast('¡Bienvenido! Modo de edición disponible.');
                } else {
                    showToast(data.message || 'Contraseña incorrecta', true);
                }
            } catch (err) {
                showToast('Error al conectar con el servidor', true);
            }
        };
    }

    // Barra de herramientas superior activa
    function renderAdminToolbar() {
        if (document.getElementById('apg-admin-toolbar')) return;

        const header = document.querySelector('header');
        if (header) {
            header.style.top = '54px';
        }

        const toolbar = document.createElement('div');
        toolbar.id = 'apg-admin-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-info">
                <span class="badge">ADMIN</span>
                <span>Editor en Vivo (Textos &amp; Fotos)</span>
            </div>
            <div class="apg-tb-btn-group">
                <button class="apg-btn apg-btn-toggle" id="apg-toggle-edit-btn">
                    <i class="fa-solid fa-pen-to-square"></i> Activar Edición
                </button>
                <button class="apg-btn apg-btn-save" id="apg-save-btn">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Guardar en Neon.tech
                </button>
                <button class="apg-btn apg-btn-logout" id="apg-logout-btn" title="Cerrar sesión">
                    <i class="fa-solid fa-right-from-bracket"></i> Salir
                </button>
            </div>
        `;
        document.body.prepend(toolbar);

        document.getElementById('apg-toggle-edit-btn').onclick = toggleEditMode;
        document.getElementById('apg-save-btn').onclick = saveChangesToNeon;
        document.getElementById('apg-logout-btn').onclick = logoutAdmin;
    }

    // Alternar modo de edición
    function toggleEditMode() {
        isEditing = !isEditing;
        const btn = document.getElementById('apg-toggle-edit-btn');
        const editableTexts = document.querySelectorAll('[data-content-key]:not(img)');
        const editableImgs = document.querySelectorAll('img[data-content-key]');

        if (isEditing) {
            document.body.classList.add('apg-editing-active');
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-unlock"></i> Edición ACTIVA (Clic textos / Doble clic fotos)';
            
            // Habilitar textos
            editableTexts.forEach(el => el.setAttribute('contenteditable', 'true'));

            // Habilitar doble clic en imágenes
            editableImgs.forEach(img => {
                img.title = 'Haz doble clic para cambiar esta imagen';
                img.addEventListener('dblclick', onImageDblClick);
            });

            showToast('Haz clic en cualquier texto o DOBLE CLIC en cualquier imagen para modificarla');
        } else {
            document.body.classList.remove('apg-editing-active');
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Activar Edición';
            
            editableTexts.forEach(el => el.removeAttribute('contenteditable'));
            editableImgs.forEach(img => {
                img.removeAttribute('title');
                img.removeEventListener('dblclick', onImageDblClick);
            });
        }
    }

    // Manejador de doble clic en imágenes
    function onImageDblClick(e) {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation();
        targetImageForUpload = e.currentTarget;
        fileInput.value = ''; // Reset
        fileInput.click();
    }

    // Procesar archivo de imagen seleccionado y optimizar
    function handleFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        if (!file || !targetImageForUpload) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                // Redimensionar suavemente si supera 1600px para mantener rendimiento ultra rápido
                const maxDim = 1600;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const optimizedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
                
                targetImageForUpload.src = optimizedDataUrl;
                showToast('¡Imagen actualizada en pantalla! Recuerda presionar "Guardar en Neon.tech"');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Guardar cambios (textos e imágenes) en Neon.tech vía Vercel API
    async function saveChangesToNeon() {
        if (isEditing) toggleEditMode();

        const saveBtn = document.getElementById('apg-save-btn');
        const originalBtnHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const allElements = document.querySelectorAll('[data-content-key]');
        const items = {};

        allElements.forEach(el => {
            const key = el.getAttribute('data-content-key');
            if (key) {
                if (el.tagName === 'IMG') {
                    // Solo guardamos si se modificó o tiene ruta
                    items[key] = el.getAttribute('src');
                } else {
                    items[key] = el.innerHTML.trim();
                }
            }
        });

        try {
            const res = await fetch('/api/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ items })
            });

            const result = await res.json();
            if (result.success) {
                showToast(`¡Cambios guardados con éxito en Neon.tech! (${result.updatedCount || Object.keys(items).length} elementos)`);
            } else {
                showToast(result.error || 'Error al guardar cambios', true);
            }
        } catch (err) {
            showToast('Error de conexión al guardar los cambios', true);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
        }
    }

    // Cerrar sesión
    function logoutAdmin() {
        if (isEditing) toggleEditMode();
        authToken = null;
        sessionStorage.removeItem('apg_admin_token');
        const toolbar = document.getElementById('apg-admin-toolbar');
        if (toolbar) toolbar.remove();

        const header = document.querySelector('header');
        if (header) {
            header.style.top = '0px';
        }

        showToast('Sesión de administrador cerrada');
    }
})();

# TeleDrive — Telegram Cloud Storage Client

## Descripción
Aplicación de escritorio (Electron + React) que usa Telegram como almacenamiento en la nube. Permite autenticarse como cliente Telegram (MTProto), crear/manage grupos propios como "carpetas" de almacenamiento, explorar grupos de terceros (solo lectura), y ver/administrar archivos con vista de lista o galería.

---

## 1. Autenticación

### Flujo de login
1. Ingreso de número de teléfono internacional
2. Solicitud de código de verificación (enviado por Telegram al celular)
3. Ingreso del código recibido
4. Ingreso de contraseña 2FA (si la cuenta la tiene configurada)
5. Almacenamiento seguro de la sesión usando `electron.safeStorage`

### Seguridad
- API ID y API Hash almacenados en `safeStorage` (encriptado con clave del SO)
- Sesión MTProto encriptada en disco
- Auditoría de paquetes npm (`npm audit`) en build/CI

---

## 2. Arquitectura

### Componentes
```
TeleDrive/
├── src/
│   ├── main/           # Electron main process
│   │   ├── telegram/   # gramjs (MTProto) client wrapper
│   │   ├── ipc/        # IPC handlers
│   │   └── storage/    # Sesión encriptada
│   ├── preload/        # contextBridge API expuesta
│   └── renderer/       # React UI
│       ├── components/
│       ├── hooks/
│       └── pages/
├── tests/
│   ├── unit/           # Componentes, hooks, utils
│   ├── integration/    # IPC + flujos mockeados
│   └── e2e/            # Playwright + Electron
└── electron/           # Config de Electron
```

### Comunicación
- Main Process ↔ Renderer via IPC (contextBridge)
- Solo métodos específicos expuestos al renderer (principio de mínimo privilegio)
- Never expone el objeto `TelegramClient` directamente al renderer

---

## 3. Funcionalidad

### Gestión de grupos
- **Listar grupos**: Todos los grupos donde el usuario es miembro
- **Grupos archivados**: Incluidos en la lista con indicador visual
- **Badge de propiedad**:
  - "Propio" (verde) — grupos creados por el usuario, permite upload/delete
  - "Tercero" (naranja) — grupos de otros miembros, solo lectura
- **Crear grupos**: El usuario puede crear nuevos grupos para almacenamiento

### Operaciones de archivos
- **Upload**: Subir archivos a grupos propios (arrastrar/y click)
- **Download**: Descargar archivos al disco local
- **Delete**: Eliminar archivos de grupos propios
- **Forward**: Reenviar archivos entre grupos (incluyendo de terceros → propios)

### Vistas
- **Vista Lista**: Tabla con icono, nombre, tipo, tamaño, fecha
- **Vista Galería**: Grid de 3 columnas con thumbnails
  - Videos con badge de duración
  - Al hacer clic: modal preview con imagen/video en grande + metadatos + acciones

### Filtros
- **Todos**: Muestra todos los archivos
- **Multimedia**: Solo imágenes y videos
- **Documentos**: PDFs, documentos, archivos comprimidos, etc.

---

## 4. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Desktop | Electron |
| UI | React + TypeScript |
| Telegram API | gramjs (MTProto client) |
| Styling | CSS Modules o Tailwind |
| Testing (unit) | Vitest + @testing-library/react |
| Testing (e2e) | Playwright + electron |
| Secure storage | electron.safeStorage |
| Build | electron-builder o electron-forge |

---

## 5. Pruebas (TDD)

### Unit tests (Vitest)
- Componentes: LoginForm, GroupList, FileGrid, FileListItem, FilterBar, ViewToggle, GalleryPreview
- Hooks: useTelegram, useGroups, useFiles, useGallery
- Utils: formatFileSize, formatDate, fileTypeFilter, groupOwnership

### Integration tests
- Flujo de login: phone → code → 2FA (con gramjs mockeado)
- Operaciones de archivos: upload, download, delete, forward
- IPC handlers: cada handler con TelegramClient simulado

### E2E tests (Playwright)
- Login completo con credenciales de prueba
- Navegación a grupos + aplicar filtros
- Toggle lista/galería
- Upload/download de archivos

---

## 6. UI/UX

### Pantallas
1. **Login Screen**: 3 pasos secuenciales (phone → code → 2FA)
2. **Group List**: Sidebar o lista principal con badges, búsqueda, grupos archivados
3. **File View**: Lista o galería, filtros, acciones contextuales
4. **Preview Modal**: Overlay con imagen/video, metadatos, botones de acción

### Diseño
- Interfaz simple y funcional (estilo Telegram Desktop simplificado)
- Toggle Lista/Galería en la cabecera de la vista de archivos
- Filtros: dropdown o tabs (Todos | Multimedia | Documentos)
- Upload: botón + drag & drop

---

## 7. Limitaciones conocidas
- Telegram tiene límite de 2 GB por archivo
- Grupos de terceros: no se puede eliminar/modificar contenido
- La API ID/Hash deben obtenerse en https://my.telegram.org/apps

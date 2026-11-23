# SmartShopping

Aplicación realizada en un entorno académico de lista de compras para Aplicaciones Móviles. El proyecto conserva las funcionalidades del Parcial 1 e incorpora recursos del dispositivo y una organización de lista y detalle para el Parcial 2.

## Requisitos

- Node.js 22.13 o superior y npm.
- Expo SDK 57, configurado en `package.json` y `app.json`.
- Para ejecutar en Android con Expo Go: Expo Go compatible con SDK 57.
- Para probar la creación real de eventos de calendario: Android o iOS con un development build. `expo-calendar` no está disponible en Expo Go para SDK 57.

## Instalación y ejecución

Desde la raíz del repositorio:

```powershell
npm.cmd ci
npm.cmd start
```

En Windows también se pueden usar `npm.cmd` y `npx.cmd` si PowerShell bloquea los scripts `npm` o `npx`. En macOS/Linux, usar `npm ci` y `npm start`.

Para Android o iOS, abrir el proyecto con Expo Go y escanear el QR cuando la función que se quiere probar esté soportada por Expo Go. Para web:

```powershell
npm.cmd run web
```

La cámara, galería, ubicación y contactos usan los módulos Expo correspondientes y sus permisos/selecciones nativos. En web hay limitaciones propias del navegador y no se simulan recursos nativos que no están disponibles.

### Calendario y estado de validación

El código integra `expo-calendar`, un selector de fecha/hora y el vínculo del ID del evento con el producto. Sin embargo, **la creación real, los permisos y la aparición del evento en la agenda todavía no fueron validados en un dispositivo con development build**. Expo Go SDK 57 no sirve para comprobar esta función.

El evento vinculado permanece en la agenda, incluso si se elimina el producto.

## Funcionalidades

### Parcial 1

- Registro y login locales, recuperación de sesión y cierre de sesión.
- Alta de productos con nombre y cantidad, lista, marcado como comprado/pendiente y eliminación confirmada.
- Recordatorio local de compra a los 10 segundos para productos pendientes.
- Persistencia local de usuario, sesión y productos.

La autenticación es académica: se guarda un único usuario y un nuevo registro lo reemplaza. Las contraseñas se almacenan sin cifrar en AsyncStorage; no usar credenciales reales.

### Parcial 2

- Lista compacta y pantalla de detalle del producto; la eliminación pide confirmación.
- Cámara y galería para asociar una fotografía. En Android, las imágenes se guardan en el directorio privado de la app; en web se guardan como Blob en IndexedDB. Las referencias de imagen se conservan con el producto. No hay sincronización entre dispositivos.
- Ubicación del comercio en primer plano mediante GPS, asociada como latitud/longitud. No hay seguimiento en segundo plano; la precisión depende del dispositivo y del permiso.
- Selección de proveedor desde contactos. Se guarda una copia local del nombre y, si está disponible, el primer teléfono o email. No se guarda la agenda completa ni se modifica el contacto.
- Recordatorio de calendario por producto, con fecha/hora y metadatos del evento.


## Estado global y persistencia

Zustand mantiene el estado global de productos con un store creado mediante `create`; no requiere un Provider envolviendo la navegación. Las pantallas consumen datos y acciones mediante selectores del store; las acciones `load`, `add`, `update`, `toggle` y `remove` centralizan las operaciones. `load` recupera AsyncStorage y las operaciones guardan el resultado por medio de `src/storage/productStorage.ts`, que valida los campos opcionales para foto, ubicación, proveedor y evento. La autenticación conserva su almacenamiento separado en `src/storage/authStorage.ts`.

Las fotos web se guardan en IndexedDB y no como Base64 en AsyncStorage. Todo el almacenamiento es local al dispositivo o al origen web; no existe sincronización remota.

## Pruebas y validaciones

Ejecutar en Windows:

```powershell
npm.cmd test -- --runInBand --no-cache
npx.cmd tsc --noEmit
```

La última ejecución de esta preparación, el 23 de noviembre de 2026, terminó con **17 suites y 120 tests aprobados**; TypeScript finalizó sin errores. Expo Doctor no se ejecutó: no está instalado en el proyecto y se evitó que `npx` descargara herramientas. Jest usa mocks para recursos nativos; esos tests no prueban permisos reales, GPS físico, selectores del sistema ni creación de eventos en un calendario real.

Las capturas `docs/images/test1.png` y `docs/images/test2.png` son evidencia histórica del Parcial 1 (4 suites/36 tests), no de la ejecución actual ni de las funciones nativas del Parcial 2.

Pruebas manuales pendientes: permisos concedidos/denegados/bloqueados; cámara y galería reales; GPS con servicios activos/desactivados; selección/cancelación de contactos; reinicio y persistencia; recordatorio de 10 segundos; calendario en un development build con evento visible en la agenda; y recorrido web de las alternativas y limitaciones.

## Video de demostración

[Ver video de demostración de SmartShopping](https://youtube.com/shorts/PvFGukGxLLQ?feature=share)

## Documentación de IA

La mejora de lista y detalle se documenta en [`docs/ia-mejora-ux-lista-detalle.md`](docs/ia-mejora-ux-lista-detalle.md), con el prompt aportado, los cambios descritos y los ajustes humanos registrados. La documentación no atribuye resultados visuales ni detalles de herramienta/modelo que no estén respaldados por evidencia.

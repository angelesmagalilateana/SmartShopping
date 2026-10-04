# SmartShopping

Proyecto del Parcial 1 de Aplicaciones Móviles.

**Opción elegida:** Lista de compras inteligente.

## Tecnologías

React Native + Expo SDK 57 + TypeScript, React Navigation Native Stack,
AsyncStorage y expo-notifications. Tests con Jest, jest-expo y React Native
Testing Library.

## Instalación

Requisitos: Node.js 22.13 o superior, npm y Expo Go compatible con SDK 57
en el dispositivo Android.

Desde la carpeta del proyecto:

```bash
npm ci
```

## Ejecución

```bash
npm start
```

Abrir el proyecto escaneando el QR desde Expo Go. La computadora y el
dispositivo deben estar conectados a la misma red.

En PowerShell, si la política de ejecución bloquea npm o npx, usar
`npm.cmd` y `npx.cmd` en lugar de `npm` y `npx`.

## Funcionalidades

- Registro local con usuario, contraseña y confirmación.
- Login y acceso al flujo autenticado mediante Native Stack.
- Recuperación de la sesión al iniciar y cierre de sesión.
- Alta de productos con nombre y cantidad entera mínima de 1.
- Listado, marcado como comprado/pendiente y eliminación.
- Persistencia local de usuario, sesión y productos.
- Recordatorio local único a los 10 segundos para una lista con pendientes.

Se guarda un único usuario local; un nuevo registro reemplaza al anterior.
Cerrar sesión conserva el usuario y los productos. La autenticación es
académica: las credenciales se almacenan sin cifrado en AsyncStorage.

Para probar el recordatorio en Android, iniciar sesión, agregar un producto
pendiente, presionar **Recordarme comprar**, permitir las notificaciones si
se solicita y esperar aproximadamente 10 segundos. Comprobar el aviso y
la bandeja de notificaciones, primero con la app abierta y luego en segundo
plano. La visualización debe verificarse en el dispositivo; Jest no la valida.

## Tests y validaciones

```bash
npm test
```

Ejecución completa sin caché:

```bash
npm test -- --runInBand --no-cache
npx tsc --noEmit
npx expo-doctor
```

Los tests cubren validaciones, ProductItem y persistencia de autenticación
y productos.

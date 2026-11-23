# Mejora UX: lista compacta y detalle de producto

## Prompt real utilizado

Prompt recibido del usuario en esta conversación, copiado sin reconstruirlo:

> Quiero implementar la primera mejora UX/UI de SmartShopping, tomando como referencia la auditoría UX y la Unidad 11 de IA en Desarrollo de Interfaces.\
> \
> OBJETIVO: simplificar la lista y organizar las funciones avanzadas en pantalla de detalle.\
> \
> LISTA PRINCIPAL:\
> - Nombre, cantidad, estado y acción rápida comprado.\
> - Miniatura cuando exista.\
> - Indicadores discretos de ubicación, proveedor y calendario.\
> - Abrir detalle tocando el producto.\
> - Mantener eliminación accesible sin sobrecarga.\
> \
> DETALLE:\
> - Nueva pantalla accesible desde la lista.\
> - Secciones: foto, comercio/GPS, proveedor y calendario.\
> - Reutilizar componentes y servicios.\
> - Mantener estados de carga, error y éxito.\
> \
> PREVENCIÓN DE ERRORES:\
> - Confirmar eliminación.\
> - Advertir que el evento del calendario seguirá en la agenda.\
> - Nunca eliminar/modificar eventos externos automáticamente.\
> \
> ACCESIBILIDAD:\
> - Corregir contraste insuficiente.\
> - Mantener identidad visual.\
> - Etiquetas accesibles y áreas táctiles adecuadas.\
> \
> COMPATIBILIDAD:\
> - Conservar Expo SDK 57, Zustand, AsyncStorage, web y funciones existentes.\
> - No alterar autenticación ni recordatorio de 10 segundos.\
> \
> TESTING:\
> - Mantener 112 tests anteriores.\
> - Agregar tests lista-detalle, confirmación, productos con/sin adjuntos, acciones avanzadas y accesibilidad básica.\
> - Ejecutar npm.cmd test -- --runInBand --no-cache y npx.cmd tsc --noEmit.\
> - Verificar exports web/Android cuando sea posible.\
> \
> DOCUMENTACIÓN IA:\
> - Guardar prompt real, archivos cambiados, problema UX, solución, ajustes y comparación antes/después.\
> - No inventar resultados.\
> \
> RESTRICCIONES:\
> - No actualizar dependencias innecesarias, no npm audit fix, no commit/push, no cambiar seguridad ni eliminar funciones.\
> - Informar resultados, riesgos y pruebas manuales. Detenerse al finalizar.

## Problema UX

Antes, cada tarjeta mostraba nombre, cantidad, estado, acciones para marcar comprado o eliminar y el control completo del recordatorio de calendario. La foto, la ubicación y el proveedor no se mostraban como controles dentro de la tarjeta. El selector de fecha/hora y el recordatorio en línea aumentaban su altura y mezclaban una acción avanzada con las acciones frecuentes. El color blanco sobre el botón rosa `#D86BA3` tenía contraste calculado aproximado de 3,21:1.

## Solución implementada

- Tarjeta compacta con nombre, cantidad, estado, miniatura e indicadores de datos asociados.
- Tocar el bloque de producto abre una pantalla de detalle con secciones de foto, comercio/GPS, proveedor y calendario, reutilizando los componentes existentes.
- Marcar comprado sigue siendo una acción rápida.
- Eliminar sigue a mano, pero requiere confirmación. Si hay un evento vinculado, el diálogo aclara que permanece en el calendario. La app no actualiza ni borra eventos externos al eliminar el producto.
- Botones principales usan `#A84275` con texto blanco; el contraste calculado es superior a 4,5:1 y conserva la familia rosa de la identidad visual.
- Se agregaron labels, hints y estados accesibles a las acciones de la tarjeta y el diálogo.

## Ajustes de revisión humana

- Se mantuvo fuera de la tarjeta la configuración de fecha/hora y las acciones avanzadas.
- El diálogo de eliminación distingue productos con evento de los que no tienen evento.
- La eliminación de fotos asociadas continúa limpiando solo el archivo local propio de la app. El evento de calendario sigue intacto.
- No se alteraron la lógica de autenticación, el formato persistido ni los servicios de almacenamiento, permisos, dependencias o el recordatorio de 10 segundos. La lista pasó a consumir las acciones Zustand existentes.

## Antes / después

| Antes | Después |
|---|---|
| Tarjeta con acciones de compra/eliminación y controles de calendario en línea | Resumen compacto; controles avanzados agrupados en detalle |
| Eliminar quitaba directamente el producto | Confirmación con aviso explícito para eventos asociados |
| Botón rosa con contraste insuficiente para texto normal | Rosa más oscuro, contraste calculado > 4,5:1 |

## Archivos del cambio

- Navegación: `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx`.
- Lista, miniatura y detalle: `src/components/ProductItem.tsx`, `src/components/ProductPhotoPreview.tsx`, `src/screens/ProductDetailScreen.tsx`, `src/screens/HomeScreen.tsx`.
- Confirmación: `src/components/ConfirmProductDelete.tsx`.
- Contraste de botones: `src/screens/LoginScreen.tsx`, `src/screens/RegisterScreen.tsx`, `src/screens/AddProductScreen.tsx`, `src/screens/HomeScreen.tsx`.
- Tests: `src/__tests__/ProductItem.test.tsx`, `src/__tests__/ConfirmProductDelete.test.tsx`, `src/__tests__/ProductDetailScreen.test.tsx`.

La revisión UX y el código final deben contrastarse con capturas reales en Android/web; esta documentación no afirma una prueba visual que no se haya ejecutado.

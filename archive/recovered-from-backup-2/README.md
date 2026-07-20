# Archivos recuperados de `Remesa_antigravity_backup_2`

Este directorio conserva código que estaba presente únicamente en la copia histórica y ausente en la base funcional más reciente.

No forma parte del frontend activo ni debe importarse directamente sin revisión. En particular, las pantallas administrativas necesitan:

1. Autenticación real.
2. Autorización por roles en el backend.
3. Protección de rutas en el frontend.
4. Eliminación o enmascaramiento de datos financieros y personales.
5. Pruebas contra los contratos actuales de la API.

Después de esa revisión, las funciones útiles podrán reimplementarse dentro de `/src/pages/Admin` mediante cambios pequeños y verificables.

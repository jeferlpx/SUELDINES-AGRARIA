# 🏛️ Portal de Transparencia y Consulta de Planillas - UNALM
### Sistema de Gestión, Consulta en Tiempo Real y Reporte Ejecutivo de Remuneraciones

[![Licencia](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)
[![Registros](https://img.shields.io/badge/Colaboradores-2%2C113-blue.svg)](#-estructura-de-datos)
[![Tecnología](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-orange.svg)](#-tecnolog%C3%ADas-utilizadas)
[![Paginación](https://img.shields.io/badge/Paginación-50%20filas-purple.svg)](#-características-principales)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-brightgreen.svg)](#-despliegue-en-github-pages)

Aplicación Web de Página Única (**Single Page Application - SPA**) de alto rendimiento diseñada para la consulta interactiva, auditoría, filtrado en tiempo real y generación de reportes consolidados de la planilla de personal de la **Universidad Nacional Agraria La Molina (UNALM)**.

Desarrollada íntegramente con tecnologías nativas (**Vanilla HTML5, Vanilla CSS3 y Vanilla JavaScript ES6+**), garantizando **cero dependencias externas**, portabilidad total y tiempos de carga instantáneos (0 ms de latencia en búsquedas locales).

---

## 📌 Tabla de Contenidos
- [✨ Características Principales](#-características-principales)
- [🏷️ Clasificación de Regímenes Laborales](#️-clasificación-de-regímenes-laborales)
- [🔐 Acceso Administrativo](#-acceso-administrativo)
- [📥 Formatos de Exportación y Reportes](#-formatos-de-exportación-y-reportes)
- [📁 Estructura del Repositorio](#-estructura-del-repositorio)
- [🚀 Cómo Ejecutar el Proyecto](#-cómo-ejecutar-el-proyecto)
- [🌐 Despliegue en GitHub Pages](#-despliegue-en-github-pages)
- [📄 Licencia](#-licencia)

---

## ✨ Características Principales

1. **Búsqueda en Tiempo Real y Resaltado Visual**:
   - Algoritmo de búsqueda instantánea con `debounce` (180ms) que indexa nombres completos, apellidos paterno/materno, cargos y dependencias.
   - Resaltado interactivo de coincidencias en la tabla mediante etiquetas `<mark>`.

2. **Filtros Multidimensionales**:
   - **Por Régimen Laboral**: Botones rápidos (*pills*) interactivos en el encabezado con conteo dinámico por categoría y selector desplegable.
   - **Por Dependencia**: Desplegable dinámico con las **135 dependencias** académicas y administrativas ordenadas alfabéticamente.
   - **Por Rango Salarial**: Filtro por escalas de ingresos (*Hasta S/. 2,000*, *S/. 2,000 - S/. 5,000*, *S/. 5,000 - S/. 8,000*, *Más de S/. 8,000*).
   - **Barra de Filtros Activos**: Etiquetas visuales (*tags*) que permiten eliminar filtros de forma individual o total.

3. **Paginación Inteligente de 50 Registros**:
   - Paginado exacto de **50 registros por página** por defecto, cumpliendo con los estándares institucionales.
   - Selector configurable para alternar entre 25, 50, 100 o visualizar todos los registros.
   - Controles de navegación con números de página, elipsis adaptativa (`...`), primera/última página y resumen en tiempo real (*ej. "Mostrando 1 - 50 de 2,113 colaboradores"*).

4. **Ordenamiento Multidireccional en Tabla**:
   - Capacidad de ordenar de forma ascendente (▲) o descendente (▼) haciendo clic en los encabezados de cualquier columna (ID, Nombres, Régimen, Cargo, Dependencia, Remuneración, Beneficios y Total).

5. **Ficha Individual del Colaborador**:
   - Modal con tarjeta ejecutiva de detalle para cada empleado: desglose de remuneración básica, otros beneficios, total mensual y proyección anual estimada (12 meses).

6. **Diseño de Vanguardia (UI/UX)**:
   - Estilo *Glassmorphism* con desenfoque de fondo (*backdrop-filter*), tarjetas KPI con gradientes luminosos y micro-animaciones suaves.
   - Selector de modo **Oscuro (Dark Mode)** y **Claro (Light Mode)** con persistencia en `localStorage`.

---

## 🏷️ Clasificación de Regímenes Laborales

La base de datos consolida **2,113 registros de colaboradores**, categorizados conforme a la directiva de planillas:

| Código | Régimen Laboral | Cantidad | Masa Salarial Mensual | % Presupuesto |
| :---: | :--- | :---: | :---: | :---: |
| **8** | **Procedencia La Molina (Docente / Administrativo)** | **752** | S/. 1,607,963.85 | 23.4% |
| **2** | **D.L. 276 o Nombrado (Carrera Administrativa)** | **441** | S/. 1,326,904.38 | 19.3% |
| **1** | **CAS (Contratación Administrativa de Servicios)** | **380** | S/. 861,351.98 | 12.5% |
| **3** | **Docente Universitario (Ley Universitaria)** | **540** | S/. 3,079,913.41 | 44.8% |
| **TOTAL** | **Consolidado General Institucional** | **2,113** | **S/. 6,876,133.62** | **100.0%** |

---

## 🔐 Acceso Administrativo

El sistema incluye una pasarela de autenticación protegida para usuarios con rol de administrador:

- **Botonera en cabecera**: `🔒 Acceso Administrador` (se transforma en `⚙️ Panel Administrador` al iniciar sesión).
- **Credenciales por defecto**:
  - **Usuario**: `admin`
  - **Contraseña**: `123`
- **Funcionalidad de apoyo**: Botón `⚡ Autocompletar` para evaluación rápida.
- **Seguridad**: Animación de error (*shake*) si las credenciales fallan y persistencia de sesión segura en `sessionStorage`.

---

## 📥 Formatos de Exportación y Reportes

Desde el **Panel de Administración**, el usuario puede generar informes y descargar la información en múltiples formatos:

1. **📊 Reporte Ejecutivo Oficial**:
   - Tabla comparativa por régimen laboral con porcentaje de personal, promedio salarial y participación del gasto.
   - **Top 8 Dependencias** con mayor asignación de planilla con barras de progreso relativas.
   - **Top 8 Cargos** con mayor remuneración promedio.
2. **🖨️ Impresión / Guardar en PDF**:
   - Optimizado con reglas CSS `@media print` para generar automáticamente documentos A4 con membrete institucional, fecha/hora de emisión y tablas formateadas.
3. **📥 Descargar CSV Completo**:
   - Archivo con los 2,113 registros, delimitador punto y coma (`;`), cabeceras estandarizadas y codificación UTF-8.
4. **📊 Descargar CSV Filtrado**:
   - Exporta exclusivamente los registros que cumplan con los filtros y búsquedas aplicadas en pantalla.
5. **📗 Exportar para Microsoft Excel**:
   - Archivo `.csv` con marca **BOM UTF-8 (`\uFEFF`)**, permitiendo abrir directamente con doble clic en Excel en Windows sin distorsión de tildes o caracteres en español (ñ).
6. **📦 Exportar Formato JSON**:
   - Exportación limpia en objetos JSON para interoperabilidad con APIs o sistemas externos.
7. **📋 Copiar al Portapapeles (TSV)**:
   - Formato tabular para pegar con `Ctrl + V` directamente en Google Sheets o Excel.
8. **➕ Módulo de Registro de Personal**:
   - Formulario CRUD en memoria para ingresar nuevos colaboradores en tiempo real, recalculando automáticamente todas las métricas, gráficos y tablas.

---

## 📁 Estructura del Repositorio

```text
SUELDINES-AGRARIA/
├── index.html            # Interfaz de usuario SPA, modales y estructura principal
├── styles.css            # Hoja de estilos Vanilla CSS con tema Dark/Light y Print CSS
├── app.js                # Lógica del cliente: buscador, paginado 50, filtros, auth, exports
├── data.js               # Dataset estructurado con los 2,113 registros de colaboradores
├── datos_personal.csv    # Archivo CSV de datos fuente original
├── LICENSE               # Licencia de software código abierto MIT
└── README.md             # Documentación técnica completa del proyecto
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Opción 1: Ejecución Directa (Sin Servidor)
Simplemente haz doble clic en el archivo `index.html` en tu explorador de archivos. Se abrirá en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari) sin requerir ninguna instalación previa.

### Opción 2: Ejecución mediante Servidor Local
Si deseas servirlo mediante HTTP local:

**Con Python:**
```bash
python -m http.server 8080
# Abrir en el navegador: http://localhost:8080/
```

**Con Node.js (npx serve):**
```bash
npx serve .
```

---

## 🌐 Despliegue en GitHub Pages

Este proyecto está 100% listo para desplegarse en **GitHub Pages** de forma gratuita:

1. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment > Branch**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
4. Haz clic en **Save** (Guardar).
5. En pocos segundos, GitHub generará tu enlace público:  
   `https://jeferlpx.github.io/SUELDINES-AGRARIA/`

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Para más detalles, consulta el archivo [LICENSE](LICENSE).

---
Desarrollado para el análisis y transparencia de planillas institucionales.

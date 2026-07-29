# 📄 Generador de Contrato de Arrendamiento Residencial

Aplicación web moderna para generar, personalizar y exportar contratos de arrendamiento residencial en formato PDF. Construida con Next.js y diseñada para funcionar completamente en el navegador, sin necesidad de un servidor backend.

🌐 **Demo en vivo:** [araxielfenix.github.io/contrato-arrendamiento](https://araxielfenix.github.io/contrato-arrendamiento/)

---

## ¿Qué hace esta aplicación?

- **Formulario inteligente** — Llena los datos del contrato (arrendador, arrendatario, fiador, dirección, renta, fechas) y la aplicación los inserta automáticamente en el documento.
- **Monto en letra automático** — Convierte el monto de la renta a texto (ej. `$5,000.00` → `Cinco mil pesos 00/100 M.N.`).
- **Fecha de término automática** — Calcula la fecha de vencimiento del contrato (1 año forzoso) a partir de la fecha de inicio.
- **Editor de cláusulas** — Agrega, edita, reordena o desactiva cualquier cláusula del contrato. Soporta variables dinámicas como `{{montoFull}}`, `{{fechaInicio}}`, `{{personas}}`, etc.
- **Exportación a PDF** — Genera el contrato listo para imprimir y firmar en tamaño A4 o A3.
- **Compartir por WhatsApp** — Descarga el PDF y abre WhatsApp Web para compartirlo fácilmente.
- **Guardado automático** — Los datos del formulario y las cláusulas personalizadas se guardan en el navegador (`localStorage`) para no perder el progreso.
- **Borrador exportable** — Descarga y carga borradores en formato `.contrato` (JSON) para retomar el trabajo más tarde.
- **Modo oscuro** — Se adapta automáticamente al tema del sistema operativo.

---

## 🛠️ Requisitos para ejecutarlo en local

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Node.js** | 18.x o superior | [nodejs.org](https://nodejs.org/) |
| **npm** | Incluido con Node.js | — |
| **Git** | Cualquier versión reciente | [git-scm.com](https://git-scm.com/) |

Puedes verificar tus versiones ejecutando en la terminal:

```bash
node --version
npm --version
```

---

## 🚀 Instalación y ejecución local

### 1. Clona el repositorio

```bash
git clone https://github.com/Araxielfenix/contrato-arrendamiento.git
cd contrato-arrendamiento
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Inicia el servidor de desarrollo

```bash
npm run dev
```

### 4. Abre la aplicación

Abre tu navegador y ve a:

```
http://localhost:3000
```

> La página se actualiza automáticamente cada vez que guardas cambios en el código.

---

## 📦 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con hot-reload |
| `npm run build` | Genera la versión de producción (exportación estática en `/out`) |
| `npm run lint` | Revisa el código con ESLint |

---

## 🗂️ Estructura del proyecto

```
contrato-arrendamiento/
├── app/
│   ├── page.tsx        # Componente principal: formulario, editor y generador PDF
│   ├── layout.tsx      # Layout raíz de la aplicación
│   └── globals.css     # Estilos globales
├── public/             # Archivos estáticos
├── .github/
│   └── workflows/
│       └── deploy.yml  # Pipeline de despliegue automático a GitHub Pages
├── next.config.ts      # Configuración de Next.js (exportación estática)
└── package.json
```

---

## 🌍 Despliegue

El proyecto se despliega automáticamente en **GitHub Pages** cada vez que se hace un `push` a la rama `main`, mediante GitHub Actions.

El workflow en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
1. Instala las dependencias
2. Genera el sitio estático con `npm run build`
3. Despliega la carpeta `/out` a GitHub Pages

---

## 🔧 Variables dinámicas en cláusulas

Dentro del editor de cláusulas puedes usar estas variables que se sustituyen automáticamente con los datos del formulario:

| Variable | Se reemplaza por |
|---|---|
| `{{arrendador}}` | Nombre del arrendador |
| `{{arrendatario}}` | Nombre del arrendatario |
| `{{fiador}}` | Nombre del fiador solidario |
| `{{montoFull}}` | Monto en número y letra (ej. `$5,000.00 (Cinco mil pesos...)`) |
| `{{montoNum}}` | Solo el monto en número (ej. `$5,000.00`) |
| `{{montoLetra}}` | Solo el monto en letra |
| `{{personas}}` | Número máximo de personas |
| `{{fechaInicio}}` | Fecha de inicio del contrato |
| `{{fechaTermino}}` | Fecha de término del contrato |
| `{{municipio}}` | Municipio / ciudad del inmueble |

---

## 📝 Licencia

Este proyecto es de uso personal. Siéntete libre de adaptarlo a tus propias necesidades.

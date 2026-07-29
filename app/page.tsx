"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractData = {
	arrendador: string;
	arrendatario: string;
	fiador: string;
	calle: string;
	numero: string;
	colonia: string;
	municipio: string;
	rentaNumero: string;
	personas: string;
	inicioDia: string;
	inicioMes: string;
	inicioAnio: string;
};

export type ClauseConfig = {
	id: string;
	title: string;
	text: string;
	enabled: boolean;
};

type ThemePreference = "system" | "light" | "dark";

const initialState: ContractData = {
	arrendador: "",
	arrendatario: "",
	fiador: "",
	calle: "",
	numero: "",
	colonia: "",
	municipio: "",
	rentaNumero: "",
	personas: "",
	inicioDia: "",
	inicioMes: "",
	inicioAnio: "",
};

export const defaultClauses: ClauseConfig[] = [
	{
		id: "primera",
		title: "PRIMERA. Renta y Puntualidad.",
		text: "El Arrendatario pagará al Arrendador **{{montoFull}}** mensuales de forma puntual y en efectivo o transferencia. El retraso generará un interés moratorio del 5% diario.",
		enabled: true,
	},
	{
		id: "segunda",
		title: "SEGUNDA. Periodo Forzoso.",
		text: "Las partes convienen que todo mes de arrendamiento es forzoso y se pagará íntegro, aun cuando el Arrendatario ocupe el inmueble por un solo día, conforme a las reglas de obligaciones del Código Civil local.",
		enabled: true,
	},
	{
		id: "tercera",
		title: "Tercera. Vigencia, Renovación y Tolerancia de Entrega",
		text: "El término del contrato es de **un año forzoso** (del **{{fechaInicio}}** al **{{fechaTermino}}**). A su vencimiento, el Arrendador entregará la propuesta de renovación; el Arrendatario dispondrá de un plazo de 5 días naturales a partir de su recepción para firmarla o manifestar por escrito su decisión de no renovar y entregar el inmueble. \nEn caso de recibir la propuesta y no firmarla ni desocupar en dicho plazo, se entenderá por aceptada la renovación con un incremento del 10% sobre la renta vigente. \nSi el Arrendatario decide no renovar, contará con un periodo máximo de tolerancia de 5 días naturales posteriores al vencimiento para desocupar y entregar el departamento, cubriendo únicamente la cuota proporcional diaria de la renta ajustada por esos días. Si transcurrido el sexto día no ha entregado la propiedad, se obligará a pagar el mes completo de renta con el aumento aplicado, independientemente de la pérdida de su depósito en garantía por incumplimiento en la entrega oportuna.",
		enabled: true,
	},
	{
		id: "cuarta",
		title: "CUARTA. Uso Exclusivo e Identificación de Habitantes.",
		text: "El inmueble se destinará única y exclusivamente como casa habitación para un máximo de **{{personas}} personas**, correspondiendo de origen a las personas identificadas al momento de la firma de este contrato. Queda estrictamente prohibida la sustitución, reemplazo o incorporación de nuevos habitantes o terceros, aun cuando no se supere el límite de **{{personas}} personas**, salvo autorización previa y por escrito del Arrendador. \nAsimismo, queda prohibido subarrendar, traspasar o ceder los derechos del inmueble (Art. 7.714 del Código Civil del Estado de México), así como almacenar sustancias peligrosas o tener mascotas de cualquier tipo. El incumplimiento de esta cláusula será causa de rescisión inmediata del contrato.",
		enabled: true,
	},
	{
		id: "quinta",
		title: "QUINTA. Áreas Comunes.",
		text: "Los patios y pasillos comunes no forman parte de la superficie rentada; su uso se limita exclusivamente al tránsito peatonal de entrada y salida, prohibiéndose su uso como estancia, almacenamiento o estacionamiento.",
		enabled: true,
	},
	{
		id: "sexta",
		title: "SEXTA. Conservación y Mantenimiento.",
		text: "El Arrendatario recibe el inmueble en perfecto estado (pintura, vidrios, instalaciones). Los gastos de mantenimiento menor (bombas, fregaderos, sanitarios, cerrajería) serán su cuenta exclusiva. Toda mejora requiere permiso escrito del Arrendador y quedará a beneficio del inmueble sin compensación.",
		enabled: true,
	},
	{
		id: "septima",
		title: "SÉPTIMA. Depósito en Garantía.",
		text: "El Arrendatario entrega en este acto **{{montoFull}}**. No podrá tomarse a cuenta de rentas. Se devolverá en 30 días posteriores a la desocupación formal, siempre que se cumpla el año forzoso, no haya adeudos de luz y el departamento se entregue limpio, resanado y pintado. En caso de incumplimiento de la vigencia o daños, el depósito se retendrá íntegro como pena convencional para esas reparaciones y quede como se entregó.",
		enabled: true,
	},
	{
		id: "octava",
		title: "OCTAVA. Fiador Solidario.",
		text: "El Fiador se obliga solidariamente renunciando expresamente a los beneficios de orden, excusión y división. Su responsabilidad legal cesará únicamente cuando el Arrendador reciba el inmueble a su entera satisfacción y sin adeudos pendientes.",
		enabled: true,
	},
	{
		id: "novena",
		title: "NOVENA. Jurisdicción.",
		text: "Para la interpretación y cumplimiento, las partes se someten a las leyes del Estado de México y a los tribunales de **{{municipio}}**, renunciando a cualquier otro fuero.",
		enabled: true,
	},
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "contrato-arrendamiento-draft";
const STORAGE_CLAUSES_KEY = "contrato-arrendamiento-clauses";
const STORAGE_THEME_KEY = "contrato-arrendamiento-theme";

const monthNames = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function numberToWords(value: number): string {
	const units = [
		"cero",
		"uno",
		"dos",
		"tres",
		"cuatro",
		"cinco",
		"seis",
		"siete",
		"ocho",
		"nueve",
		"diez",
		"once",
		"doce",
		"trece",
		"catorce",
		"quince",
		"dieciséis",
		"diecisiete",
		"dieciocho",
		"diecinueve",
	];
	const twenties = [
		"veinte",
		"veintiuno",
		"veintidós",
		"veintitrés",
		"veinticuatro",
		"veinticinco",
		"veintiséis",
		"veintisiete",
		"veintiocho",
		"veintinueve",
	];
	const tens = [
		"",
		"",
		"",
		"treinta",
		"cuarenta",
		"cincuenta",
		"sesenta",
		"setenta",
		"ochenta",
		"noventa",
	];
	const hundreds = [
		"",
		"ciento",
		"doscientos",
		"trescientos",
		"cuatrocientos",
		"quinientos",
		"seiscientos",
		"setecientos",
		"ochocientos",
		"novecientos",
	];

	if (value < 0 || !Number.isInteger(value)) return "";
	if (value < 20) return units[value] ?? "";
	if (value < 30) return twenties[value - 20] ?? "";
	if (value < 100) {
		const t = Math.floor(value / 10);
		const r = value % 10;
		return r === 0 ? (tens[t] ?? "") : `${tens[t] ?? ""} y ${units[r] ?? ""}`;
	}
	if (value === 100) return "cien";
	if (value < 1000) {
		const h = Math.floor(value / 100);
		const r = value % 100;
		return r > 0
			? `${hundreds[h] ?? ""} ${numberToWords(r)}`
			: (hundreds[h] ?? "");
	}
	if (value < 1000000) {
		const thousands = Math.floor(value / 1000);
		const r = value % 1000;
		const thousandsText =
			thousands === 1 ? "mil" : `${numberToWords(thousands)} mil`;
		return r > 0 ? `${thousandsText} ${numberToWords(r)}` : thousandsText;
	}
	const millions = Math.floor(value / 1000000);
	const r = value % 1000000;
	const millionsText =
		millions === 1 ? "un millón" : `${numberToWords(millions)} millones`;
	return r > 0 ? `${millionsText} ${numberToWords(r)}`.trim() : millionsText;
}

function formatAmountInLetters(value: string): string {
	const n = Number(value);
	if (!value || !Number.isFinite(n) || n < 0) return "Monto aún sin definir";
	const whole = Math.floor(n);
	const words = numberToWords(whole);
	if (!words) return "Monto aún sin definir";
	const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
	return `${capitalized} pesos 00/100 M.N.`;
}

function formatCurrency(value: string): string {
	const n = Number(value);
	if (!value || !Number.isFinite(n)) return "$0.00";
	return `$${n.toLocaleString("es-MX", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function computeEndDate(day: string, month: string, year: string) {
	if (!day || !month || !year) return { dia: "", mes: "", anio: "" };
	const d = Number(day);
	const m = Number(month);
	const y = Number(year);
	if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
		return { dia: "", mes: "", anio: "" };
	}
	const date = new Date(y, m - 1, d);
	if (date.getMonth() !== m - 1) return { dia: "", mes: "", anio: "" };
	date.setFullYear(date.getFullYear() + 1);
	return {
		dia: String(date.getDate()),
		mes: String(date.getMonth() + 1),
		anio: String(date.getFullYear()),
	};
}

function formatDateLong(dia: string, mes: string, anio: string): string {
	if (!dia || !mes || !anio) return "[fecha]";
	const idx = Number(mes) - 1;
	const monthName = monthNames[idx] ?? "";
	return `${dia} de ${monthName} de ${anio}`;
}

// ─── Rich Text Parsing & PDF Layout Engine ────────────────────────────────────

type RichSpan = { text: string; bold?: boolean; newline?: boolean };

function parseClauseToSpans(
	title: string,
	rawText: string,
	replacements: Record<string, string>,
): RichSpan[] {
	let processed = rawText;
	for (const [key, val] of Object.entries(replacements)) {
		processed = processed.replaceAll(`{{${key}}}`, val);
	}

	const spans: RichSpan[] = [];
	if (title.trim()) {
		spans.push({ text: `${title.trim()} `, bold: true });
	}

	// Dividimos por saltos de línea \n Y por marcas **negrita**
	const parts = processed.split(/(\*\*.*?\*\*|\n)/g);
	for (const part of parts) {
		if (part === "\n") {
			// Salto de línea explícito
			spans.push({ text: "", newline: true });
		} else if (!part) {
			continue;
		} else if (part.startsWith("**") && part.endsWith("**")) {
			spans.push({ text: part.slice(2, -2), bold: true });
		} else {
			spans.push({ text: part, bold: false });
		}
	}

	return spans;
}

function drawRichParagraph(
	doc: jsPDF,
	spans: RichSpan[],
	x: number,
	startY: number,
	maxWidth: number,
	lineHeight: number,
	pageHeight: number,
	fontSize = 9.2,
): number {
	doc.setFontSize(fontSize);

	type Token = { text: string; bold: boolean; width: number; newline?: boolean };
	const tokens: Token[] = [];

	for (const span of spans) {
		if (span.newline) {
			// Token especial que fuerza salto de línea
			tokens.push({ text: "", bold: false, width: 0, newline: true });
			continue;
		}
		doc.setFont("helvetica", span.bold ? "bold" : "normal");
		const parts = span.text.split(/(\s+)/);
		for (const part of parts) {
			if (!part) continue;
			const w = doc.getTextWidth(part);
			tokens.push({ text: part, bold: !!span.bold, width: w });
		}
	}

	const lines: Token[][] = [];
	let currentLine: Token[] = [];
	let currentLineWidth = 0;

	for (const token of tokens) {
		// Salto de línea forzado (usuario presionó Enter en el editor)
		if (token.newline) {
			while (
				currentLine.length > 0 &&
				/^\s+$/.test(currentLine[currentLine.length - 1].text)
			) {
				currentLine.pop();
			}
			lines.push(currentLine);
			currentLine = [];
			currentLineWidth = 0;
			continue;
		}

		const isSpace = /^\s+$/.test(token.text);
		if (currentLine.length === 0 && isSpace) continue;

		if (currentLineWidth + token.width <= maxWidth) {
			currentLine.push(token);
			currentLineWidth += token.width;
		} else {
			if (currentLine.length > 0) {
				while (
					currentLine.length > 0 &&
					/^\s+$/.test(currentLine[currentLine.length - 1].text)
				) {
					currentLine.pop();
				}
				lines.push(currentLine);
			}
			if (!isSpace) {
				currentLine = [token];
				currentLineWidth = token.width;
			} else {
				currentLine = [];
				currentLineWidth = 0;
			}
		}
	}

	if (currentLine.length > 0) {
		while (
			currentLine.length > 0 &&
			/^\s+$/.test(currentLine[currentLine.length - 1].text)
		) {
			currentLine.pop();
		}
		if (currentLine.length > 0) {
			lines.push(currentLine);
		}
	}

	let y = startY;
	for (const line of lines) {
		if (y + lineHeight > pageHeight - 40) {
			doc.addPage();
			y = 45;
		}
		let curX = x;
		for (const token of line) {
			doc.setFont("helvetica", token.bold ? "bold" : "normal");
			doc.text(token.text, curX, y);
			curX += token.width;
		}
		y += lineHeight;
	}

	return y;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
	const [formData, setFormData] = useState<ContractData>(initialState);
	const [clauses, setClauses] = useState<ClauseConfig[]>(defaultClauses);
	const [paperSize, setPaperSize] = useState<"a4" | "a3">("a3");
	const [theme, setTheme] = useState<ThemePreference>("system");
	const [activeTab, setActiveTab] = useState<"form" | "clauses">("form");
	const [status, setStatus] = useState("Listo para empezar");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const hasLoadedRef = useRef(false);

	// Load theme, draft & custom clauses on mount
	useEffect(() => {
		const storedTheme = window.localStorage.getItem(
			STORAGE_THEME_KEY,
		) as ThemePreference | null;
		if (storedTheme) {
			setTheme(storedTheme);
		}

		const storedForm = window.localStorage.getItem(STORAGE_KEY);
		if (storedForm) {
			try {
				setFormData(JSON.parse(storedForm));
			} catch {}
		}

		const storedClauses = window.localStorage.getItem(STORAGE_CLAUSES_KEY);
		if (storedClauses) {
			try {
				setClauses(JSON.parse(storedClauses));
			} catch {}
		}

		hasLoadedRef.current = true;
	}, []);

	// Save draft & clauses to localStorage
	useEffect(() => {
		if (!hasLoadedRef.current) return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
		window.localStorage.setItem(STORAGE_CLAUSES_KEY, JSON.stringify(clauses));
		window.localStorage.setItem(STORAGE_THEME_KEY, theme);
		setStatus("Borrador guardado automáticamente");
	}, [formData, clauses, theme]);

	// Apply Theme Preference (System vs Light vs Dark)
	useEffect(() => {
		const root = document.documentElement;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const updateTheme = () => {
			const isDark =
				theme === "dark" || (theme === "system" && mediaQuery.matches);
			if (isDark) {
				root.classList.add("dark");
			} else {
				root.classList.remove("dark");
			}
		};

		updateTheme();

		if (theme === "system") {
			mediaQuery.addEventListener("change", updateTheme);
			return () => mediaQuery.removeEventListener("change", updateTheme);
		}
	}, [theme]);

	// Auto-dismiss toast
	useEffect(() => {
		if (!toastMessage) return;
		const id = window.setTimeout(() => setToastMessage(null), 3000);
		return () => window.clearTimeout(id);
	}, [toastMessage]);

	// Computed end date
	const endDate = useMemo(
		() =>
			computeEndDate(
				formData.inicioDia,
				formData.inicioMes,
				formData.inicioAnio,
			),
		[formData.inicioDia, formData.inicioMes, formData.inicioAnio],
	);

	// Summary preview text
	const previewText = useMemo(() => {
		const startDate = formatDateLong(
			formData.inicioDia,
			formData.inicioMes,
			formData.inicioAnio,
		);
		const endDateText = formatDateLong(endDate.dia, endDate.mes, endDate.anio);
		const amountWords = formatAmountInLetters(formData.rentaNumero);
		const amountNum = formatCurrency(formData.rentaNumero);
		const direccion =
			[formData.calle, formData.numero, formData.colonia, formData.municipio]
				.filter(Boolean)
				.join(", ") || "[dirección completa]";

		return [
			`Arrendador:   ${formData.arrendador || "[nombre completo]"}`,
			`Arrendatario: ${formData.arrendatario || "[nombre completo]"}`,
			`Fiador:       ${formData.fiador || "[nombre completo]"}`,
			`Dirección:    ${direccion}`,
			`Renta:        ${amountNum}`,
			`              (${amountWords})`,
			`Personas:     ${formData.personas || "[cantidad]"}`,
			`Inicio:       ${startDate}`,
			`Término:      ${endDateText}`,
			`Cláusulas:    ${clauses.filter((c) => c.enabled).length} activas`,
		].join("\n");
	}, [endDate, formData, clauses]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleChange = (field: keyof ContractData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleDownloadFile = () => {
		const exportPayload = {
			formData,
			clauses,
		};
		const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "contrato-arrendamiento.contrato";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		setToastMessage("Borrador descargado (.contrato)");
		setStatus("Archivo .contrato descargado");
	};

	const handleImportFile = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		event.target.value = "";
		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			if (parsed.formData) {
				setFormData(parsed.formData);
			} else {
				setFormData(parsed as ContractData);
			}
			if (Array.isArray(parsed.clauses)) {
				setClauses(parsed.clauses);
			}
			setToastMessage("Borrador cargado correctamente");
			setStatus("Borrador cargado correctamente");
		} catch {
			setToastMessage("El archivo no tiene un formato válido");
			setStatus("Error al cargar borrador");
		}
	};

	// ── Clause Editor Handlers ────────────────────────────────────────────────

	const handleClauseChange = (
		id: string,
		field: "title" | "text",
		value: string,
	) => {
		setClauses((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
		);
	};

	const handleToggleClause = (id: string) => {
		setClauses((prev) =>
			prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
		);
	};

	const handleAddClause = () => {
		const newId = `clausula-${Date.now()}`;
		setClauses((prev) => [
			...prev,
			{
				id: newId,
				title: "NUEVA CLÁUSULA. Título.",
				text: "Escribe aquí los términos de la nueva cláusula.",
				enabled: true,
			},
		]);
		setToastMessage("Nueva cláusula agregada");
	};

	const handleDeleteClause = (id: string) => {
		setClauses((prev) => prev.filter((c) => c.id !== id));
		setToastMessage("Cláusula eliminada");
	};

	const handleMoveClause = (index: number, direction: -1 | 1) => {
		setClauses((prev) => {
			const targetIndex = index + direction;
			if (targetIndex < 0 || targetIndex >= prev.length) return prev;
			const next = [...prev];
			const [moved] = next.splice(index, 1);
			next.splice(targetIndex, 0, moved);
			return next;
		});
	};

	const handleResetClauses = () => {
		setClauses(defaultClauses);
		setToastMessage("Plantilla restablecida a cláusulas originales");
		setStatus("Cláusulas restablecidas");
	};

	// ── PDF Generation ────────────────────────────────────────────────────────

	const generatePdfDoc = () => {
		const doc = new jsPDF({ unit: "pt", format: paperSize });

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();

		const ml = paperSize === "a3" ? 60 : 42;
		const mr = paperSize === "a3" ? 60 : 42;
		const cw = pageWidth - ml - mr;
		const fontSize = paperSize === "a3" ? 12 : 9.2;
		const lh = paperSize === "a3" ? 16 : 11.8;
		const clauseSpacing = paperSize === "a3" ? 10 : 4.5;

		const arrendador = (
			formData.arrendador || "NOMBRE DEL ARRENDADOR"
		).toUpperCase();
		const arrendatario = (
			formData.arrendatario || "NOMBRE DEL ARRENDATARIO"
		).toUpperCase();
		const fiador = (
			formData.fiador || "NOMBRE DEL FIADOR SOLIDARIO"
		).toUpperCase();
		const direccion =
			[formData.calle, formData.numero, formData.colonia, formData.municipio]
				.filter(Boolean)
				.join(", ") ||
			"Calle Ejemplo No. 100, Col. Centro, Municipio, Estado";
		const amountNum = formatCurrency(formData.rentaNumero || "5000");
		const amountWords = formatAmountInLetters(formData.rentaNumero || "5000");
		const rentFullText = `${amountNum} (${amountWords})`;
		const personas = formData.personas || "2";
		const startDate = formatDateLong(
			formData.inicioDia || "1",
			formData.inicioMes || "1",
			formData.inicioAnio || "2025",
		);
		const endDateStr = formatDateLong(
			endDate.dia || "1",
			endDate.mes || "1",
			endDate.anio || "2026",
		);
		const municipio = formData.municipio || "Municipio de Ejemplo";

		const replacements: Record<string, string> = {
			arrendador,
			arrendatario,
			fiador,
			direccion,
			montoNum: amountNum,
			montoLetra: amountWords,
			montoFull: rentFullText,
			personas,
			fechaInicio: startDate,
			fechaTermino: endDateStr,
			municipio,
		};

		let y = paperSize === "a3" ? 60 : 42;

		// ── Title
		doc.setFont("helvetica", "bold");
		doc.setFontSize(paperSize === "a3" ? 16 : 11.5);
		doc.text("CONTRATO DE ARRENDAMIENTO RESIDENCIAL", pageWidth / 2, y, {
			align: "center",
		});
		y += paperSize === "a3" ? 28 : 18;

		// ── Preamble
		const preambleSpans: RichSpan[] = [
			{
				text: "Con fundamento en el Libro Séptimo, Título Sexto del Código Civil del Estado de México, celebran el presente contrato el C. ",
			},
			{ text: arrendador, bold: true },
			{ text: " (Arrendador), el C. " },
			{ text: arrendatario, bold: true },
			{ text: " (Arrendatario), y la C. " },
			{ text: fiador, bold: true },
			{
				text: " (Fiador Solidario), respecto del inmueble (departamento) ubicado en: ",
			},
			{ text: direccion, bold: true },
			{ text: ", bajo las siguientes declaraciones y clausulas:" },
		];
		y = drawRichParagraph(
			doc,
			preambleSpans,
			ml,
			y,
			cw,
			lh,
			pageHeight,
			fontSize,
		);
		y += clauseSpacing;

		// ── Clauses dynamically from state
		const activeClauses = clauses.filter((c) => c.enabled);
		for (const clause of activeClauses) {
			const spans = parseClauseToSpans(clause.title, clause.text, replacements);
			y = drawRichParagraph(doc, spans, ml, y, cw, lh, pageHeight, fontSize);
			y += clauseSpacing;
		}

		// ── Closing
		y += paperSize === "a3" ? 8 : 4;
		const closingSpans: RichSpan[] = [
			{ text: "Enteradas las partes, firman por duplicado en " },
			{ text: `${municipio}, Estado de México, el ${startDate}`, bold: true },
			{ text: "." },
		];
		y = drawRichParagraph(
			doc,
			closingSpans,
			ml,
			y,
			cw,
			lh,
			pageHeight,
			fontSize,
		);

		// ── Signatures
		const sigBlockGap = paperSize === "a3" ? 80 : 66;
		if (y + 200 > pageHeight - 30) {
			doc.addPage();
			y = 90;
		} else {
			y += sigBlockGap;
		}

		const lineWidth = 180;
		const leftCenterX = ml + lineWidth / 2;
		const rightCenterX = ml + cw - lineWidth / 2;
		const centerCenterX = pageWidth / 2;

		doc.setFontSize(paperSize === "a3" ? 10.5 : 8.5);

		doc.setLineWidth(0.75);
		doc.line(ml, y, ml + lineWidth, y);
		doc.line(ml + cw - lineWidth, y, ml + cw, y);

		let sy1 = y + (paperSize === "a3" ? 16 : 11);
		doc.setFont("helvetica", "bold");
		doc.text(`C. ${arrendador}`, leftCenterX, sy1, { align: "center" });
		doc.text(`C. ${arrendatario}`, rightCenterX, sy1, { align: "center" });

		sy1 += paperSize === "a3" ? 14 : 11;
		doc.setFont("helvetica", "normal");
		doc.text("ARRENDADOR", leftCenterX, sy1, { align: "center" });
		doc.text("ARRENDATARIO", rightCenterX, sy1, { align: "center" });

		const sy2Line = y + (paperSize === "a3" ? 54 : 38);
		doc.line(
			centerCenterX - lineWidth / 2,
			sy2Line,
			centerCenterX + lineWidth / 2,
			sy2Line,
		);

		let sy2Text = sy2Line + (paperSize === "a3" ? 16 : 11);
		doc.setFont("helvetica", "bold");
		doc.text(`C. ${fiador}`, centerCenterX, sy2Text, { align: "center" });

		sy2Text += paperSize === "a3" ? 14 : 11;
		doc.setFont("helvetica", "normal");
		doc.text("FIADOR SOLIDARIO", centerCenterX, sy2Text, { align: "center" });

		return doc;
	};

	const handleExportPdf = () => {
		try {
			const doc = generatePdfDoc();
			doc.save(`contrato-arrendamiento-${paperSize.toUpperCase()}.pdf`);
			setToastMessage(`PDF exportado en tamaño ${paperSize.toUpperCase()}`);
			setStatus(`PDF exportado correctamente (${paperSize.toUpperCase()})`);
		} catch (err) {
			console.error("Error al exportar PDF:", err);
			setToastMessage("Ocurrió un error al generar el PDF");
			setStatus("Error al generar PDF");
		}
	};

	const handleShareWhatsapp = async () => {
		try {
			const doc = generatePdfDoc();
			const pdfBlob = doc.output("blob");
			const cleanName = (formData.arrendatario || "contrato").replace(
				/[^a-zA-Z0-9]/g,
				"_",
			);
			const fileName = `contrato_arrendamiento_${cleanName}.pdf`;
			const pdfFile = new File([pdfBlob], fileName, {
				type: "application/pdf",
			});

			if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
				await navigator.share({
					files: [pdfFile],
					title: "Contrato de Arrendamiento",
					text: `Hola, te comparto el contrato de arrendamiento residencial de ${formData.arrendatario || "inmueble"}.`,
				});
				setToastMessage("Contrato compartido por WhatsApp");
				setStatus("Contrato compartido con archivo PDF");
				return;
			}
		} catch (err) {
			console.log("Web Share fallback:", err);
		}

		try {
			const doc = generatePdfDoc();
			doc.save(`contrato-arrendamiento-${paperSize.toUpperCase()}.pdf`);
		} catch (err) {
			console.error("Error descargando PDF para WhatsApp:", err);
		}

		const message = encodeURIComponent(
			`Hola, te comparto el contrato de arrendamiento. (He descargado el archivo PDF "${`contrato-arrendamiento-${paperSize.toUpperCase()}.pdf`}" en mis descargas para adjuntarlo a este chat).`,
		);
		window.open(
			`https://wa.me/?text=${message}`,
			"_blank",
			"noopener,noreferrer",
		);
		setToastMessage("PDF descargado. Adjúntalo en el chat de WhatsApp");
		setStatus("PDF descargado. Adjúntalo con el icono 📎 en WhatsApp");
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.15),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.15),_transparent_40%),linear-gradient(135deg,_#090d16_0%,_#0f172a_100%)] px-4 py-8 text-slate-900 dark:text-slate-100 transition-colors duration-300 sm:px-6 lg:px-8">
			{/* Toast notification */}
			{toastMessage && (
				<div className="fixed bottom-4 right-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl animate-bounce-in">
					{toastMessage}
				</div>
			)}

			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				{/* Header */}
				<section className="rounded-3xl border border-white/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.15)] backdrop-blur-lg transition-colors">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-2xl">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
									Generador Legal de Contratos
								</span>
							</div>
							<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
								Contrato de Arrendamiento Residencial
							</h1>
							<p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
								Llena los datos, personaliza las cláusulas según tus necesidades
								y expórtalo listo para firmar.
							</p>
						</div>

						{/* Right Control Box: Status & Theme Selector */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
							<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-100 shadow-sm">
								<p className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">
									Estado
								</p>
								<p className="mt-0.5 font-semibold text-emerald-400">
									{status}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Navigation Tabs (Form vs Clause Editor) */}
				<div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
					<button
						type="button"
						onClick={() => setActiveTab("form")}
						className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
							activeTab === "form"
								? "bg-emerald-600 text-white shadow-md"
								: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
						}`}
					>
						📋 Datos del Contrato
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("clauses")}
						className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
							activeTab === "clauses"
								? "bg-emerald-600 text-white shadow-md"
								: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
						}`}
					>
						⚙️ Editar Cláusulas y Artículos (
						{clauses.filter((c) => c.enabled).length})
					</button>
				</div>

				{/* Main content */}
				<section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
					{/* Left Panel: Form or Clause Editor */}
					<div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
						{/* Action toolbar */}
						<div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
							<button
								type="button"
								onClick={handleDownloadFile}
								className="rounded-full bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:hover:bg-slate-700 active:scale-95 shadow-sm"
							>
								💾 Guardar borrador (.contrato)
							</button>
							<label className="cursor-pointer rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-sm">
								📂 Cargar borrador
								<input
									type="file"
									accept=".contrato,.json"
									className="hidden"
									onChange={handleImportFile}
								/>
							</label>

							{/* Paper size selection */}
							<div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
								<button
									type="button"
									onClick={() => setPaperSize("a4")}
									className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
										paperSize === "a4"
											? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
											: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
									}`}
								>
									📄 A4 (Estándar)
								</button>
								<button
									type="button"
									onClick={() => setPaperSize("a3")}
									className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
										paperSize === "a3"
											? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
											: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
									}`}
								>
									📑 A3 (Grande)
								</button>
							</div>

							<button
								type="button"
								onClick={handleExportPdf}
								className="rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 active:scale-95 shadow-sm"
							>
								📥 Exportar PDF ({paperSize.toUpperCase()})
							</button>
							<button
								type="button"
								onClick={handleShareWhatsapp}
								className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95"
							>
								💬 WhatsApp
							</button>
						</div>

						{/* TAB 1: FORM FIELDS */}
						{activeTab === "form" && (
							<div className="grid gap-4 md:grid-cols-2">
								<div className="md:col-span-2">
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Arrendador{" "}
										<span className="font-normal text-slate-400 font-sans lowercase">
											(nombre completo)
										</span>
									</label>
									<input
										value={formData.arrendador}
										onChange={(e) => handleChange("arrendador", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Juan Pérez González"
									/>
								</div>

								<div className="md:col-span-2">
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Arrendatario{" "}
										<span className="font-normal text-slate-400 font-sans lowercase">
											(nombre completo)
										</span>
									</label>
									<input
										value={formData.arrendatario}
										onChange={(e) =>
											handleChange("arrendatario", e.target.value)
										}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. María López Martínez"
									/>
								</div>

								<div className="md:col-span-2">
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Fiador Solidario{" "}
										<span className="font-normal text-slate-400 font-sans lowercase">
											(nombre completo)
										</span>
									</label>
									<input
										value={formData.fiador}
										onChange={(e) => handleChange("fiador", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Carlos Ramírez Sánchez"
									/>
								</div>

								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Calle / Vialidad
									</label>
									<input
										value={formData.calle}
										onChange={(e) => handleChange("calle", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Av. Insurgentes Sur"
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Número / Departamento
									</label>
									<input
										value={formData.numero}
										onChange={(e) => handleChange("numero", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Depto. 101"
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Colonia
									</label>
									<input
										value={formData.colonia}
										onChange={(e) => handleChange("colonia", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Col. Centro"
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Municipio / Ciudad
									</label>
									<input
										value={formData.municipio}
										onChange={(e) => handleChange("municipio", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. Ciudad de México"
									/>
								</div>

								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Costo de la renta{" "}
										<span className="font-normal text-slate-400 font-sans lowercase">
											(monto mensual $)
										</span>
									</label>
									<input
										type="number"
										min="0"
										step="1"
										value={formData.rentaNumero}
										onChange={(e) =>
											handleChange("rentaNumero", e.target.value)
										}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. 5000"
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Renta en letra{" "}
										<span className="font-normal text-slate-400 font-sans lowercase">
											(calculada)
										</span>
									</label>
									<input
										value={formatAmountInLetters(formData.rentaNumero)}
										readOnly
										aria-label="Monto en letra, calculado automáticamente"
										className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 px-4 py-3 text-sm font-medium text-emerald-900 dark:text-emerald-300 outline-none"
									/>
								</div>

								<div>
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Máximo de personas
									</label>
									<input
										type="number"
										min="1"
										max="20"
										step="1"
										value={formData.personas}
										onChange={(e) => handleChange("personas", e.target.value)}
										className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										placeholder="Ej. 2"
									/>
								</div>

								<div className="md:col-span-2">
									<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
										Fecha de inicio del contrato
									</label>
									<div className="grid gap-3 sm:grid-cols-3">
										<input
											type="number"
											min="1"
											max="31"
											value={formData.inicioDia}
											onChange={(e) =>
												handleChange("inicioDia", e.target.value)
											}
											className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
											placeholder="Día (ej. 1)"
										/>
										<select
											value={formData.inicioMes}
											onChange={(e) =>
												handleChange("inicioMes", e.target.value)
											}
											className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
										>
											<option value="">Mes</option>
											{monthNames.map((m, i) => (
												<option key={m} value={String(i + 1)}>
													{m.charAt(0).toUpperCase() + m.slice(1)}
												</option>
											))}
										</select>
										<input
											type="number"
											min="2020"
											max="2100"
											value={formData.inicioAnio}
											onChange={(e) =>
												handleChange("inicioAnio", e.target.value)
											}
											className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950"
											placeholder="Año (ej. 2025)"
										/>
									</div>
								</div>

								<div className="md:col-span-2 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 p-4">
									<label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
										Fecha de término{" "}
										<span className="font-normal font-sans lowercase text-emerald-700 dark:text-emerald-400">
											(1 año forzoso automático)
										</span>
									</label>
									<div className="grid gap-3 sm:grid-cols-3">
										<input
											value={endDate.dia}
											readOnly
											aria-label="Día de término"
											placeholder="Día"
											className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
										/>
										<input
											value={
												endDate.mes
													? (monthNames[Number(endDate.mes) - 1] ?? "")
													: ""
											}
											readOnly
											aria-label="Mes de término"
											placeholder="Mes"
											className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize outline-none"
										/>
										<input
											value={endDate.anio}
											readOnly
											aria-label="Año de término"
											placeholder="Año"
											className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
										/>
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: CLAUSE & LEGAL ARTICLE TEMPLATE EDITOR */}
						{activeTab === "clauses" && (
							<div className="space-y-6">
								<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 p-4">
									<div>
										<h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
											Personalización de Cláusulas y Artículos Legales
										</h3>
										<p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
											Puedes editar títulos, artículos (ej. Art. 7.714), textos,
											agregar o quitar cláusulas. Usa <code>**texto**</code>{" "}
											para poner en negrita.
										</p>
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={handleAddClause}
											className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
										>
											➕ Agregar Cláusula
										</button>
										<button
											type="button"
											onClick={handleResetClauses}
											className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
										>
											🔄 Restablecer
										</button>
									</div>
								</div>

								{/* Guide of Placeholders */}
								<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-600 dark:text-slate-400">
									<p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
										Variables dinámicas disponibles para usar en tus textos:
									</p>
									<div className="flex flex-wrap gap-2 text-[11px] font-mono">
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{montoFull}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{fechaInicio}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{fechaTermino}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{personas}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{municipio}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{arrendador}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{arrendatario}}"}
										</span>
										<span className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
											{"{{fiador}}"}
										</span>
									</div>
								</div>

								{/* List of Clauses */}
								<div className="space-y-4">
									{clauses.map((clause, idx) => (
										<div
											key={clause.id}
											className={`rounded-2xl border p-4 transition ${
												clause.enabled
													? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
													: "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 opacity-60"
											}`}
										>
											<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
												<div className="flex items-center gap-3">
													<button
														type="button"
														onClick={() => handleToggleClause(clause.id)}
														className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
															clause.enabled
																? "bg-emerald-600"
																: "bg-slate-300 dark:bg-slate-700"
														}`}
														title={
															clause.enabled
																? "Desactivar cláusula"
																: "Activar cláusula"
														}
													>
														<span
															className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
																clause.enabled
																	? "translate-x-4"
																	: "translate-x-0"
															}`}
														/>
													</button>
													<span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
														Cláusula #{idx + 1}
													</span>
												</div>

												<div className="flex items-center gap-1.5">
													<button
														type="button"
														onClick={() => handleMoveClause(idx, -1)}
														disabled={idx === 0}
														className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
														title="Mover arriba"
													>
														⬆️
													</button>
													<button
														type="button"
														onClick={() => handleMoveClause(idx, 1)}
														disabled={idx === clauses.length - 1}
														className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
														title="Mover abajo"
													>
														⬇️
													</button>
													<button
														type="button"
														onClick={() => handleDeleteClause(clause.id)}
														className="rounded-lg border border-red-200 dark:border-red-900/60 p-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
														title="Eliminar cláusula"
													>
														🗑️
													</button>
												</div>
											</div>

											<div className="space-y-3">
												<div>
													<label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
														Título de la Cláusula
													</label>
													<input
														value={clause.title}
														onChange={(e) =>
															handleClauseChange(
																clause.id,
																"title",
																e.target.value,
															)
														}
														className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold dark:text-white outline-none focus:border-emerald-500"
														placeholder="Ej. PRIMERA. Renta y Puntualidad."
													/>
												</div>
												<div>
													<label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
														Texto legal y contenido de la cláusula
													</label>
													<textarea
														rows={3}
														value={clause.text}
														onChange={(e) =>
															handleClauseChange(
																clause.id,
																"text",
																e.target.value,
															)
														}
														className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs leading-relaxed dark:text-white outline-none focus:border-emerald-500"
														placeholder="Escribe el texto de la cláusula..."
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<aside className="space-y-6">
						<div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
							<h2 className="text-lg font-semibold">Vista previa de datos</h2>
							<p className="mt-1 text-xs text-slate-400">
								Resumen en tiempo real del documento.
							</p>
							<pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/10 p-4 text-xs leading-6 text-slate-200 font-mono">
								{previewText}
							</pre>
						</div>
						<div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
							<h3 className="text-base font-semibold text-slate-900 dark:text-white">
								Características y Personalización
							</h3>
							<ul className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
								<li>
									✓ <strong>Modo Oscuro</strong> automático según la
									configuración de tu dispositivo o selección manual.
								</li>
								<li>
									✓ <strong>Editor de Cláusulas</strong>: Agrega, edita o
									elimina artículos legales (ej. Art. 7.714) en cualquier
									momento.
								</li>
								<li>
									✓ <strong>Formato PDF inteligente</strong>: Ajusta el texto
									dinámicamente para que quepa en 1 hoja.
								</li>
								<li>
									✓ <strong>Resguardo de plantilla</strong>: Tus cláusulas
									personalizadas se guardan en el archivo <code>.contrato</code>
									.
								</li>
							</ul>
						</div>
					</aside>
				</section>
			</div>
		</main>
	);
}

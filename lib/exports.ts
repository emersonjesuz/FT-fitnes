import { Workout, Student } from "@/types";
import { saveAs } from "file-saver";

const DIAS_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function sortedDias(workout: Workout) {
  return [...workout.dias].sort((a, b) => DIAS_ORDER.indexOf(a.diaSemana) - DIAS_ORDER.indexOf(b.diaSemana));
}

// ─── JSON ────────────────────────────────────────────────────────────────────

export function exportJSON(workout: Workout, student: Student) {
  const payload = {
    aluno: student.nome,
    objetivo: workout.objetivo,
    nivel: workout.nivel,
    exportadoEm: new Date().toLocaleDateString("pt-BR"),
    dias: sortedDias(workout).map((d) => ({
      dia: d.diaSemana,
      descricao: d.descricaoDia || "",
      exercicios: d.exercises.map((e) => ({
        nome: e.exercicio,
        series: e.series,
        repeticoes: e.repeticoes,
        peso: e.peso,
        observacao: e.descricao || "",
        aula: e.aulaNome || "",
        linkAula: e.aulaUrl || "",
      })),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  saveAs(blob, `treino-${student.nome.replace(/\s/g, "_")}.json`);
}

// ─── Texto ────────────────────────────────────────────────────────────────────

export function exportText(workout: Workout, student: Student) {
  let text = `TREINO - ${student.nome.toUpperCase()}\n`;
  text += `Objetivo: ${workout.objetivo} | Nível: ${workout.nivel}\n`;
  text += `Exportado em: ${new Date().toLocaleDateString("pt-BR")}\n`;
  text += `${"─".repeat(40)}\n\n`;

  for (const dia of sortedDias(workout)) {
    text += `${dia.diaSemana.toUpperCase()}\n`;
    if (dia.descricaoDia) text += `${dia.descricaoDia}\n`;
    text += `${"─".repeat(20)}\n`;
    dia.exercises.forEach((ex, i) => {
      text += `${i + 1}. ${ex.exercicio}\n`;
      text += `   Séries: ${ex.series} | Reps: ${ex.repeticoes}`;
      if (ex.peso) text += ` | Peso: ${ex.peso}`;
      text += "\n";
      if (ex.descricao) text += `   Obs: ${ex.descricao}\n`;
      if (ex.aulaNome) text += `   Aula: ${ex.aulaNome} - ${ex.aulaUrl}\n`;
    });
    text += "\n";
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `treino-${student.nome.replace(/\s/g, "_")}.txt`);
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function exportExcel(workout: Workout, student: Student) {
  const XLSX = await import("xlsx");

  const rows: (string | number)[][] = [
    ["TREINO", student.nome],
    ["Objetivo", workout.objetivo],
    ["Nível", workout.nivel],
    ["Data", new Date().toLocaleDateString("pt-BR")],
    [],
    ["Dia", "Descrição do Dia", "Nº", "Exercício", "Séries", "Repetições", "Peso", "Observação", "Aula", "Link Aula"],
  ];

  for (const dia of sortedDias(workout)) {
    dia.exercises.forEach((ex, i) => {
      rows.push([
        i === 0 ? dia.diaSemana : "",
        i === 0 ? dia.descricaoDia || "" : "",
        i + 1,
        ex.exercicio,
        ex.series,
        ex.repeticoes,
        ex.peso || "",
        ex.descricao || "",
        ex.aulaNome || "",
        ex.aulaUrl || "",
      ]);
    });
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largura das colunas
  ws["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 4 },
    { wch: 28 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 20 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Treino");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `treino-${student.nome.replace(/\s/g, "_")}.xlsx`);
}

// ─── DOCX ────────────────────────────────────────────────────────────────────

export async function exportDOCX(workout: Workout, student: Student) {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = await import("docx");

  const children = [
    new Paragraph({
      text: `Treino - ${student.nome}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Objetivo: `, bold: true }),
        new TextRun({ text: workout.objetivo }),
        new TextRun({ text: `   |   Nível: `, bold: true }),
        new TextRun({ text: workout.nivel }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const dia of sortedDias(workout)) {
    children.push(
      new Paragraph({
        text: dia.diaSemana + (dia.descricaoDia ? ` — ${dia.descricaoDia}` : ""),
        heading: HeadingLevel.HEADING_2,
      }),
    );

    dia.exercises.forEach((ex, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${ex.exercicio}`, bold: true })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `  Séries: ${ex.series}  |  Reps: ${ex.repeticoes}` }),
            ...(ex.peso ? [new TextRun({ text: `  |  Peso: ${ex.peso}` })] : []),
          ],
        }),
      );
      if (ex.descricao) {
        children.push(new Paragraph({ children: [new TextRun({ text: `  Obs: ${ex.descricao}`, italics: true })] }));
      }
      if (ex.aulaNome) {
        children.push(
          new Paragraph({ children: [new TextRun({ text: `  Aula: ${ex.aulaNome} (${ex.aulaUrl})`, color: "0070C0" })] }),
        );
      }
    });
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `treino-${student.nome.replace(/\s/g, "_")}.docx`);
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export function exportWhatsApp(workout: Workout, student: Student) {
  let text = `💪 *TREINO - ${student.nome.toUpperCase()}*\n`;
  text += `🎯 ${workout.objetivo} | 📊 ${workout.nivel}\n\n`;

  for (const dia of sortedDias(workout)) {
    text += `*📅 ${dia.diaSemana.toUpperCase()}*\n`;
    if (dia.descricaoDia) text += `_${dia.descricaoDia}_\n`;
    text += "\n";

    dia.exercises.forEach((ex, i) => {
      text += `*${i + 1}. ${ex.exercicio}*\n`;
      text += `   ${ex.series} séries × ${ex.repeticoes} reps`;
      if (ex.peso) text += ` | ${ex.peso}`;
      text += "\n";
      if (ex.descricao) text += `   _${ex.descricao}_\n`;
      if (ex.aulaUrl) text += `   🎬 Aula: ${ex.aulaUrl}\n`;
    });
    text += "\n";
  }

  text += `_Gerado em ${new Date().toLocaleDateString("pt-BR")} via PTPro_`;

  navigator.clipboard
    .writeText(text)
    .then(() => alert("✅ Treino copiado! Cole no WhatsApp."))
    .catch(() => {
      // Fallback para dispositivos sem suporte
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      alert("✅ Treino copiado! Cole no WhatsApp.");
    });
}

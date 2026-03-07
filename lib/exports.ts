import { Workout, Student } from '@/types'

export function exportJSON(workout: Workout, student: Student): void {
  const data = {
    aluno: {
      nome: student.nome,
      biotipo: student.biotipo,
      idade: student.idade,
      altura: student.altura,
      peso: student.peso,
    },
    treino: {
      objetivo: workout.objetivo,
      nivel: workout.nivel,
      criadoEm: workout.createdAt,
      dias: workout.dias.map(dia => ({
        dia: dia.diaSemana,
        exercicios: dia.exercises.map(ex => ({
          exercicio: ex.exercicio,
          series: ex.series,
          repeticoes: ex.repeticoes,
          peso: ex.peso,
          descricao: ex.descricao,
        })),
      })),
    },
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `treino_${student.nome.toLowerCase().replace(/\s/g, '_')}.json`)
}

export function exportText(workout: Workout, student: Student): void {
  let text = `FICHA DE TREINO\n${'='.repeat(40)}\n\n`
  text += `Aluno: ${student.nome}\n`
  text += `Biotipo: ${student.biotipo}\n`
  text += `Idade: ${student.idade} anos\n`
  text += `Altura: ${student.altura}m | Peso: ${student.peso}kg\n`
  text += `\nObjetivo: ${workout.objetivo}\n`
  text += `Nível: ${workout.nivel}\n\n`
  text += `${'='.repeat(40)}\n\n`

  workout.dias.forEach(dia => {
    text += `${dia.diaSemana.toUpperCase()}\n${'-'.repeat(30)}\n\n`
    dia.exercises.forEach(ex => {
      text += `• ${ex.exercicio}\n`
      text += `  Séries: ${ex.series} | Repetições: ${ex.repeticoes} | Peso: ${ex.peso}\n`
      if (ex.descricao) text += `  Obs: ${ex.descricao}\n`
      text += '\n'
    })
  })

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `treino_${student.nome.toLowerCase().replace(/\s/g, '_')}.txt`)
}

export async function exportExcel(workout: Workout, student: Student): Promise<void> {
  const XLSX = (await import('xlsx')).default

  const wb = XLSX.utils.book_new()

  // Info sheet
  const infoData = [
    ['FICHA DE TREINO'],
    [],
    ['Aluno', student.nome],
    ['Biotipo', student.biotipo],
    ['Idade', `${student.idade} anos`],
    ['Altura', `${student.altura}m`],
    ['Peso', `${student.peso}kg`],
    [],
    ['Objetivo', workout.objetivo],
    ['Nível', workout.nivel],
    ['Data', new Date(workout.createdAt).toLocaleDateString('pt-BR')],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Informações')

  // Exercises sheet
  const exercisesData = [
    ['Dia', 'Exercício', 'Séries', 'Repetições', 'Peso', 'Descrição'],
  ]
  workout.dias.forEach(dia => {
    dia.exercises.forEach(ex => {
      exercisesData.push([
        dia.diaSemana,
        ex.exercicio,
        ex.series,
        ex.repeticoes,
        ex.peso,
        ex.descricao || '',
      ])
    })
  })
  const exercisesSheet = XLSX.utils.aoa_to_sheet(exercisesData)
  XLSX.utils.book_append_sheet(wb, exercisesSheet, 'Treino')

  XLSX.writeFile(wb, `treino_${student.nome.toLowerCase().replace(/\s/g, '_')}.xlsx`)
}

export async function exportDOCX(workout: Workout, student: Student): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType, AlignmentType } = await import('docx')

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 24 }
        }
      }
    },
    sections: [{
      children: [
        new Paragraph({
          text: 'FICHA DE TREINO',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'DADOS DO ALUNO', bold: true, size: 28 })],
          spacing: { before: 200, after: 200 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Nome', student.nome),
            makeTableRow('Biotipo', student.biotipo),
            makeTableRow('Idade', `${student.idade} anos`),
            makeTableRow('Altura', `${student.altura}m`),
            makeTableRow('Peso', `${student.peso}kg`),
            makeTableRow('Objetivo', workout.objetivo),
            makeTableRow('Nível', workout.nivel),
          ],
        }),
        new Paragraph({ text: '', spacing: { before: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: 'PROGRAMAÇÃO DE TREINO', bold: true, size: 28 })],
          spacing: { before: 200, after: 300 },
        }),
        ...workout.dias.flatMap(dia => [
          new Paragraph({
            children: [new TextRun({ text: dia.diaSemana.toUpperCase(), bold: true, size: 26, color: 'EA580C' })],
            spacing: { before: 300, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EA580C' } },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ['Exercício', 'Séries', 'Repetições', 'Peso', 'Descrição'].map(h =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  })
                ),
              }),
              ...dia.exercises.map(ex =>
                new TableRow({
                  children: [ex.exercicio, ex.series, ex.repeticoes, ex.peso, ex.descricao || '-'].map(v =>
                    new TableCell({
                      children: [new Paragraph({ text: v })],
                    })
                  ),
                })
              ),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),
        ]),
      ],
    }],
  })

  function makeTableRow(label: string, value: string) {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: value })],
        }),
      ],
    })
  }

  const buffer = await Packer.toBlob(doc)
  downloadBlob(buffer, `treino_${student.nome.toLowerCase().replace(/\s/g, '_')}.docx`)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DashboardData, Contract, MonthlyDetail } from '../types/dashboard';

export async function exportDashboardReport(data: DashboardData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Limpax';
  workbook.created = new Date();

  // Planilha de Resumo
  const summarySheet = workbook.addWorksheet('Resumo Financeiro');
  
  // Estilo para cabeçalhos
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: '2563EB' }
    },
    alignment: { horizontal: 'center' as const }
  };

  // Resumo Geral
  summarySheet.addRow(['Resumo Financeiro Geral']).font = { bold: true, size: 14 };
  summarySheet.addRow(['']);
  summarySheet.addRow(['Receita Total', `R$ ${data.totalIncome.toLocaleString()}`]);
  summarySheet.addRow(['Despesas Totais', `R$ ${data.totalExpenses.toLocaleString()}`]);
  summarySheet.addRow(['Saldo', `R$ ${data.balance.toLocaleString()}`]);
  summarySheet.addRow(['']);

  // Custos por Categoria
  summarySheet.addRow(['Custos por Categoria']).font = { bold: true, size: 12 };
  const headerRow = summarySheet.addRow(['Categoria', 'Valor']);
  headerRow.eachCell(cell => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
  });

  summarySheet.addRow(['Aluguel', `R$ ${data.internalCosts.aluguel.toLocaleString()}`]);
  summarySheet.addRow(['Energia', `R$ ${data.internalCosts.energia.toLocaleString()}`]);
  summarySheet.addRow(['Internet', `R$ ${data.internalCosts.internet.toLocaleString()}`]);
  summarySheet.addRow(['Manutenção', `R$ ${data.internalCosts.manutencao.toLocaleString()}`]);
  summarySheet.addRow(['Fornecedores', `R$ ${data.suppliersCost.toLocaleString()}`]);
  summarySheet.addRow(['Baixas', `R$ ${data.dismissalsCost.toLocaleString()}`]);
  summarySheet.addRow(['Férias', `R$ ${data.vacationsCost.toLocaleString()}`]);

  // Planilha de Contratos
  const contractsSheet = workbook.addWorksheet('Contratos');
  
  contractsSheet.addRow(['Resumo por Contrato']).font = { bold: true, size: 14 };
  const contractHeaderRow = contractsSheet.addRow(['Município', 'Receita', 'Despesas', 'Saldo']);
  contractHeaderRow.eachCell(cell => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
  });

  data.contractsRevenue.byContract.forEach((contract: Contract) => {
    contractsSheet.addRow([
      contract.municipalityName,
      `R$ ${contract.revenue.toLocaleString()}`,
      `R$ ${contract.expenses.toLocaleString()}`,
      `R$ ${contract.balance.toLocaleString()}`
    ]);
  });

  // Planilha de Movimentações
  const detailsSheet = workbook.addWorksheet('Movimentações');
  
  const detailsHeaderRow = detailsSheet.addRow(['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']);
  detailsHeaderRow.eachCell(cell => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
  });

  data.monthlyDetails.forEach((detail: MonthlyDetail) => {
    detailsSheet.addRow([
      new Date(detail.date).toLocaleDateString(),
      detail.description,
      detail.category,
      detail.type === 'income' ? 'Receita' : 'Despesa',
      `R$ ${detail.amount.toLocaleString()}`
    ]);
  });

  // Ajustar largura das colunas
  [summarySheet, contractsSheet, detailsSheet].forEach(sheet => {
    if (sheet && sheet.columns) {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }
  });

  // Gerar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `relatorio-financeiro-${new Date().toISOString().slice(0,10)}.xlsx`);
} 
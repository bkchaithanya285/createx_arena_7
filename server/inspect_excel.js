const ExcelJS = require('exceljs');
const path = require('path');

async function checkExcel() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'team_list.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  
  console.log('Sheet Name:', worksheet.name);
  console.log('Row Count:', worksheet.rowCount);
  
  // Print headers (Row 1)
  const headers = worksheet.getRow(1).values;
  console.log('Headers:', headers);
  
  // Print first few rows
  for(let i=2; i<=5; i++){
    console.log(`Row ${i}:`, worksheet.getRow(i).values);
  }
}

checkExcel().catch(console.error);

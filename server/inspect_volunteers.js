const ExcelJS = require('exceljs');
const path = require('path');

async function checkVolunteers() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'Volunteer_Team_Allocation.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  
  console.log('Sheet Name:', worksheet.name);
  console.log('Headers:', worksheet.getRow(1).values);
  console.log('Row 2:', worksheet.getRow(2).values);
}

checkVolunteers().catch(console.error);

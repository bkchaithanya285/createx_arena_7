const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function importData() {
  console.log('Starting data import...');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('../team_list.xlsx');
  const worksheet = workbook.getWorksheet(1);
  
  const teamsMap = new Map();
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    const teamId = row.getCell(1).value;
    const teamName = row.getCell(2).value;
    const role = row.getCell(3).value;
    const name = row.getCell(4).value;
    const phone = row.getCell(5).value;
    const regNo = row.getCell(6).value?.toString();
    
    if (!teamId) return;

    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, {
        id: teamId,
        name: teamName,
        leader_reg: '',
        cluster: getCluster(teamId),
        members: []
      });
    }
    
    const team = teamsMap.get(teamId);
    team.members.push({ role, name, phone, regNo });
    if (role === 'Leader' || role === 'TEAM LEAD') {
      team.leader_reg = regNo;
    }
  });

  const teams = Array.from(teamsMap.values());
  console.log(`Aggregated ${teams.length} teams.`);

  // Upload to Supabase in chunks
  for (let i = 0; i < teams.length; i += 20) {
    const chunk = teams.slice(i, i + 20);
    const { error } = await supabase.from('teams').insert(chunk);
    if (error) {
      console.error('Error inserting chunk:', error.message);
    } else {
      console.log(`Inserted chunk ${i / 20 + 1}`);
    }
  }

  console.log('Import completed!');
}

function getCluster(teamId) {
  // Assuming 108 teams, CREATOR-001 to CREATOR-108
  // Cluster A: 1-36, Cluster B: 37-72, Cluster C: 73-108
  const num = parseInt(teamId.split('-')[1]);
  if (num <= 36) return 'A';
  if (num <= 72) return 'B';
  return 'C';
}

importData().catch(console.error);

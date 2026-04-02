const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function seed() {
  console.log('--- SEEDING DATABASE ---');

  // 1. Teams
  const teamsWorkbook = new ExcelJS.Workbook();
  await teamsWorkbook.xlsx.readFile('../team_list.xlsx');
  const teamsSheet = teamsWorkbook.getWorksheet(1);
  const teamsMap = new Map();

  teamsSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const teamId = row.getCell(1).value;
    const teamName = row.getCell(2).value;
    const role = row.getCell(3).value;
    const name = row.getCell(4).value;
    const phone = row.getCell(5).value;
    const regNo = row.getCell(6).value?.toString();
    if (!teamId) return;

    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, { id: teamId, name: teamName, leader_reg: '', cluster: getCluster(teamId), members: [] });
    }
    const team = teamsMap.get(teamId);
    team.members.push({ role, name, phone, regNo });
    if (role === 'Leader' || role === 'TEAM LEAD' || role === 'Team Lead') team.leader_reg = regNo;
  });

  const teams = Array.from(teamsMap.values());
  console.log(`Prepared ${teams.length} teams.`);

  // 2. Volunteers
  const volWorkbook = new ExcelJS.Workbook();
  await volWorkbook.xlsx.readFile('../Volunteer_Team_Allocation.xlsx');
  const volSheet = volWorkbook.getWorksheet(1);
  const volunteers = [];

  volSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = row.getCell(2).value;
    const regNo = row.getCell(3).value?.toString();
    const fromTeam = row.getCell(4).value;
    const toTeam = row.getCell(5).value;
    if (!regNo) return;

    const assignedTeams = generateTeamRange(fromTeam, toTeam);
    volunteers.push({ id: `CREATEX_vol_${regNo}`, name, reg_no: regNo, assigned_teams: assignedTeams });
  });
  console.log(`Prepared ${volunteers.length} volunteers.`);

  // 3. Reviewers (Default 10)
  const reviewerIds = Array.from({ length: 10 }, (_, i) => `reviewer_${i + 1}`);
  const reviewers = reviewerIds.map(id => ({ id, display_name: `Reviewer ${id.split('_')[1]}`, assigned_teams: [] }));

  // 4. Problems (40 Dummy)
  const problems = [];
  for (let i = 1; i <= 40; i++) {
    problems.push({
      id: `P${i.toString().padStart(3, '0')}`,
      title: `Innovation Challenge ${i}`,
      description: `Detailed requirements and expectations for Problem ${i}. This requires a scalable, modern technological solution.`,
      is_revealed: false,
      is_details_revealed: false
    });
  }

  // Execute Inserts
  await performChunkedInsert('teams', teams);
  await performChunkedInsert('volunteers', volunteers);
  await performChunkedInsert('reviewers', reviewers);
  await performChunkedInsert('problems', problems);

  console.log('--- SEEDING COMPLETED ---');
}

async function performChunkedInsert(table, data) {
  for (let i = 0; i < data.length; i += 20) {
    const chunk = data.slice(i, i + 20);
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) console.error(`Error upserting into ${table}:`, error.message);
  }
  console.log(`Table ${table}: Chunked upserts done.`);
}

function getCluster(teamId) {
  if (!teamId) return 'A';
  const match = teamId.match(/\d+/);
  const num = match ? parseInt(match[0]) : 0;
  return num <= 36 ? 'A' : num <= 72 ? 'B' : 'C';
}

function generateTeamRange(from, to) {
  try {
    if (!from || !to) return [];
    
    // Ensure we have strings for split
    const fromStr = from.toString();
    const toStr = to.toString();
    
    const startMatch = fromStr.match(/\d+/);
    const endMatch = toStr.match(/\d+/);
    
    if (!startMatch || !endMatch) {
      console.warn(`Invalid team range format: ${from} to ${to}`);
      return [];
    }

    const start = parseInt(startMatch[0]);
    const end = parseInt(endMatch[0]);
    
    if (isNaN(start) || isNaN(end)) return [];

    const teams = [];
    for (let i = start; i <= end; i++) {
      teams.push(`CREATOR-${i.toString().padStart(3, '0')}`);
    }
    return teams;
  } catch (err) {
    console.error('Error generating team range:', err.message);
    return [];
  }
}

seed().catch(console.error);

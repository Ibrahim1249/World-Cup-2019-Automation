// npm install miniminst
// npm install axios
// npm install pdf-lib
// npm install jsdom
// npm install excel4node

// node Project_1_Webscrapping.js  --excel=Worldcup.csv --dataFolder=WorldCup --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-schedule-fixtures-and-results"

let miniminst = require('minimist');
let axios = require('axios');
let excel = require('excel4node');
let pdf = require('pdf-lib');
let jsdom = require('jsdom');
let fs = require('fs');
let path = require('path');
const workbook = require('excel4node/distribution/lib/workbook');

let args = miniminst(process.argv);
let promiseKaRespone = axios.get(args.source);
promiseKaRespone.then(function (reponse) {
  let html = reponse.data;

  let dom = new jsdom.JSDOM(html);
  let document = dom.window.document;

  let matches = [];
  let matchesDivs = document.querySelectorAll("div.ds-grow > a.ds-no-tap-higlight");
  console.log(matchesDivs.length);
  for (let i = 0; i < matchesDivs.length; i++) {
    FmatchDiv = matchesDivs[i];
    let match = {
      t1: "",
      t2: "",
      t1score: "",
      t2score: "",
      Mresult: "",
    };

    let teamDivs = FmatchDiv.querySelectorAll("div.ci-team-score > p.ds-text-tight-m");
    match.t1 = teamDivs[0].textContent;
    match.t2 = teamDivs[1].textContent;

    let teamScore = FmatchDiv.querySelectorAll("div.ds-text-compact-s > strong");
    // if(teamScore.length==2){
    //   match.t1score=teamScore[0].textContext;
    //   match.t2score=teamScore[1].textContext;
    // }else if(teamScore.length==1){
    //   match.t1score=teamScore[0].textContext;
    //   match.t2score="";
    // }else{
    //   match.t1score="";
    //   match.t2score="";
    // }
    match.t1score = teamScore[0].textContent;
    match.t2score = teamScore[1].textContent;

    let resultSpan = FmatchDiv.querySelectorAll("td.os-textleft > div");
    match.Mresult = resultSpan[0].textContent;

    matches.push(match);

    let matchesJson = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesJson, "utf-8");
  }
//   let teams = [];
//   for (let i = 0; i < matches.length; i++) {
//     pushTeaminTeamIfNotAlreadyThere(teams, matches[i].t1);
//     pushTeaminTeamIfNotAlreadyThere(teams, matches[i].t2);
//   }
//    for(let i=0;i<matches.length;i++){
//     pushMatchInAppropriateTeam(teams,matches[i].t1,matches[i].t2,matches[i].t1score,matches[i].t2score);
//     pushMatchInAppropriateTeam(teams,matches[i].t2,matches[i].t1,matches[i].t2score,matches[i].t1score);
    
//    }
//   let teamsJson = JSON.stringify(teams);
//   fs.writeFileSync("teams.json", teamsJson, "utf-8");

//   prepareExcel(teams,args.excel);
//   prepareFolderAndPdfs(teams,args.dataFolder);
 }
).catch(function (err) {
  console.log(err);
});

function prepareFolderAndPdfs(teams,datadir){
if(fs.existsSync(datadir)==true){
  fs.rmdirSync(datadir,{recursive:true});
}
    fs.mkdirSync(datadir);
  
  for(let i=0;i<teams.length;i++){
    let teamFolderName=path.join(datadir,teams[i].name);
      fs.mkdirSync(teamFolderName);
    
    for(let j=0;j<teams[i].matches[j].length;j++){
      let match=teams[i].matches[j];
      createMatchScorecardPdf(teamFolderName,match);
    }
  }
}
function createMatchScorecardPdf(teamFolderName,match){
  let matchFileName=path.join(teamFolderName,match.vs + ".pdf");

  let originalBytes=fs.readFileSync("Template.pdf");// it will give bytes
  let promiseToLoadDoc=pdf.PDFDocument.load(originalBytes);
  promiseToLoadDoc.then(function(pdfDoc){
      let page = pdfDoc.getPage(0);
      page.drawText(t1,{
          x:330,
          y:582,
          size:15
      });
      page.drawText(t2,{
          x:330,
          y:562,
          size:15
      });
      page.drawText(result,{
          x:330,
          y:542,
          size:15
      });
  let promiseToSave=pdfDoc.save()
  promiseToSave.then(function(changedBytes){
      if(fs.existsSync(matchFileName + ".pdf")==true){
        fs.writeFileSync(matchFileName + ".1pdf",changedBytes);
      }else{
        fs.writeFileSync(matchFileName + ".pdf",changedBytes);
      }
  })
  })
}

function prepareExcel(teams,excelFileName){
  let wb=new excel4node.workbook();

  for(let i=0;i<teams.length;i++){
    let tsheet=wb.addWorksheet(teams[i].name);

    tsheet.cell(1,1).string("VS");
    tsheet.cell(1,2).string("Self Score");
    tsheet.cell(1,3).string("Opp-Score");
    tsheet.cell(1,4).string("Result");

    for(let j=0;j<teams[i].matches.length;j++){
     tsheet.cell(2 +j ,1).string(teams[i].matches[j].vs);
     tsheet.cell(2 +j ,2).string(teams[i].matches[j].selfScore);
     tsheet.cell(2 +j ,3).string(teams[i].matches[j].OppScore);
     tsheet.cell(2 +j ,4).string(teams[i].matches[j].Mresult);

    }

  }
  wb.write(excelFileName);
}



function pushTeaminTeamIfNotAlreadyThere(teams, teamName) {
  let tidx = -1;
  for (let j = 0; j < teams.length; j++) {
    if (teams[j].name == teamName) {
      tidx = j;
      break;
    }
  }
  if (tidx == -1) {
    let team = {
      name: teamName,
      matches: []
    }
    teams.push(team);
  }
}

function pushMatchInAppropriateTeam(teams,homeTeam,OppTeam,homeScore,OppScore){
  let tidx=-1;
  for(let j=0;j<teams.length;j++){
    if(teams[j]==homeTeam){
      tidx=j;
      break;
    }
  }
  let team=teams[tidx];
  team.matches.push({
    vs: OppTeam,
    selfScore: homeScore,
    OppScore: OppScore,
   // result: result
  });
}
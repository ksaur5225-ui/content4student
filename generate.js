const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ================== आपकी नई शीट का CSV URL ==================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSn6g7KTqzw0ZWurT4wmd1_O-zTunBnj6A8VUfoUt3FVZtshr9qBzPzacaIIp_yM1O1J1M-Nq6RuQRr/pub?gid=1414097283&single=true&output=csv";

const OUT_DIR = path.join(__dirname, 'public');
const JOBS_DIR = path.join(OUT_DIR, 'jobs');
const DEPT_DIR = path.join(OUT_DIR, 'department');
const QUAL_DIR = path.join(OUT_DIR, 'qualification');
const STATE_DIR = path.join(OUT_DIR, 'state');
const POS_DIR = path.join(OUT_DIR, 'position');

// ================== यूटिलिटी फंक्शन ==================
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
}

// ================== CSV पार्सर (42 कॉलम के अनुसार) ==================
function parseCSV(text) {
  let lines = []; let row = []; let cell = ''; let insideQuote = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i], nextChar = text[i+1];
    if (char === '"') {
      if (insideQuote && nextChar === '"') { cell += '"'; i++; }
      else { insideQuote = !insideQuote; }
    } else if (char === ',' && !insideQuote) {
      row.push(cell.trim()); cell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      if (row.length > 0 && row.some(x => x !== '')) lines.push(row);
      row = []; cell = '';
    } else { cell += char; }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); lines.push(row); }
  if(lines.length === 0) return [];
  
  let output = [];
  for (let i = 1; i < lines.length; i++) {
    let m = lines[i];
    if (m.length >= 8) {
      output.push({
        title: (m[0] || "").replace(/^"|"$/g, "").trim(),
        company: (m[1] || "").replace(/^"|"$/g, "").trim(),
        link: (m[2] || "").replace(/^"|"$/g, "").trim(),
        linkpdf: (m[3] || "").replace(/^"|"$/g, "").trim(),
        position: (m[4] || "Not Mentioned").replace(/^"|"$/g, "").trim(),
        qualification: (m[5] || "Not Mentioned").replace(/^"|"$/g, "").trim(),
        department: (m[6] || "Govt").replace(/^"|"$/g, "").trim(),
        state: (m[7] || "All India").replace(/^"|"$/g, "").trim(),
        postType: (m[8] || "Job").replace(/^"|"$/g, "").trim(),
        trending: (m[9] || "No").replace(/^"|"$/g, "").trim(),
        tags: (m[10] || "").replace(/^"|"$/g, "").trim(),
        salary: (m[11] || "").replace(/^"|"$/g, "").trim(),
        appStartDate: (m[12] || "").replace(/^"|"$/g, "").trim(),
        lastDate: (m[13] || "").replace(/^"|"$/g, "").trim(),
        fee: (m[14] || "").replace(/^"|"$/g, "").trim(),
        overview: (m[15] || "Check official PDF notification for generic overview.").replace(/^"|"$/g, "").trim(),
        vacancy: (m[16] || "Refer to notification details.").replace(/^"|"$/g, "").trim(),
        selection: (m[17] || "Written Exam / Interview").replace(/^"|"$/g, "").trim(),
        dates: (m[18] || "Check document deadlines").replace(/^"|"$/g, "").trim(),
        eligibility: (m[19] || "As per guidelines").replace(/^"|"$/g, "").trim(),
        ageLimit: (m[20] || "Refer to official norms").replace(/^"|"$/g, "").trim(),
        howToApply: (m[21] || "Apply online through the official link given above.").replace(/^"|"$/g, "").trim(),
        syllabus: (m[22] || "Syllabus not explicitly specified in brief sheet.").replace(/^"|"$/g, "").trim(),
        examPattern: (m[23] || "").replace(/^"|"$/g, "").trim(),
        officialWebsite: (m[24] || "").replace(/^"|"$/g, "").trim(),
        notifNumber: (m[25] || "").replace(/^"|"$/g, "").trim(),
        totalPosts: (m[26] || "N/A").replace(/^"|"$/g, "").trim(),
        urVacancy: (m[27] || "").replace(/^"|"$/g, "").trim(),
        obcVacancy: (m[28] || "").replace(/^"|"$/g, "").trim(),
        scVacancy: (m[29] || "").replace(/^"|"$/g, "").trim(),
        stVacancy: (m[30] || "").replace(/^"|"$/g, "").trim(),
        ewsVacancy: (m[31] || "").replace(/^"|"$/g, "").trim(),
        pwdVacancy: (m[32] || "").replace(/^"|"$/g, "").trim(),
        jobType: (m[33] || "").replace(/^"|"$/g, "").trim(),
        experience: (m[34] || "").replace(/^"|"$/g, "").trim(),
        negativeMarking: (m[35] || "").replace(/^"|"$/g, "").trim(),
        interviewDate: (m[36] || "").replace(/^"|"$/g, "").trim(),
        resultDate: (m[37] || "").replace(/^"|"$/g, "").trim(),
        admitCardDate: (m[38] || "").replace(/^"|"$/g, "").trim(),
        answerKeyDate: (m[39] || "").replace(/^"|"$/g, "").trim(),
        ref1: (m[40] || "").replace(/^"|"$/g, "").trim(),
        ref2: (m[41] || "").replace(/^"|"$/g, "").trim()
      });
    }
  }
  return output;
}

// ================== जेनरेटर मेन फंक्शन (अभी सिर्फ सेटअप) ==================
async function generate() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const allData = parseCSV(text);

  // फोल्डर बनाएँ
  [OUT_DIR, JOBS_DIR, DEPT_DIR, QUAL_DIR, STATE_DIR, POS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // अलग-अलग टाइप के डेटा
  const jobs = allData.filter(j => j.postType.toLowerCase() === 'job');
  const results = allData.filter(j => j.postType.toLowerCase() === 'result');
  const admitCards = allData.filter(j => j.postType.toLowerCase() === 'admit card');
  const answerKeys = allData.filter(j => j.postType.toLowerCase() === 'answer key');

  // कैटेगरी टॉप 10 निकालें
  const getTop = (arr, key) => {
    const count = {};
    arr.forEach(item => {
      if (item[key]) {
        const val = item[key].trim();
        if (val) count[val] = (count[val] || 0) + 1;
      }
    });
    return Object.entries(count).sort((a,b) => b[1]-a[1]).slice(0,10).map(e => e[0]);
  };
  const topDept = getTop(jobs, 'department');
  const topQual = getTop(jobs, 'qualification');
  const topPos = getTop(jobs, 'position');
  const allStates = [...new Set(jobs.map(j => j.state).filter(s => s && s !== 'All India'))].sort();

  // बाकी जेनरेशन पार्ट 2 और 3 में...
  console.log(`Total entries: ${allData.length}, Jobs: ${jobs.length}, Results: ${results.length}, Admit Cards: ${admitCards.length}, Answer Keys: ${answerKeys.length}`);
}

generate();
// ================== कॉमन CSS ==================
function commonCSS() {
  return `<style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f0f2f5; color: #333; padding: 15px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 30px 20px; text-align: center; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .header h1 { font-size: 34px; font-weight: 800; margin-bottom: 5px; letter-spacing: 1px; }
        .header p { font-size: 15px; opacity: 0.9; margin-bottom: 15px; }
        .social-buttons { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .social-buttons a { text-decoration: none; color: white; padding: 8px 15px; font-size: 13px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
        .tg-btn { background: #0088cc; } .yt-btn { background: #ff0000; } .job-btn { background: #2e7d32; } .ca-btn { background: #ef6c00; } .sm-btn { background: #6a1b9a; }
        .filter-seo-box { background: white; border-left: 5px solid #ef6c00; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .filter-seo-box h2 { font-size: 18px; color: #1e3c72; margin-bottom: 8px; font-weight: 700; }
        .filter-seo-box p { font-size: 14px; color: #555; line-height: 1.6; }
        #exclusivePageLayout { background: white; border-radius: 16px; padding: 30px 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-top: 10px; border: 1px solid #eef2f5; }
        .back-btn, .page-back-btn { display: inline-flex; align-items: center; background: #f4f6f9; color: #222; padding: 11px 20px; font-weight: 700; text-decoration: none; font-size: 14px; margin-bottom: 25px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s ease; }
        .back-btn:hover, .page-back-btn:hover { background: #e2e8f0; transform: translateX(-3px); }
        .page-header-title { font-size: 28px; color: #1e3c72; font-weight: 800; text-align: center; margin-bottom: 8px; line-height: 1.3; }
        .page-header-subtitle { text-align: center; font-size: 18px; color: #0288d1; font-weight: 700; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        .breadcrumb { font-size: 14px; color: #666; margin-bottom: 15px; }
        .breadcrumb a { color: #1e3c72; text-decoration: none; font-weight: 600; }
        .info-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .dashboard-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center; }
        .dashboard-card span { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; }
        .dashboard-card p { font-size: 15px; color: #0f172a; font-weight: 700; }
        .job-highlights { background: #f1f5f9; border-radius: 10px; padding: 15px 20px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
        .highlight-item { text-align: center; }
        .highlight-item strong { display: block; font-size: 12px; color: #475569; margin-bottom: 4px; }
        .highlight-item span { font-size: 14px; font-weight: 700; color: #0f172a; }
        .details-tabs-nav { display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 25px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
        .tab-trigger { background: none; border: none; padding: 12px 20px; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; border-radius: 8px 8px 0 0; position: relative; transition: all 0.2s ease; white-space: nowrap; }
        .tab-trigger.active { color: #1e3c72; background: #f1f5f9; }
        .tab-trigger.active::after { content: ''; position: absolute; bottom: -10px; left: 0; right: 0; height: 3px; background: #1e3c72; border-radius: 2px; }
        .tab-content-block { display: none; background: #fff; border-radius: 12px; }
        .tab-content-block.active { display: block; }
        .content-card-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
        .content-card-header { background: #1e3c72; color: white; padding: 14px 20px; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .content-card-body { padding: 20px; font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-line; background: #ffffff; }
        .action-button-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .action-box { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 10px; }
        .action-label { font-size: 15px; font-weight: bold; color: #1e3c72; margin-bottom: 10px; }
        .action-link { display: inline-block; width: 100%; max-width: 240px; background: #2e7d32; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(46,125,50,0.2); transition: all 0.2s ease; }
        .action-link:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(46,125,50,0.3); }
        .action-link.pdf { background: #c62828; box-shadow: 0 4px 6px rgba(198,40,40,0.2); }
        .action-link.pdf:hover { box-shadow: 0 6px 12px rgba(198,40,40,0.3); }
        .faq-section { margin-top: 30px; }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; overflow: hidden; }
        .faq-question { background: #f8fafc; padding: 15px 20px; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .faq-answer { padding: 15px 20px; display: none; background: white; color: #334155; line-height: 1.6; }
        .faq-answer.open { display: block; }
        .related-jobs { margin-top: 30px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .related-card { background: white; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; cursor: pointer; }
        .related-card:hover { border-color: #1e3c72; }
        .share-buttons { display: flex; gap: 10px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
        .share-btn { padding: 8px 15px; border-radius: 6px; color: white; text-decoration: none; font-weight: 600; font-size: 13px; }
        .share-wa { background: #25D366; } .share-tg { background: #0088cc; } .share-fb { background: #1877F2; }
        .site-footer { background: #1e3c72; color: white; padding: 30px 20px; border-radius: 12px; margin-top: 40px; text-align: center; }
        .site-footer h3 { font-size: 20px; margin-bottom: 12px; font-weight: 700; }
        .site-footer p { font-size: 13.5px; opacity: 0.85; line-height: 1.6; max-width: 900px; margin: 0 auto 15px auto; }
        .site-footer .footer-rights { font-size: 12px; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 15px; }
        @media (max-width: 600px) {
            .header h1 { font-size: 24px !important; word-wrap: break-word; }
            .page-header-title { font-size: 22px; } .page-header-subtitle { font-size: 15px; }
            .action-button-panel { grid-template-columns: 1fr; gap: 20px; }
            .tab-trigger { padding: 10px 12px; font-size: 13px; }
        }
    </style>`;
}

// ================== कॉमन हेडर ==================
function commonHeader(currentPage) {
  return `<div class="header">
        <h1>CONTENT4STUDENT (C4S)</h1>
        <p>Your Ultimate Hub for Govt Jobs, Daily Current Affairs & Free Study Material</p>
        <div class="social-buttons">
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="tg-btn">Join Telegram</a>
            <a href="https://youtube.com/@content4student" target="_blank" class="yt-btn">YouTube Channel</a>
            <a href="../index.html" class="job-btn">Latest Jobs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="ca-btn">Current Affairs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="sm-btn">Study Material</a>
        </div>
    </div>`;
}

// ================== कॉमन फ़ूटर ==================
function commonFooter() {
  return `<footer class="site-footer">
        <h3>About Content4Student (C4S)</h3>
        <p><strong>Content4Student (C4S)</strong> is a dedicated online portal built to support government job aspirants across India. We aim to distribute timely, clear, and highly organized <strong>Sarkari Naukri Updates</strong>, exhaustive exam structures, and verified recruitment guidelines. By supplying targeted <strong>Daily Current Affairs</strong> notes, competitive exam syllabi, and multi-disciplinary <strong>Free Study Material</strong>, we help students optimize their preparation tracking. Subscribe to our official Telegram group and YouTube channel to stay connected with expert strategies and regular informational feeds.</p>
        <div class="footer-rights">© 2026 Content4Student | Built for Academic Success & Reliable Job Tracking.</div>
    </footer>`;
}

// ================== SEO बॉक्स ==================
function seoBox() {
  return `<div class="filter-seo-box">
        <h2>Latest Govt Job Alerts & Daily Current Affairs Updates 2026</h2>
        <p>Welcome to <strong>Content4Student (C4S)</strong>, your trusted platform for instant <strong>Latest Govt Job Alerts</strong>, online recruitment details, and accurate Sarkari exam insights. We actively cover vacancy notifications from UPSC, SSC, Railways, Banking, and State Public Service Commissions. To ensure complete preparation, we also provide comprehensive <strong>Daily Current Affairs</strong> updates, interactive quiz resources, and free high-quality <strong>Study Material</strong> notes.</p>
    </div>`;
}
// ================== एक्सक्लूसिव डिटेल पेज ==================
function jobDetailPage(job, allJobs, index, topDept, topQual, topPos, allStates) {
  const deptSlug = slugify(job.department);
  const relatedJobs = allJobs.filter(j => j.department === job.department && j.title !== job.title).slice(0,4);
  
  const faqs = [
    { q: "What is the eligibility for this recruitment?", a: job.eligibility || "Please refer to the official notification for detailed eligibility criteria." },
    { q: "What is the last date to apply?", a: job.lastDate ? `The last date to apply is ${job.lastDate}.` : "Check the important dates section above." },
    { q: "What is the selection process?", a: job.selection || "The selection process typically involves written exam/interview." },
    { q: "Where can I download the official notification?", a: `You can download the official PDF <a href="${job.linkpdf}" target="_blank">here</a>.` }
  ];

  const faqHTML = faqs.map(faq => `
    <div class="faq-item">
      <div class="faq-question" onclick="this.nextElementSibling.classList.toggle('open')">
        ${faq.q} <span>▼</span>
      </div>
      <div class="faq-answer">${faq.a}</div>
    </div>`).join('');

  const relatedHTML = relatedJobs.map(rj => {
    const rjIdx = allJobs.indexOf(rj);
    return `<div class="related-card" onclick="location.href='${rjIdx}.html'">
      <strong>${esc(rj.title)}</strong><br>
      <small>${esc(rj.company)}</small>
    </div>`;
  }).join('');

  const shareURL = `https://ksaur5225-ui.github.io/content4student/jobs/${index}.html`;
  const shareText = encodeURIComponent(`${job.title} - Apply Now! ${shareURL}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(job.title)} - Content4Student | Govt Job 2026</title>
    <meta name="description" content="${esc(job.title)} recruitment by ${esc(job.company)}. Check eligibility, vacancy, selection process, important dates & apply online.">
    <meta name="keywords" content="${esc(job.title)}, ${esc(job.company)}, ${esc(job.department)}, ${esc(job.position)}, govt job 2026, sarkari naukri, content4student, C4S, latest jobs, free job alert, ${esc(job.state)} job">
    <meta name="robots" content="index, follow">
    ${commonCSS()}
</head>
<body>
<div class="container">
    ${commonHeader('detail')}
    
    <div class="breadcrumb">
      <a href="../index.html">Home</a> &raquo; 
      <a href="../department/${deptSlug}.html">${esc(job.department)}</a> &raquo; 
      ${esc(job.title)}
    </div>

    <div id="exclusivePageLayout">
        <a class="back-btn" href="../">← Back to Jobs Grid</a>
        <h2 class="page-header-title">${esc(job.title)}</h2>
        <div class="page-header-subtitle">${esc(job.company)} (${esc(job.department)})</div>
        
        <div class="job-highlights">
          ${job.salary ? `<div class="highlight-item"><strong>Salary</strong><span>${esc(job.salary)}</span></div>` : ''}
          ${job.totalPosts && job.totalPosts !== 'N/A' ? `<div class="highlight-item"><strong>Total Vacancy</strong><span>${esc(job.totalPosts)}</span></div>` : ''}
          ${job.appStartDate ? `<div class="highlight-item"><strong>Start Date</strong><span>${esc(job.appStartDate)}</span></div>` : ''}
          ${job.lastDate ? `<div class="highlight-item"><strong>Last Date</strong><span>${esc(job.lastDate)}</span></div>` : ''}
          ${job.fee ? `<div class="highlight-item"><strong>Application Fee</strong><span>${esc(job.fee)}</span></div>` : ''}
          ${job.ageLimit ? `<div class="highlight-item"><strong>Age Limit</strong><span>${esc(job.ageLimit)}</span></div>` : ''}
        </div>

        <div class="share-buttons">
          <a href="https://wa.me/?text=${shareText}" target="_blank" class="share-btn share-wa">📱 WhatsApp</a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(shareURL)}&text=${shareText}" target="_blank" class="share-btn share-tg">📢 Telegram</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}" target="_blank" class="share-btn share-fb">📘 Facebook</a>
        </div>

        <div class="info-dashboard-grid">
            <div class="dashboard-card"><span>Target Post</span><p>${esc(job.position)}</p></div>
            <div class="dashboard-card"><span>Minimum Eligibility</span><p>${esc(job.qualification)}</p></div>
            <div class="dashboard-card"><span>Job Location</span><p>${esc(job.state)}</p></div>
        </div>

        <div class="details-tabs-nav">
            <button class="tab-trigger active" onclick="switchTab('tabOverview', this)">Overview & Vacancies</button>
            <button class="tab-trigger" onclick="switchTab('tabEligibility', this)">Eligibility & Age</button>
            <button class="tab-trigger" onclick="switchTab('tabSelection', this)">Selection & Syllabus</button>
            <button class="tab-trigger" onclick="switchTab('tabLinks', this)">Important Links</button>
        </div>

        <div id="tabOverview" class="tab-content-block active">
            <div class="content-card-box"><div class="content-card-header">📋 Job Recruitment Overview</div><div class="content-card-body">${esc(job.overview)}</div></div>
            <div class="content-card-box"><div class="content-card-header">🔢 Total Vacancy Details</div><div class="content-card-body">${esc(job.vacancy)}</div></div>
        </div>
        <div id="tabEligibility" class="tab-content-block">
            <div class="content-card-box"><div class="content-card-header">🎓 Qualification & Criteria</div><div class="content-card-body">${esc(job.eligibility)}</div></div>
            <div class="content-card-box"><div class="content-card-header">⏳ Age Limit Specifications</div><div class="content-card-body">${esc(job.ageLimit)}</div></div>
        </div>
        <div id="tabSelection" class="tab-content-block">
            <div class="content-card-box"><div class="content-card-header">⚡ Selection Process Structure</div><div class="content-card-body">${esc(job.selection)}</div></div>
            <div class="content-card-box"><div class="content-card-header" style="background: #c62828;">📖 Exam Syllabus & Pattern</div><div class="content-card-body" style="background: #fffdfd;">${esc(job.syllabus)}</div></div>
            ${job.examPattern ? `<div class="content-card-box"><div class="content-card-header" style="background: #6a1b9a;">📝 Exam Pattern Details</div><div class="content-card-body">${esc(job.examPattern)}</div></div>` : ''}
        </div>
        <div id="tabLinks" class="tab-content-block">
            <div class="content-card-box"><div class="content-card-header">📅 Important Dates & Deadlines</div><div class="content-card-body">${esc(job.dates)}</div></div>
            <div class="content-card-box"><div class="content-card-header">🛠️ How to Fill Online Form</div><div class="content-card-body">${esc(job.howToApply)}</div></div>
        </div>

        <div class="action-button-panel">
            <div class="action-box" style="border-right: 1px solid #e2e8f0;"><div class="action-label">Apply Online Link</div><a href="${esc(job.link)}" target="_blank" class="action-link">Apply Now</a></div>
            <div class="action-box"><div class="action-label">Download Notification Document</div><a href="${esc(job.linkpdf)}" target="_blank" class="action-link pdf">Download PDF</a></div>
        </div>

        <div class="faq-section">
          <h3 style="font-size:20px; color:#1e3c72; margin-bottom:15px;">❓ Frequently Asked Questions</h3>
          ${faqHTML}
        </div>

        ${relatedHTML ? `<div style="margin-top:30px;"><h3 style="font-size:20px; color:#1e3c72; margin-bottom:15px;">🔗 Related ${esc(job.department)} Jobs</h3><div class="related-jobs">${relatedHTML}</div></div>` : ''}
    </div>

    ${seoBox()}
    ${categoryCards(topDept, topQual, topPos, allStates)}
    ${stateListHTML(allStates)}
    ${commonFooter()}
</div>
<script>
    function switchTab(id, btn) {
        document.querySelectorAll('.tab-content-block').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-trigger').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        btn.classList.add('active');
    }
</script>
</body>
</html>`;
}
// ================== कैटेगरी कार्ड (होमपेज और डिटेल पेज दोनों के लिए) ==================
function categoryCards(topDept, topQual, topPos, allStates) {
  const top10States = allStates.slice(0, 10);
  
  return `<div style="margin-top:30px;">
    <h2 style="font-size:22px; color:#1e3c72; text-align:center; margin-bottom:20px;">📂 Category Wise Jobs</h2>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:15px;">
      
      <div style="background:white; border-radius:10px; padding:20px; border:2px solid #e2e8f0; cursor:pointer;" onclick="location.href='../department/'">
        <h3 style="color:#1e3c72; margin-bottom:12px;">🏢 Top Departments</h3>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${topDept.map(d => `<a href="../department/${slugify(d)}.html" style="background:#e1f5fe; color:#0288d1; padding:5px 10px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600;">${esc(d)}</a>`).join('')}
        </div>
      </div>
      
      <div style="background:white; border-radius:10px; padding:20px; border:2px solid #e2e8f0; cursor:pointer;" onclick="location.href='../qualification/'">
        <h3 style="color:#1e3c72; margin-bottom:12px;">🎓 Top Qualifications</h3>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${topQual.map(q => `<a href="../qualification/${slugify(q)}.html" style="background:#fce4ec; color:#c62828; padding:5px 10px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600;">${esc(q)}</a>`).join('')}
        </div>
      </div>
      
      <div style="background:white; border-radius:10px; padding:20px; border:2px solid #e2e8f0; cursor:pointer;" onclick="location.href='../state/'">
        <h3 style="color:#1e3c72; margin-bottom:12px;">📍 Top States</h3>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${top10States.map(s => `<a href="../state/${slugify(s)}.html" style="background:#e8f5e9; color:#2e7d32; padding:5px 10px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600;">${esc(s)}</a>`).join('')}
        </div>
      </div>
      
      <div style="background:white; border-radius:10px; padding:20px; border:2px solid #e2e8f0; cursor:pointer;" onclick="location.href='../position/'">
        <h3 style="color:#1e3c72; margin-bottom:12px;">💼 Top Positions</h3>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${topPos.map(p => `<a href="../position/${slugify(p)}.html" style="background:#fff3e0; color:#ef6c00; padding:5px 10px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600;">${esc(p)}</a>`).join('')}
        </div>
      </div>
      
    </div>
  </div>`;
}
// ================== 28 राज्यों की लिस्ट ==================
function stateListHTML(allStates) {
  const stateLinks = allStates
    .filter(s => s && s !== 'All India')
    .map(s => `<a href="../state/${slugify(s)}.html" style="color:white; text-decoration:none; padding:4px 8px; display:inline-block;">${esc(s)}</a>`)
    .join(' | ');
  
  return `<div style="background:#1e3c72; border-radius:12px; padding:20px; margin-top:30px; text-align:center;">
    <h3 style="color:white; margin-bottom:12px;">📍 State Wise Govt Jobs</h3>
    <div style="font-size:13px; line-height:2; opacity:0.9;">${stateLinks}</div>
  </div>`;
}
// ================== होमपेज ==================
function homePage(jobs, results, admitCards, answerKeys, topDept, topQual, topPos, allStates) {
  const trendingJobs = jobs.filter(j => j.trending === 'Yes');
  const latestJobs = jobs.slice(0, 20);
  
  const jobCard = (job, idx) => {
    const realIdx = jobs.indexOf(job);
    return `<div class="job-card" onclick="location.href='jobs/${realIdx}.html'">
      <span class="card-tag">Active</span>
      <div class="job-title">${esc(job.title)}</div>
      <div class="job-company">${esc(job.company)} (${esc(job.department)})</div>
      <div class="job-meta"><strong>Qualification:</strong> ${esc(job.qualification)}</div>
      <div class="job-meta"><strong>Location:</strong> ${esc(job.state)}</div>
      ${job.lastDate ? `<div class="job-meta"><strong>Last Date:</strong> ${esc(job.lastDate)}</div>` : ''}
      <div class="view-btn">View Full Details →</div>
    </div>`;
  };

  const trendingHTML = trendingJobs.length ? `
    <div style="margin-bottom:25px;">
      <h2 style="color:#1e3c72; margin-bottom:12px;">🔥 Trending Govt Jobs</h2>
      <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:10px;">
        ${trendingJobs.map((j,i) => jobCard(j,i)).join('')}
      </div>
    </div>` : '';

  const otherTabs = `
    <div style="margin:25px 0;">
      <div style="display:flex; gap:8px; overflow-x:auto;">
        <button class="tab-trigger active" onclick="switchHomeTab('tabResults',this)">📋 Results (${results.length})</button>
        <button class="tab-trigger" onclick="switchHomeTab('tabAdmit',this)">🎫 Admit Cards (${admitCards.length})</button>
        <button class="tab-trigger" onclick="switchHomeTab('tabAnswer',this)">🔑 Answer Keys (${answerKeys.length})</button>
      </div>
      <div id="tabResults" class="home-tab active" style="margin-top:10px; display:grid; grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap:10px;">
        ${results.slice(0,6).map(r => jobCard(r)).join('')}
      </div>
      <div id="tabAdmit" class="home-tab" style="margin-top:10px; display:grid; grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap:10px; display:none;">
        ${admitCards.slice(0,6).map(a => jobCard(a)).join('')}
      </div>
      <div id="tabAnswer" class="home-tab" style="margin-top:10px; display:grid; grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap:10px; display:none;">
        ${answerKeys.slice(0,6).map(k => jobCard(k)).join('')}
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content4Student (C4S) | Latest Govt Jobs, Current Affairs & Study Material</title>
    <meta name="description" content="Welcome to Content4Student (C4S). Get real-time updates on Latest Govt Jobs, Daily Current Affairs Notes, and Premium Free Study Material for UPSC, SSC, Bank, Railway & State Exams.">
    <meta name="keywords" content="content4student, C4S, Sarkari Job, Current Affairs, Study Material, Free Job Alert, Latest Jobs 2026, Daily Current Affairs PDF, Sarkari Exam">
    <meta name="robots" content="index, follow">
    ${commonCSS()}
    <style>
      .job-card { background: white; border-radius: 10px; border-left: 5px solid #1e3c72; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); cursor: pointer; min-width: 280px; }
      .card-tag { position: absolute; top: 12px; right: 12px; background: #e1f5fe; color: #0288d1; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
      .job-title { font-size: 18px; color: #1e3c72; font-weight: bold; margin-bottom: 8px; padding-right: 45px; }
      .job-company { font-size: 13px; color: #666; font-weight: 600; margin-bottom: 12px; }
      .job-meta { font-size: 13px; margin-bottom: 6px; color: #555; }
      .view-btn { display: block; text-align: center; background: #1e3c72; color: white; text-decoration: none; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 15px; }
      .home-tab.active { display: grid !important; }
    </style>
</head>
<body>
<div class="container">
    ${commonHeader('home')}
    <div class="filter-seo-box">
        <h2>Latest Govt Job Alerts & Daily Current Affairs Updates 2026</h2>
        <p>Welcome to <strong>Content4Student (C4S)</strong>, your trusted platform for instant <strong>Latest Govt Job Alerts</strong>, online recruitment details, and accurate Sarkari exam insights. Use the category cards below to explore jobs by department, qualification, state, or position.</p>
    </div>
    ${trendingHTML}
    <h2 style="color:#1e3c72; margin-bottom:12px;">📌 Latest Job Alerts</h2>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
      ${latestJobs.map(j => jobCard(j)).join('')}
    </div>
    ${otherTabs}
    ${categoryCards(topDept, topQual, topPos, allStates)}
    ${stateListHTML(allStates)}
    ${commonFooter()}
</div>
<script>
    function switchHomeTab(tabId, btn) {
        document.querySelectorAll('.home-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-trigger').forEach(el => el.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        btn.classList.add('active');
    }
</script>
</body>
</html>`;
}
// ================== कैटेगरी पेज (डिपार्टमेंट, क्वालिफिकेशन, स्टेट, पोज़िशन) ==================
function categoryPage(categoryName, items, categoryType, allJobs) {
  const typeLabel = { department: 'Department', qualification: 'Qualification', state: 'State', position: 'Position' }[categoryType] || '';
  const cardHTML = items.map((j, i) => {
    const realIdx = allJobs.indexOf(j);
    return `<div class="job-card" onclick="location.href='../jobs/${realIdx}.html'">
      <span class="card-tag">${esc(j.postType)}</span>
      <div class="job-title">${esc(j.title)}</div>
      <div class="job-company">${esc(j.company)} (${esc(j.department)})</div>
      <div class="job-meta"><strong>Qualification:</strong> ${esc(j.qualification)}</div>
      <div class="job-meta"><strong>Location:</strong> ${esc(j.state)}</div>
      ${j.lastDate ? `<div class="job-meta"><strong>Last Date:</strong> ${esc(j.lastDate)}</div>` : ''}
      <div class="view-btn">View Full Details →</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(categoryName)} ${typeLabel} Jobs 2026 - Content4Student</title>
    <meta name="description" content="Latest ${esc(categoryName)} ${typeLabel} Govt Jobs 2026. Find all upcoming and current vacancies, results, admit cards for ${esc(categoryName)} on Content4Student.">
    <meta name="robots" content="index, follow">
    ${commonCSS()}
    <style>
      .job-card { background: white; border-radius: 10px; border-left: 5px solid #1e3c72; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); cursor: pointer; margin-bottom: 15px; position: relative; }
      .card-tag { position: absolute; top: 12px; right: 12px; background: #e1f5fe; color: #0288d1; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
      .job-title { font-size: 18px; color: #1e3c72; font-weight: bold; margin-bottom: 8px; padding-right: 45px; }
      .job-company { font-size: 13px; color: #666; font-weight: 600; margin-bottom: 12px; }
      .job-meta { font-size: 13px; margin-bottom: 6px; color: #555; }
      .view-btn { display: block; text-align: center; background: #1e3c72; color: white; text-decoration: none; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 15px; }
    </style>
</head>
<body>
<div class="container">
    ${commonHeader('category')}
    <div class="breadcrumb">
      <a href="../index.html">Home</a> &raquo; ${esc(categoryName)} ${typeLabel}
    </div>
    <h2 style="color:#1e3c72; margin-bottom:15px;">📂 ${esc(categoryName)} ${typeLabel} Govt Jobs 2026</h2>
    ${seoBox()}
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
      ${cardHTML || '<p>No active jobs found in this category.</p>'}
    </div>
    ${commonFooter()}
</div>
</body>
</html>`;
}

// ================== अंतिम जेनरेट फ़ंक्शन ==================
async function generate() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const allData = parseCSV(text);

  // फोल्डर बनाएँ
  [OUT_DIR, JOBS_DIR, DEPT_DIR, QUAL_DIR, STATE_DIR, POS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // अलग-अलग टाइप
  const jobs = allData.filter(j => j.postType.toLowerCase() === 'job');
  const results = allData.filter(j => j.postType.toLowerCase() === 'result');
  const admitCards = allData.filter(j => j.postType.toLowerCase() === 'admit card');
  const answerKeys = allData.filter(j => j.postType.toLowerCase() === 'answer key');

  // टॉप कैटेगरी
  const getTop = (arr, key) => {
    const count = {};
    arr.forEach(item => { if (item[key]) { const val = item[key].trim(); if (val) count[val] = (count[val] || 0) + 1; } });
    return Object.entries(count).sort((a,b) => b[1]-a[1]).slice(0,10).map(e => e[0]);
  };
  const topDept = getTop(jobs, 'department');
  const topQual = getTop(jobs, 'qualification');
  const topPos = getTop(jobs, 'position');
  const allStates = [...new Set(jobs.map(j => j.state).filter(s => s && s !== 'All India'))].sort();

  // === जॉब डिटेल पेज ===
  jobs.forEach((job, idx) => {
    const html = jobDetailPage(job, jobs, idx, topDept, topQual, topPos, allStates);
    fs.writeFileSync(path.join(JOBS_DIR, `${idx}.html`), html);
  });

  // === होमपेज ===
  const indexHtml = homePage(jobs, results, admitCards, answerKeys, topDept, topQual, topPos, allStates);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);

  // === कैटेगरी पेज (डिपार्टमेंट) ===
  const deptGroups = {};
  jobs.forEach(j => { if (j.department) { const d = j.department.trim(); if (!deptGroups[d]) deptGroups[d] = []; deptGroups[d].push(j); } });
  Object.entries(deptGroups).forEach(([dept, items]) => {
    const slug = slugify(dept);
    const html = categoryPage(dept, items, 'department', jobs);
    fs.writeFileSync(path.join(DEPT_DIR, `${slug}.html`), html);
  });

  // === कैटेगरी पेज (क्वालिफिकेशन) ===
  const qualGroups = {};
  jobs.forEach(j => { if (j.qualification) { const q = j.qualification.trim(); if (!qualGroups[q]) qualGroups[q] = []; qualGroups[q].push(j); } });
  Object.entries(qualGroups).forEach(([qual, items]) => {
    const slug = slugify(qual);
    const html = categoryPage(qual, items, 'qualification', jobs);
    fs.writeFileSync(path.join(QUAL_DIR, `${slug}.html`), html);
  });

  // === कैटेगरी पेज (स्टेट) ===
  const stateGroups = {};
  jobs.forEach(j => { if (j.state) { const s = j.state.trim(); if (!stateGroups[s]) stateGroups[s] = []; stateGroups[s].push(j); } });
  Object.entries(stateGroups).forEach(([state, items]) => {
    const slug = slugify(state);
    const html = categoryPage(state, items, 'state', jobs);
    fs.writeFileSync(path.join(STATE_DIR, `${slug}.html`), html);
  });

  // === कैटेगरी पेज (पोज़िशन) ===
  const posGroups = {};
  jobs.forEach(j => { if (j.position) { const p = j.position.trim(); if (!posGroups[p]) posGroups[p] = []; posGroups[p].push(j); } });
  Object.entries(posGroups).forEach(([pos, items]) => {
    const slug = slugify(pos);
    const html = categoryPage(pos, items, 'position', jobs);
    fs.writeFileSync(path.join(POS_DIR, `${slug}.html`), html);
  });

  console.log(`✅ Done! Generated ${jobs.length} jobs, homepage, and category pages.`);
}

generate();

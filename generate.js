const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 👉 अपनी Google Sheets की CSV URL यहाँ डालें (अभी वही है जो आपने शुरू में दी थी)
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQEOkfqthC4cdgJAm0mTOJfxCH4UuzIPHr1KMZDBNF0LUkrAJtfdhgzCEu0iNZTLhYmIvOIeRM1z5RZ/pub?gid=682596104&single=true&output=csv";

const OUT_DIR = path.join(__dirname, 'public');
const JOBS_DIR = path.join(OUT_DIR, 'jobs');

// CSV पार्सर (बिना किसी बदलाव के)
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
        overview: (m[14] || "Check official PDF notification for generic overview.").replace(/^"|"$/g, "").trim(),
        vacancy: (m[15] || "Refer to notification details.").replace(/^"|"$/g, "").trim(),
        selection: (m[16] || "Written Exam / Interview").replace(/^"|"$/g, "").trim(),
        dates: (m[17] || "Check document deadlines").replace(/^"|"$/g, "").trim(),
        eligibility: (m[18] || "As per guidelines").replace(/^"|"$/g, "").trim(),
        ageLimit: (m[19] || "Refer to official norms").replace(/^"|"$/g, "").trim(),
        howToApply: (m[22] || "Apply online through the official link given above.").replace(/^"|"$/g, "").trim(),
        syllabus: (m[23] || "Syllabus not explicitly specified in brief sheet.").replace(/^"|"$/g, "").trim()
      });
    }
  }
  return output;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ========== JOB DETAIL PAGE (Header, Footer, SEO Box सहित) ==========
function jobDetailPage(job) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(job.title)} - Content4Student | Govt Job 2026</title>
    <meta name="description" content="${esc(job.title)} recruitment by ${esc(job.company)}. Check eligibility, vacancy, selection process, important dates & apply online. Latest Sarkari Job on Content4Student (C4S).">
    <meta name="keywords" content="${esc(job.title)}, ${esc(job.company)}, ${esc(job.department)}, ${esc(job.position)}, govt job 2026, sarkari naukri, content4student, C4S, latest jobs, free job alert, ${esc(job.state)} job">
    <meta name="robots" content="index, follow">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f0f2f5; color: #333; padding: 15px; }
        .container { max-width: 1100px; margin: 0 auto; }
        /* Header */
        .header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 30px 20px; text-align: center; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .header h1 { font-size: 34px; font-weight: 800; margin-bottom: 5px; letter-spacing: 1px; }
        .header p { font-size: 15px; opacity: 0.9; margin-bottom: 15px; }
        .social-buttons { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .social-buttons a { text-decoration: none; color: white; padding: 8px 15px; font-size: 13px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
        .tg-btn { background: #0088cc; } .yt-btn { background: #ff0000; } .job-btn { background: #2e7d32; } .ca-btn { background: #ef6c00; } .sm-btn { background: #6a1b9a; }
        /* SEO box */
        .filter-seo-box { background: white; border-left: 5px solid #ef6c00; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .filter-seo-box h2 { font-size: 18px; color: #1e3c72; margin-bottom: 8px; font-weight: 700; }
        .filter-seo-box p { font-size: 14px; color: #555; line-height: 1.6; }
        /* Detail layout */
        #exclusivePageLayout { background: white; border-radius: 16px; padding: 30px 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin-top: 10px; border: 1px solid #eef2f5; }
        .back-btn { display: inline-flex; align-items: center; background: #f4f6f9; color: #222; padding: 11px 20px; font-weight: 700; text-decoration: none; font-size: 14px; margin-bottom: 25px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s ease; }
        .back-btn:hover { background: #e2e8f0; transform: translateX(-3px); }
        .page-header-title { font-size: 28px; color: #1e3c72; font-weight: 800; text-align: center; margin-bottom: 8px; line-height: 1.3; }
        .page-header-subtitle { text-align: center; font-size: 18px; color: #0288d1; font-weight: 700; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .dashboard-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center; }
        .dashboard-card span { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; }
        .dashboard-card p { font-size: 15px; color: #0f172a; font-weight: 700; }
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
        /* Footer */
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
    </style>
</head>
<body>
<div class="container">
    <!-- HEADER -->
    <div class="header">
        <h1>CONTENT4STUDENT (C4S)</h1>
        <p>Your Ultimate Hub for Govt Jobs, Daily Current Affairs & Free Study Material</p>
        <div class="social-buttons">
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="tg-btn">Join Telegram</a>
            <a href="https://youtube.com/@content4student" target="_blank" class="yt-btn">YouTube Channel</a>
            <a href="../index.html" class="job-btn">Latest Jobs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="ca-btn">Current Affairs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="sm-btn">Study Material</a>
        </div>
    </div>

    <!-- JOB DETAILS -->
    <div id="exclusivePageLayout">
        <a class="back-btn" href="../">← Back to Jobs Grid</a>
        <h2 class="page-header-title">${esc(job.title)}</h2>
        <div class="page-header-subtitle">${esc(job.company)} (${esc(job.department)})</div>
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
        </div>
        <div id="tabLinks" class="tab-content-block">
            <div class="content-card-box"><div class="content-card-header">📅 Important Dates & Deadlines</div><div class="content-card-body">${esc(job.dates)}</div></div>
            <div class="content-card-box"><div class="content-card-header">🛠️ How to Fill Online Form</div><div class="content-card-body">${esc(job.howToApply)}</div></div>
        </div>
        <div class="action-button-panel">
            <div class="action-box" style="border-right: 1px solid #e2e8f0;"><div class="action-label">Apply Online Link</div><a href="${esc(job.link)}" target="_blank" class="action-link">Apply Now</a></div>
            <div class="action-box"><div class="action-label">Download Notification Document</div><a href="${esc(job.linkpdf)}" target="_blank" class="action-link pdf">Download PDF</a></div>
        </div>
    </div>

    <!-- SEO CONTENT -->
    <div class="filter-seo-box">
        <h2>Latest Govt Job Alerts & Daily Current Affairs Updates 2026</h2>
        <p>Welcome to <strong>Content4Student (C4S)</strong>, your trusted platform for instant <strong>Latest Govt Job Alerts</strong>, online recruitment details, and accurate Sarkari exam insights. We actively cover vacancy notifications from UPSC, SSC, Railways, Banking, and State Public Service Commissions. To ensure complete preparation, we also provide comprehensive <strong>Daily Current Affairs</strong> updates, interactive quiz resources, and free high-quality <strong>Study Material</strong> notes. Check the detailed eligibility, selection process, and important dates for this specific recruitment above. For more jobs and study material, visit our homepage or join our Telegram channel.</p>
    </div>

    <!-- FOOTER -->
    <footer class="site-footer">
        <h3>About Content4Student (C4S)</h3>
        <p><strong>Content4Student (C4S)</strong> is a dedicated online portal built to support government job aspirants across India. We aim to distribute timely, clear, and highly organized <strong>Sarkari Naukri Updates</strong>, exhaustive exam structures, and verified recruitment guidelines. By supplying targeted <strong>Daily Current Affairs</strong> notes, competitive exam syllabi, and multi-disciplinary <strong>Free Study Material</strong>, we help students optimize their preparation tracking. Subscribe to our official Telegram group and YouTube channel to stay connected with expert strategies and regular informational feeds.</p>
        <div class="footer-rights">© 2026 Content4Student | Built for Academic Success & Reliable Job Tracking.</div>
    </footer>
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

// ========== HOMEPAGE (Header, Filters, Cards, Footer सहित) ==========
function homePage(jobs) {
  let cards = jobs.map((job, idx) => `
    <div class="job-card" onclick="location.href='jobs/${idx}.html'">
        <span class="card-tag">Active</span>
        <div>
            <div class="job-title">${esc(job.title)}</div>
            <div class="job-company">${esc(job.company)} (${esc(job.department)})</div>
            <div class="job-meta"><strong>Qualification:</strong> ${esc(job.qualification)}</div>
            <div class="job-meta"><strong>Location:</strong> ${esc(job.state)}</div>
        </div>
        <div class="view-btn">View Full Details →</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content4Student (C4S) | Latest Govt Jobs, Current Affairs & Study Material</title>
    <meta name="description" content="Welcome to Content4Student (C4S). Get real-time updates on Latest Govt Jobs, Daily Current Affairs Notes, and Premium Free Study Material for UPSC, SSC, Bank, Railway & State Exams.">
    <meta name="keywords" content="content4student, C4S, Sarkari Job, Current Affairs, Study Material, Free Job Alert, Latest Jobs 2026, Daily Current Affairs PDF, Sarkari Exam">
    <meta name="robots" content="index, follow">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f0f2f5; color: #333; padding: 15px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 30px 20px; text-align: center; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .header h1 { font-size: 34px; font-weight: 800; margin-bottom: 5px; letter-spacing: 1px; }
        .header p { font-size: 15px; opacity: 0.9; margin-bottom: 15px; }
        .social-buttons { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .social-buttons a { text-decoration: none; color: white; padding: 8px 15px; font-size: 13px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
        .tg-btn { background: #0088cc; } .yt-btn { background: #ff0000; } .job-btn { background: #2e7d32; } .ca-btn { background: #ef6c00; } .sm-btn { background: #6a1b9a; }
        .filter-section { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .filter-select { flex: 1; min-width: 220px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; outline: none; background-color: #fafafa; font-weight: 500; color: #444; }
        .filter-seo-box { background: white; border-left: 5px solid #ef6c00; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .filter-seo-box h2 { font-size: 18px; color: #1e3c72; margin-bottom: 8px; font-weight: 700; }
        .filter-seo-box p { font-size: 14px; color: #555; line-height: 1.6; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .job-card { background: white; border-radius: 10px; border-left: 5px solid #1e3c72; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; }
        .card-tag { position: absolute; top: 12px; right: 12px; background: #e1f5fe; color: #0288d1; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
        .job-title { font-size: 18px; color: #1e3c72; font-weight: bold; margin-bottom: 8px; padding-right: 45px; }
        .job-company { font-size: 13px; color: #666; font-weight: 600; margin-bottom: 12px; }
        .job-meta { font-size: 13px; margin-bottom: 6px; color: #555; }
        .job-meta strong { color: #222; }
        .view-btn { display: block; text-align: center; background: #1e3c72; color: white; text-decoration: none; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 15px; }
        .site-footer { background: #1e3c72; color: white; padding: 30px 20px; border-radius: 12px; margin-top: 40px; text-align: center; }
        .site-footer h3 { font-size: 20px; margin-bottom: 12px; font-weight: 700; }
        .site-footer p { font-size: 13.5px; opacity: 0.85; line-height: 1.6; max-width: 900px; margin: 0 auto 15px auto; }
        .site-footer .footer-rights { font-size: 12px; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 15px; }
        @media (max-width: 600px) {
            .header h1 { font-size: 24px !important; word-wrap: break-word; }
            .filter-select { font-size: 14px !important; padding: 12px !important; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>CONTENT4STUDENT (C4S)</h1>
        <p>Your Ultimate Hub for Govt Jobs, Daily Current Affairs & Free Study Material</p>
        <div class="social-buttons">
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="tg-btn">Join Telegram</a>
            <a href="https://youtube.com/@content4student" target="_blank" class="yt-btn">YouTube Channel</a>
            <a href="#" class="job-btn">Latest Jobs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="ca-btn">Current Affairs</a>
            <a href="https://t.me/dailycurrentaffairnotesbyGaurav" target="_blank" class="sm-btn">Study Material</a>
        </div>
    </div>
    <div class="filter-section">
        <select id="filterDept" class="filter-select"><option value="">All Department</option></select>
        <select id="filterPosition" class="filter-select"><option value="">All Position</option></select>
        <select id="filterQual" class="filter-select"><option value="">All Qualification</option></select>
        <select id="filterState" class="filter-select"><option value="">All India / State</option></select>
    </div>
    <div class="filter-seo-box">
        <h2>Latest Govt Job Alerts & Daily Current Affairs Updates 2026</h2>
        <p>Welcome to <strong>Content4Student (C4S)</strong>, your trusted platform for instant <strong>Latest Govt Job Alerts</strong>, online recruitment details, and accurate Sarkari exam insights. We actively cover vacancy notifications from UPSC, SSC, Railways, Banking, and State Public Service Commissions. To ensure complete preparation, we also provide comprehensive <strong>Daily Current Affairs</strong> updates, interactive quiz resources, and free high-quality <strong>Study Material</strong> notes. Refine your search using the dynamic filters above to access premium educational materials and targeted job announcements instantly.</p>
    </div>
    <div class="jobs-grid" id="cardsContainer">${cards}</div>
    <footer class="site-footer">
        <h3>About Content4Student (C4S)</h3>
        <p><strong>Content4Student (C4S)</strong> is a dedicated online portal built to support government job aspirants across India. We aim to distribute timely, clear, and highly organized <strong>Sarkari Naukri Updates</strong>, exhaustive exam structures, and verified recruitment guidelines. By supplying targeted <strong>Daily Current Affairs</strong> notes, competitive exam syllabi, and multi-disciplinary <strong>Free Study Material</strong>, we help students optimize their preparation tracking. Subscribe to our official Telegram group and YouTube channel to stay connected with expert strategies and regular informational feeds.</p>
        <div class="footer-rights">© 2026 Content4Student | Built for Academic Success & Reliable Job Tracking.</div>
    </footer>
</div>
<script>
    const masterJobsData = ${JSON.stringify(jobs)};
    function populateFilters() {
        const depts = [...new Set(masterJobsData.map(j => j.department))].sort();
        const positions = [...new Set(masterJobsData.map(j => j.position))].sort();
        const quals = [...new Set(masterJobsData.map(j => j.qualification))].sort();
        const states = [...new Set(masterJobsData.map(j => j.state))].sort();
        const fill = (id, arr) => {
            let s = document.getElementById(id);
            arr.forEach(v => { if(v) s.insertAdjacentHTML('beforeend', '<option value="'+v+'">'+v+'</option>'); });
        };
        fill('filterDept', depts);
        fill('filterPosition', positions);
        fill('filterQual', quals);
        fill('filterState', states);
    }
    function applyFilters() {
        let dept = document.getElementById('filterDept').value;
        let pos = document.getElementById('filterPosition').value;
        let qual = document.getElementById('filterQual').value;
        let state = document.getElementById('filterState').value;
        let filtered = masterJobsData.filter(j => 
            (!dept || j.department===dept) && (!pos || j.position===pos) && (!qual || j.qualification===qual) && (!state || j.state===state)
        );
        let container = document.getElementById('cardsContainer');
        container.innerHTML = filtered.map((job, idx) => {
            let realIdx = masterJobsData.indexOf(job);
            return '<div class="job-card" onclick="location.href=\\'jobs/'+realIdx+'.html\\'"><span class="card-tag">Active</span><div><div class="job-title">'+job.title+'</div><div class="job-company">'+job.company+' ('+job.department+')</div><div class="job-meta"><strong>Qualification:</strong> '+job.qualification+'</div><div class="job-meta"><strong>Location:</strong> '+job.state+'</div></div><div class="view-btn">View Full Details →</div></div>';
        }).join('');
    }
    document.getElementById('filterDept').addEventListener('change', applyFilters);
    document.getElementById('filterPosition').addEventListener('change', applyFilters);
    document.getElementById('filterQual').addEventListener('change', applyFilters);
    document.getElementById('filterState').addEventListener('change', applyFilters);
    populateFilters();
</script>
</body>
</html>`;
}

// ========== MAIN GENERATE FUNCTION ==========
async function generate() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const jobs = parseCSV(text);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR);

  jobs.forEach((job, idx) => {
    const html = jobDetailPage(job);
    fs.writeFileSync(path.join(JOBS_DIR, `${idx}.html`), html);
  });

  const indexHtml = homePage(jobs);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);

  console.log(`Generated ${jobs.length} jobs. Done!`);
}

generate();

/* =========================================================
   DATA LAYER
   ========================================================= */
const DB_KEY = 'unigig_db_v1';
const THEME_KEY = 'unigig_theme';
const SESSION_KEY = 'unigig_session';

const CATEGORIES = ['Computer Science','Mathematics','Science','Writing','Business','Languages'];
const CATEGORY_GRADIENTS = {
  'Computer Science':['#0ea5e9','#38bdf8'], Mathematics:['#14b8a6','#0d9488'], Science:['#3b82f6','#06b6d4'], Writing:['#f59e0b','#fbbf24'],
  Business:['#8b5cf6','#6366f1'], Languages:['#ec4899','#f43f5e'],
};
const AVATAR_COLORS = ['#8b5cf6','#ec4899','#3b82f6','#fb923c','#10b981','#fbbf24','#06b6d4','#f43f5e','#6366f1'];

const SEED_USERS = [
  { id:'u_aarav', name:'Aarav Mehta',  role:'creator', verified:true,  tagline:'CS Major · Tutoring DSA & Web Dev', completed:47, responseHrs:1.5, onTimePct:98 },
  { id:'u_priya', name:'Priya Sharma', role:'client',  verified:true,  tagline:'Freshman, struggling with Calculus' },
  { id:'u_rohan', name:'Rohan Iyer',   role:'client',  verified:false, tagline:'Business Major' },
  { id:'u_neha',  name:'Neha Kapoor',  role:'creator', verified:true,  tagline:'Math & Physics Tutor', completed:31, responseHrs:2.5, onTimePct:96 },
];

const SEED_GIGS = [
  { id:'g1', creatorId:'u_aarav', title:'I will tutor you in Data Structures & Algorithms', category:'Computer Science', rate:500, description:'Clear, step-by-step explanations for assignments and midterms. Includes practice problems.', createdAt: Date.now()-1000*60*60*2, hasVideo:true },
  { id:'g2', creatorId:'u_neha',  title:'I will help you ace Calculus 1 and 2',   category:'Mathematics', rate:400, description:'We will go through past papers, limits, derivatives, and integrals together.', createdAt: Date.now()-1000*60*60*8, hasVideo:false },
  { id:'g3', creatorId:'u_aarav', title:'I will build a responsive HTML/CSS project with you', category:'Computer Science', rate:600, description:'Learn by doing. I will guide you in building a landing page or portfolio.', createdAt: Date.now()-1000*60*60*20, hasVideo:false },
  { id:'g4', creatorId:'u_neha',  title:'I will proofread and edit your English essays', category:'Writing', rate:250, description:'Grammar check, flow improvement, and structural feedback to get you an A.', createdAt: Date.now()-1000*60*60*40, hasVideo:true },
  { id:'g5', creatorId:'u_aarav', title:'I will teach you the basics of Financial Accounting', category:'Business', rate:450, description:'Debits, credits, balance sheets, and income statements made simple.', createdAt: Date.now()-1000*60*60*60, hasVideo:false },
  { id:'g6', creatorId:'u_neha',  title:'Conversational Spanish practice partner', category:'Languages', rate:300, description:'Let us chat in Spanish to improve your fluency. Beginners welcome!', createdAt: Date.now()-1000*60*60*90, hasVideo:false },
];

const SEED_REVIEWS = [
  { id:'r1', gigId:'g1', reviewerId:'u_priya', rating:5, text:'Aarav explained recursion so well! I finally passed my midterm.', createdAt: Date.now()-1000*60*60*24*3, verified:true },
  { id:'r2', gigId:'g1', reviewerId:'u_rohan', rating:5, text:'Super patient and knew his stuff. Highly recommend.', createdAt: Date.now()-1000*60*60*24*8, verified:true },
  { id:'r3', gigId:'g2', reviewerId:'u_priya', rating:4, text:'Great help with Calculus, took a day to reply initially but the session was great.', createdAt: Date.now()-1000*60*60*24*5, verified:true },
];

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) { try { return JSON.parse(raw); } catch(e){} }
  const fresh = { users: SEED_USERS, gigs: SEED_GIGS, bookings: [], reviews: SEED_REVIEWS, messages: {}, activities: [] };
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
function uid(p) { return p + '_' + Math.random().toString(36).slice(2, 9); }

let DB = loadDB();
if (!DB.messages) DB.messages = {};
if (!DB.reviews) DB.reviews = [];
if (!DB.activities) DB.activities = [];

let CURRENT_USER_ID = sessionStorage.getItem(SESSION_KEY) || DB.users.find(u => u.role === 'creator').id;

/* HELPERS */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const userById = id => DB.users.find(u => u.id === id);
const gigById = id => DB.gigs.find(g => g.id === id);
const fmtMoney = n => '₹' + Number(n).toLocaleString('en-IN');

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  if (s < 604800) return Math.floor(s/86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}
function escapeHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function initials(name) { return String(name || '?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function colorFor(id) { let h=0; for (const c of String(id)) h = (h*31 + c.charCodeAt(0)) >>> 0; return AVATAR_COLORS[h % AVATAR_COLORS.length]; }
function avatarHTML(user, size='') {
  if (!user) return `<div class="avatar ${size}" style="background:#444;">?</div>`;
  const v = user.verified ? `<span class="verified-dot">✓</span>` : '';
  return `<div class="avatar ${size}" style="background:${colorFor(user.id)};">${initials(user.name)}${v}</div>`;
}

function gigStats(gigId) {
  const rs = DB.reviews.filter(r => r.gigId === gigId);
  if (!rs.length) return { avg: 0, count: 0 };
  const avg = rs.reduce((s,r) => s + r.rating, 0) / rs.length;
  return { avg: Math.round(avg*10)/10, count: rs.length };
}

/* =========================================================
   MISSING UI & ANIMATION LOGIC (RESTORED)
   ========================================================= */

// 1. RENDER THE CARDS
function renderGigs(filterCat = 'All', searchQuery = '') {
  const grid = $('#gigGrid');
  if (!grid) return;
  
  let filtered = DB.gigs;
  
  if (filterCat !== 'All') {
    filtered = filtered.filter(g => g.category === filterCat);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(g => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
  }

  grid.innerHTML = filtered.map(gig => {
    const creator = userById(gig.creatorId);
    const stats = gigStats(gig.id);
    const gradient = CATEGORY_GRADIENTS[gig.category] || ['#0ea5e9', '#38bdf8'];
    const catInitials = gig.category.substring(0, 2).toUpperCase();
    
    // Star rendering
    let starsHtml = '';
    if (stats.count > 0) {
      starsHtml = `<div class="gig-rating"><span class="stars">${'★'.repeat(Math.round(stats.avg))}${'☆'.repeat(5 - Math.round(stats.avg))}</span> <span class="num">${stats.avg}</span> <span class="count">(${stats.count})</span></div>`;
    } else {
      starsHtml = `<div class="gig-rating"><span class="count">New</span></div>`;
    }

    return `
      <div class="gig-card" data-parallax="in" onclick="openBookingModal('${gig.id}')">
        <div class="gig-cover" style="background: linear-gradient(135deg, ${gradient[0]}, ${gradient[1]});">
          <div class="cover-cat">${catInitials}</div>
          <div class="badges">
            ${creator.verified ? '<span class="badge verified">Verified</span>' : ''}
            ${gig.hasVideo ? `<span class="badge hot">Intro</span>` : ''}
          </div>
        </div>
        <div class="gig-body">
          <div class="gig-cat">${gig.category}</div>
          <h3>${escapeHtml(gig.title)}</h3>
          <div class="desc">${escapeHtml(gig.description)}</div>
          ${starsHtml}
          <div class="gig-creator">
            ${avatarHTML(creator)}
            <div class="meta">
              <div class="name">${escapeHtml(creator.name)} ${creator.verified ? '✓' : ''}</div>
              <div class="time">Responds in ~${creator.responseHrs || 1}h</div>
            </div>
          </div>
        </div>
        <div class="gig-footer">
          <div class="price">
            <div class="amt">${fmtMoney(gig.rate)}</div>
            <div class="per">Per Hour</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openBookingModal('${gig.id}')">Book</button>
        </div>
      </div>
    `;
  }).join('');

  // Re-initialize 3D Tilt for the new cards
  init3DTilt();
}

// 2. 3D TILT ANIMATION
function init3DTilt() {
  const cards = document.querySelectorAll('.gig-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; 
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.setProperty('--rx', `${rotateX}deg`);
      card.style.setProperty('--ry', `${rotateY}deg`);
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.classList.add('tilting');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// 3. CUSTOM CURSOR LOGIC
function initCustomCursor() {
  const layer = $('#cursorLayer');
  const dot = $('#cursorDot');
  const halo = $('#cursorHalo');
  const label = $('#cursorLabel');
  if (!layer) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let haloX = mouseX;
  let haloY = mouseY;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    layer.classList.add('active');
    
    // Move dot instantly
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    
    // Check for hover targets
    const target = e.target;
    if (target.closest('button, a, input, select, textarea')) {
      layer.classList.add('hover-interactive');
    } else if (target.closest('.gig-card')) {
      layer.classList.add('hover-card');
    } else {
      layer.classList.remove('hover-interactive', 'hover-card');
    }
  });

  // Smooth follow for halo
  function animateHalo() {
    haloX += (mouseX - haloX) * 0.15;
    haloY += (mouseY - haloY) * 0.15;
    halo.style.transform = `translate(${haloX}px, ${haloY}px)`;
    requestAnimationFrame(animateHalo);
  }
  animateHalo();

  // Click ripples
  window.addEventListener('click', e => {
    const rippleLayer = $('#clickRippleLayer');
    const r1 = document.createElement('div');
    r1.className = 'click-ripple';
    r1.style.left = e.clientX + 'px';
    r1.style.top = e.clientY + 'px';
    rippleLayer.appendChild(r1);
    
    const r2 = document.createElement('div');
    r2.className = 'click-ripple secondary';
    r2.style.left = e.clientX + 'px';
    r2.style.top = e.clientY + 'px';
    rippleLayer.appendChild(r2);

    setTimeout(() => { r1.remove(); r2.remove(); }, 800);
  });
}

// 4. INITIALIZE EVERYTHING ON LOAD
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  renderGigs(); // Renders the cards!
  
  // Render Category Chips
  const chipsContainer = $('#categoryChips');
  if (chipsContainer) {
    chipsContainer.innerHTML = `
      <button class="chip active" onclick="filterCategory(this, 'All')">All</button>
      ${CATEGORIES.map(c => `<button class="chip" onclick="filterCategory(this, '${c}')">${c}</button>`).join('')}
    `;
  }

  // Render User Dropdown
  const userSelect = $('#userSelect');
  if (userSelect) {
    userSelect.innerHTML = DB.users.map(u => `<option value="${u.id}" ${u.id === CURRENT_USER_ID ? 'selected' : ''}>${u.name}</option>`).join('');
  }
});

// Helper for Category clicking
function filterCategory(btn, cat) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderGigs(cat);
}

// Placeholder for booking modal so the "Book" button doesn't throw an error
function openBookingModal(gigId) {
  const modal = $('#bookingModal');
  if (modal) {
    modal.classList.add('open');
    // You can add the logic to populate the modal summary here if you have it
  }
}
  /* =========================================================
   NAVIGATION & UI CONTROLS (RESTORED)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. TAB SWITCHING LOGIC
  const tabs = document.querySelectorAll('nav.tabs button');
  const mobileTabs = document.querySelectorAll('.mobile-nav button');
  const views = document.querySelectorAll('.view');

  function switchView(viewId) {
    // Hide all views
    views.forEach(v => v.classList.remove('active'));
    // Show target view
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');

    // Update active state on desktop tabs
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
    // Update active state on mobile tabs
    mobileTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  mobileTabs.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 2. BRAND LOGO CLICK (Goes to Marketplace)
  const brandHome = document.getElementById('brandHome');
  if (brandHome) {
    brandHome.addEventListener('click', () => switchView('marketplace'));
  }

  // 3. THEME TOGGLE (Light/Dark Mode)
  const themeToggle = document.getElementById('themeToggle');
  themeToggle?.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  });

  // Load saved theme on page load
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // 4. USER SWITCHER (Acting as)
  const userSelect = document.getElementById('userSelect');
  if (userSelect) {
    userSelect.addEventListener('change', (e) => {
      CURRENT_USER_ID = e.target.value;
      sessionStorage.setItem(SESSION_KEY, CURRENT_USER_ID);
      
      // Optional: Add a toast notification to show the switch
      const toast = document.getElementById('toast');
      const toastText = document.getElementById('toastText');
      if (toast && toastText) {
        toastText.textContent = `Switched to ${userById(CURRENT_USER_ID).name}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }
    });
  }

  // 5. COMMAND PALETTE (Search Icon)
  const paletteBtn = document.getElementById('paletteBtn');
  const paletteBackdrop = document.getElementById('paletteBackdrop');
  const paletteInput = document.getElementById('paletteInput');
  
  if (paletteBtn && paletteBackdrop) {
    paletteBtn.addEventListener('click', () => {
      paletteBackdrop.classList.add('open');
      if (paletteInput) paletteInput.focus();
    });
    
    paletteBackdrop.addEventListener('click', (e) => {
      if (e.target === paletteBackdrop) paletteBackdrop.classList.remove('open');
    });
  }

  // 6. AI CHATBOT FAB
  const chatbotFab = document.getElementById('chatbotFab');
  const chatbotPanel = document.getElementById('chatbotPanel');
  const chatbotClose = document.getElementById('chatbotClose');
  
  if (chatbotFab && chatbotPanel) {
    chatbotFab.addEventListener('click', () => {
      chatbotPanel.classList.toggle('open');
      chatbotFab.classList.toggle('open');
    });
    
    chatbotClose?.addEventListener('click', () => {
      chatbotPanel.classList.remove('open');
      chatbotFab.classList.remove('open');
    });
  }

  // 7. MODAL CLOSE BUTTONS
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });

  // 8. SEARCH BAR SHORTCUT (Press "/" to focus)
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    }
  });

});
  /* =========================================================
   AI CHATBOT LOGIC (RESTORED)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const chatbotForm = document.getElementById('chatbotForm');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotBody = document.getElementById('chatbotBody');
  const chatbotSuggestions = document.getElementById('chatbotSuggestions');

  if (!chatbotForm || !chatbotBody) return;

  // 1. Prevent page reset when submitting the chat
  chatbotForm.addEventListener('submit', (e) => {
    e.preventDefault(); // THIS STOPS THE PAGE FROM RESETTING
    
    const text = chatbotInput.value.trim();
    if (!text) return;

    // Add user's message to the chat
    addChatMessage(text, 'me');
    chatbotInput.value = '';
    chatbotSuggestions.innerHTML = ''; // Clear suggestion chips

    // 2. Simulate AI "typing" delay
    setTimeout(() => {
      // Remove typing indicator
      const typing = document.getElementById('botTyping');
      if (typing) typing.remove();

      // Generate a smart, contextual response based on keywords
      const lowerText = text.toLowerCase();
      let response = "";

      if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('rate') || lowerText.includes('how much')) {
        response = "Our tutors set their own rates, usually ranging from ₹250 to ₹600 per hour depending on the subject and their experience. You can filter by price on the Marketplace page!";
      } 
      else if (lowerText.includes('tutor') || lowerText.includes('find') || lowerText.includes('need help')) {
        response = "I can help with that! Just use the <strong>AI Match</strong> bar at the top of the page. Describe what you need (e.g., 'I need help with Calculus') and I'll find the best peer tutors for you.";
      } 
      else if (lowerText.includes('book') || lowerText.includes('session') || lowerText.includes('request')) {
        response = "To book a session, click the <strong>Book</strong> button on any tutor's card. You'll send them a request, and once they accept, you can chat and schedule your session.";
      } 
      else if (lowerText.includes('refund') || lowerText.includes('cancel')) {
        response = "You can cancel a session request anytime before the tutor accepts it. If a tutor cancels, you won't be charged. Any payments are held securely in escrow.";
      } 
      else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
        response = "Hello! 👋 I'm UniGig AI. I can help you find a tutor, understand pricing, or navigate the platform. What do you need help with today?";
      } 
      else {
        response = "That's a great question. As a student marketplace, we focus on peer-to-peer learning. You can browse the <strong>Marketplace</strong> for subjects or click <strong>Offer a Skill</strong> if you want to start tutoring yourself!";
      }

      // Add bot response
      addChatMessage(response, 'bot');
      
      // Add new suggestions
      updateSuggestions();
      
    }, 1200); // 1.2 second delay
  });

  // Helper to add a message bubble to the UI
  function addChatMessage(html, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-msg ${type}`;
    msgDiv.innerHTML = html;
    chatbotBody.appendChild(msgDiv);
    
    // Auto-scroll to the bottom
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }

  // Helper to show the typing animation
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-msg bot typing';
    typingDiv.id = 'botTyping';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatbotBody.appendChild(typingDiv);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }

  // Show typing animation when user submits
  chatbotForm.addEventListener('submit', () => {
    showTyping();
  });

  // Add clickable suggestion chips
  function updateSuggestions() {
    chatbotSuggestions.innerHTML = `
      <button class="chatbot-chip" onclick="document.getElementById('chatbotInput').value='How much does it cost?'; document.getElementById('chatbotForm').dispatchEvent(new Event('submit'));">How much does it cost?</button>
      <button class="chatbot-chip" onclick="document.getElementById('chatbotInput').value='How do I book a tutor?'; document.getElementById('chatbotForm').dispatchEvent(new Event('submit'));">How do I book?</button>
    `;
  }

  // Welcome message on load
  if (chatbotBody.children.length === 0) {
    setTimeout(() => {
      addChatMessage("Hi there! 👋 I'm <strong>UniGig AI</strong>. Need help finding a tutor, understanding prices, or booking a session? Let me know!", 'bot');
      updateSuggestions();
    }, 500);
  }
});
  /* =========================================================
   POST A GIG FORM LOGIC (RESTORED)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  const gigForm = document.getElementById('gigForm');
  const gCategory = document.getElementById('gCategory');
  const gDesc = document.getElementById('gDesc');
  const descCount = document.getElementById('descCount');

  // 1. POPULATE THE CATEGORY DROPDOWN
  if (gCategory) {
    // Clear existing options just in case
    gCategory.innerHTML = '<option value="" disabled selected>Select a category...</option>';
    
    // Add our new categories (Computer Science, Math, etc.)
    CATEGORIES.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      gCategory.appendChild(option);
    });
  }

  // 2. LIVE CHARACTER COUNTER FOR DESCRIPTION
  if (gDesc && descCount) {
    gDesc.addEventListener('input', (e) => {
      descCount.textContent = e.target.value.length;
    });
  }

  // 3. HANDLE FORM SUBMISSION (Publishing the Gig)
  if (gigForm) {
    gigForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop page reload

      // Gather the form data
      const title = document.getElementById('gTitle').value;
      const category = gCategory.value;
      const description = gDesc.value;
      const rate = document.getElementById('gRate').value;
      const videoUrl = document.getElementById('gVideo').value;

      // Validate category
      if (!category) {
        alert("Please select a category!");
        return;
      }

      // Create the new gig object
      const newGig = {
        id: 'g_' + Date.now(),
        creatorId: CURRENT_USER_ID, // The person currently logged in
        title: title,
        category: category,
        rate: Number(rate),
        description: description,
        createdAt: Date.now(),
        hasVideo: videoUrl.trim() !== '' // true if a video link was pasted
      };

      // Save to our fake database
      DB.gigs.unshift(newGig); // Add to the beginning of the list
      saveDB(); // Save to localStorage

      // Reset the form
      gigForm.reset();
      if (descCount) descCount.textContent = '0';

      // Show success toast
      const toast = document.getElementById('toast');
      const toastText = document.getElementById('toastText');
      if (toast && toastText) {
        toastText.textContent = "Profile published successfully!";
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }

      // Switch to the marketplace view to see the new card
      document.querySelector('nav.tabs button[data-view="marketplace"]').click();
      
      // Re-render the gigs to show the new one
      if (typeof renderGigs === 'function') {
        renderGigs(); 
      }
    });
  }
});
  /* =========================================================
   BOOKING, DASHBOARD, & MESSAGES LOGIC (FULL APP LOOP)
   ========================================================= */

// Global variable to keep track of the current chat open
let activeChatId = null;

// 1. OPEN BOOKING MODAL
function openBookingModal(gigId) {
  const gig = gigById(gigId);
  if (!gig) return;
  
  const creator = userById(gig.creatorId);
  const modal = document.getElementById('bookingModal');
  
  // Set the hidden input value
  document.getElementById('modalGigId').value = gigId;
  
  // Populate the summary
  document.getElementById('modalSummary').innerHTML = `
    <div class="row"><span class="k">Tutor</span><span class="v">${creator.name}</span></div>
    <div class="row"><span class="k">Subject</span><span class="v">${escapeHtml(gig.title)}</span></div>
    <div class="row"><span class="k">Rate</span><span class="v" style="color:var(--green)">${fmtMoney(gig.rate)} / hr</span></div>
  `;
  
  // Pre-fill name if the current user is a client
  const currentUser = userById(CURRENT_USER_ID);
  document.getElementById('bName').value = currentUser.name;

  modal.classList.add('open');
}

// 2. HANDLE BOOKING SUBMISSION
document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const gigId = document.getElementById('modalGigId').value;
  const gig = gigById(gigId);
  const message = document.getElementById('bMessage').value;
  const clientName = document.getElementById('bName').value;

  // Create the booking object
  const newBooking = {
    id: 'b_' + Date.now(),
    gigId: gigId,
    clientId: CURRENT_USER_ID, // Person booking
    creatorId: gig.creatorId, // Person getting booked
    message: message,
    status: 'pending', // pending, accepted, declined
    createdAt: Date.now()
  };

  // Save to DB
  DB.bookings.push(newBooking);
  
  // Create an empty chat thread for this booking
  DB.messages[newBooking.id] = [
    { senderId: CURRENT_USER_ID, text: message, time: Date.now() }
  ];
  
  saveDB();

  // Close booking modal and show confirmation
  document.getElementById('bookingModal').classList.remove('open');
  document.getElementById('confirmModal').classList.add('open');
  document.getElementById('confirmText').innerText = `Your session request has been sent to ${userById(gig.creatorId).name}. They will respond shortly.`;
  
  // Reset form
  document.getElementById('bMessage').value = '';
  document.getElementById('msgCount').textContent = '0';

  // Re-render everything
  renderDashboard();
  renderBookings();
  renderMessages();
});

// 3. RENDER DASHBOARD (Incoming Requests for Tutors)
function renderDashboard() {
  const statsRow = document.getElementById('creatorStats');
  const incomingList = document.getElementById('incomingBookings');
  if (!statsRow || !incomingList) return;

  // Filter bookings where the current user is the TUTOR
  const myBookings = DB.bookings.filter(b => b.creatorId === CURRENT_USER_ID);
  
  // Calculate Stats
  const pendingCount = myBookings.filter(b => b.status === 'pending').length;
  const acceptedCount = myBookings.filter(b => b.status === 'accepted').length;
  const totalEarned = myBookings.filter(b => b.status === 'accepted').reduce((sum, b) => {
    const gig = gigById(b.gigId);
    return sum + (gig ? gig.rate : 0);
  }, 0);

  statsRow.innerHTML = `
    <div class="stat-card purple"><div class="stat-num">${pendingCount}</div><div class="stat-lbl">Pending Requests</div></div>
    <div class="stat-card green"><div class="stat-num">${acceptedCount}</div><div class="stat-lbl">Active Sessions</div></div>
    <div class="stat-card cyan"><div class="stat-num">${fmtMoney(totalEarned)}</div><div class="stat-lbl">Total Earned</div></div>
  `;

  // Render Incoming Requests
  if (myBookings.length === 0) {
    incomingList.innerHTML = `<div class="empty"><div class="icon">📭</div><h3>No requests yet</h3><p>When students book your gigs, they will appear here.</p></div>`;
    return;
  }

  incomingList.innerHTML = myBookings.map(booking => {
    const gig = gigById(booking.gigId);
    const client = userById(booking.clientId);
    if (!gig || !client) return '';

    return `
      <div class="booking-card">
        <div class="booking-main">
          ${avatarHTML(client, 'lg')}
          <div class="info">
            <h4>${escapeHtml(gig.title)}</h4>
            <div class="meta">
              <span>Requested by <strong>${client.name}</strong></span>
              <span class="dot">•</span>
              <span>${timeAgo(booking.createdAt)}</span>
            </div>
            <div class="msg">"${escapeHtml(booking.message)}"</div>
          </div>
        </div>
        <div class="booking-actions">
          <span class="status ${booking.status}">${booking.status}</span>
          ${booking.status === 'pending' ? `
            <button class="btn btn-success btn-sm" onclick="updateBookingStatus('${booking.id}', 'accepted')">Accept</button>
            <button class="btn btn-danger btn-sm" onclick="updateBookingStatus('${booking.id}', 'declined')">Decline</button>
          ` : ''}
          <button class="btn btn-ghost btn-sm" onclick="openChat('${booking.id}')">Message</button>
        </div>
      </div>
    `;
  }).join('');
}

// 4. HANDLE ACCEPT/DECLINE
function updateBookingStatus(bookingId, newStatus) {
  const booking = DB.bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.status = newStatus;
    saveDB();
    renderDashboard();
    renderBookings();
    
    // Show toast
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = `Booking ${newStatus}!`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// 5. RENDER MY BOOKINGS (For Clients)
function renderBookings() {
  const myList = document.getElementById('myBookings');
  if (!myList) return;

  // Filter bookings where the current user is the CLIENT
  const myBookings = DB.bookings.filter(b => b.clientId === CURRENT_USER_ID);

  if (myBookings.length === 0) {
    myList.innerHTML = `<div class="empty"><div class="icon">🔍</div><h3>No sessions booked</h3><p>Find a tutor in the marketplace and book your first session!</p></div>`;
    return;
  }

  myList.innerHTML = myBookings.map(booking => {
    const gig = gigById(booking.gigId);
    const creator = userById(booking.creatorId);
    if (!gig || !creator) return '';

    return `
      <div class="booking-card">
        <div class="booking-main">
          ${avatarHTML(creator, 'lg')}
          <div class="info">
            <h4>${escapeHtml(gig.title)}</h4>
            <div class="meta">
              <span>Tutor: <strong>${creator.name}</strong></span>
              <span class="dot">•</span>
              <span>${timeAgo(booking.createdAt)}</span>
            </div>
            <div class="msg">"${escapeHtml(booking.message)}"</div>
          </div>
        </div>
        <div class="booking-actions">
          <span class="status ${booking.status}">${booking.status}</span>
          <button class="btn btn-ghost btn-sm" onclick="openChat('${booking.id}')">Message</button>
        </div>
      </div>
    `;
  }).join('');
}

// 6. RENDER MESSAGES LIST
function renderMessages() {
  const msgList = document.getElementById('messagesList');
  if (!msgList) return;

  // Get all bookings involving the current user
  const myChats = DB.bookings.filter(b => b.clientId === CURRENT_USER_ID || b.creatorId === CURRENT_USER_ID);

  if (myChats.length === 0) {
    msgList.innerHTML = `<div class="empty"><div class="icon">💬</div><h3>No messages</h3><p>Your active conversations will appear here.</p></div>`;
    return;
  }

  msgList.innerHTML = myChats.map(booking => {
    const gig = gigById(booking.gigId);
    if (!gig) return '';
    
    // Determine who the "other" person is
    const otherUserId = CURRENT_USER_ID === booking.clientId ? booking.creatorId : booking.clientId;
    const otherUser = userById(otherUserId);
    
    const chatMsgs = DB.messages[booking.id] || [];
    const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1].text : "No messages yet";

    return `
      <div class="booking-card" style="cursor:pointer;" onclick="openChat('${booking.id}')">
        <div class="booking-main">
          ${avatarHTML(otherUser, 'lg')}
          <div class="info">
            <h4>${otherUser.name}</h4>
            <div class="meta">${escapeHtml(gig.title)}</div>
            <div style="font-size:12.5px; color:var(--muted); margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(lastMsg)}
            </div>
          </div>
        </div>
        <div class="booking-actions">
          <button class="btn btn-primary btn-sm">Open Chat</button>
        </div>
      </div>
    `;
  }).join('');
}

// 7. CHAT SYSTEM
function openChat(bookingId) {
  activeChatId = bookingId;
  const booking = DB.bookings.find(b => b.id === bookingId);
  if (!booking) return;
  
  const otherUserId = CURRENT_USER_ID === booking.clientId ? booking.creatorId : booking.clientId;
  const otherUser = userById(otherUserId);
  
  document.getElementById('chatHead').innerHTML = `
    ${avatarHTML(otherUser)}
    <div>
      <div class="name">${otherUser.name}</div>
      <div class="online">Online</div>
    </div>
  `;
  
  renderChatMessages();
  
  // Open the modal
  document.getElementById('chatModal').classList.add('open');
}

function renderChatMessages() {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody || !activeChatId) return;
  
  const msgs = DB.messages[activeChatId] || [];
  
  chatBody.innerHTML = msgs.map(m => {
    const isMe = m.senderId === CURRENT_USER_ID;
    return `
      <div class="chat-msg ${isMe ? 'me' : 'them'}">
        ${escapeHtml(m.text)}
        <div class="time">${new Date(m.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    `;
  }).join('');
  
  chatBody.scrollTop = chatBody.scrollHeight;
}

document.getElementById('chatSend')?.addEventListener('click', () => {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !activeChatId) return;
  
  // Add message to DB
  if (!DB.messages[activeChatId]) DB.messages[activeChatId] = [];
  DB.messages[activeChatId].push({
    senderId: CURRENT_USER_ID,
    text: text,
    time: Date.now()
  });
  
  saveDB();
  input.value = '';
  renderChatMessages();
  renderMessages(); // Update the last message preview in the sidebar
});

// 8. INITIALIZE APP LOOP ON LOAD
// (Adding this to a slight timeout ensures other scripts have loaded first)
setTimeout(() => {
  renderDashboard();
  renderBookings();
  renderMessages();
}, 100);

// Re-render lists when the "Acting as" dropdown changes
document.getElementById('userSelect')?.addEventListener('change', () => {
  setTimeout(() => {
    renderDashboard();
    renderBookings();
    renderMessages();
  }, 100);
});
  /* =========================================================
   FIX CONFIRMATION MODAL BUTTONS
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const confirmModal = document.getElementById('confirmModal');
  const confirmViewBookings = document.getElementById('confirmViewBookings');
  const confirmClose = document.getElementById('confirmClose');

  // 1. "View My Sessions" Button
  if (confirmViewBookings) {
    confirmViewBookings.addEventListener('click', () => {
      confirmModal.classList.remove('open'); // Close the popup
      
      // Trigger the click on the "My Sessions" tab to navigate there
      const sessionsTab = document.querySelector('nav.tabs button[data-view="bookings"]');
      if (sessionsTab) sessionsTab.click();
    });
  }

  // 2. "Keep Browsing" Button
  if (confirmClose) {
    confirmClose.addEventListener('click', () => {
      confirmModal.classList.remove('open'); // Just close the popup
    });
  }
});
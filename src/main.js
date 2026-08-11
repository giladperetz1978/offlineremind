import './style.css'

const STORAGE_KEY = 'offlineremind.reminders'
const LOCAL_STT_URL = 'http://127.0.0.1:3000/api/stt'

let reminders = loadReminders()

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <div>
      <p class="eyebrow">LOCAL TOOLKIT / 01</p>
      <h1>Offline<span>Remind</span></h1>
    </div>
    <div class="status-pill"><i></i> מקומי בלבד</div>
  </header>
  <main class="workspace">
    <section class="intro">
      <div>
        <p class="eyebrow">תזכורות, קול וניווט</p>
        <h2>הדברים החשובים,<br><em>בלי ענן באמצע.</em></h2>
      </div>
      <p class="intro-copy">מרחב אישי שמחזיק את המידע על המכשיר. תמלול יתחבר למנוע מקומי, והתזכורות נשארות איתך גם בלי רשת.</p>
    </section>

    <section class="dashboard-grid">
      <article class="panel capture-panel">
        <div class="panel-heading"><span class="index">01</span><h3>תמלול מקומי</h3><span class="local-tag">STT / LOCAL</span></div>
        <p class="panel-note">הקלט קול ושלח אותו למנוע Moonshine שרץ אצלך במחשב.</p>
        <div class="transcript-box" id="transcriptOutput">מוכן לקבל תמלול...</div>
        <div class="capture-actions">
          <button class="primary-button" id="recordButton" type="button"><span class="mic-dot"></span>התחל הקלטה</button>
          <select id="languageSelect" aria-label="שפת תמלול">
            <option value="he">עברית</option><option value="en">English</option><option value="es">Español</option>
            <option value="ar">العربية</option><option value="ja">日本語</option><option value="zh">中文</option><option value="ko">한국어</option>
          </select>
        </div>
        <p class="connection-note" id="connectionNote">מנוע מקומי: http://127.0.0.1:3000</p>
      </article>

      <article class="panel reminder-panel">
        <div class="panel-heading"><span class="index">02</span><h3>תזכורות</h3><span class="count" id="reminderCount">0</span></div>
        <form class="reminder-form" id="reminderForm"><input id="reminderInput" placeholder="מה צריך לזכור?" autocomplete="off" required><button type="submit" aria-label="הוסף תזכורת">+</button></form>
        <ul class="reminder-list" id="reminderList"></ul>
      </article>

      <article class="panel route-panel">
        <div class="panel-heading"><span class="index">03</span><h3>Waze</h3><span class="local-tag">DEVICE ACTION</span></div>
        <p class="panel-note">שמור יעדים שימושיים מקומית. פתיחת ניווט תעבור לאפליקציית Waze רק בלחיצה.</p>
        <form class="route-form" id="routeForm"><input id="routeInput" placeholder="למשל: הבית או קניון איילון" autocomplete="off"><button type="submit">שמור יעד</button></form>
        <ul class="route-list" id="routeList"></ul>
      </article>

      <article class="panel next-panel"><span class="index">04—06</span><h3>בדרך</h3><p>שלושה מקומות פתוחים לרעיונות הבאים.</p><div class="future-lines"><span></span><span></span><span></span></div></article>
    </section>
  </main>
  <footer><span>אין חשבון. אין Google. אין סנכרון ענן.</span><span>DATA: DEVICE STORAGE</span></footer>
`

function loadReminders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

function saveReminders() { localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders)) }

function renderReminders() {
  const list = document.querySelector('#reminderList')
  document.querySelector('#reminderCount').textContent = String(reminders.length).padStart(2, '0')
  list.innerHTML = reminders.length ? reminders.map((item) => `<li><button class="check-button ${item.done ? 'done' : ''}" data-id="${item.id}" aria-label="סמן תזכורת">${item.done ? '✓' : ''}</button><span class="${item.done ? 'done-text' : ''}">${escapeHtml(item.text)}</span><button class="delete-button" data-delete="${item.id}" aria-label="מחק תזכורת">×</button></li>`).join('') : '<li class="empty-state">אין תזכורות. זה זמן טוב להוסיף אחת.</li>'
}

function renderRoutes() {
  const routes = JSON.parse(localStorage.getItem('offlineremind.routes') || '[]')
  const list = document.querySelector('#routeList')
  list.innerHTML = routes.length ? routes.map((route) => `<li><span>${escapeHtml(route)}</span><button data-route="${encodeURIComponent(route)}">פתח ב־Waze ↗</button></li>`).join('') : '<li class="empty-state">אין יעדים שמורים.</li>'
}

function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML }

document.querySelector('#reminderForm').addEventListener('submit', (event) => {
  event.preventDefault()
  const input = document.querySelector('#reminderInput')
  if (!input.value.trim()) return
  reminders.unshift({ id: crypto.randomUUID(), text: input.value.trim(), done: false })
  input.value = ''; saveReminders(); renderReminders()
})

document.querySelector('#reminderList').addEventListener('click', (event) => {
  const id = event.target.dataset.id || event.target.dataset.delete
  if (!id) return
  if (event.target.dataset.delete) reminders = reminders.filter((item) => item.id !== id)
  else reminders = reminders.map((item) => item.id === id ? { ...item, done: !item.done } : item)
  saveReminders(); renderReminders()
})

document.querySelector('#routeForm').addEventListener('submit', (event) => {
  event.preventDefault()
  const input = document.querySelector('#routeInput'); const value = input.value.trim()
  if (!value) return
  const routes = JSON.parse(localStorage.getItem('offlineremind.routes') || '[]')
  localStorage.setItem('offlineremind.routes', JSON.stringify([value, ...routes.filter((route) => route !== value)]))
  input.value = ''; renderRoutes()
})

document.querySelector('#routeList').addEventListener('click', (event) => {
  const route = event.target.dataset.route
  if (route) window.open(`https://waze.com/ul?q=${route}&navigate=yes`, '_blank', 'noopener')
})

let recorder; let chunks = []
document.querySelector('#recordButton').addEventListener('click', async (event) => {
  const button = event.currentTarget; const output = document.querySelector('#transcriptOutput'); const note = document.querySelector('#connectionNote')
  if (recorder?.state === 'recording') { recorder.stop(); return }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder = new MediaRecorder(stream); chunks = []
    recorder.ondataavailable = (item) => chunks.push(item.data)
    recorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); await sendRecording(new Blob(chunks, { type: recorder.mimeType }), output, note, button) }
    recorder.start(); button.classList.add('recording'); button.innerHTML = '<span class="mic-dot"></span>עצור הקלטה'; output.textContent = 'מקליט עכשיו...'
  } catch { output.textContent = 'אין גישה למיקרופון. בדוק הרשאות בדפדפן.' }
})

async function sendRecording(blob, output, note, button) {
  output.textContent = 'מתמלל במנוע המקומי...'
  try {
    const response = await fetch(LOCAL_STT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio_base64: await recordingToBase64(blob), language: document.querySelector('#languageSelect').value }) })
    if (!response.ok) throw new Error('Local STT unavailable')
    output.textContent = (await response.json()).text || 'לא זוהה טקסט.'; note.textContent = 'מחובר למנוע תמלול מקומי'
  } catch { output.textContent = 'מנוע התמלול המקומי לא זמין כרגע.'; note.textContent = 'הפעל את שירות Moonshine המקומי כדי לתמלל' }
  button.classList.remove('recording'); button.innerHTML = '<span class="mic-dot"></span>התחל הקלטה'
}

async function recordingToBase64(blob) {
  const context = new AudioContext({ sampleRate: 16000 })
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer())
    const channel = decoded.getChannelData(0)
    const raw = new Float32Array(channel.length)
    raw.set(channel)
    return uint8ToBase64(new Uint8Array(raw.buffer))
  } finally { await context.close() }
}

function uint8ToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  return btoa(binary)
}

renderReminders(); renderRoutes()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}

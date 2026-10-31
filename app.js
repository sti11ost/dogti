import { scoreQuiz, encodeAnswers, decodeAnswers } from './scoring.mjs';

const $ = selector => document.querySelector(selector);
const views = ['homeView', 'quizView', 'resultView', 'galleryView'];
const STORAGE_KEY = 'dogti-progress-v1';
const dogs = {
  golden:          { fur:'#eac995', ear:'#cf9f66', face:'#f9e7c8', bg:'#f2e5d6', collar:'#d98774', ears:'flop', mark:'none' },
  border_collie:   { fur:'#4d5754', ear:'#394440', face:'#fff8ea', bg:'#e2ebe5', collar:'#d79b83', ears:'flop', mark:'blaze' },
  shiba:           { fur:'#d99c6e', ear:'#bf7c50', face:'#fbebd2', bg:'#f3e8dc', collar:'#95a589', ears:'point', mark:'cheeks' },
  samoyed:         { fur:'#fcfaf2', ear:'#eee8dd', face:'#fffefa', bg:'#e4eee9', collar:'#dbac9a', ears:'point', mark:'fluffy' },
  german_shepherd: { fur:'#aa8a71', ear:'#66564d', face:'#e8d3b6', bg:'#e8e9db', collar:'#8da18a', ears:'point', mark:'mask' },
  bichon:          { fur:'#faf4e9', ear:'#e7d9cd', face:'#fffdf6', bg:'#f3e5ea', collar:'#dca0a5', ears:'round', mark:'fluffy' },
  husky:           { fur:'#929d9f', ear:'#67777b', face:'#f9f9f4', bg:'#e3ebef', collar:'#dfaa84', ears:'point', mark:'blaze' },
  pug:             { fur:'#d5b58e', ear:'#806d63', face:'#edd8bc', bg:'#e9eadc', collar:'#d99a8b', ears:'flop', mark:'mask' }
};
const stageCopy = [
  { eyebrow:'01 / 04 · 心动信号已收藏', title:'好像，有一点心动了。', body:'从下一章开始，看看两个人慢慢靠近时，你会把什么样的自己交给 TA。', next:'Next · 靠近一点', dog:'golden' },
  { eyebrow:'02 / 04 · 靠近一点已收藏', title:'喜欢开始有了日常。', body:'一条消息、一顿饭、一个雨天。接下来，是那些没那么容易说出口的小情绪。', next:'Next · 看看小小拉扯', dog:'bichon' },
  { eyebrow:'03 / 04 · 一点点拉扯已收藏', title:'原来在意，也会小心翼翼。', body:'最后六个问题，我们聊聊认真喜欢一个人之后，你最想怎么陪在 TA 身边。', next:'Next · 认真喜欢', dog:'shiba' },
  { eyebrow:'24 / 24 · 心动旅程完成', title:'找到你心里的小狗啦。', body:'它已经乖乖坐好，等你来认领。准备好看看，恋爱里的自己是什么模样了吗？', next:'Next · 揭晓我的小狗', dog:'samoyed' }
];
const chapterNotes = [
  '还没说出口的喜欢，通常最先藏在小动作里。',
  '关系慢慢靠近时，你最舒服的节奏是什么？',
  '有点在意、有点委屈，也有点想被理解。',
  '认真喜欢一个人时，柔软的一面会慢慢出现。'
];

function dogSvg(id, mood='soft') {
  const d = dogs[id] || dogs.golden;
  const ears = d.ears === 'point'
    ? `<path d="M74 96Q59 46 77 29Q86 21 105 69L105 104Z" fill="${d.ear}"/><path d="M166 104V69Q185 21 194 29Q212 46 197 96Z" fill="${d.ear}"/><path d="M82 62Q78 49 84 48L98 76" fill="#f5c9bd" opacity=".55"/><path d="M178 76L192 48Q198 49 194 62" fill="#f5c9bd" opacity=".55"/>`
    : d.ears === 'round'
      ? `<ellipse cx="67" cy="107" rx="27" ry="47" transform="rotate(24 67 107)" fill="${d.ear}"/><ellipse cx="193" cy="107" rx="27" ry="47" transform="rotate(-24 193 107)" fill="${d.ear}"/>`
      : `<path d="M89 70Q46 61 48 105Q48 139 73 143Q90 145 100 102Z" fill="${d.ear}"/><path d="M171 70Q214 61 212 105Q212 139 187 143Q170 145 160 102Z" fill="${d.ear}"/>`;
  const mark = d.mark === 'blaze'
    ? `<path d="M113 54Q130 45 147 54Q143 78 134 95Q130 102 126 95Q117 78 113 54Z" fill="${d.face}" opacity=".95"/>`
    : d.mark === 'mask'
      ? `<ellipse cx="99" cy="118" rx="22" ry="27" fill="${d.ear}" opacity=".35"/><ellipse cx="161" cy="118" rx="22" ry="27" fill="${d.ear}" opacity=".35"/>`
      : d.mark === 'cheeks'
        ? `<ellipse cx="85" cy="151" rx="25" ry="20" fill="${d.face}"/><ellipse cx="175" cy="151" rx="25" ry="20" fill="${d.face}"/>`
        : '';
  const fluff = d.mark === 'fluffy'
    ? `<circle cx="65" cy="143" r="18" fill="${d.fur}"/><circle cx="195" cy="143" r="18" fill="${d.fur}"/><circle cx="77" cy="174" r="16" fill="${d.fur}"/><circle cx="183" cy="174" r="16" fill="${d.fur}"/>`
    : '';
  const eyes = mood === 'curious'
    ? `<circle cx="102" cy="121" r="4" fill="#514b44"/><circle cx="158" cy="121" r="4" fill="#514b44"/><circle cx="130" cy="169" r="4" fill="#65554d"/>`
    : `<ellipse cx="102" cy="121" rx="3.6" ry="4.5" fill="#514b44"/><ellipse cx="158" cy="121" rx="3.6" ry="4.5" fill="#514b44"/><path d="M130 153v8m0 0q-8 8-15 0m15 0q8 8 15 0" fill="none" stroke="#65554d" stroke-width="2.3" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="130" cy="239" rx="76" ry="10" fill="#828b7d" opacity=".12"/>
    <path d="M186 193Q224 177 213 147" fill="none" stroke="${d.fur}" stroke-width="18" stroke-linecap="round"/>
    <ellipse cx="130" cy="205" rx="68" ry="51" fill="${d.fur}"/>
    <ellipse cx="88" cy="226" rx="18" ry="13" fill="${d.face}"/><ellipse cx="172" cy="226" rx="18" ry="13" fill="${d.face}"/>
    ${ears}<path d="M130 50C78 50 57 81 59 124C61 171 87 190 130 190C173 190 199 171 201 124C203 81 182 50 130 50Z" fill="${d.fur}"/>
    ${fluff}${mark}<ellipse cx="130" cy="151" rx="53" ry="31" fill="${d.face}"/>
    <ellipse cx="84" cy="143" rx="10" ry="6" fill="#e8a6a0" opacity=".38"/><ellipse cx="176" cy="143" rx="10" ry="6" fill="#e8a6a0" opacity=".38"/>
    ${eyes}<path d="M122 148Q130 143 138 148Q138 154 130 156Q122 154 122 148Z" fill="#675a51"/>
    <path d="M80 190Q130 211 180 190" fill="none" stroke="${d.collar}" stroke-width="11" stroke-linecap="round"/>
    <circle cx="130" cy="210" r="7" fill="#f8dfbb"/><circle cx="130" cy="210" r="2" fill="${d.collar}"/>
  </svg>`;
}

let data;
let state = { index: 0, answers: Array(24).fill(null) };
let lastView = 'homeView';
let busy = false;
let pendingStage = null;
let toastTimer;

function show(id) {
  for (const view of views) document.getElementById(view).classList.toggle('active', view === id);
  window.scrollTo(0, 0);
  if (id === 'quizView') $('#questionTitle').focus({ preventScroll:true });
}
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
function saveProgress() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
function clearProgress() { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} }
function cleanUrl() { history.replaceState({}, '', location.pathname); }
function home() { cleanUrl(); show('homeView'); }

function start(reset=false) {
  if (reset) { state = { index:0, answers:Array(data.questions.length).fill(null) }; clearProgress(); }
  cleanUrl(); renderQuestion(); show('quizView');
}
function renderQuestion() {
  const q = data.questions[state.index];
  const chapter = Math.floor(state.index / 6);
  $('#quizCounter').textContent = `${String(state.index + 1).padStart(2,'0')} / ${data.questions.length}`;
  $('#quizBack').style.visibility = state.index === 0 ? 'hidden' : 'visible';
  $('#chapterLabel').textContent = `${String(chapter + 1).padStart(2,'0')} / ${q.section}`;
  $('#questionTitle').textContent = q.prompt;
  $('#questionNote').textContent = chapterNotes[chapter];
  $('#quizDog').innerHTML = dogSvg(['golden','bichon','shiba','samoyed'][chapter],state.index % 3 === 0 ? 'curious' : 'soft');
  [...$('#stageProgress').children].forEach((el,index) => el.style.setProperty('--fill',index < chapter ? '100%' : index === chapter ? `${(state.index % 6) / 6 * 100}%` : '0%'));
  const container = $('#options'); container.replaceChildren();
  q.options.forEach((option,index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'option';
    const key = document.createElement('span'); key.className = 'option-key'; key.textContent = String(index + 1);
    const text = document.createElement('span'); text.textContent = option.text;
    button.append(key,text);
    button.addEventListener('click', () => selectOption(index,button));
    container.append(button);
  });
  window.scrollTo(0, 0);
}
function selectOption(index,button) {
  if (busy) return;
  busy = true; state.answers[state.index] = index; button.classList.add('selected'); saveProgress();
  setTimeout(() => {
    busy = false;
    const nextIndex = state.index + 1;
    if (nextIndex === data.questions.length) { pendingStage = 'result'; openStage(3); }
    else if (nextIndex % 6 === 0) { state.index = nextIndex; saveProgress(); pendingStage = 'question'; openStage(nextIndex / 6 - 1); }
    else { state.index = nextIndex; saveProgress(); renderQuestion(); $('#questionTitle').focus({ preventScroll:true }); }
  }, 260);
}
function openStage(copyIndex) {
  const stage = stageCopy[copyIndex];
  if (copyIndex < 3) $('#stageProgress').children[copyIndex].style.setProperty('--fill','100%');
  $('#stageDog').innerHTML = dogSvg(stage.dog,copyIndex === 3 ? 'soft' : 'curious');
  $('#stageEyebrow').textContent = stage.eyebrow;
  $('#stageTitle').textContent = stage.title;
  $('#stageDescription').textContent = stage.body;
  $('#stageNextText').textContent = stage.next;
  $('#stageMiniProgress').replaceChildren(...Array.from({length:4},(_,index) => { const dot = document.createElement('span'); if (index <= copyIndex) dot.className='done'; return dot; }));
  $('#stageDialog').showModal();
}
function continueStage() {
  if (!$('#stageDialog').open) return;
  $('#stageDialog').close();
  if (pendingStage === 'result') showResult(state.answers);
  else { renderQuestion(); $('#questionTitle').focus({ preventScroll:true }); }
  pendingStage = null;
}

function showResult(answers) {
  let scored;
  try { scored = scoreQuiz(data,answers); } catch (_) { toast('这份结果好像走丢了，我们重新出发吧'); start(true); return; }
  const { result,dimensions } = scored;
  const resultIndex = data.results.findIndex(item => item.id === result.id);
  $('#resultHero').style.background = dogs[result.id].bg;
  $('#resultDog').innerHTML = dogSvg(result.id);
  $('#resultId').textContent = `${String(resultIndex + 1).padStart(2,'0')} / 08`;
  $('#resultName').textContent = result.name;
  $('#resultTitle').textContent = result.title;
  $('#resultSummary').textContent = result.summary;
  $('#resultNote').textContent = result.note;
  $('#resultRelationship').textContent = result.inRelationship;
  $('#resultMisunderstood').textContent = result.misunderstood;
  $('#resultTags').replaceChildren(...result.tags.map(tag => { const el=document.createElement('span'); el.textContent=tag; return el; }));
  $('#dimensionRows').replaceChildren(...data.dimensions.map(dimension => {
    const row=document.createElement('div'); row.className='dimension-row';
    const label=document.createElement('label'); label.textContent=dimension.name;
    const track=document.createElement('div'); track.className='dimension-track'; track.setAttribute('role','meter'); track.setAttribute('aria-label',dimension.name); track.setAttribute('aria-valuemin','0'); track.setAttribute('aria-valuemax','100'); track.setAttribute('aria-valuenow',String(dimensions[dimension.id]));
    const fill=document.createElement('div'); fill.className='dimension-fill'; fill.style.width=`${dimensions[dimension.id]}%`; track.append(fill);
    const output=document.createElement('output'); output.textContent=String(dimensions[dimension.id]);
    row.append(label,track,output); return row;
  }));
  history.replaceState({}, '', `${location.pathname}?r=${encodeAnswers(answers)}`);
  clearProgress(); $('#startText').textContent='和小狗一起出发'; show('resultView');
}

function renderGallery() {
  $('#galleryGrid').replaceChildren(...data.results.map((result,index) => {
    const card=document.createElement('article'); card.className='gallery-card';
    const picture=document.createElement('div'); picture.className='gallery-dog'; picture.style.background=dogs[result.id].bg; picture.innerHTML=dogSvg(result.id);
    const body=document.createElement('div'); body.className='gallery-card-body';
    const num=document.createElement('span'); num.className='num'; num.textContent=`DOG ${String(index+1).padStart(2,'0')} / 08`;
    const name=document.createElement('h2'); name.textContent=result.name;
    const title=document.createElement('p'); title.textContent=result.title;
    body.append(num,name,title); card.append(picture,body); return card;
  }));
}
function openShare() {
  const result=scoreQuiz(data,state.answers).result;
  $('#shareMessage').textContent=result.note;
  $('#shareUrl').value=location.href;
  $('#shareDialog').showModal();
}
async function copyLink() {
  const input=$('#shareUrl');
  try { await navigator.clipboard.writeText(input.value); toast('链接已经复制，去发给 TA 吧 ♡'); $('#shareDialog').close(); }
  catch (_) {
    input.focus(); input.select();
    try { if (document.execCommand('copy')) { toast('链接已经复制，去发给 TA 吧 ♡'); $('#shareDialog').close(); return; } } catch (_) {}
    toast('请长按链接复制，或用微信右上角分享');
  }
}

async function init() {
  try { const response=await fetch('./quiz-data.json?v=2'); if (!response.ok) throw new Error(); data=await response.json(); }
  catch (_) { toast('小狗还没准备好，请刷新页面试试'); return; }
  $('#heroDog').innerHTML=dogSvg('golden'); renderGallery();
  $('#startBtn').addEventListener('click',() => {
    let saved; try { saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (saved && Number.isInteger(saved.index) && saved.index>=0 && saved.index<data.questions.length && Array.isArray(saved.answers) && saved.answers.length===data.questions.length) state=saved;
    else state={ index:0,answers:Array(data.questions.length).fill(null) };
    start();
  });
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.index>0 && saved.index<data.questions.length) $('#startText').textContent='继续上次的心动'; } catch (_) {}
  $('#brandBtn').addEventListener('click',home);
  $('#quizBack').addEventListener('click',() => { if (busy || state.index===0) return; state.index--; saveProgress(); renderQuestion(); });
  $('#quizClose').addEventListener('click',() => { saveProgress(); $('#startText').textContent='继续上次的心动'; home(); toast('进度已悄悄存好，下次接着来'); });
  $('#stageNext').addEventListener('click',continueStage);
  $('#stageDialog').addEventListener('cancel',event => { event.preventDefault(); continueStage(); });
  $('#resultHome').addEventListener('click',home);
  $('#retryBtn').addEventListener('click',() => start(true));
  $('#shareBtn').addEventListener('click',openShare);
  $('#shareClose').addEventListener('click',() => $('#shareDialog').close());
  $('#copyLink').addEventListener('click',copyLink);
  $('#headerGallery').addEventListener('click',() => { lastView=document.querySelector('.view.active').id; show('galleryView'); });
  $('#resultGallery').addEventListener('click',() => { lastView='resultView'; show('galleryView'); });
  $('#galleryBack').addEventListener('click',() => show(lastView));
  document.addEventListener('keydown',event => {
    if (!$('#quizView').classList.contains('active') || $('#stageDialog').open || busy || event.altKey || event.ctrlKey || event.metaKey) return;
    const index=Number(event.key)-1;
    if (index>=0 && index<3) $('#options').children[index]?.click();
    else if (event.key==='ArrowLeft') $('#quizBack').click();
  });
  const sharedCode=new URLSearchParams(location.search).get('r');
  if (sharedCode) {
    try { state.answers=decodeAnswers(sharedCode,data.questions.length); state.index=data.questions.length-1; showResult(state.answers); }
    catch (_) { cleanUrl(); toast('这份链接好像走丢了，来测一份新的吧'); }
  }
}
init();

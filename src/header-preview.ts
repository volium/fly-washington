import './header-preview.css';

/** Local review only: reuse the existing app controls and offline lifecycle. */
export function installHeaderPreview() {
  const header = document.querySelector<HTMLElement>('.app-header')!;
  const actions = header.querySelector<HTMLElement>('.header-actions')!;
  const select = document.querySelector<HTMLSelectElement>('#theme')!;
  select.closest<HTMLElement>('label')!.style.display = 'none';
  header.classList.add('header-preview');
  document.querySelector('.passport-app')!.classList.add('header-preview-app');
  const paths = {
    appearance: '<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 0 0 14Z" fill="currentColor" stroke="none"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  };
  const icon = (key: keyof typeof paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[key]}</svg>`;
  const trigger = document.createElement('button');
  trigger.id = 'appearance-trigger'; trigger.type = 'button';
  const sync = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    trigger.setAttribute('aria-label',dark ? 'Switch to light appearance' : 'Switch to dark appearance');
    trigger.title = dark ? 'Switch to light appearance' : 'Switch to dark appearance';
    trigger.innerHTML = '<span class="appearance-icon-tile" aria-hidden="true">' + icon('appearance') + '</span>';
  };
  trigger.addEventListener('click',()=>{
    select.value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  select.addEventListener('change',sync);
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  actions.append(trigger);sync();
  const navigation=document.querySelector<HTMLElement>('.offline-navigation')!;actions.append(navigation);
  const offline=document.querySelector<HTMLButtonElement>('#offline-access')!;
  offline.querySelector('span')!.classList.add('sr-only');
  const compact=document.createElement('span');compact.className='header-offline-label';
  offline.insertAdjacentHTML('afterbegin',icon('map'));offline.append(compact);
  const summary=document.querySelector<HTMLElement>('#offline-summary')!;
  const status=()=>{const text=summary.textContent??'';let short=text;
    if(text==='Map available offline')short='Offline ready';else if(text==='Map not downloaded')short='Download map';else if(text.startsWith('Map download '))short='Map '+text.replace('Map download ','');else if(text.includes('verifying'))short='Verifying map';else if(text.includes('attention')||text.includes('failed')||text.includes('missing'))short='Check map';
    compact.textContent=short;offline.title='Offline access: '+text;offline.setAttribute('aria-label',offline.title);offline.dataset.ready=String(text==='Map available offline');offline.dataset.transfer=String(text.startsWith('Map download '));
  };new MutationObserver(status).observe(summary,{childList:true,subtree:true,characterData:true});status();
  const shield=document.querySelector<HTMLButtonElement>('#storage-protection')!;
  const heading=document.querySelector<HTMLElement>('#protection-heading')!;
  heading.append(shield.querySelector('svg')!.cloneNode(true));
  shield.addEventListener('click',()=>requestAnimationFrame(()=>{
    const card=document.querySelector<HTMLElement>('#offline-card')!;
    const details=document.querySelector<HTMLDetailsElement>('#protection-details')!;details.open=true;
    const sticky=document.querySelector<HTMLElement>('.offline-card-heading')!;
    card.scrollTop+=heading.getBoundingClientRect().top-sticky.getBoundingClientRect().bottom-12;
    heading.focus({preventScroll:true});
  }));
}

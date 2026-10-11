// Phone header: the page navigation opens from a hamburger as a full-screen panel.
(() => {
 const header=document.querySelector('.top-header'),toggle=header&&header.querySelector('.top-menu-toggle'),nav=header&&header.querySelector('#top-nav');
 if(!toggle||!nav)return;
 const setOpen=open=>{
  header.classList.toggle('is-menu-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
 };
 toggle.addEventListener('click',()=>setOpen(!header.classList.contains('is-menu-open')));
 nav.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('is-menu-open')){setOpen(false);toggle.focus();}});
 matchMedia('(min-width: 701px)').addEventListener('change',event=>{if(event.matches)setOpen(false);});
})();

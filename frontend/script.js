(function(){
  var b=document.getElementById('burger'),d=document.getElementById('drawer');
  b.addEventListener('click',function(){var o=d.classList.toggle('open');b.setAttribute('aria-expanded',o)});
  d.addEventListener('click',function(e){if(e.target.tagName==='A'){d.classList.remove('open');b.setAttribute('aria-expanded','false')}});
})();
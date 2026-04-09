const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 2.5 + 0.5;
  s.style.cssText = `
    width:${size}px; height:${size}px;
    top:${Math.random()*100}%;
    left:${Math.random()*100}%;
    --d:${(Math.random()*4+2).toFixed(1)}s;
    animation-delay:${(Math.random()*5).toFixed(1)}s;
  `;
  starsEl.appendChild(s);
}

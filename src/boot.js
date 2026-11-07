// Vite must see a literal module path in each import() to bundle the chapter,
// its dependencies, and its CSS. import(chapterVariable) is NOT analyzable.
// Keep the original chapter 1 DOM and instantiate chapter 2 only on ?stage=2.
const stage = new URLSearchParams(window.location.search).get('stage');
const loading = stage === '2'
  ? import('./chapter2-main.js')
  : import('./main.js');

loading.catch((error) => {
  console.error('Unable to load game chapter:', error);
  const message = document.createElement('p');
  message.style.cssText =
    'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);' +
    'z-index:9999;padding:18px 24px;background:white;color:#36493e;' +
    'border:1px solid #b8cbbd;font:14px system-ui,sans-serif;text-align:center;';
  message.textContent = '场景加载失败，请刷新页面后重试。';
  document.body.appendChild(message);
});

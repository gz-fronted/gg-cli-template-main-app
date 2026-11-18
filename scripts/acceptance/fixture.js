exports.provider = function () {
 let root, listener;
 return {
 render({dom, props, appName}) {
  window.qaStats ||= {mount:0,destroy:0,listeners:0}; window.qaStats.mount++; window.qaStats.listeners++;
  root=document.createElement('section'); root.dataset.qa=appName;
  const output=document.createElement('output'); output.textContent=props.globalState.routePath;
  const input=document.createElement('input'); input.placeholder='保活状态';
  const logout=document.createElement('button');logout.textContent='子应用退出';logout.onclick=()=>window.postMessage({event:'g-user-logout',appId:appName,tabId:appName},location.origin);
  root.append(output,input,logout);dom.append(root);
  listener=e=>{if(e.detail.appId===appName)output.textContent=e.detail.routePath;};
  window.addEventListener('pilotcore:host-subapp-route',listener);
 },
 destroy(){ window.qaStats.destroy++;window.qaStats.listeners--;window.removeEventListener('pilotcore:host-subapp-route',listener);root.remove();root=null;listener=null; }
 };
};
// Deterministic browser fixtures exercise the real match -> spin -> reward UI.
// Routes are intercepted only by this test; production exposes no reward/debug controls.
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const config=JSON.parse(fs.readFileSync('levels/slots.json','utf8'));
const fixture={id:'slot-test',name:'Slot test',colors:3,ballCount:40,ballRadius:18,feedSpacing:37,speed:.001,shotSpeed:1150,path:{type:'polyline',points:[[900,280],[100,280]]}};
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{for(const reward of config.rewards){
   const page=await browser.newPage(devices['iPhone 13']),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/levels/campaign.json',route=>route.fulfill({json:{version:1,levels:[fixture]}}));
   await page.route('**/levels/slots.json',route=>route.fulfill({json:{...config,ballsPerSpin:3,rewards:[reward]}}));
   await page.goto('http://127.0.0.1:4174');await page.selectOption('#controls','mouse');await page.click('#play');
   const box=await page.locator('#game').boundingBox(),scale=Math.min(box.width,box.height)/1000;
   await page.mouse.click(box.x+box.width/2+10*scale,box.y+box.height/2-220*scale);
   await page.waitForSelector('#slot-panel[data-phase=spinning]');
   if(reward.type==='gold'){
    await page.click('#pause');const reels=await page.locator('.reels').innerText();await page.waitForTimeout(350);assert.equal(await page.locator('.reels').innerText(),reels);assert.equal(await page.locator('#gold').innerText(),'0');await page.click('#play');
    await page.screenshot({path:`test-results/${name}-slots-spin.png`});
   }
   await page.waitForSelector('#slot-panel[data-phase=result]');
   const result=await page.locator('#slot-result').innerText();assert.ok(result.includes(reward.type==='none'?'No reward':reward.label),result);
   if(reward.type==='gold')assert.equal(await page.locator('#gold').innerText(),'1');
   if(['preview','burning','infection'].includes(reward.type))assert.ok((await page.locator('#power-status').innerText()).toLowerCase().includes(reward.type));
   await page.screenshot({path:`test-results/${name}-slots-${reward.type}.png`});
   if(reward.type==='burning'){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);await page.screenshot({path:`test-results/${name}-slots-landscape.png`});}
   assert.deepEqual(errors,[]);console.log(`${name}: ${reward.type} PASS real shot, match, spin, result and HUD`);await page.close();
  }
  const page=await browser.newPage({...devices['iPhone 13'],viewport:{width:375,height:667}});await page.goto('http://127.0.0.1:4174');await page.selectOption('#controls','two');await page.click('#play');await page.waitForTimeout(100);await page.screenshot({path:`test-results/${name}-slots-small-phone.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);assert.ok(await page.locator('#slot-panel').isVisible());assert.ok(await page.locator('#fire-pad').isVisible());await page.close();
  const lifecycle=await browser.newPage(devices['iPhone 13']);
  await lifecycle.route('**/levels/campaign.json',route=>route.fulfill({json:{version:1,levels:[{...fixture,ballCount:2},{...fixture,ballCount:2}]}}));
  await lifecycle.route('**/levels/slots.json',route=>route.fulfill({json:{...config,ballsPerSpin:3,rewards:[config.rewards.find(r=>r.type==='gold')]}}));
  await lifecycle.goto('http://127.0.0.1:4174');await lifecycle.selectOption('#controls','mouse');await lifecycle.click('#play');
  const finish=async()=>{const box=await lifecycle.locator('#game').boundingBox(),scale=Math.min(box.width,box.height)/1000;await lifecycle.mouse.click(box.x+box.width/2-285*scale,box.y+box.height/2-220*scale);await lifecycle.waitForSelector('#slot-panel[data-phase=result]');assert.equal(await lifecycle.locator('#gold').innerText(),'1');};
  await finish();await lifecycle.click('#settings');await lifecycle.click('#restart');await lifecycle.waitForFunction(()=>document.querySelector('#gold').textContent==='0');
  await finish();await lifecycle.waitForSelector('#menu[open]');await lifecycle.click('#play');await lifecycle.waitForTimeout(50);assert.equal(await lifecycle.locator('#level').innerText(),'02');assert.equal(await lifecycle.locator('#gold').innerText(),'1');await lifecycle.click('#settings');await lifecycle.click('#restart');await lifecycle.waitForTimeout(50);assert.equal(await lifecycle.locator('#gold').innerText(),'1');await lifecycle.close();console.log(`${name}: gold checkpoint, retry and level transition PASS`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});

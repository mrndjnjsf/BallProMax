const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,type,options] of [['chromium-mobile',chromium,{...devices['iPhone 13'],defaultBrowserType:undefined}],['webkit-mobile',webkit,{...devices['iPhone 13'],defaultBrowserType:undefined}],['chromium-desktop',chromium,{viewport:{width:1280,height:800}}]]){
 let browser;try{browser=await type.launch({headless:true});}catch(e){console.log(`${name}: UNAVAILABLE ${e.message.split('\n')[0]}`);continue;}
 const page=await browser.newPage(options),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174');await page.waitForSelector('#menu[open]');
 await page.selectOption('#controls','one');await page.click('#play');await page.waitForTimeout(300);
 const box=await page.locator('#game').boundingBox();const size=Math.min(box.width,box.height),cx=box.x+box.width/2,cy=box.y+box.height/2;
 await page.locator('#game').dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy});
 await page.locator('#game').dispatchEvent('pointerup',{pointerId:11,pointerType:'touch',clientX:cx,clientY:cy});
 await page.waitForTimeout(500);await page.screenshot({path:`test-results/${name}-portrait.png`});
 await page.click('#settings');await page.selectOption('#controls','two');await page.click('#play');
 if(!await page.locator('#fire-pad').isVisible())throw Error('Missing fire pad');await page.locator('#fire-pad').dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.screenshot({path:`test-results/${name}-landscape.png`});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1);if(overflow)throw Error(`${name}: page overflow`);
 await page.click('#settings');await page.reload();await page.waitForSelector('#menu[open]');if(await page.inputValue('#controls')!=='two')throw Error('Settings not saved');
 if(errors.length)throw Error(`${name}: ${errors.join('; ')}`);console.log(`${name}: PASS launch, shoot, settings, two-hand pads, rotate, persistence, no JS errors`);await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});

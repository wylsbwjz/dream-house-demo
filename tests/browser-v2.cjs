const { chromium } = require('E:/Codex/Runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = 'E:/Codex/Projects/2026-10-28/dream-house/demo';
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(root, '.playwright');
const BASE = process.env.DEMO_URL || 'http://127.0.0.1:4317';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const checks = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('dream-house-agent-v2')));
  const shot = async (name) => {
    await page.waitForTimeout(220);
    await page.screenshot({ path: path.join(root, 'qa/v2/' + name + '.png') });
  };
  const runTask = async () => {
    await page.getByRole('button', { name: /寻找更合适的替代/ }).click();
    await page.waitForTimeout(220);
    await page.locator('.example-card').first().click();
    await page.getByTestId('parse-brief').click();
    await page.waitForTimeout(250);
    await page.getByTestId('confirm-intent').click();
    await page.getByTestId('candidates').waitFor({ timeout: 8000 });
    await page.waitForTimeout(250);
  };
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByTestId('official-cost').innerText(), '¥8,080');
    assert.equal(await page.getByTestId('home-enter-space').isVisible(), true);
    checks.push('landing on home overview');
    await page.getByTestId('home-enter-space').click();
    await page.waitForTimeout(400);
    checks.push('open C v3 space');

    // 无限画布：素材簇 + 缩略图定位
    await page.getByTestId('nav-canvas').click();
    await page.waitForTimeout(500);
    for (const id of ['canvas-palette', 'canvas-materials', 'canvas-refs', 'canvas-furniture', 'canvas-notes', 'canvas-focus']) {
      assert.equal(await page.getByTestId(id).count() >= 1, true, `canvas cluster ${id}`);
    }
    const camBefore = await page.locator('.canvas-board').evaluate((el) => el.style.transform);
    await page.locator('.minimap-map').click({ position: { x: 8, y: 8 } });
    await page.waitForTimeout(350);
    const camAfter = await page.locator('.canvas-board').evaluate((el) => el.style.transform);
    assert.notEqual(camBefore, camAfter);
    checks.push('canvas hosts material clusters and minimap navigation');
    await page.getByTestId('nav-space').click();
    await page.waitForTimeout(400);

    // 示例只填入
    await page.getByRole('button', { name: /寻找更合适的替代/ }).click();
    await page.locator('.example-card').first().click();
    await page.waitForTimeout(200);
    assert.equal((await saved()).version, 3);
    assert.equal((await page.getByTestId('official-cost').innerText()), '¥8,080');
    checks.push('example fills only, no commit');

    await page.getByTestId('parse-brief').click();
    await page.waitForTimeout(250);
    assert.equal(await page.getByTestId('confirm-intent').isVisible(), true);
    await page.getByTestId('confirm-intent').click();
    await page.getByTestId('candidates').waitFor({ timeout: 8000 });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.candidate-card').count(), 2);
    assert.equal(await page.getByTestId('apply-button').count(), 1);
    const artLite = await page.locator('[data-testid="candidate-T150L"] .candidate-art').innerHTML();
    const artT140 = await page.locator('[data-testid="candidate-T140"] .candidate-art').innerHTML();
    assert.notEqual(artLite, artT140);
    await page.getByTestId('candidate-T150L').click();
    await page.waitForTimeout(300);
    const tableLite = await page.getByTestId('room-table').innerHTML();
    await page.getByTestId('candidate-T140').click();
    await page.waitForTimeout(350);
    const tableT140 = await page.getByTestId('room-table').innerHTML();
    assert.notEqual(tableLite, tableT140);
    checks.push('two eligible candidates, apply visible');
    checks.push('candidate art and space table visibly change per product');

    // 预览不写正式金额
    await page.getByTestId('candidate-T140').click();
    await page.waitForTimeout(350);
    assert.equal(await page.getByTestId('official-cost').innerText(), '¥8,080');
    assert.equal(await page.getByTestId('preview-cost').innerText().then((t) => t.includes('¥7,580')), true);
    assert.equal(await page.getByTestId('footprint').first().getAttribute('data-length'), '140');
    checks.push('preview changes geometry but not formal cost');

    await page.getByTestId('nav-budget').click();
    await page.waitForTimeout(350);
    assert.ok((await page.getByTestId('budget-row-table-01').innerText()).includes('T150'));
    assert.equal(await page.getByTestId('budget-known').innerText(), '¥8,080');
    assert.equal(await page.getByTestId('budget-candidate-row').count(), 1);
    checks.push('budget keeps formal row and adds candidate row');

    await page.getByTestId('nav-space').click();
    await page.waitForTimeout(300);
    await page.getByTestId('apply-button').click();
    await page.waitForTimeout(500);
    assert.equal(await page.getByTestId('official-cost').innerText(), '¥7,580');
    assert.equal((await saved()).version, 4);
    assert.equal((await saved()).objects.find((o) => o.id === 'table-01').productId, 'T140');
    checks.push('apply atomically commits C v4');

    await page.getByTestId('nav-budget').click();
    await page.waitForTimeout(300);
    assert.ok((await page.getByTestId('budget-row-table-01').innerText()).includes('T140'));
    assert.equal(await page.getByTestId('budget-known').innerText(), '¥7,580');
    checks.push('budget follows applied product');

    await page.getByTestId('nav-compare').click();
    await page.waitForTimeout(400);
    const compareText = await page.locator('.compare-grid').innerText();
    assert.ok(compareText.includes('C v4'));
    assert.ok((await page.getByTestId('compare-versions').innerText()).includes('C v3'));
    assert.ok((await page.getByTestId('compare-versions').innerText()).includes('C v4'));
    checks.push('compare pins v3 and v4');

    // 移动后撤销：保留位置
    await page.getByTestId('nav-space').click();
    await page.waitForTimeout(350);
    await page.getByTestId('room-table').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    await page.locator('.applied-actions .danger-ghost-btn').click();
    await page.waitForTimeout(500);
    const savedAfterUndo = await saved();
    assert.equal(await page.getByTestId('official-cost').innerText(), '¥8,080');
    assert.equal(savedAfterUndo.version, 5);
    assert.equal(savedAfterUndo.objects.find((o) => o.id === 'table-01').productId, 'T150');
    assert.equal(savedAfterUndo.objects.find((o) => o.id === 'table-01').x, 358);
    checks.push('undo restores product while keeping later position');

    // 过期与重校验
    await page.getByRole('button', { name: /再做一次替换/ }).click();
    await page.waitForTimeout(250);
    await page.locator('.example-card').first().click();
    await page.getByTestId('parse-brief').click();
    await page.waitForTimeout(220);
    await page.getByTestId('confirm-intent').click();
    await page.getByTestId('candidates').waitFor({ timeout: 8000 });
    await page.waitForTimeout(250);
    await page.getByTestId('room-table').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(350);
    await page.getByTestId('stale-banner').waitFor();
    assert.equal(await page.getByTestId('apply-button').count(), 0);
    checks.push('moving the table marks the proposal stale and blocks apply');
    await page.getByTestId('recheck').click();
    await page.getByTestId('candidates').waitFor({ timeout: 8000 });
    await page.waitForTimeout(350);
    assert.equal(await page.getByTestId('apply-button').count(), 1);
    assert.equal(await page.getByTestId('footprint').first().getAttribute('data-x'), '368');
    checks.push('recheck preserves the new position');

    // 刷新恢复
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert.equal((await saved()).version, 5);
    assert.equal(await page.getByTestId('official-cost').innerText(), '¥8,080');
    checks.push('reload restores saved formal state');

    // 链路 B：对比 → 决策笔记 → 笔记找回
    await page.getByTestId('home-enter-space').click();
    await page.waitForTimeout(350);
    await page.getByTestId('nav-compare').click();
    await page.waitForTimeout(400);
    assert.equal(await page.getByTestId('compare-conclusion').count(), 1);
    await page.getByTestId('save-decision-note').click();
    await page.waitForTimeout(350);
    assert.ok((await page.locator('.note-context-rows').innerText()).includes('C v3'));
    await page.locator('.note-reason-chips button').first().click();
    await page.getByTestId('note-save').click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: '灵感' }).click();
    await page.waitForTimeout(400);
    await page.locator('.ant-tabs-tab').filter({ hasText: '我的笔记' }).click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.note-row').count(), 1);
    await page.locator('.note-row .soft-btn').first().click();
    await page.waitForTimeout(300);
    assert.equal(await page.getByRole('button', { name: /回到当时的对比/ }).count(), 1);
    await page.keyboard.press('Escape');
    checks.push('decision note saved and links back to compare');

    // 链路 A：灵感 → 设计要素 → 意图摘要
    await page.locator('.ant-tabs-tab').filter({ hasText: '发现' }).click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="fav-insp-nordic"]:visible').click();
    await page.waitForTimeout(250);
    await page.locator('.ant-tabs-tab').filter({ hasText: '收藏' }).click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('[data-testid="insp-insp-nordic"]:visible').count(), 1);
    checks.push('favorite shows in favorites tab');
    await page.locator('.ant-tabs-tab').filter({ hasText: '发现' }).click();
    await page.waitForTimeout(250);
    await page.locator('[data-testid="insp-insp-nordic"]:visible').locator('.insp-cover').click();
    await page.waitForTimeout(350);
    await page.getByTestId('insp-generate').click();
    await page.waitForTimeout(400);
    const draft = await page.getByTestId('brief-input').inputValue();
    assert.ok(draft.includes('参考《浅木色小户型'));
    assert.ok(draft.includes('长至少 140cm'));
    await page.getByTestId('parse-brief').click();
    await page.waitForTimeout(250);
    await page.getByTestId('confirm-intent').click();
    await page.getByTestId('candidates').waitFor({ timeout: 8000 });
    assert.equal(await page.locator('.candidate-card').count(), 2);
    checks.push('inspiration elements enter the same intent chain');

    // 预算待确认筛选
    await page.getByTestId('nav-budget').click();
    await page.waitForTimeout(350);
    await page.getByTestId('budget-filter-pending').click();
    await page.waitForTimeout(250);
    assert.equal(await page.getByTestId('budget-pending-row').count(), 1);
    checks.push('budget pending filter isolates unknown cost');

    // 无结果 + 组合放宽
    await page.getByTestId('nav-space').click();
    await page.waitForTimeout(300);
    await page.getByLabel('退出任务').click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: /寻找更合适的替代/ }).click();
    await page.waitForTimeout(220);
    await page.getByTestId('brief-input').fill('只换这张餐桌，预算 1000 元，尺寸保持 150×80cm，其他不变。');
    await page.getByTestId('parse-brief').click();
    await page.waitForTimeout(220);
    await page.getByTestId('confirm-intent').click();
    await page.getByTestId('empty-results').waitFor({ timeout: 8000 });
    assert.ok((await page.locator('.relax-option').first().innerText()).includes('1,899'));
    checks.push('no-result state is honest and offers a combined relaxation');

    // 1280
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push('1280 no horizontal overflow');

    assert.deepEqual(errors, []);
    const report = { pass: true, checks, errors, time: new Date().toISOString() };
    fs.mkdirSync(path.join(root, 'qa/v2'), { recursive: true });
    fs.writeFileSync(path.join(root, 'qa/v2/browser-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    console.error(e);
    await shot('failure');
    console.log('ERRORS', errors);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

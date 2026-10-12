'use strict';
(() => {
  const data = window.RESEARCH;
  if (!data) return;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const num = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', {maximumFractionDigits:digits,minimumFractionDigits:0}).format(value);
  const money = value => `${num(value)} Kč`;
  const sourceLink = (url, label) => /^https?:\/\//.test(url) ? `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a>` : escape(label);
  const links = urls => String(urls).split(' | ').map((url, index) => sourceLink(url.trim(), `Zdroj ${index + 1} ↗`)).join(' · ');
  const offer = value => value === 'ano' ? '' : 'unknown';

  function renderCompetitors() {
    const search = normalize($('competitor-search').value.trim());
    const role = $('competitor-role').value;
    const region = $('competitor-region').value;
    const material = $('competitor-material').value;
    const rows = data.competitors.filter(row =>
      (!search || normalize(Object.values(row).join(' ')).includes(search)) &&
      (role === 'all' || row.role_v_pruzkumu === (role === 'main' ? 'hlavní profil' : 'doplňující profil')) &&
      (region === 'all' || row.skupina === (region === 'local' ? 'místní adresní vztah' : 'mimobrněnské zázemí')) &&
      (material === 'all' || (row.epoxid === 'ano' && row.polyuretan === 'ano'))
    );
    $('competitor-count').textContent = `${rows.length} z ${data.competitors.length} profilů`;
    $('competitor-rows').innerHTML = rows.length ? rows.map(row => `<tr>
      <td><strong>${escape(row.firma)}</strong><span class="domain">${sourceLink(row.zdroje.split(' | ')[0], row.domena + ' ↗')}</span>${row.role_v_pruzkumu === 'doplňující profil' ? '<span class="meta">Doplňující profil</span>' : ''}</td>
      <td>${escape(row.skupina)}<span class="meta">${row.skupina === 'místní adresní vztah' ? 'Sídlo / pobočka / showroom / okolí' : 'Nabídka nebo reference pro Brno'}</span></td>
      <td><div class="offer"><span class="${offer(row.epoxid)}">EP${row.epoxid === 'ano' ? ' ✓' : ' ?'}</span><span class="${offer(row.polyuretan)}">PU${row.polyuretan === 'ano' ? ' ✓' : ' ?'}</span></div></td>
      <td><p>${escape(row.segmenty.replaceAll(' | ', ' · '))}</p><details><summary>Profil, poptávka a zdroje</summary><p><b>Vztah k Brnu:</b> ${escape(row.vztah_k_brnu)}</p><p><b>Komunikovaná témata:</b> ${escape(row.pozorovana_temata.replaceAll(' | ', ' · '))}</p><p><b>Cesta k poptávce:</b> ${escape(row.poptavka)}</p><p><b>Reference:</b> ${escape(row.reference)}</p><p><b>Cena / limity:</b> ${escape(row.cena_a_limity)}</p><p>${links(row.zdroje)}</p><p class="footnote">Kontrola ${escape(row.datum_kontroly)} · ${escape(row.povaha_dat)}</p></details></td>
    </tr>`).join('') : '<tr><td colspan="4" class="empty-row">Žádný profil neodpovídá filtrům. Zkus širší hledání.</td></tr>';
  }

  const clusters = [...new Set(data.keywords.map(row => row.skupina))];
  $('keyword-cluster').insertAdjacentHTML('beforeend', clusters.map(cluster => `<option value="${escape(cluster)}">${escape(cluster)}</option>`).join(''));
  function renderKeywords() {
    const search = normalize($('keyword-search').value.trim());
    const cluster = $('keyword-cluster').value;
    const priority = $('keyword-priority').value;
    const status = $('keyword-status').value;
    const rows = data.keywords.filter(row =>
      (!search || normalize(row.fraze).includes(search)) &&
      (cluster === 'all' || row.skupina === cluster) &&
      (priority === 'all' || row.priorita.includes(priority)) &&
      (status === 'all' || (row.status_fraze.startsWith('pozorovaná') === (status === 'observed')))
    );
    $('keyword-count').textContent = `${rows.length} z ${data.keywords.length} frází`;
    $('keyword-rows').innerHTML = rows.length ? rows.map(row => {
      const observed = row.status_fraze.startsWith('pozorovaná');
      return `<tr><td><strong>${escape(row.fraze)}</strong><span class="keyword-status ${observed ? 'observed' : ''}">${observed ? sourceLink(row.zdroj, '● Pozorované téma ↗') : '○ Analytický návrh k ověření'}</span></td><td>${escape(row.skupina)}</td><td>${escape(row.zamer)}<br><span class="priority">${escape(row.priorita)}</span></td><td><span class="unmeasured">Nezjištěno<small>Google i Seznam / měsíc<br>CPC: nezjištěno</small></span></td><td><span class="slug">${escape(row.navrh_stranky)}</span></td></tr>`;
    }).join('') : '<tr><td colspan="5" class="empty-row">Žádná fráze neodpovídá filtrům. Zkus jinou skupinu nebo prioritu.</td></tr>';
  }

  const priceLabels = {realizace:'Realizační nabídka',realizace_polozka:'Jednotlivá položka',material:'Pouze materiál',historicka_realizace:'Historická zakázka'};
  function renderPrices() {
    const selected = $('price-category').value;
    const rows = data.prices.filter(row => selected === 'all' || row.kategorie === selected);
    $('price-count').textContent = `${rows.length} z ${data.prices.length} položek`;
    $('price-rows').innerHTML = rows.map(row => {
      let price = row.typ_ceny === 'from' ? `od ${num(Number(row.cena_od))}` : row.cena_do !== 'nezjištěno' && row.cena_do !== row.cena_od ? `${num(Number(row.cena_od))}–${num(Number(row.cena_do))}` : num(Number(row.cena_od));
      return `<tr><td><strong>${escape(row.firma)}</strong><p>${escape(row.produkt)}</p>${sourceLink(row.zdroj,'Primární zdroj ↗')}</td><td><strong class="price-value">${escape(price)}</strong><span class="meta">${escape(row.jednotka)}</span>${row.plocha !== 'nezjištěno' ? `<span class="meta">Plocha: ${escape(row.plocha)}</span>` : ''}</td><td><span class="pill ${row.kategorie === 'historicka_realizace' ? 'pill-estimate' : 'pill-light'}">${escape(priceLabels[row.kategorie] || row.kategorie)}</span><span class="meta">DPH: ${escape(row.dph)}</span></td><td><p>${row.rozsah !== 'nezjištěno' ? escape(row.rozsah) : 'Rozsah zahrnutých prací nezjištěn.'}</p><span class="meta">Realizace / platnost: ${escape(row.datum_realizace_nebo_platnosti)}</span><details><summary>Omezení a poznámka</summary><p>${escape(row.poznamka)}</p><p>Kontrola zdroje: ${escape(row.datum_kontroly)}</p></details></td></tr>`;
    }).join('');
  }

  $('serp-rows').innerHTML = data.serp.map(row => `<tr><td>${escape(row.dotaz)}</td><td>${escape(row.poradi_webovych_vysledku)}</td><td>${sourceLink(row.url,row.domena + ' ↗')}</td><td>${escape(row.kategorie)}</td></tr>`).join('');
  $('ads-rows').innerHTML = data.ads.map(row => `<tr><td>${escape(row.dotaz)}</td><td><strong>${escape(row.domena)}</strong>${escape(row.znacka)}</td><td>${escape(row.pozorovane_sdeleni)}</td></tr>`).join('');
  const validAudit = data.audit.filter(row => row.stav === 'čitelný HTML vzorek');
  const auditMetrics = [
    ['Meta description', row => Number(row.meta_description_znaky) > 0],
    ['Canonical', row => row.canonical_nalezen === 'ano'],
    ['Alespoň jeden H1', row => Number(row.h1_pocet) > 0],
    ['Telefonní odkaz tel:', row => Number(row.tel_odkazy_pocet) > 0],
    ['HTML formulář', row => Number(row.form_pocet) > 0],
    ['JSON-LD skript', row => Number(row.jsonld_skripty_pocet) > 0]
  ];
  $('audit-bars').innerHTML = auditMetrics.map(([label, predicate]) => {
    const count = validAudit.filter(predicate).length;
    const percent = count / validAudit.length * 100;
    return `<div class="audit-bar"><div class="bar-label"><span>${escape(label)}</span><strong>${count} / ${validAudit.length} · ${num(percent)} %</strong></div><div class="bar-track" aria-hidden="true"><span style="width:${percent}%"></span></div></div>`;
  }).join('');

  function calculate() {
    const media = Number($('media').value);
    const cpc = Math.max(1, Number($('cpc').value));
    const conversion = Math.max(0, Number($('conversion').value)) / 100;
    const winrate = Math.max(0, Number($('winrate').value)) / 100;
    const management = Math.max(0, Number($('management').value));
    const clicks = media / cpc;
    const leads = clicks * conversion;
    const jobs = leads * winrate;
    $('media-display').textContent = money(media);
    $('total-cost').textContent = money(media + management);
    $('calc-clicks').textContent = num(clicks,1);
    $('calc-leads').textContent = num(leads,1);
    $('calc-jobs').textContent = num(jobs,1);
    $('calc-cpl').textContent = leads > 0 ? money(media / leads) : '—';
    $('calc-cpa').textContent = jobs > 0 ? money((media + management) / jobs) : '—';
  }

  ['competitor-search','competitor-role','competitor-region','competitor-material'].forEach(id => $(id).addEventListener('input', renderCompetitors));
  ['keyword-search','keyword-cluster','keyword-priority','keyword-status'].forEach(id => $(id).addEventListener('input', renderKeywords));
  $('price-category').addEventListener('input',renderPrices);
  ['media','cpc','conversion','winrate','management'].forEach(id => $(id).addEventListener('input', calculate));
  $('copy-prompt').addEventListener('click',async () => {
    let prompt = data.prompt;
    try { const response = await fetch('./data/prompt-pruzkum-podlahy-brno.txt'); if(response.ok) prompt = await response.text(); } catch (_) {}
    try { await navigator.clipboard.writeText(prompt); $('copy-status').textContent = 'Prompt je zkopírovaný do schránky.'; }
    catch (_) { $('copy-status').textContent = 'Kopírování není dostupné. Použij tlačítko „Upravený prompt ↓“.'; }
  });
  const sectionLinks = [...document.querySelectorAll('.nav-inner a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        sectionLinks.forEach(link => {const active = link.getAttribute('href') === '#' + entry.target.id;link.classList.toggle('active',active);if(active) link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
      });
    },{rootMargin:'-10% 0px -65% 0px',threshold:0});
    document.querySelectorAll('main .section').forEach(section => observer.observe(section));
  }
  renderCompetitors();renderKeywords();renderPrices();calculate();
})();

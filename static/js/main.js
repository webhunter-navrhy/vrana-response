// Vrána Response – menu, plánovač ročního programu, záložky, výběr zájmu, formulář.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- mobilní menu ---------- */
  var menuTl = $('.menu-tl'), menu = $('#menu');
  if (menuTl && menu) {
    var zavri = function () { menu.classList.remove('otevreno'); menuTl.setAttribute('aria-expanded', 'false'); };
    menuTl.addEventListener('click', function () {
      var o = menu.classList.toggle('otevreno');
      menuTl.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', zavri); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zavri(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hlavicka')) zavri(); });
  }

  /* ---------- formulář: zájem ---------- */
  var form = $('form.formular');
  function zaskrtni(hodnota) {
    if (!form) return;
    $$('input[name="zajem"]', form).forEach(function (i) { if (i.value === hodnota) i.checked = true; });
  }
  $$('[data-zajem]').forEach(function (a) {
    a.addEventListener('click', function () { zaskrtni(a.getAttribute('data-zajem')); });
  });

  /* ---------- plánovač ročního programu ---------- */
  var p = $('[data-planovac]');
  var dataEl = $('#okruhy-data');
  if (p && dataEl) {
    var okruhy = JSON.parse(dataEl.textContent);
    var MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
    var rezim = 12;
    var vybrane6 = [1, 2, 3, 4, 5, 6];
    var elMesice = $('[data-mesice]', p), elNap = $('[data-napoveda]', p), elSouhrn = $('[data-souhrn]', p);
    var elStart = $('[data-start]', p);
    var tlRezim = $$('[data-rezim]', p), tlOkruh = $$('.okruh', p);
    var podle = function (c) { return okruhy.filter(function (o) { return o.c === c; })[0]; };
    var dvojmistne = function (n) { return (n < 10 ? '0' : '') + n; };

    var plan = function () {
      var start = parseInt(elStart.value, 10) || 0;
      var vysl = [];
      var serazene = vybrane6.slice().sort(function (a, b) { return a - b; });
      for (var i = 0; i < 12; i++) {
        var m = (start + i) % 12;
        if (rezim === 12) vysl.push({ m: m, kurz: i + 1, o: okruhy[i] });
        else if (i % 2 === 0) vysl.push({ m: m, kurz: i / 2 + 1, o: serazene[i / 2] ? podle(serazene[i / 2]) : null });
        else vysl.push({ m: m, volno: true });
      }
      return vysl;
    };

    var vykresli = function () {
      p.setAttribute('data-rezim', String(rezim));
      tlRezim.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-rezim') === String(rezim) ? 'true' : 'false'); });
      tlOkruh.forEach(function (b) {
        var c = parseInt(b.getAttribute('data-c'), 10);
        b.setAttribute('aria-pressed', rezim === 12 || vybrane6.indexOf(c) > -1 ? 'true' : 'false');
        if (rezim === 12) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      });
      elMesice.textContent = '';
      plan().forEach(function (x, idx) {
        var li = document.createElement('li');
        li.className = 'mesic' + (x.volno ? ' mesic-volno' : (x.o ? '' : ' mesic-prazdny'));
        li.style.animationDelay = (idx * 25) + 'ms';
        var hlava = '<span class="mesic-m">' + MESICE[x.m] + '<small>' + (x.volno ? 'bez kurzu' : x.kurz + '. kurz') + '</small></span>';
        if (x.volno) li.innerHTML = hlava + '<span class="mesic-n">Volný měsíc</span>';
        else if (x.o) li.innerHTML = hlava + '<span class="mesic-n">' + x.o.nazev + '</span><span class="mesic-c">' + dvojmistne(x.o.c) + '</span>';
        else li.innerHTML = hlava + '<span class="mesic-n">Vyberte okruh v seznamu</span>';
        elMesice.appendChild(li);
      });
      elNap.classList.remove('varovani');
      if (rezim === 12) {
        elNap.textContent = 'Každý měsíc jeden okruh, všech 12 za rok.';
        elSouhrn.innerHTML = '12 kurzů · <em>12 okruhů</em> · cena na dotaz';
      } else {
        var zbyva = 6 - vybrane6.length;
        elNap.textContent = zbyva > 0
          ? 'Vyberte ještě ' + zbyva + (zbyva === 1 ? ' okruh.' : (zbyva < 5 ? ' okruhy.' : ' okruhů.'))
          : 'Vybráno 6 okruhů z 12. Kliknutím je můžete vyměnit.';
        elSouhrn.innerHTML = '6 kurzů · <em>každý druhý měsíc</em> · cena na dotaz';
      }
    };

    tlRezim.forEach(function (b) {
      b.addEventListener('click', function () { rezim = parseInt(b.getAttribute('data-rezim'), 10); vykresli(); });
      b.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var dalsi = tlRezim[(tlRezim.indexOf(b) + 1) % tlRezim.length];
        dalsi.focus(); dalsi.click();
      });
    });
    tlOkruh.forEach(function (b) {
      b.addEventListener('click', function () {
        if (rezim === 12) {
          elNap.textContent = 'Při kurzu každý měsíc projdete všech 12 okruhů. Šest si vyberete u varianty každý druhý měsíc.';
          elNap.classList.add('varovani');
          return;
        }
        var c = parseInt(b.getAttribute('data-c'), 10), i = vybrane6.indexOf(c);
        if (i > -1) vybrane6.splice(i, 1);
        else if (vybrane6.length < 6) vybrane6.push(c);
        else { elNap.textContent = 'Už máte vybráno 6 okruhů. Nejdřív jeden odeberte.'; elNap.classList.add('varovani'); return; }
        vykresli();
      });
    });
    elStart.addEventListener('change', vykresli);

    var tlPlan = $('[data-poptat-plan]', p);
    if (tlPlan && form) {
      tlPlan.addEventListener('click', function () {
        var radky = plan().filter(function (x) { return !x.volno; }).map(function (x) {
          return MESICE[x.m] + ': ' + (x.o ? dvojmistne(x.o.c) + ' ' + x.o.nazev : '(okruh doplníme)');
        });
        var hlavicka = rezim === 12 ? 'Roční program – každý měsíc (12 kurzů)' : 'Roční program – každý druhý měsíc (6 kurzů)';
        $('textarea[name="plan"]', form).value = hlavicka + ', začátek: ' + MESICE[parseInt(elStart.value, 10) || 0] + '\n' + radky.join('\n');
        $('.pole-plan', form).hidden = false;
        $$('input[data-plan]', form).forEach(function (i) { i.checked = i.getAttribute('data-plan') === String(rezim); });
      });
    }
    vykresli();
  }

  if (form) {
    var zrusit = $('.plan-zrusit', form);
    if (zrusit) zrusit.addEventListener('click', function () {
      $('textarea[name="plan"]', form).value = '';
      $('.pole-plan', form).hidden = true;
      $$('input[data-plan]', form).forEach(function (i) { i.checked = false; });
    });
  }

  /* ---------- záložky Pro koho ---------- */
  var taby = $$('.zalozky [role="tab"]');
  var vyber = function (t, fokus) {
    taby.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(x.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (fokus) t.focus();
  };
  taby.forEach(function (t, i) {
    t.addEventListener('click', function () { vyber(t); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = taby[(i + 1) % taby.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = taby[(i - 1 + taby.length) % taby.length];
      else if (e.key === 'Home') n = taby[0];
      else if (e.key === 'End') n = taby[taby.length - 1];
      if (n) { e.preventDefault(); vyber(n, true); }
    });
  });

  /* ---------- formulář: demo / ostrý režim ---------- */
  $$('form.formular').forEach(function (f) {
    var stav = f.querySelector('.formular-stav');
    f.addEventListener('submit', function (e) {
      var endpoint = f.getAttribute('data-endpoint');
      var demo = f.getAttribute('data-demo') === '1';
      e.preventDefault();
      if (f.querySelector('.past input').value) return;
      if (demo || !endpoint) {
        stav.textContent = 'Ukázka formuláře: nic se neodesílá. Po spuštění webu bude poptávka doručena na e-mail.';
        return;
      }
      stav.textContent = 'Odesílám…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); stav.textContent = 'Děkujeme, poptávka byla odeslána. Ozveme se co nejdříve.'; })
        .catch(function () { stav.textContent = 'Odeslání se nepodařilo. Napište prosím na e-mail uvedený vlevo.'; });
    });
  });
})();

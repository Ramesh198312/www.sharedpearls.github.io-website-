/* =========================================================================
   SENTENCE STRUCTURE — INTERACTIVITY
   ========================================================================= */
(function(){
  "use strict";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===================================================================
     NAVIGATION
     =================================================================== */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }));

  const progressFill = document.getElementById("progressFill");
  function updateProgress(){
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    progressFill.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  document.getElementById("backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ===================================================================
     HERO BACKGROUND — lightweight animated constituent network (canvas2D)
     =================================================================== */
  (function heroCanvas(){
    const canvas = document.getElementById("heroCanvas");
    const ctx = canvas.getContext("2d");
    let w, h, nodes = [];
    function resize(){
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    function buildNodes(){
      nodes = [];
      const count = Math.min(46, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 24000));
      for (let i = 0; i < count; i++){
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
          vy: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
          r: (Math.random() * 1.6 + 1) * devicePixelRatio
        });
      }
    }
    function step(){
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++){
        for (let j = i + 1; j < nodes.length; j++){
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const maxDist = 160 * devicePixelRatio;
          if (dist < maxDist){
            ctx.strokeStyle = `rgba(179,144,79,${0.14 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.fillStyle = "rgba(203,166,88,0.55)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      if (!prefersReducedMotion) requestAnimationFrame(step);
    }
    window.addEventListener("resize", () => { resize(); buildNodes(); });
    resize(); buildNodes(); step();
  })();

  /* ===================================================================
     3D SYNTAX TREE (Three.js)
     =================================================================== */
  (function syntaxTree3D(){
    // ---- layout: assign leaf-order x, depth y, branch-based z ----
    let leafCounter = 0;
    function assignX(node){
      if (!node.children || node.children.length === 0){
        node._x = leafCounter; leafCounter += 1;
      } else {
        node.children.forEach(assignX);
        const xs = node.children.map(c => c._x);
        node._x = (Math.min(...xs) + Math.max(...xs)) / 2;
      }
    }
    assignX(TREE_DATA);

    function assignZ(node, zBase){
      node._z = zBase;
      if (node.children && node.children.length){
        const n = node.children.length;
        node.children.forEach((c, i) => {
          const childZ = n > 1 ? zBase + (i - (n - 1) / 2) * 70 : zBase;
          assignZ(c, childZ);
        });
      }
    }
    assignZ(TREE_DATA, 0);

    const flat = [];
    function flatten(node, depth, parent){
      flat.push({ node, depth, parent });
      (node.children || []).forEach(c => flatten(c, depth + 1, node));
    }
    flatten(TREE_DATA, 0, null);

    const spacingX = 52, spacingY = 78;
    const centerX = leafCounter > 1 ? (leafCounter - 1) / 2 : 0;
    flat.forEach(item => {
      item.pos = {
        x: (item.node._x - centerX) * spacingX,
        y: -item.depth * spacingY + 150,
        z: item.node._z
      };
    });

    const categoryColor = (cat) => {
      if (cat.startsWith("S ")) return 0xcba658;
      if (cat.startsWith("NP")) return 0x5b8cae;
      if (cat.startsWith("VP")) return 0x3653a0;
      if (cat.startsWith("PP")) return 0x8a7345;
      if (cat.startsWith("AdjP")) return 0x7fa6bf;
      if (cat.startsWith("AdvP")) return 0x9fb8c9;
      return 0x3a4048; // terminal categories: Det, N, V, Adj, Adv, P — dark charcoal for contrast on the light canvas
    };

    // ---- scene setup ----
    const canvas = document.getElementById("treeCanvas");
    const wrap = canvas.parentElement;
    let renderer, scene, camera, group, raycaster, pointer;
    const nodeMeshes = {}; // id -> mesh
    const lineMeshes = [];  // { line, parentId, childId }

    function initScene(){
      scene = new THREE.Scene();
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h);

      camera = new THREE.PerspectiveCamera(42, w / h, 1, 3000);
      camera.position.set(0, 40, 620);

      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(200, 300, 400);
      scene.add(dir);

      group = new THREE.Group();
      scene.add(group);

      // edges
      flat.forEach(item => {
        if (!item.parent) return;
        const parentFlat = flat.find(f => f.node === item.parent);
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(parentFlat.pos.x, parentFlat.pos.y, parentFlat.pos.z),
          new THREE.Vector3(item.pos.x, item.pos.y, item.pos.z)
        ]);
        const material = new THREE.LineBasicMaterial({ color: 0x5c6b85, transparent: true, opacity: 0.55 });
        const line = new THREE.Line(geometry, material);
        group.add(line);
        lineMeshes.push({ line, parentId: item.parent.id, childId: item.node.id, baseColor: 0x5c6b85 });
      });

      // nodes
      flat.forEach(item => {
        const isTerminal = !item.node.children || item.node.children.length === 0;
        const radius = item.depth === 0 ? 15 : (isTerminal ? 8 : 11);
        const geo = new THREE.SphereGeometry(radius, 24, 24);
        const color = categoryColor(item.node.category);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, emissive: 0x000000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(item.pos.x, item.pos.y, item.pos.z);
        mesh.userData.id = item.node.id;
        mesh.userData.baseColor = color;
        group.add(mesh);
        nodeMeshes[item.node.id] = mesh;

        // label sprite
        const label = isTerminal ? item.node.name : item.node.category.split(" ")[0];
        const sprite = makeLabelSprite(label, isTerminal);
        sprite.position.set(item.pos.x, item.pos.y + radius + 12, item.pos.z);
        group.add(sprite);
      });

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();
    }

    function makeLabelSprite(text, terminal){
      const cvs = document.createElement("canvas");
      const ctx2 = cvs.getContext("2d");
      const fontSize = 30;
      ctx2.font = `${terminal ? "500" : "600"} ${fontSize}px 'DM Mono', monospace`;
      const metrics = ctx2.measureText(text);
      cvs.width = metrics.width + 24;
      cvs.height = fontSize + 20;
      ctx2.font = `${terminal ? "500" : "600"} ${fontSize}px 'DM Mono', monospace`;
      ctx2.fillStyle = terminal ? "rgba(38,42,48,0.9)" : "rgba(140,105,42,0.96)";
      ctx2.textBaseline = "middle";
      ctx2.fillText(text, 12, cvs.height / 2);
      const texture = new THREE.CanvasTexture(cvs);
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      const scale = 0.24;
      sprite.scale.set(cvs.width * scale, cvs.height * scale, 1);
      sprite.renderOrder = 999;
      return sprite;
    }

    // ---- interaction: drag rotate, wheel/pinch zoom, click select ----
    let isDragging = false, lastX = 0, lastY = 0, moved = 0;
    let rotY = -0.35, rotX = 0.12;
    let zoom = 620;
    let autoRotate = true;

    function applyTransform(){
      group.rotation.y = rotY;
      group.rotation.x = rotX;
      camera.position.set(0, 40, zoom);
      camera.lookAt(0, 20, 0);
    }

    canvas.addEventListener("pointerdown", (e) => {
      isDragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.006;
      rotX = Math.max(-0.6, Math.min(0.6, rotX + dy * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      applyTransform();
    });
    canvas.addEventListener("pointerup", (e) => {
      isDragging = false;
      if (moved < 6){ handleSelect(e); }
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoom = Math.max(260, Math.min(1100, zoom + e.deltaY * 0.6));
      applyTransform();
    }, { passive: false });

    // basic pinch-zoom
    let pinchStartDist = null, pinchStartZoom = null;
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2){
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoom = zoom;
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && pinchStartDist){
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        zoom = Math.max(260, Math.min(1100, pinchStartZoom * (pinchStartDist / dist)));
        applyTransform();
      }
    }, { passive: true });
    canvas.addEventListener("touchend", () => { pinchStartDist = null; });

    function handleSelect(e){
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = Object.values(nodeMeshes);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length){
        const id = hits[0].object.userData.id;
        selectNode(id);
      }
    }

    // ---- find/select node data by id (search TREE_DATA) ----
    function findNode(id, node = TREE_DATA){
      if (node.id === id) return node;
      for (const c of (node.children || [])){
        const found = findNode(id, c);
        if (found) return found;
      }
      return null;
    }
    function getDescendantIds(node){
      let ids = [node.id];
      (node.children || []).forEach(c => { ids = ids.concat(getDescendantIds(c)); });
      return ids;
    }
    function getAncestorChain(id){
      // returns array of ids from root to id
      const chain = [];
      function walk(node, path){
        const newPath = path.concat([node.id]);
        if (node.id === id){ chain.push(...newPath); return true; }
        for (const c of (node.children || [])){
          if (walk(c, newPath)) return true;
        }
        return false;
      }
      walk(TREE_DATA, []);
      return chain;
    }

    const panelEmpty = document.getElementById("treePanelEmpty");
    const panelContent = document.getElementById("treePanelContent");

    function selectNode(id){
      const node = findNode(id);
      if (!node) return;

      // visual highlight: subtree bright, ancestors bright, others dim
      const subtreeIds = new Set(getDescendantIds(node));
      const ancestorIds = new Set(getAncestorChain(id));
      Object.entries(nodeMeshes).forEach(([nid, mesh]) => {
        const inFocus = subtreeIds.has(nid) || ancestorIds.has(nid);
        mesh.material.emissive.setHex(subtreeIds.has(nid) ? 0x6a4f1c : 0x000000);
        mesh.material.opacity = inFocus ? 1 : 0.35;
        mesh.material.transparent = true;
      });
      lineMeshes.forEach(l => {
        const inFocus = subtreeIds.has(l.parentId) && subtreeIds.has(l.childId);
        l.line.material.opacity = inFocus ? 0.95 : 0.18;
        l.line.material.color.setHex(inFocus ? 0xcba658 : l.baseColor);
      });

      // update panel
      panelEmpty.hidden = true;
      panelContent.hidden = false;
      document.getElementById("pCategory").textContent = node.category;
      document.getElementById("pName").textContent = node.name;
      document.getElementById("pFunction").textContent = node.func;
      document.getElementById("pDefinition").textContent = node.def;
      document.getElementById("pExample").textContent = node.example;
      const ex2Wrap = document.getElementById("pExample2Wrap");
      if (node.example2){ ex2Wrap.hidden = false; document.getElementById("pExample2").textContent = node.example2; }
      else { ex2Wrap.hidden = true; }
      document.getElementById("pRelation").textContent = node.relation;
      const semWrap = document.getElementById("pSemanticWrap");
      if (node.semantic){ semWrap.style.display = ""; document.getElementById("pSemantic").textContent = node.semantic; }
      else { semWrap.style.display = "none"; }
      const pragWrap = document.getElementById("pPragmaticWrap");
      if (node.pragmatic){ pragWrap.style.display = ""; document.getElementById("pPragmatic").textContent = node.pragmatic; }
      else { pragWrap.style.display = "none"; }

      // sync list buttons
      document.querySelectorAll("#treeNodeList button").forEach(b => {
        b.classList.toggle("is-active", b.dataset.id === id);
      });
    }

    // ---- accessible fallback list ----
    const listEl = document.getElementById("treeNodeList");
    flat.forEach(item => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.id = item.node.id;
      const isTerminal = !item.node.children || item.node.children.length === 0;
      btn.textContent = isTerminal ? `${item.node.name} (${item.node.category.split(" ")[0]})` : `${item.node.category.split(" ")[0]} — ${item.node.name}`;
      btn.addEventListener("click", () => selectNode(item.node.id));
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    // ---- controls ----
    document.getElementById("treeResetView").addEventListener("click", () => {
      rotY = -0.35; rotX = 0.12; zoom = 620; applyTransform();
    });
    const autoBtn = document.getElementById("treeAutoRotate");
    autoBtn.addEventListener("click", () => {
      autoRotate = !autoRotate;
      autoBtn.classList.toggle("is-active", autoRotate);
      autoBtn.setAttribute("aria-pressed", autoRotate ? "true" : "false");
      autoBtn.textContent = "Auto-rotate: " + (autoRotate ? "On" : "Off");
    });

    function onResize(){
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    let hasWebGL = true;
    try {
      initScene();
    } catch (err){
      hasWebGL = false;
    }

    if (hasWebGL){
      applyTransform();
      onResize();
      function animate(){
        if (autoRotate && !isDragging){ rotY += 0.0016; applyTransform(); }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();
    } else {
      wrap.innerHTML = '<div style="padding:40px;color:#b9c2cf;font-family:Inter,sans-serif;">Your browser does not support the 3D view. Please use the constituent index below to explore the tree.</div>';
    }
  })();

  /* ===================================================================
     CONSTITUENT EXPLORER
     =================================================================== */
  (function explorer(){
    const cardsEl = document.getElementById("explorerCards");
    const detailEl = document.getElementById("explorerDetail");
    let active = EXPLORER_DATA[0].id;

    function renderCards(){
      cardsEl.innerHTML = "";
      EXPLORER_DATA.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", item.id === active ? "true" : "false");
        btn.className = item.id === active ? "is-active" : "";
        btn.innerHTML = `<span class="ec-label">${item.label}</span><span class="ec-name">${item.name}</span>`;
        btn.addEventListener("click", () => { active = item.id; renderCards(); renderDetail(); });
        cardsEl.appendChild(btn);
      });
    }

    function renderDetail(){
      const d = EXPLORER_DATA.find(x => x.id === active);
      detailEl.innerHTML = `
        <div class="ed-header">
          <span class="ec-label">${d.label}</span>
          <h3 class="ed-title">${d.name}</h3>
        </div>
        <p class="ed-def">${d.definition}</p>
        <div class="ed-grid">
          <div><span class="ed-field-label">Structure</span><p class="ed-field-value" style="font-family:var(--font-mono); font-size:0.88rem;">${d.structure}</p></div>
          <div><span class="ed-field-label">Head</span><p class="ed-field-value">${d.head}</p></div>
        </div>
        <span class="ed-field-label">Possible functions</span>
        <div class="ed-functions" style="margin-bottom:24px;">${d.functions.map(f => `<span>${f}</span>`).join("")}</div>
        <div class="ed-examples">
          <div class="ed-example-block"><span class="ed-field-label">Example</span><p>${d.example}</p></div>
          <div class="ed-example-block"><span class="ed-field-label">Advanced example</span><p>${d.advanced}</p></div>
          <div class="ed-example-block"><span class="ed-field-label">Semantic role</span><p style="font-family:var(--font-sans); font-style:normal; font-size:0.94rem; color:var(--text-on-light-dim);">${d.semantic}</p></div>
        </div>
        <div class="ed-test"><strong>Syntactic test:</strong> ${d.test}</div>
      `;
    }

    renderCards();
    renderDetail();

    // clickable sentence
    const sentEl = document.getElementById("clickableSentence");
    const readout = document.getElementById("clickableReadout");
    let openIndex = null;
    function renderClickable(){
      sentEl.innerHTML = "";
      CLICKABLE_SENTENCE.forEach((chunk, i) => {
        const span = document.createElement("span");
        span.className = "clickable-chunk" + (openIndex === i ? " is-open" : "");
        span.textContent = chunk.text;
        span.tabIndex = 0;
        span.setAttribute("role", "button");
        span.setAttribute("aria-pressed", openIndex === i ? "true" : "false");
        span.addEventListener("click", () => { openIndex = openIndex === i ? null : i; renderClickable(); });
        span.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); span.click(); } });
        sentEl.appendChild(span);
      });
      if (openIndex !== null){
        const c = CLICKABLE_SENTENCE[openIndex];
        readout.innerHTML = `<strong>${c.cat}</strong> · ${c.func} — ${c.def}`;
      } else {
        readout.textContent = "";
      }
    }
    renderClickable();
  })();

  /* ===================================================================
     SYNTACTIC TEST LAB
     =================================================================== */
  (function testLab(){
    const sentSelect = document.getElementById("testSentenceSelect");
    const typeSelect = document.getElementById("testTypeSelect");
    const instructionEl = document.getElementById("testInstruction");
    const sentenceViewEl = document.getElementById("testSentenceView");
    const resultEl = document.getElementById("testResult");

    TESTLAB_SENTENCES.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id; opt.textContent = s.text;
      sentSelect.appendChild(opt);
    });

    function renderStatic(){
      const sentence = TESTLAB_SENTENCES.find(s => s.id === sentSelect.value);
      const test = TESTLAB_TESTS[typeSelect.value];
      instructionEl.textContent = test.instruction;
      sentenceViewEl.textContent = sentence.text;
      resultEl.hidden = true;
    }

    document.getElementById("testApplyBtn").addEventListener("click", () => {
      const test = TESTLAB_TESTS[typeSelect.value];
      const outcome = test.apply(sentSelect.value);
      resultEl.hidden = false;
      resultEl.innerHTML = `
        <span class="testlab-result-label">Result of applying the diagnostic</span>
        <p class="testlab-result-sentence">${outcome.result}</p>
        <p class="testlab-result-note">${outcome.note}</p>
      `;
    });

    sentSelect.addEventListener("change", renderStatic);
    typeSelect.addEventListener("change", renderStatic);
    renderStatic();
  })();

  /* ===================================================================
     SEMANTICS & PRAGMATICS TABS
     =================================================================== */
  (function semanticsTabs(){
    const tabsEl = document.getElementById("semanticsTabs");
    const panelsEl = document.getElementById("semanticsPanels");
    const keys = Object.keys(SEMANTICS_PANELS);

    panelsEl.innerHTML = keys.map((key, i) => {
      const p = SEMANTICS_PANELS[key];
      return `
        <div class="tab-panel ${i === 0 ? "is-active" : ""}" id="panel-${key}" role="tabpanel">
          <h3 class="tab-panel-title">${p.title}</h3>
          ${p.body.map(b => `<p>${b}</p>`).join("")}
          <div class="tab-examples">
            ${p.examples.map(ex => `<div class="tab-example"><span class="tab-example-label">${ex.label}</span><p>${ex.text}</p></div>`).join("")}
          </div>
        </div>
      `;
    }).join("");

    tabsEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", "false"));
        btn.setAttribute("aria-selected", "true");
        panelsEl.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("is-active"));
        document.getElementById("panel-" + btn.dataset.tab).classList.add("is-active");
      });
    });
  })();

  /* ===================================================================
     SENTENCE ARCHITECTURE
     =================================================================== */
  (function architecture(){
    const rail = document.getElementById("architectureRail");
    const display = document.getElementById("architectureDisplay");
    let active = ARCHITECTURE_LEVELS[0].id;

    function renderRail(){
      rail.innerHTML = "";
      ARCHITECTURE_LEVELS.forEach(lvl => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = lvl.label;
        btn.className = lvl.id === active ? "is-active" : "";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", lvl.id === active ? "true" : "false");
        btn.addEventListener("click", () => { active = lvl.id; renderRail(); renderDisplay(); });
        rail.appendChild(btn);
      });
    }
    function renderDisplay(){
      const lvl = ARCHITECTURE_LEVELS.find(l => l.id === active);
      display.innerHTML = `
        <div>
          <h3 class="arch-heading">${lvl.heading}</h3>
          <p class="arch-body">${lvl.body}</p>
          <p class="arch-combine">${lvl.combine}</p>
        </div>
        <div class="arch-unit"><p>${lvl.unit}</p></div>
      `;
    }
    renderRail(); renderDisplay();
  })();

  /* ===================================================================
     SENTENCE TYPES
     =================================================================== */
  (function types(){
    function renderColumn(elId, data){
      const el = document.getElementById(elId);
      el.innerHTML = data.map(t => `
        <div class="type-card">
          <p class="type-card-name">${t.name}</p>
          <p class="type-card-def">${t.def}</p>
          <p class="type-card-ex">${t.example}</p>
        </div>
      `).join("");
    }
    renderColumn("typesStructure", TYPES_STRUCTURE);
    renderColumn("typesRelation", TYPES_RELATION);
    renderColumn("typesFunction", TYPES_FUNCTION);
  })();

  /* ===================================================================
     AMBIGUITY LAB
     =================================================================== */
  (function ambiguityLab(){
    const picker = document.getElementById("ambiguityPicker");
    const stage = document.getElementById("ambiguityStage");
    let active = AMBIGUITY_DATA[0].id;

    function renderPicker(){
      picker.innerHTML = "";
      AMBIGUITY_DATA.forEach(a => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "\u201C" + a.sentence + "\u201D";
        btn.className = a.id === active ? "is-active" : "";
        btn.setAttribute("role", "tab");
        btn.addEventListener("click", () => { active = a.id; renderPicker(); renderStage(); });
        picker.appendChild(btn);
      });
    }
    function renderStage(){
      const a = AMBIGUITY_DATA.find(x => x.id === active);
      stage.innerHTML = `
        <p class="amb-sentence">${a.sentence}</p>
        <div class="amb-readings">
          ${a.readings.map(r => `
            <div class="amb-reading">
              <p class="amb-reading-label">${r.label}</p>
              <pre class="amb-tree">${r.tree}</pre>
              <p class="amb-paraphrase">${r.paraphrase}</p>
              <p class="amb-explanation">${r.explanation}</p>
            </div>
          `).join("")}
        </div>
      `;
    }
    renderPicker(); renderStage();
  })();

  /* ===================================================================
     CONSTRUCTION LAB
     =================================================================== */
  (function constructionLab(){
    const grid = document.getElementById("constructionGrid");
    grid.innerHTML = CONSTRUCTION_DATA.map(c => `
      <div class="construction-card">
        <h3 class="cc-name">${c.name}</h3>
        <div class="cc-row"><span class="cc-label">Form</span><p>${c.form}</p></div>
        <div class="cc-row"><span class="cc-label">Example</span><p class="cc-example">${c.example}</p></div>
        <div class="cc-row"><span class="cc-label">Communicative effect</span><p>${c.effect}</p></div>
      </div>
    `).join("");
  })();

  /* ===================================================================
     QUESTION ENGINE — 25 questions, 7 formats
     =================================================================== */
  const QuestionEngine = (function(){
    let current = 0;
    const answers = {}; // id -> answer (shape depends on type)
    const checked = {}; // id -> bool (has been checked)

    const engineEl = document.getElementById("questionEngine");
    const progressText = document.getElementById("qProgressText");
    const progressFill = document.getElementById("qProgressFill");
    const prevBtn = document.getElementById("qPrevBtn");
    const nextBtn = document.getElementById("qNextBtn");
    const submitBtn = document.getElementById("qSubmitBtn");
    const resultsPanel = document.getElementById("resultsPanel");

    function shuffleIndices(n){
      const arr = Array.from({ length: n }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function render(){
      const q = QUESTIONS[current];
      progressText.textContent = `Question ${current + 1} of ${QUESTIONS.length}`;
      progressFill.style.width = `${((current + 1) / QUESTIONS.length) * 100}%`;
      prevBtn.disabled = current === 0;
      nextBtn.hidden = current === QUESTIONS.length - 1;
      submitBtn.hidden = current !== QUESTIONS.length - 1;

      let bodyHTML = `<p class="q-category">${q.category}<span class="q-type-badge">${typeLabel(q.type)}</span></p>
        <p class="q-prompt">${q.prompt}</p>`;

      if (q.type === "mcq" || q.type === "dropdown-as-mcq"){
        bodyHTML += renderOptionsSingle(q);
      } else if (q.type === "dropdown"){
        bodyHTML += renderDropdown(q);
      } else if (q.type === "toggle"){
        bodyHTML += renderToggle(q, q.trueLabel, q.falseLabel);
      } else if (q.type === "truefalse"){
        bodyHTML += renderToggle(q, "True", "False");
      } else if (q.type === "checkbox"){
        bodyHTML += renderCheckbox(q);
      } else if (q.type === "matrix"){
        bodyHTML += renderMatrix(q);
      } else if (q.type === "dragdrop" && q.matchMode){
        bodyHTML += renderMatch(q);
      } else if (q.type === "dragdrop"){
        bodyHTML += renderDragOrder(q);
      }

      bodyHTML += `<button type="button" class="btn btn-secondary q-check-btn" id="qCheckBtn">Check answer</button>`;
      bodyHTML += `<div id="qFeedback"></div>`;

      engineEl.innerHTML = bodyHTML;
      attachHandlers(q);

      if (checked[q.id]) showFeedback(q);
    }

    function typeLabel(type){
      return { mcq: "Multiple choice", dropdown: "Dropdown", toggle: "Toggle", truefalse: "True / False", checkbox: "Checkbox", matrix: "Choice matrix", dragdrop: "Drag &amp; drop" }[type] || type;
    }

    function renderOptionsSingle(q){
      return `<div class="q-options" id="qOptionsWrap">
        ${q.options.map((opt, i) => `
          <div class="q-option" data-i="${i}" tabindex="0" role="radio" aria-checked="false">
            <span class="q-option-marker">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
          </div>
        `).join("")}
      </div>`;
    }
    function renderDropdown(q){
      return `<select class="q-select" id="qSelect">
        <option value="" disabled ${answers[q.id] === undefined ? "selected" : ""}>Select an answer…</option>
        ${q.options.map((opt, i) => `<option value="${i}" ${answers[q.id] === i ? "selected" : ""}>${opt}</option>`).join("")}
      </select>`;
    }
    function renderToggle(q, labelTrue, labelFalse){
      return `<div class="q-toggle-row" id="qToggleWrap">
        <button type="button" class="q-toggle-btn" data-v="true">${labelTrue}</button>
        <button type="button" class="q-toggle-btn" data-v="false">${labelFalse}</button>
      </div>`;
    }
    function renderCheckbox(q){
      return `<div class="q-options checkbox-mode" id="qOptionsWrap">
        ${q.options.map((opt, i) => `
          <div class="q-option" data-i="${i}" tabindex="0" role="checkbox" aria-checked="false">
            <span class="q-option-marker"></span>
            <span>${opt}</span>
          </div>
        `).join("")}
      </div>`;
    }
    function renderMatrix(q){
      return `<table class="q-matrix" id="qMatrix">
        <thead><tr><th></th>${q.columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${q.rows.map((row, ri) => `
            <tr data-row="${ri}">
              <td>${row.label}</td>
              ${q.columns.map((c, ci) => `<td><input type="radio" name="matrixRow${ri}" data-row="${ri}" data-col="${ci}"></td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>`;
    }
    function renderDragOrder(q){
      const order = answers[q.id] && answers[q.id].order ? answers[q.id].order : shuffleIndices(q.chunks.length);
      answers[q.id] = answers[q.id] || { order, slots: new Array(q.chunks.length).fill(null) };
      const slots = answers[q.id].slots;
      return `
        <p style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-on-dark-dim); margin-bottom:10px;">Click a chunk, then click a slot to place it. Click a filled slot to remove it.</p>
        <div class="q-drag-chunks" id="qDragChunks">
          ${order.map(ci => `<span class="q-drag-chunk ${slots.includes(ci) ? "is-placed" : ""}" data-ci="${ci}" tabindex="0">${q.chunks[ci]}</span>`).join("")}
        </div>
        <div class="q-drag-slots" id="qDragSlots">
          ${slots.map((val, si) => `<div class="q-drag-slot ${val !== null ? "is-filled" : ""}" data-si="${si}" tabindex="0">${val !== null ? q.chunks[val] : "position " + (si + 1)}</div>`).join("")}
        </div>
      `;
    }
    function renderMatch(q){
      const rightOrder = (answers[q.id] && answers[q.id].rightOrder) ? answers[q.id].rightOrder : shuffleIndices(q.rightItems.length);
      const assigned = (answers[q.id] && answers[q.id].assigned) ? answers[q.id].assigned : new Array(q.leftItems.length).fill(null);
      answers[q.id] = { rightOrder, assigned, selectedLeft: null };
      return `
        <p style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-on-dark-dim); margin-bottom:10px;">Click an item on the left, then its match on the right.</p>
        <div class="q-match-grid">
          <div id="qMatchLeft">
            ${q.leftItems.map((it, i) => `<div class="q-match-item" data-i="${i}">${it}</div>`).join("")}
          </div>
          <div id="qMatchRight">
            ${rightOrder.map(ri => `<div class="q-match-item" data-ri="${ri}">${q.rightItems[ri]}</div>`).join("")}
          </div>
        </div>
        <div class="q-match-pairs" id="qMatchPairs"></div>
      `;
    }

    function refreshMatchPairs(q){
      const state = answers[q.id];
      const pairsEl = document.getElementById("qMatchPairs");
      const lines = state.assigned.map((ri, li) => ri !== null ? `${q.leftItems[li]} → ${q.rightItems[ri]}` : null).filter(Boolean);
      pairsEl.innerHTML = lines.join("<br>");
      // visual matched state
      document.querySelectorAll("#qMatchLeft .q-match-item").forEach((el, i) => {
        el.classList.toggle("is-matched", state.assigned[i] !== null);
      });
      document.querySelectorAll("#qMatchRight .q-match-item").forEach(el => {
        const ri = Number(el.dataset.ri);
        el.classList.toggle("is-matched", state.assigned.includes(ri));
      });
    }

    function attachHandlers(q){
      if (q.type === "mcq"){
        document.querySelectorAll("#qOptionsWrap .q-option").forEach(el => {
          el.addEventListener("click", () => {
            answers[q.id] = Number(el.dataset.i);
            document.querySelectorAll("#qOptionsWrap .q-option").forEach(o => { o.classList.remove("is-selected"); o.setAttribute("aria-checked", "false"); });
            el.classList.add("is-selected"); el.setAttribute("aria-checked", "true");
          });
          el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); el.click(); } });
          if (answers[q.id] === Number(el.dataset.i)){ el.classList.add("is-selected"); el.setAttribute("aria-checked", "true"); }
        });
      } else if (q.type === "dropdown"){
        const sel = document.getElementById("qSelect");
        sel.addEventListener("change", () => { answers[q.id] = Number(sel.value); });
      } else if (q.type === "toggle" || q.type === "truefalse"){
        document.querySelectorAll("#qToggleWrap .q-toggle-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            answers[q.id] = btn.dataset.v === "true";
            document.querySelectorAll("#qToggleWrap .q-toggle-btn").forEach(b => b.classList.remove("is-selected"));
            btn.classList.add("is-selected");
          });
          if (answers[q.id] === (btn.dataset.v === "true")) btn.classList.add("is-selected");
        });
      } else if (q.type === "checkbox"){
        if (!Array.isArray(answers[q.id])) answers[q.id] = [];
        document.querySelectorAll("#qOptionsWrap .q-option").forEach(el => {
          const i = Number(el.dataset.i);
          if (answers[q.id].includes(i)){ el.classList.add("is-selected"); el.setAttribute("aria-checked", "true"); }
          el.addEventListener("click", () => {
            const idx = answers[q.id].indexOf(i);
            if (idx === -1){ answers[q.id].push(i); el.classList.add("is-selected"); el.setAttribute("aria-checked", "true"); }
            else { answers[q.id].splice(idx, 1); el.classList.remove("is-selected"); el.setAttribute("aria-checked", "false"); }
          });
          el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); el.click(); } });
        });
      } else if (q.type === "matrix"){
        if (!Array.isArray(answers[q.id])) answers[q.id] = new Array(q.rows.length).fill(null);
        document.querySelectorAll("#qMatrix input[type=radio]").forEach(input => {
          const row = Number(input.dataset.row), col = Number(input.dataset.col);
          if (answers[q.id][row] === col) input.checked = true;
          input.addEventListener("change", () => { answers[q.id][row] = col; });
        });
      } else if (q.type === "dragdrop" && q.matchMode){
        const state = answers[q.id];
        refreshMatchPairs(q);
        document.querySelectorAll("#qMatchLeft .q-match-item").forEach(el => {
          el.addEventListener("click", () => {
            document.querySelectorAll("#qMatchLeft .q-match-item").forEach(o => o.classList.remove("is-selected"));
            el.classList.add("is-selected");
            state.selectedLeft = Number(el.dataset.i);
          });
        });
        document.querySelectorAll("#qMatchRight .q-match-item").forEach(el => {
          el.addEventListener("click", () => {
            if (state.selectedLeft === null || state.selectedLeft === undefined) return;
            const ri = Number(el.dataset.ri);
            state.assigned[state.selectedLeft] = ri;
            document.querySelectorAll("#qMatchLeft .q-match-item").forEach(o => o.classList.remove("is-selected"));
            state.selectedLeft = null;
            refreshMatchPairs(q);
          });
        });
      } else if (q.type === "dragdrop"){
        const state = answers[q.id];
        document.querySelectorAll("#qDragChunks .q-drag-chunk").forEach(el => {
          el.addEventListener("click", () => {
            const ci = Number(el.dataset.ci);
            if (state.slots.includes(ci)) return;
            const emptySlot = state.slots.indexOf(null);
            if (emptySlot === -1) return;
            state.slots[emptySlot] = ci;
            render();
          });
        });
        document.querySelectorAll("#qDragSlots .q-drag-slot").forEach(el => {
          el.addEventListener("click", () => {
            const si = Number(el.dataset.si);
            if (state.slots[si] !== null){ state.slots[si] = null; render(); }
          });
        });
      }

      document.getElementById("qCheckBtn").addEventListener("click", () => {
        checked[q.id] = true;
        showFeedback(q);
      });
    }

    function isCorrect(q){
      const a = answers[q.id];
      if (a === undefined) return false;
      switch (q.type){
        case "mcq": return a === q.correct;
        case "dropdown": return a === q.correct;
        case "toggle": case "truefalse": return a === q.correct;
        case "checkbox": {
          if (!Array.isArray(a)) return false;
          const sortedA = [...a].sort().join(",");
          const sortedC = [...q.correct].sort().join(",");
          return sortedA === sortedC;
        }
        case "matrix": {
          if (!Array.isArray(a)) return false;
          return a.length === q.correct.length && a.every((v, i) => v === q.correct[i]);
        }
        case "dragdrop":
          if (q.matchMode){
            return a.assigned.every((v, i) => v === q.correctPairs[i]);
          } else {
            return a.slots.every((v, i) => v === q.correctOrder[i]);
          }
        default: return false;
      }
    }

    function showFeedback(q){
      const fbEl = document.getElementById("qFeedback");
      const correct = isCorrect(q);
      let extra = "";
      if (q.distractorNote) extra = `<p>${q.distractorNote}</p>`;
      fbEl.innerHTML = `
        <div class="q-feedback ${correct ? "is-correct" : "is-incorrect"}">
          <p class="q-feedback-verdict">${correct ? "Correct." : "Not quite."}</p>
          <p>${q.explanation}</p>
          ${extra}
        </div>
      `;
    }

    prevBtn.addEventListener("click", () => { if (current > 0){ current--; render(); } });
    nextBtn.addEventListener("click", () => { if (current < QUESTIONS.length - 1){ current++; render(); } });
    submitBtn.addEventListener("click", showResults);

    function classify(pct){
      if (pct >= 90) return "Distinguished analytical command";
      if (pct >= 75) return "Proficient — sound structural reasoning";
      if (pct >= 60) return "Developing — core concepts secure, refinement needed";
      return "Foundational — targeted review recommended";
    }

    function showResults(){
      let correctCount = 0;
      const byCategory = {};
      const reviewItems = [];
      QUESTIONS.forEach(q => {
        const ok = isCorrect(q);
        if (ok) correctCount++;
        byCategory[q.category] = byCategory[q.category] || { correct: 0, total: 0 };
        byCategory[q.category].total++;
        if (ok) byCategory[q.category].correct++;
        if (!ok) reviewItems.push(q);
      });
      const pct = Math.round((correctCount / QUESTIONS.length) * 100);

      engineEl.hidden = true;
      document.querySelector(".question-nav").hidden = true;
      resultsPanel.hidden = false;
      resultsPanel.innerHTML = `
        <div class="results-score">
          <div class="results-score-num">${correctCount}/${QUESTIONS.length}</div>
          <div class="results-score-label">${pct}% overall</div>
        </div>
        <p class="results-classification">${classify(pct)}</p>
        <div class="results-breakdown">
          ${Object.entries(byCategory).map(([cat, v]) => `
            <div class="results-cat">
              <p class="results-cat-name">${cat}</p>
              <p class="results-cat-score">${v.correct}/${v.total}</p>
            </div>
          `).join("")}
        </div>
        <div class="results-review-list">
          <h3 class="results-review-title">Questions to review</h3>
          ${reviewItems.length === 0 ? "<p style='color:var(--text-on-dark-dim);'>None — every question was answered correctly.</p>" :
            reviewItems.map(q => `<div class="results-review-item"><strong>Q${q.id}</strong> (${q.category}): ${q.explanation}</div>`).join("")}
        </div>
        <div class="results-actions">
          <button type="button" class="btn btn-secondary" id="retryBtn">Retry Assessment</button>
          <button type="button" class="btn btn-ghost" id="reviewAllBtn">Review All Answers</button>
        </div>
        <div id="reviewAllPanel"></div>
      `;
      document.getElementById("retryBtn").addEventListener("click", resetAssessment);
      document.getElementById("reviewAllBtn").addEventListener("click", () => {
        const panel = document.getElementById("reviewAllPanel");
        if (panel.dataset.open === "true"){ panel.innerHTML = ""; panel.dataset.open = "false"; return; }
        panel.dataset.open = "true";
        panel.innerHTML = `<div style="margin-top:30px; padding-top:30px; border-top:1px solid var(--line-dark);">` +
          QUESTIONS.map(q => `
            <div class="results-review-item">
              <strong>Q${q.id}. ${q.prompt}</strong><br>
              ${isCorrect(q) ? "<span style='color:#3f8f56;'>Correct.</span>" : "<span style='color:#b23f2c;'>Incorrect.</span>"} ${q.explanation}
            </div>
          `).join("") + `</div>`;
      });
    }

    function resetAssessment(){
      current = 0;
      Object.keys(answers).forEach(k => delete answers[k]);
      Object.keys(checked).forEach(k => delete checked[k]);
      engineEl.hidden = false;
      document.querySelector(".question-nav").hidden = false;
      resultsPanel.hidden = true;
      render();
      document.getElementById("assessment").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    render();

    return { isCorrect, resetAssessment };
  })();

  /* ===================================================================
     WORKSHEET PDF GENERATOR
     =================================================================== */
  document.getElementById("worksheetBtn").addEventListener("click", generateWorksheet);
  const topWorksheetBtn = document.getElementById("downloadWorksheetTopBtn");
  if (topWorksheetBtn) topWorksheetBtn.addEventListener("click", generateWorksheet);

  function optionLetter(i){ return String.fromCharCode(65 + i); }

  function generateWorksheet(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();   // 595.28pt
    const pageH = doc.internal.pageSize.getHeight();  // 841.89pt
    const margin = 72; // exactly 1 inch on all four sides
    const contentW = pageW - margin * 2;
    let y = margin;

    // Plain, ink-light, print-friendly palette: black/grey text and rules only —
    // no filled colour blocks, so the sheet stays economical to print.
    const INK = 20, GREY = 90, RULE = 200;

    function newPage(){
      doc.addPage();
      y = margin;
    }
    function ensureSpace(h){
      if (y + h > pageH - margin) newPage();
    }
    // Plain-text content occasionally contains an arrow character (e.g. inside
    // explanation prose); the core PDF fonts don't include that glyph, so it
    // is swapped for a plain ASCII arrow whenever text is drawn into the PDF.
    // This only affects how the PDF renders the character — the on-screen
    // content in data.js is untouched.
    function sanitizePdfText(str){
      return String(str).replace(/\u2192/g, "->");
    }
    function heading(text, size, opts = {}){
      const font = opts.font || "times";
      const style = opts.style || "bold";
      doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(INK);
      const lines = doc.splitTextToSize(sanitizePdfText(text), opts.width || contentW);
      const lineHeight = size * 1.28;
      ensureSpace(lines.length * lineHeight + 6);
      doc.text(lines, opts.x || margin, y);
      y += lines.length * lineHeight + (opts.gap !== undefined ? opts.gap : 8);
    }
    function bodyText(text, opts = {}){
      const size = opts.size || 11;
      const font = opts.font || "helvetica";
      const style = opts.style || "normal";
      doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(opts.color !== undefined ? opts.color : INK);
      const lines = doc.splitTextToSize(sanitizePdfText(text), opts.width || contentW);
      const lineHeight = size * 1.35;
      ensureSpace(lines.length * lineHeight + 4);
      doc.text(lines, opts.x || margin, y);
      y += lines.length * lineHeight + (opts.gap !== undefined ? opts.gap : 6);
    }
    function rule(weight){
      ensureSpace(14);
      doc.setDrawColor(RULE); doc.setLineWidth(weight || 0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 14;
    }
    // Circle-choice and checkbox rows are drawn as vector shapes rather than
    // Unicode glyphs (\u25CB / \u2610): the core PDF fonts jsPDF uses do not
    // contain those characters, so they were previously printing as garbled
    // substitute glyphs and throwing off the surrounding spacing.
    function circleChoiceRow(label, size){
      doc.setFont("helvetica", "normal"); doc.setFontSize(size);
      const textX = margin + 20;
      const textWidth = contentW - 20;
      const lines = doc.splitTextToSize(label, textWidth);
      const lineHeight = size * 1.35;
      ensureSpace(lines.length * lineHeight + 6);
      const r = 4.3;
      doc.setDrawColor(INK); doc.setLineWidth(0.8);
      doc.circle(margin + r + 2, y - size * 0.32, r, "S");
      doc.setTextColor(INK);
      doc.text(lines, textX, y);
      y += lines.length * lineHeight + 6;
    }
    function checkboxRow(label, size){
      doc.setFont("helvetica", "normal"); doc.setFontSize(size);
      const boxX = margin + 16, boxSize = 9;
      const textX = boxX + boxSize + 8;
      const textWidth = contentW - (textX - margin);
      const lines = doc.splitTextToSize(label, textWidth);
      const lineHeight = size * 1.35;
      ensureSpace(lines.length * lineHeight + 5);
      doc.setDrawColor(INK); doc.setLineWidth(0.8);
      doc.rect(boxX, y - 8, boxSize, boxSize);
      doc.setTextColor(INK);
      doc.text(lines, textX, y);
      y += lines.length * lineHeight + 5;
    }

    // ---- Title page: plain and economical to print (no filled colour panels) ----
    doc.setFont("times", "bold"); doc.setFontSize(27); doc.setTextColor(INK);
    doc.text("Sentence Structure", margin, y + 6); y += 34;
    doc.setFont("times", "italic"); doc.setFontSize(13); doc.setTextColor(GREY);
    doc.text("Advanced English \u00B7 Syntax \u2014 Assessment Worksheet", margin, y); y += 22;
    doc.setDrawColor(INK); doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 90, y);
    y += 34;

    doc.setTextColor(INK);
    bodyText("Name: _______________________________________________", { size: 11, gap: 22 });
    bodyText("Date: _______________________________________________", { size: 11, gap: 30 });
    bodyText(
      "Instructions: Answer all 25 questions. For multiple-choice and dropdown items, circle the letter of the best answer. For checkbox items, tick all that apply. For matrix items, place a mark in the appropriate cell. For true/false and toggle items, circle your choice. For drag-and-drop items, write your answer on the line provided. An answer key appears on the final page of this worksheet.",
      { size: 11, gap: 10 }
    );
    rule();

    QUESTIONS.forEach(q => {
      ensureSpace(70);
      heading(`${q.id}.  ${q.category}`, 13, { gap: 4 });
      doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(GREY);
      ensureSpace(14);
      doc.text(`[${typeLabelPlain(q.type)}]`, margin, y);
      y += 16; doc.setTextColor(INK);

      bodyText(q.prompt, { size: 12, style: "normal", gap: 10 });

      if (q.type === "mcq" || q.type === "dropdown"){
        q.options.forEach((opt, i) => {
          bodyText(`${optionLetter(i)}.  ${opt}`, { size: 11, x: margin + 16, width: contentW - 16, gap: 5 });
        });
      } else if (q.type === "toggle"){
        circleChoiceRow(q.trueLabel, 11);
        circleChoiceRow(q.falseLabel, 11);
        y += 2;
      } else if (q.type === "truefalse"){
        circleChoiceRow("True", 11);
        circleChoiceRow("False", 11);
        y += 2;
      } else if (q.type === "checkbox"){
        q.options.forEach(opt => { checkboxRow(opt, 11); });
      } else if (q.type === "matrix"){
        const labelColW = 190;
        const colW = (contentW - labelColW) / q.columns.length;
        ensureSpace(44);
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(GREY);
        let maxHeaderLines = 1;
        const headerLineSets = q.columns.map(c => doc.splitTextToSize(c, colW - 8));
        headerLineSets.forEach((lines, ci) => {
          maxHeaderLines = Math.max(maxHeaderLines, lines.length);
          doc.text(lines, margin + labelColW + ci * colW, y);
        });
        y += maxHeaderLines * 10 + 16;
        doc.setFont("helvetica", "normal"); doc.setTextColor(INK);
        q.rows.forEach(row => {
          const rowLines = doc.splitTextToSize(row.label.replace(/\*/g, ""), labelColW - 10);
          doc.setFontSize(10);
          ensureSpace(Math.max(rowLines.length * 12, 22));
          doc.text(rowLines, margin, y);
          q.columns.forEach((c, ci) => {
            doc.setDrawColor(RULE);
            doc.rect(margin + labelColW + ci * colW + colW / 2 - 5, y - 8, 10, 10);
          });
          y += Math.max(rowLines.length * 12, 22);
        });
        y += 6;
      } else if (q.type === "dragdrop" && q.matchMode){
        bodyText("Items:", { size: 10, style: "italic", gap: 3 });
        q.leftItems.forEach((it, i) => bodyText(`${i + 1}. ${it}   ->  _______________________________`, { size: 11, x: margin + 16, width: contentW - 16, gap: 5 }));
        bodyText("Options: " + q.rightItems.join("  \u00B7  "), { size: 10, style: "italic", width: contentW });
      } else if (q.type === "dragdrop"){
        bodyText("Chunks to arrange: " + q.chunks.join("  \u00B7  "), { size: 10, style: "italic", gap: 6, width: contentW });
        bodyText("Your sentence: _______________________________________________________", { size: 11, width: contentW });
      }
      y += 8;
      if (q.id !== QUESTIONS.length) rule(0.4);
    });

    // ---- Answer key: always starts on its own final page ----
    newPage();
    heading("ANSWER KEY", 19, { gap: 4 });
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(GREY);
    ensureSpace(20);
    doc.text("Sentence Structure \u2014 Assessment Worksheet", margin, y);
    y += 22; doc.setTextColor(INK);
    rule();

    QUESTIONS.forEach(q => {
      ensureSpace(50);
      let answerText = "";
      if (q.type === "mcq" || q.type === "dropdown"){
        answerText = `${optionLetter(q.correct)}. ${q.options[q.correct]}`;
      } else if (q.type === "toggle"){
        answerText = q.correct ? q.trueLabel : q.falseLabel;
      } else if (q.type === "truefalse"){
        answerText = q.correct ? "True" : "False";
      } else if (q.type === "checkbox"){
        answerText = q.correct.map(i => `${optionLetter(i)}. ${q.options[i]}`).join("; ");
      } else if (q.type === "matrix"){
        answerText = q.rows.map((row, ri) => `${row.label.replace(/\*/g, "")} -> ${q.columns[q.correct[ri]]}`).join(" | ");
      } else if (q.type === "dragdrop" && q.matchMode){
        answerText = q.leftItems.map((it, i) => `${it} -> ${q.rightItems[q.correctPairs[i]]}`).join("; ");
      } else if (q.type === "dragdrop"){
        answerText = q.resultSentence;
      }
      heading(`${q.id}. ${answerText}`, 11.5, { font: "times", style: "bold", gap: 5 });
      bodyText(q.explanation, { size: 9.5, style: "italic", color: GREY, gap: 14 });
    });

    // ---- Final pass: uniform "Page X of Y" footer on every page ----
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++){
      doc.setPage(i);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(GREY);
      doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - margin / 2, { align: "center" });
    }

    doc.save("sentence-structure-worksheet.pdf");
  }

  function typeLabelPlain(type){
    return { mcq: "Multiple choice", dropdown: "Dropdown", toggle: "Toggle", truefalse: "True / False", checkbox: "Checkbox (select all that apply)", matrix: "Choice matrix", dragdrop: "Drag and drop" }[type] || type;
  }

})();
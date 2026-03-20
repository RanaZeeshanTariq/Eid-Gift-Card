// ──────────────────────────────────────────────────────────────────
// URL Params
// ──────────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const recipientName = params.get('name') || 'Dear Friend';
document.getElementById('recipientTag').textContent = recipientName;
document.getElementById('cardRecipient').textContent = recipientName;

const customMsg = params.get('msg');
if (customMsg) document.getElementById('cardBody').textContent = decodeURIComponent(customMsg);

// ──────────────────────────────────────────────────────────────────
// Stars Canvas
// ──────────────────────────────────────────────────────────────────
(function initStars() {
    const canvas = document.getElementById('stars-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, stars = [];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeStars(n) {
        stars = [];
        for (let i = 0; i < n; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.7,
                r: Math.random() * 1.8 + 0.3,
                a: Math.random(),
                speed: Math.random() * 0.008 + 0.003,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    let t = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        t += 0.016;
        stars.forEach(s => {
            const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed * 60 + s.phase));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253,230,138,${alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }

    resize();
    makeStars(180);
    draw();
    window.addEventListener('resize', () => { resize(); makeStars(180); });
})();

// ──────────────────────────────────────────────────────────────────
// Floating Particles
// ──────────────────────────────────────────────────────────────────
(function spawnParticles() {
    const colors = ['#d4a017','#f5c842','#fde68a','#059669','#10b981'];
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'particle';
        const size = Math.random() * 5 + 3;
        el.style.cssText = `
            width:${size}px; height:${size}px;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            left:${Math.random()*100}%;
            bottom:-${size}px;
            --drift:${(Math.random()-0.5)*120}px;
            animation-duration:${Math.random()*8+6}s;
            animation-delay:${Math.random()*8}s;
        `;
        document.body.appendChild(el);
    }
})();

// ──────────────────────────────────────────────────────────────────
// Sound Effects via Web Audio API
// ──────────────────────────────────────────────────────────────────
let audioCtx = null;

function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playSealBreakSound() {
    try {
        const ctx = ensureAudioContext();
        const now = ctx.currentTime;

        // Crack sound — short noise burst
        const noiseLen = 0.15;
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 3);
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;
        noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
        noiseSource.start(now);

        // Paper unfold — lower frequency sweep
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.6);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now + 0.1);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(oscGain).connect(ctx.destination);
        osc.start(now + 0.1);
        osc.stop(now + 0.7);

        // Soft chime
        const chime = ctx.createOscillator();
        chime.type = 'sine';
        chime.frequency.value = 800;
        const chimeGain = ctx.createGain();
        chimeGain.gain.setValueAtTime(0.08, now + 0.2);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        chime.connect(chimeGain).connect(ctx.destination);
        chime.start(now + 0.2);
        chime.stop(now + 1.1);
    } catch(e) {
        console.warn('Audio playback failed:', e);
    }
}

function playCardRevealSound() {
    try {
        const ctx = ensureAudioContext();
        const now = ctx.currentTime;

        // Ascending chime sequence
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.1, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.6);
        });
    } catch(e) {
        console.warn('Audio playback failed:', e);
    }
}

// ──────────────────────────────────────────────────────────────────
// Envelope Interaction
// ──────────────────────────────────────────────────────────────────
let opened = false;

function openEnvelope() {
    if (opened) return;
    opened = true;

    const board = document.querySelector('.from-board');
    const seal = document.querySelector('.envelope-seal');
    const flap = document.querySelector('.envelope-flap');
    const cardPeek = document.querySelector('.envelope-card-peek');
    const container = document.querySelector('.envelope-container');
    const hint = document.querySelector('.hint');

    // STEP 1: Character lifts board and waves
    board.classList.add('waving');

    // STEP 2: Break the seal with sound
    playSealBreakSound();
    seal.classList.add('breaking');
    spawnSealParticles(seal);

    // STEP 3: Open the flap
    setTimeout(() => {
        flap.classList.add('open');
    }, 600);

    // STEP 4: Card slides out of envelope
    setTimeout(() => {
        cardPeek.classList.add('slide-out');
        container.classList.add('opened');
    }, 1200);

    // STEP 5: Show the full Eid card overlay
    setTimeout(() => {
        document.getElementById('card-overlay').classList.add('visible');
        playCardRevealSound();
        spawnConfetti();
        board.classList.remove('waving');
        if (hint) hint.classList.add('hidden');
    }, 1800);
}

function spawnSealParticles(seal) {
    const rect = seal.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#c41e3a', '#e63946', '#d4a017', '#f5c842', '#8b1a2e'];
    for (let i = 0; i < 16; i++) {
        const el = document.createElement('div');
        el.className = 'seal-particle';
        const angle = (i / 16) * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const size = 4 + Math.random() * 6;
        el.style.cssText = `
            left:${cx}px; top:${cy}px;
            width:${size}px; height:${size}px;
            background:${colors[i % colors.length]};
            border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
            --px:${Math.cos(angle)*dist}px;
            --py:${Math.sin(angle)*dist}px;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }
}

function spawnConfetti() {
    const card = document.querySelector('.eid-card');
    const colors = ['#d4a017','#f5c842','#34d399','#059669','#fde68a','#ffffff','#c41e3a'];
    for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const color = colors[i % colors.length];
        el.style.cssText = `
            background: ${color};
            left: ${Math.random() * 100}%;
            top: ${-10 - Math.random() * 20}px;
            animation-delay: ${Math.random() * 0.4}s;
            animation-duration: ${2 + Math.random() * 1.5}s;
            box-shadow: 0 0 12px ${color}, 0 2px 4px rgba(0,0,0,0.2);
        `;
        card.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

function closeCard() {
    document.getElementById('card-overlay').classList.remove('visible');

    setTimeout(() => {
        const flap = document.querySelector('.envelope-flap');
        const seal = document.querySelector('.envelope-seal');
        const cardPeek = document.querySelector('.envelope-card-peek');
        const container = document.querySelector('.envelope-container');
        const hint = document.querySelector('.hint');

        flap.classList.remove('open');
        seal.classList.remove('breaking');
        seal.style.display = '';
        cardPeek.classList.remove('slide-out');
        container.classList.remove('opened');
        if (hint) hint.classList.remove('hidden');

        document.querySelector('.from-board').classList.remove('waving');
        opened = false;
    }, 500);
}

// ──────────────────────────────────────────────────────────────────
// Three.js — 3D Character
// ──────────────────────────────────────────────────────────────────
(function init3DCharacter() {
    const canvas = document.getElementById('char-canvas');
    const isMobile = window.innerWidth <= 500;
    const W = isMobile ? Math.min(120, window.innerWidth * 0.32) : Math.min(320, window.innerWidth * 0.35);
    const H = isMobile ? Math.min(200, window.innerHeight * 0.38) : Math.min(400, window.innerHeight * 0.55);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xfde68a, 1.2);
    keyLight.position.set(3, 5, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x34d399, 0.4);
    fillLight.position.set(-3, 2, 1);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xd4a017, 0.8, 10);
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);

    let character = null;
    let mixer     = null;

    function loadGLTF(url, onLoad, onError) {
        fetch(url)
            .then(r => r.arrayBuffer())
            .then(buffer => {
                const view = new DataView(buffer);
                const magic = view.getUint32(0, true);
                if (magic === 0x46546C67) {
                    parseBinaryGLTF(buffer, onLoad, onError);
                } else {
                    const text = new TextDecoder().decode(buffer);
                    const json = JSON.parse(text);
                    parseGLTFJson(json, url, onLoad, onError);
                }
            })
            .catch(onError);
    }

    function parseBinaryGLTF(buffer, onLoad, onError) {
        try {
            const view = new DataView(buffer);
            let offset = 12;
            let jsonChunk = null, binChunk = null;
            const totalLen = view.getUint32(8, true);
            while (offset < totalLen) {
                const chunkLen  = view.getUint32(offset, true);
                const chunkType = view.getUint32(offset + 4, true);
                offset += 8;
                if (chunkType === 0x4E4F534A) {
                    jsonChunk = new TextDecoder().decode(new Uint8Array(buffer, offset, chunkLen));
                } else if (chunkType === 0x004E4942) {
                    binChunk = buffer.slice(offset, offset + chunkLen);
                }
                offset += chunkLen;
            }
            if (!jsonChunk) { onError(new Error('No JSON chunk')); return; }
            const gltf = JSON.parse(jsonChunk);
            buildScene(gltf, binChunk, onLoad, onError);
        } catch(e) { onError(e); }
    }

    function buildScene(gltf, binBuffer, onLoad, onError) {
        try {
            const buffers = [binBuffer];
            const group   = new THREE.Group();

            const imagePromises = (gltf.images || []).map((img) => {
                return new Promise((res) => {
                    if (img.bufferView !== undefined) {
                        const bv  = gltf.bufferViews[img.bufferView];
                        const arr = new Uint8Array(buffers[bv.buffer], bv.byteOffset || 0, bv.byteLength);
                        const blob = new Blob([arr], { type: img.mimeType || 'image/jpeg' });
                        const url  = URL.createObjectURL(blob);
                        const tex  = new THREE.TextureLoader().load(url, () => { URL.revokeObjectURL(url); res(tex); }, undefined, () => res(null));
                        tex.flipY  = false;
                    } else { res(null); }
                });
            });

            Promise.all(imagePromises).then(textures => {
                const materials = (gltf.materials || []).map(mat => {
                    const m = new THREE.MeshStandardMaterial({ side: mat.doubleSided ? THREE.DoubleSide : THREE.FrontSide });
                    const pbr = mat.pbrMetallicRoughness || {};
                    if (pbr.baseColorTexture !== undefined && textures[pbr.baseColorTexture.index]) {
                        m.map = textures[pbr.baseColorTexture.index];
                    }
                    m.roughness = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1;
                    m.metalness = pbr.metallicFactor  !== undefined ? pbr.metallicFactor  : 0;
                    if (mat.normalTexture !== undefined && textures[mat.normalTexture.index]) {
                        m.normalMap = textures[mat.normalTexture.index];
                    }
                    return m;
                });

                function getAccessor(idx) {
                    const acc = gltf.accessors[idx];
                    const bv  = gltf.bufferViews[acc.bufferView];
                    const buf = buffers[bv.buffer];
                    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
                    const typeMap = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16 };
                    const components = typeMap[acc.type] || 1;
                    const ctorMap = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
                    const Ctor = ctorMap[acc.componentType] || Float32Array;
                    return new Ctor(buf, byteOffset, acc.count * components);
                }

                (gltf.meshes || []).forEach(meshDef => {
                    meshDef.primitives.forEach(prim => {
                        const geo = new THREE.BufferGeometry();
                        if (prim.attributes.POSITION !== undefined) {
                            geo.setAttribute('position', new THREE.BufferAttribute(getAccessor(prim.attributes.POSITION), 3));
                        }
                        if (prim.attributes.NORMAL !== undefined) {
                            geo.setAttribute('normal', new THREE.BufferAttribute(getAccessor(prim.attributes.NORMAL), 3));
                        }
                        if (prim.attributes.TEXCOORD_0 !== undefined) {
                            geo.setAttribute('uv', new THREE.BufferAttribute(getAccessor(prim.attributes.TEXCOORD_0), 2));
                        }
                        if (prim.indices !== undefined) {
                            geo.setIndex(new THREE.BufferAttribute(getAccessor(prim.indices), 1));
                        }
                        geo.computeVertexNormals();
                        const mat  = prim.material !== undefined ? materials[prim.material] : new THREE.MeshStandardMaterial();
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        group.add(mesh);
                    });
                });

                onLoad(group);
            });
        } catch(e) { onError(e); }
    }

    function parseGLTFJson(gltf, baseUrl, onLoad, onError) {
        const bufferPromises = (gltf.buffers || []).map(buf => {
            if (buf.uri) {
                const url = new URL(buf.uri, baseUrl).href;
                return fetch(url).then(r => r.arrayBuffer());
            }
            return Promise.resolve(null);
        });
        Promise.all(bufferPromises).then(buffers => {
            buildScene(gltf, buffers[0], onLoad, onError);
        }).catch(onError);
    }

    // Fallback Roblox-style blocky character
    function buildFallbackCharacter() {
        const group = new THREE.Group();
        const green = new THREE.MeshStandardMaterial({ color: 0x064e3b });
        const skin  = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
        const gold  = new THREE.MeshStandardMaterial({ color: 0xd4a017 });
        const dark  = new THREE.MeshStandardMaterial({ color: 0x022c22 });

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.7,0.4), green);
        torso.position.y = 0.1;
        group.add(torso);
        group.userData.torso = torso;

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.45), skin);
        head.position.y = 0.75;
        group.add(head);
        group.userData.head = head;

        // Eyes
        [-0.1, 0.1].forEach(x => {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.06,0.05), dark);
            eye.position.set(x, 0.8, 0.24);
            group.add(eye);
        });

        // Smile
        const smile = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.04,0.05), dark);
        smile.position.set(0, 0.68, 0.24);
        group.add(smile);

        // Kufi (Islamic cap)
        const kufi = new THREE.Mesh(new THREE.CylinderGeometry(0.27,0.27,0.18,8), gold);
        kufi.position.y = 1.07;
        group.add(kufi);

        // Left Arm
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.6,0.3), green);
        lArm.position.set(-0.41, 0.1, 0);
        lArm.rotation.z = -0.15;
        group.add(lArm);
        group.userData.leftArm = lArm;

        // Right Arm — raised high for waving
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.6,0.3), green);
        rArm.position.set(0.41, 0.35, 0);
        rArm.rotation.z = 1.2;
        group.add(rArm);
        group.userData.rightArm = rArm;

        // Hands
        const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.25), skin);
        lHand.position.set(-0.48, -0.2, 0);
        group.add(lHand);
        group.userData.leftHand = lHand;

        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.25), skin);
        rHand.position.set(0.6, 0.7, 0);
        group.add(rHand);
        group.userData.rightHand = rHand;

        // Legs
        const legs = [];
        [-0.15, 0.15].forEach((x) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.55,0.3), dark);
            leg.position.set(x, -0.46, 0);
            group.add(leg);
            legs.push(leg);
        });
        group.userData.leftLeg = legs[0];
        group.userData.rightLeg = legs[1];

        // Shoes
        [-0.15, 0.15].forEach((x) => {
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.15,0.38), dark);
            shoe.position.set(x, -0.79, 0.04);
            group.add(shoe);
        });

        return group;
    }

    function onCharacterLoaded(group) {
        character = group;
        const box3 = new THREE.Box3().setFromObject(character);
        const size = new THREE.Vector3();
        box3.getSize(size);
        const center = new THREE.Vector3();
        box3.getCenter(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 2.6 / maxDim;
        character.scale.setScalar(scale);
        character.position.set(-center.x * scale, -center.y * scale - 0.1, -center.z * scale);
        character.rotation.y = Math.PI + 0.3;
        scene.add(character);
        animate();
    }

    function onLoadError(err) {
        console.warn('GLTF load failed, using fallback:', err);
        character = buildFallbackCharacter();
        character.position.y = -1.0;
        character.rotation.y = Math.PI + 0.3;
        scene.add(character);
        animate();
    }

    loadGLTF('character.gltf', onCharacterLoaded, onLoadError);

    let clock = { start: Date.now() };
    let waveTime = 0;

    function animate() {
        requestAnimationFrame(animate);
        const t = (Date.now() - clock.start) * 0.001;
        const board = document.querySelector('.from-board');
        const isWaving = board && board.classList.contains('waving');

        if (character && character.userData) {
            const parts = character.userData;

            if (isWaving) {
                waveTime += 0.1;
                const waveMotion = Math.sin(waveTime * 3) * 0.4;

                if (parts.rightArm) {
                    parts.rightArm.rotation.z = 1.2 + waveMotion;
                    parts.rightArm.rotation.x = 0.3;
                }
                if (parts.rightHand) {
                    parts.rightHand.position.y = 0.7 + waveMotion * 0.2;
                }
                // Subtle head nod while waving
                if (parts.head) {
                    parts.head.rotation.z = Math.sin(waveTime * 2.5) * 0.1;
                }
            } else {
                waveTime = 0;
                // Continuous idle wave animation — hand stays up and sways
                const idleWave = Math.sin(t * 2) * 0.15;
                character.position.y += Math.sin(t * 1.8) * 0.0008;
                character.rotation.y = (Math.PI + 0.3) + Math.sin(t * 0.5) * 0.12;

                if (parts.rightArm) {
                    parts.rightArm.rotation.z += (1.2 + idleWave - parts.rightArm.rotation.z) * 0.08;
                    parts.rightArm.rotation.x += (0 - parts.rightArm.rotation.x) * 0.1;
                }
                if (parts.rightHand) {
                    parts.rightHand.position.y += (0.7 + idleWave * 0.1 - parts.rightHand.position.y) * 0.08;
                }
                if (parts.head) {
                    parts.head.rotation.z += (0 - parts.head.rotation.z) * 0.1;
                }
            }
        }

        rimLight.intensity = 0.6 + 0.2 * Math.sin(t * 1.2);
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        const mob = window.innerWidth <= 500;
        const nW = mob ? Math.min(120, window.innerWidth * 0.32) : Math.min(320, window.innerWidth * 0.35);
        const nH = mob ? Math.min(200, window.innerHeight * 0.38) : Math.min(400, window.innerHeight * 0.55);
        canvas.width  = nW;
        canvas.height = nH;
        canvas.style.width  = nW + 'px';
        canvas.style.height = nH + 'px';
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
    });
})();

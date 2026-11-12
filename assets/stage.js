(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const leaves = [];
  const refreshers = [];

  const L = (zh, en) => (document.documentElement.lang === 'zh' ? zh : en);
  function T(tag, cls, zh, en) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (zh != null) {
      node.dataset.zh = zh;
      node.dataset.en = en;
      leaves.push(node);
      node.textContent = L(zh, en);
    }
    return node;
  }
  function relabel() {
    for (const node of leaves) node.textContent = L(node.dataset.zh, node.dataset.en);
    for (const fn of refreshers) fn();
  }
  document.querySelector('.language-selector')?.addEventListener('change', relabel);

  function shell(host, kicker, title) {
    const block = document.createElement('section');
    block.className = 'eval-block';
    block.append(T('h3', 'eval-kicker', kicker[0], kicker[1]));
    const root = document.createElement('article');
    root.className = 'sv-panel';
    const top = document.createElement('div');
    top.className = 'sv-top';
    const copy = document.createElement('div');
    copy.append(T('h3', '', title[0], title[1]));
    const replay = T('button', 'sv-replay', '↻ 重放', '↻ Replay');
    replay.type = 'button';
    top.append(copy, replay);
    const meter = document.createElement('div');
    meter.className = 'sv-meter';
    const bar = document.createElement('i');
    meter.append(bar);
    const caption = document.createElement('p');
    caption.className = 'sv-caption';
    const note = document.createElement('p');
    note.className = 'sv-note';
    root.append(top, meter, caption, note);
    block.append(root);
    host.append(block);
    return { root, replay, bar, caption, note, meter };
  }

  function play(host, count, period, render) {
    let step = reduced ? count - 1 : 0;
    let acc = 0;
    let playing = !reduced;
    let visible = false;
    let last = 0;
    const draw = () => render(step, playing && visible && !reduced ? acc / period : (step === count - 1 ? 1 : 0));
    const api = {
      replay() {
        if (reduced) {
          step = (step + 1) % count;
          render(step, 1);
          return;
        }
        step = 0;
        acc = 0;
        playing = true;
        render(0, 0);
      }
    };
    function loop(now) {
      if (!last) last = now;
      const dt = Math.min(48, now - last);
      last = now;
      if (playing && visible && !document.hidden && !reduced) {
        acc += dt;
        if (acc >= period) {
          if (step >= count - 1) {
            playing = false;
            acc = 0;
            render(step, 1);
          } else {
            acc -= period;
            step += 1;
            render(step, acc / period);
          }
        } else {
          render(step, acc / period);
        }
      }
      requestAnimationFrame(loop);
    }
    new IntersectionObserver((entries) => {
      const on = entries.some((entry) => entry.isIntersecting);
      if (on && !visible) render(step, acc / period);
      visible = on;
    }, { threshold: 0.12 }).observe(host);
    render(step, reduced ? 1 : 0);
    requestAnimationFrame(loop);
    return api;
  }

  function fraction(step, progress, from) {
    if (reduced || step > from) return 1;
    if (step < from) return 0;
    return progress;
  }

  /* ---------- Composite coverflow ---------- */
  const rail = document.getElementById('demo-grid');
  if (rail) {
    const viewer = rail.nextElementSibling?.classList.contains('inline-viewer') ? rail.nextElementSibling : null;
    const stage = document.createElement('div');
    stage.className = 'coverflow';
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', L('复合能力场景，点选一张卡片', 'Composite scenarios, select a card'));
    rail.before(stage);
    stage.append(rail);
    rail.classList.add('coverflow-track');
    if (viewer) stage.after(viewer);

    const ui = document.createElement('div');
    ui.className = 'coverflow-ui';
    const count = document.createElement('span');
    count.className = 'coverflow-count';
    ui.append(count);
    stage.append(ui);

    let index = 0;
    let coverVisible = false;
    const cardsOf = () => [...rail.querySelectorAll('.demo-card')].filter((card) => !card.hidden);

    function layout() {
      const cards = cardsOf();
      if (!cards.length) return;
      const total = cards.length;
      index = ((index % total) + total) % total;
      cards.forEach((card, i) => {
        card.classList.remove('reveal', 'visible');
        let offset = i - index;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
        const distance = Math.abs(offset);
        const scale = distance === 0 ? 1 : distance === 1 ? 0.8 : distance === 2 ? 0.66 : 0.54;
        const lift = distance === 0 ? -10 : 18;
        card.style.transform = `translate(-50%, -50%) translateX(${offset * 68}%) translateY(${lift}px) scale(${scale})`;
        card.style.zIndex = String(40 - distance);
        card.style.opacity = distance > 3 ? '0' : '1';
        card.style.visibility = distance > 3 ? 'hidden' : 'visible';
        card.classList.toggle('is-center', offset === 0);
        const video = card.querySelector('video');
        if (video) {
          if (offset === 0 && coverVisible && !reduced) video.play().catch(() => {});
          else video.pause();
        }
      });
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
    new IntersectionObserver((entries) => {
      coverVisible = entries.some((entry) => entry.isIntersecting);
      layout();
    }, { threshold: 0.2 }).observe(stage);

    rail.addEventListener('click', (event) => {
      const card = event.target.closest('.demo-card');
      if (!card || card.hidden) return;
      const nextIndex = cardsOf().indexOf(card);
      if (nextIndex !== index && nextIndex >= 0) {
        event.preventDefault();
        event.stopPropagation();
        index = nextIndex;
        layout();
      }
    }, true);

    refreshers.push(layout);
    layout();
    addEventListener('resize', layout);
  }

  /* ---------- Method timeline ---------- */
  const method = document.querySelector('#method .architecture');
  if (method) {
    method.classList.add('sv-panel');
    method.replaceChildren();
    const beats = [
      ['左侧虚线是已经离开当前视觉窗口的历史消息。', 'Dashed boxes are messages that have left the active visual window.'],
      ['这些历史经 LHIM 做事件级压缩，写入记忆后再送回模型。', 'LHIM compresses that history into events, stores it as memory, and feeds it back into the model.'],
      ['第一组五个时间块：模型接收提问、调用工具，再结合工具结果生成回答。', 'First group of five timeline chunks: the model receives a question, calls a tool, and answers using the result.'],
      ['另一路不调用工具：提问经 ASR 进入后，模型直接给出文本和语音，再继续沉默。', 'The other path calls no tool. After ASR, the model answers in text and speech, then stays silent.']
    ];

    const top = document.createElement('div');
    top.className = 'sv-top';
    const copy = document.createElement('div');
    copy.append(T('h3', '', 'AURA 2.0 流式交互框架', 'AURA 2.0 streaming interaction framework'));
    const replay = T('button', 'sv-replay', '↻ 重放', '↻ Replay');
    replay.type = 'button';
    top.append(copy, replay);
    const meter = document.createElement('div');
    meter.className = 'sv-meter';
    const bar = document.createElement('i');
    meter.append(bar);

    const scroll = document.createElement('div');
    scroll.className = 'sv-scroll';
    const board = document.createElement('div');
    board.className = 'fw';
    scroll.append(board);

    function wave(kind) {
      const node = document.createElement('span');
      node.className = `wave ${kind || ''}`;
      node.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
      return node;
    }
    function token(kind, step, hist) {
      const node = document.createElement('span');
      node.className = `tok tok-${kind}${hist ? ' is-hist' : ''}`;
      node.textContent = kind;
      node.dataset.step = String(step);
      return node;
    }
    function video(step, hist) {
      const node = document.createElement('span');
      node.className = `chunk${hist ? ' is-hist' : ''}`;
      node.textContent = '▶';
      node.dataset.step = String(step);
      return node;
    }
    function question(step, hist) {
      const node = document.createElement('span');
      node.className = `chunk chunk-q${hist ? ' is-hist' : ''}`;
      node.textContent = 'Q';
      node.dataset.step = String(step);
      return node;
    }
    function line(nodes) {
      const row = document.createElement('div');
      row.className = 'fw-line';
      nodes.forEach((node) => {
        const slot = document.createElement('div');
        slot.className = 'fw-slot';
        if (Array.isArray(node)) {
          const group = document.createElement('div');
          group.className = 'fw-group';
          group.append(...node);
          slot.append(group);
        } else slot.append(node);
        row.append(slot);
      });
      return row;
    }
    function speech(cls, label, step) {
      const node = document.createElement('div');
      node.className = cls;
      node.dataset.step = String(step);
      const tag = document.createElement('b');
      tag.textContent = label;
      node.append(tag, wave(label === 'TTS' ? 'tts' : ''));
      return node;
    }

    const output = document.createElement('div');
    output.className = 'fw-band';
    const histOut = document.createElement('div');
    histOut.className = 'fw-dash';
    histOut.append(T('b', 'fw-tag', '历史', 'History'), line(['S', 'S', 'R', 'A', 'S'].map((k) => token(k, 0, true))));
    const liveOut = document.createElement('div');
    liveOut.className = 'fw-live';
    const exAOut = document.createElement('div');
    exAOut.className = 'fw-ex';
    const outA = line([token('S', 2), token('S', 2), [token('R', 3), token('TC', 4)], [token('R', 6), token('A', 6)], token('S', 6)]);
    outA.children[3].append(speech('fw-tts', 'TTS', 6));
    exAOut.append(outA);
    const exBOut = document.createElement('div');
    exBOut.className = 'fw-ex';
    const outB = line([token('S', 7), token('S', 7), [token('R', 7), token('A', 7)], token('S', 7), token('S', 7)]);
    outB.children[2].append(speech('fw-tts', 'TTS', 7));
    exBOut.append(outB);
    liveOut.append(exAOut, exBOut);
    output.append(histOut, liveOut);

    const model = document.createElement('div');
    model.className = 'fw-model';
    model.textContent = 'AURA 2.0';

    const input = document.createElement('div');
    input.className = 'fw-band';
    const histIn = document.createElement('div');
    histIn.className = 'fw-side';
    const histVideo = document.createElement('div');
    histVideo.className = 'fw-dash';
    histVideo.append(line([video(0, true), video(0, true), question(0, true), video(0, true), video(0, true)]));
    const down = document.createElement('i');
    down.className = 'fw-varr';
    down.dataset.step = '1';
    const up = document.createElement('i');
    up.className = 'fw-varr up';
    up.dataset.step = '1';
    const arrow = document.createElement('i');
    arrow.className = 'fw-harr';
    arrow.dataset.step = '1';
    arrow.textContent = '→';
    const compress = T('span', 'fw-pill', '事件级压缩', 'Event-level compression');
    const memory = T('span', 'fw-pill', '记忆', 'Memory');
    compress.dataset.step = '1';
    memory.dataset.step = '1';
    const lhimLabel = T('small', 'fw-lhim-name', '长期记忆 LHIM', 'LHIM');
    lhimLabel.dataset.step = '1';
    histIn.append(histVideo, down, compress, arrow, memory, lhimLabel);
    const ret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ret.setAttribute('class', 'fw-return');
    ret.setAttribute('viewBox', '0 0 200 190');
    ret.setAttribute('aria-hidden', 'true');
    ret.innerHTML = '<defs><marker id="fwRet" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#3D8BFF"/></marker></defs><path d="M62 172 C 58 100, 96 28, 168 46" fill="none" stroke="#3D8BFF" stroke-width="2" marker-end="url(#fwRet)"/>';
    const liveIn = document.createElement('div');
    liveIn.className = 'fw-live';
    const exAIn = document.createElement('div');
    exAIn.className = 'fw-ex';
    const asrA = speech('fw-asr', 'ASR', 3);
    const qA = question(3);
    const inA = line([video(2), video(2), [video(3), qA], token('TR', 5)]);
    inA.children[2].append(asrA);
    exAIn.append(inA);
    const exBIn = document.createElement('div');
    exBIn.className = 'fw-ex';
    const asrB = speech('fw-asr', 'ASR', 7);
    const qB = question(7);
    const inB = line([video(7), [video(7), qB], video(7), video(7), video(7), video(7)]);
    inB.children[1].append(asrB);
    exBIn.append(inB);
    liveIn.append(exAIn, exBIn);
    input.append(histIn, liveIn);
    board.append(output, model, input, ret);

    const caption = document.createElement('p');
    caption.className = 'sv-caption';
    const note = T('p', 'sv-note',
      '模型逐块处理视频、用户输入和交互历史：输出 <|silent|> 继续观察，或输出 <|respond|> 后再接文本回应或工具调用。工具结果写回上下文。虚线是已经离开当前视觉窗口的历史消息。',
      'The model processes video chunks, user input, and interaction history incrementally. It emits <|silent|> to keep observing, or <|respond|> followed by text or a tool call. Tool results re-enter the context. Dashed tokens are history outside the active visual window.');
    const legend = document.createElement('div');
    legend.className = 'legend';
    const legendItems = [
      ['R', 'tok tok-R', '回应标记', '<|respond|>'],
      ['S', 'tok tok-S', '沉默标记', '<|silent|>'],
      ['▶', 'chunk', '视频块', 'Video chunk'],
      ['TC', 'tok tok-TC', '工具调用', 'Tool call'],
      ['TR', 'tok tok-TR', '工具结果', 'Tool response'],
      ['A', 'tok tok-A', '文本回应', 'Text response'],
      ['Q', 'chunk chunk-q', '用户提问', 'User question']
    ];
    for (const [mark, cls, zh, en] of legendItems) {
      const item = document.createElement('span');
      const badge = document.createElement('i');
      badge.className = cls;
      badge.textContent = mark;
      badge.style.fontStyle = 'normal';
      item.append(badge, document.createTextNode(' '), T('span', '', zh, en));
      legend.append(item);
    }
    const dashed = document.createElement('span');
    const dashMark = document.createElement('i');
    dashMark.className = 'tok is-hist';
    dashMark.textContent = 'R';
    dashed.append(dashMark, document.createTextNode(' '), T('span', '', '历史消息', 'Historical message'));
    legend.prepend(dashed);
    method.append(top, meter, scroll, caption, legend, note);

    // Animate corresponding input and output columns together in groups of five.
    for (const row of [liveOut, liveIn]) {
      const slots = [...row.querySelectorAll('.fw-slot')];
      slots.forEach((slot, index) => {
        slot.querySelectorAll('[data-step]').forEach((node) => {
          node.dataset.step = index < 5 ? '2' : '3';
        });
      });
    }
    const parts = [...board.querySelectorAll('[data-step]')];
    let methodStep = reduced ? beats.length - 1 : 0;
    function render(step, progress) {
      methodStep = step;
      const settled = step === beats.length - 1 && progress >= 1;
      parts.forEach((node) => {
        const at = Number(node.dataset.step);
        node.classList.toggle('is-future', at > step);
        node.classList.toggle('is-now', !settled && at === step);
      });
      caption.textContent = L(beats[step][0], beats[step][1]);
      bar.style.width = `${((step + progress) / beats.length) * 100}%`;
    }
    const api = play(method, beats.length, 1500, render);
    replay.addEventListener('click', () => api.replay());
    refreshers.push(() => {
      caption.textContent = L(beats[methodStep][0], beats[methodStep][1]);
    });
  }

  // The method player above updates captions inside render, but language switches need the latest step.
  // Rebuild the method renderer hook properly if the first version did not track step.
  // (tracked below after all players register their own refreshers)

  /* ---------- Data pipeline ---------- */
  const pipeFig = document.querySelector('#data .pipeline-figure');
  if (pipeFig) {
    const title = pipeFig.querySelector('h3');
    const glyph = {
      video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="6" width="11" height="8" rx="1.4"/><rect x="8" y="9" width="13" height="9" rx="1.4"/><path d="M14.2 13.4l3.2-1.7v3.6z" fill="currentColor" stroke="none"/></svg>',
      refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 4v4h-4"/></svg>',
      resize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>',
      split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v12M12 6v12M16 6v12"/></svg>',
      mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10h3l4-3v10l-4-3H4z"/><path d="M16 10l4 4M20 10l-4 4"/></svg>',
      clips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="7" width="6" height="10" rx="1"/><rect x="16" y="7" width="6" height="10" rx="1"/><path d="M4.2 12l2 1.2v-2.4zM11.2 12l2 1.2v-2.4zM18.2 12l2 1.2v-2.4z" fill="currentColor" stroke="none"/></svg>',
      face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M9 10.5h.01M15 10.5h.01M8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"/></svg>',
      doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
      qa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="5" width="8" height="8" rx="2"/><rect x="14" y="11" width="8" height="8" rx="2"/><path d="M11 9h2M12 9v4"/></svg>',
      mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>',
      calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
      align: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 12h16M4 17h10"/><circle cx="8" cy="7" r="1.3" fill="currentColor"/><circle cx="14" cy="12" r="1.3" fill="currentColor"/><circle cx="10" cy="17" r="1.3" fill="currentColor"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
      filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>',
      db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>'
    };
    const iconEl = (name) => {
      const node = document.createElement('span');
      node.className = 'pipe-ico';
      node.innerHTML = glyph[name] || glyph.doc;
      return node;
    };
    const steps = [
      { phase: 'a', icon: 'video', zh: '视频采集', en: 'Video collection', body: ['采集到的视频从这里进入流程。', 'Collected videos enter the pipeline here.'] },
      { phase: 'a', icon: 'refresh', zh: '轻量预处理', en: 'Lightweight preprocessing', tools: [['refresh', '转码', 'Re-encode'], ['resize', '缩放', 'Resize'], ['split', '切段', 'Split'], ['mute', '去音轨', 'No audio']], body: ['统一编码、尺寸、长度，并去掉音频。', 'Re-encode, resize, split into fixed-length clips, and remove the audio.'] },
      { phase: 'a', icon: 'clips', zh: '标准化片段', en: 'Standardized clips', body: ['预处理之后得到可复用的标准片段。', 'Preprocessing yields reusable standardized clips.'] },
      { phase: 'a', icon: 'face', zh: 'MLLM', en: 'MLLM', body: ['多模态模型阅读每个片段。', 'A multimodal model reads each clip.'] },
      { phase: 'a', icon: 'doc', zh: '片段级描述', en: 'Clip-level descriptions', body: ['生成物体、动作和场景上下文，作为后面任务合成的共享语义。', 'Objects, actions, and scene context become the shared semantics for task synthesis.'] },
      { phase: 'b', kind: 'qa', icon: 'qa', zh: 'General QA', en: 'General QA', points: [['实时 Q→A', 'Real-time Q→A'], ['主动 Q S S A', 'Proactive Q S S A'], ['多轮 Q A A A', 'Multi-response Q A A A']], body: ['问题驱动的交互，覆盖实时回答、主动时机和多段回复。', 'Question-driven trajectories: real-time answers, proactive timing, and multi-response replies.'] },
      { phase: 'b', kind: 'mic', icon: 'mic', zh: 'MIC · 主动对话', en: 'MIC · Model-initiated', points: [['建议 · 提醒 · 告警', 'Suggest · remind · alert'], ['没有用户提问', 'Without a user query'], ['“要不要我帮忙分账？”', '“Shall I help split the bill?”']], body: ['模型自己决定何时开口、说什么；没有帮助点就保持沉默。', 'The model decides when and what to say. It speaks when helpful, and otherwise stays silent.'] },
      { phase: 'b', kind: 'satc', icon: 'calc', zh: 'SATC · 工具调用', en: 'SATC · Tool calling', tools: [['search', '搜索', 'Search'], ['calc', '计算', 'Calculator'], ['sun', '天气', 'Weather']], points: [['calc(60 / 4) → 15', 'calc(60 / 4) → 15'], ['回答每人 $15', 'Answer $15 each']], body: ['为场景提议工具，合成调用与不调用两类轨迹。', 'Scene-relevant tools are proposed, including both tool-use trajectories and no-call cases.'] },
      { phase: 'b', kind: 'ivg', icon: 'pin', zh: 'IVG · 视觉定位', en: 'IVG · Visual grounding', points: [['“跟着那个红杯子。”', '“Track the red cup.”'], ['LocateAnything', 'LocateAnything'], ['辅助框标注', 'Assisted box localization']], body: ['定位问答配上边界框轨迹。', 'Grounded questions are paired with bounding-box trajectories.'] },
      { phase: 'c', icon: 'align', zh: '对齐到视频块', en: 'Align to video chunks', chips: ['Q', 'S', 'A', 'S', 'CALL', 'RESULT', 'A+BOX', 'S', 'A'], body: ['把观察、沉默、文本、工具和框按时间对齐到视频块。', 'Observations, silence, text, tool calls, and boxes are aligned to video chunks by timestamp.'] },
      { phase: 'c', icon: 'check', zh: '质量评估', en: 'Quality assessment', points: [['流式格式与时间对齐', 'Streaming format and temporal alignment'], ['画面证据与回复一致', 'Visual evidence matches the response'], ['按任务做多模态核对', 'Task-specific multimodal checks']], body: ['规则和 MLLM 一起做这三项检查。', 'Rules and an MLLM run these three checks.'] },
      { phase: 'c', icon: 'filter', zh: '过滤低质量样本', en: 'Filter low-quality samples', body: ['不合格或低质量样本在这里被去掉。', 'Invalid or low-quality samples are removed.'] },
      { phase: 'c', icon: 'db', zh: 'AURA 2.0 训练集', en: 'AURA 2.0 mixture', body: ['得到经过校验的流式训练混合数据。', 'What remains is the verified streaming training mixture.'] }
    ];

    pipeFig.parentElement?.prepend(pipeFig);
    pipeFig.replaceChildren(title);
    const panel = document.createElement('div');
    panel.className = 'sv-panel';
    const top = document.createElement('div');
    top.className = 'sv-top';
    const copy = document.createElement('div');
    copy.append(
      T('span', 'sv-kicker', '沿箭头从 a 到 b 到 c', 'Follow the arrows from a to b to c'),
      T('h3', '', '采集、合成、组装', 'Collect, synthesize, assemble')
    );
    const replay = T('button', 'sv-replay', '↻ 重放', '↻ Replay');
    replay.type = 'button';
    top.append(copy, replay);
    const meter = document.createElement('div');
    meter.className = 'sv-meter';
    const bar = document.createElement('i');
    meter.append(bar);
    const caption = document.createElement('p');
    caption.className = 'sv-caption';

    const phases = {};
    for (const id of ['a', 'b', 'c']) {
      const section = document.createElement('section');
      section.className = 'pipe-phase is-wait';
      section.dataset.phase = id;
      const header = document.createElement('header');
      const mark = document.createElement('b');
      mark.textContent = id;
      const label = id === 'a'
        ? T('span', '', '视频采集与准备', 'Video collection & preparation')
        : id === 'b'
          ? T('span', '', '按任务合成四类监督', 'Task-specific data synthesis')
          : T('span', '', '流式组装与质量评估', 'Streaming assembly & quality assessment');
      header.append(mark, label);
      section.append(header);
      if (id === 'b') section.append(T('p', 'pipe-source', '视频片段 + 场景描述 · 四类互补监督', 'Video clips + scene descriptions · four complementary supervision types'));
      const flow = document.createElement('div');
      flow.className = id === 'b' ? 'pipe-cards' : 'pipe-flow';
      section.append(flow);
      phases[id] = { section, flow };
    }

    const nodes = steps.map((step, index) => {
      const node = document.createElement('article');
      node.className = `pipe-node is-wait${step.kind ? ` ${step.kind}` : ''}`;
      if (step.icon) node.append(iconEl(step.icon));
      node.append(T('strong', '', step.zh, step.en));
      if (step.tools) {
        const tools = document.createElement('div');
        tools.className = 'pipe-tools';
        for (const tool of step.tools) {
          const item = document.createElement('span');
          const mark = document.createElement('i');
          mark.innerHTML = glyph[tool[0]] || '';
          item.append(mark, T('b', '', tool[1], tool[2]));
          tools.append(item);
        }
        node.append(tools);
      }
      if (step.points) {
        const list = document.createElement('ul');
        for (const point of step.points) list.append(T('li', '', point[0], point[1]));
        node.append(list);
      }
      if (step.chips) {
        const row = document.createElement('div');
        row.className = 'chip-row';
        for (const chip of step.chips) {
          const c = document.createElement('span');
          c.className = 'chip';
          c.textContent = chip;
          row.append(c);
        }
        node.append(row);
      }
      return node;
    });

    let cursor = { a: null, b: null, c: null };
    steps.forEach((step, index) => {
      const flow = phases[step.phase].flow;
      if (cursor[step.phase]) {
        const arrow = document.createElement('i');
        arrow.className = 'pipe-arrow';
        arrow.dataset.after = String(index - 1);
        flow.append(arrow);
      }
      flow.append(nodes[index]);
      cursor[step.phase] = nodes[index];
    });

    const downAB = document.createElement('i');
    downAB.className = 'pipe-down';
    const downBC = document.createElement('i');
    downBC.className = 'pipe-down';
    const note = T('p', 'sv-note',
      '流程把采集的视频变成经过校验的流式训练数据：(a) 标准化片段并生成片段描述；(b) 用这些描述构造 General QA、MIC、SATC 和 IVG 轨迹；(c) 按视频块对齐，并滤掉无效或低质量样本。',
      'The pipeline turns collected videos into a verified streaming mixture: (a) standardize clips and write clip-level descriptions; (b) build General QA, MIC, SATC, and IVG trajectories from those descriptions; (c) align them to video chunks and filter invalid or low-quality samples.');
    panel.append(top, meter, caption, phases.a.section, downAB, phases.b.section, downBC, phases.c.section, note);
    pipeFig.append(panel);

    const phaseOrder = ['a', 'b', 'c'];
    const phaseCaptions = [
      ['a 整段一起进行：采集视频，做轻量预处理，切成标准片段，再写出片段描述。', 'Stage a runs as a whole: collect videos, preprocess them, cut standardized clips, and write clip descriptions.'],
      ['b 整段一起进行：用片段和描述合成 General QA、MIC、SATC 和 IVG。', 'Stage b runs as a whole: the clips and descriptions become General QA, MIC, SATC, and IVG.'],
      ['c 整段一起进行：对齐到视频块，做质量检查，滤掉低质量样本，得到训练集。', 'Stage c runs as a whole: align to video chunks, check quality, filter weak samples, and keep the training mixture.']
    ];
    let dataStep = 0;
    function render(step, progress) {
      dataStep = step;
      nodes.forEach((node, index) => {
        const phaseIndex = phaseOrder.indexOf(steps[index].phase);
        node.classList.toggle('is-current', phaseIndex === step);
        node.classList.toggle('is-done', phaseIndex < step);
        node.classList.toggle('is-wait', phaseIndex > step);
      });
      panel.querySelectorAll('.pipe-arrow').forEach((arrow) => {
        const phaseIndex = phaseOrder.indexOf(steps[Number(arrow.dataset.after)].phase);
        arrow.classList.toggle('is-done', phaseIndex <= step);
        arrow.classList.toggle('is-current', phaseIndex === step);
      });
      phaseOrder.forEach((id, phaseIndex) => {
        const section = phases[id].section;
        section.classList.toggle('is-wait', phaseIndex > step);
        section.classList.toggle('is-current', phaseIndex === step);
        section.classList.toggle('is-done', phaseIndex < step);
      });
      downAB.classList.toggle('is-on', step >= 1);
      downBC.classList.toggle('is-on', step >= 2);
      caption.textContent = L(phaseCaptions[step][0], phaseCaptions[step][1]);
      bar.style.width = `${((step + progress) / phaseOrder.length) * 100}%`;
    }
    const api = play(panel, phaseOrder.length, 2200, render);
    replay.addEventListener('click', () => api.replay());
    refreshers.push(() => { caption.textContent = L(phaseCaptions[dataStep][0], phaseCaptions[dataStep][1]); });
  }

  buildMix();
  animateBenchmarks();

  /* ---------- Evaluation tables ---------- */
  const evalHost = document.getElementById('eval-stages');
  if (evalHost) {
    buildMic(evalHost);
    buildTools(evalHost);
    buildIvg(evalHost);
  }

  function buildMic(host) {
    const ui = shell(host,
      ['主动对话', 'Model-Initiated Conversation'],
      ['25 条视频上的触发率与回复质量', 'Trigger rate and response quality on 25 videos']);
    ui.note.textContent = '';
    const grid = document.createElement('div');
    grid.className = 'metric-grid';
    const cards = [
      { k: ['视觉 + 对话上下文', 'Visual-Dialogue Context'], s: ['只在标注窗口上统计', 'Annotated windows only'], rate: 80, rateText: '80.0 (20/25)', quality: 4.1, qualityText: '4.10' },
      { k: ['仅视觉上下文', 'Visual-Only Context'], s: ['整段视频', 'Entire videos'], rate: 96, rateText: '96.0 (24/25)', quality: 3.72, qualityText: '3.72' }
    ].map((item) => {
      const card = document.createElement('article');
      card.className = 'metric-card is-wait';
      const sub = T('h4', '', item.s[0], item.s[1]);
      const nums = document.createElement('div');
      nums.className = 'metric-nums';
      const rate = document.createElement('div');
      const rateB = document.createElement('b');
      rateB.textContent = '0';
      rate.append(rateB, T('span', '', '触发率 %', 'Trigger rate %'));
      const qual = document.createElement('div');
      const qualB = document.createElement('b');
      qualB.textContent = '0';
      qual.append(qualB, T('span', '', '回复质量 0–5', 'Response quality 0–5'));
      nums.append(rate, qual);
      card.append(T('small', '', item.k[0], item.k[1]), sub, nums);
      grid.append(card);
      return { card, rateB, qualB, item };
    });
    const stack = document.createElement('div');
    stack.className = 'stack';
    stack.setAttribute('aria-hidden', 'true');
    const good = document.createElement('i');
    good.className = 'good';
    const neutral = document.createElement('i');
    neutral.className = 'neutral';
    const bad = document.createElement('i');
    bad.className = 'bad';
    stack.append(good, neutral, bad);
    const key = document.createElement('div');
    key.className = 'stack-key';
    const kg = T('span', '', '好 93', 'Good 93');
    const kn = T('span', '', '中 65', 'Neutral 65');
    const kb = T('span', '', '差 15', 'Bad 15');
    key.append(kg, kn, kb);
    key.style.opacity = '0.35';
    ui.note.dataset.zh = '触发率的评估区间不同，回复质量的计分方式也不同。这两个指标都不能直接跨设置比较。';
    ui.note.dataset.en = 'Trigger rates use different evaluation intervals, and response quality uses setting-specific scoring. Neither metric should be compared directly across settings.';
    leaves.push(ui.note);
    ui.note.textContent = L(ui.note.dataset.zh, ui.note.dataset.en);
    ui.meter.after(grid, stack, key);
    const beats = [
      ['两种设置的统计口径不同，数字不能直接横向比较。', 'The two settings use different intervals and scoring, so the metrics are not directly comparable.'],
      ['有对话上下文时，只在标注窗口上统计：触发率 80.0（20/25），回复质量 4.10。', 'With dialogue context, annotated windows only: trigger rate 80.0 (20/25), response quality 4.10.'],
      ['只有画面时，在整段视频上统计：触发率 96.0（24/25），回复质量 3.72。', 'With vision alone, over entire videos: trigger rate 96.0 (24/25), response quality 3.72.'],
      ['仅视觉设置里，模型主动消息 173 条：好 93 / 中 65 / 差 15。', 'Visual-only model-initiated messages: Good 93 / Neutral 65 / Bad 15, out of 173.']
    ];
    let stepNow = 0;
    function render(step, progress) {
      stepNow = step;
      const p0 = fraction(step, progress, 1);
      const p1 = fraction(step, progress, 2);
      cards[0].rateB.textContent = (80 * p0).toFixed(1);
      cards[0].qualB.textContent = (4.1 * p0).toFixed(2);
      cards[1].rateB.textContent = (96 * p1).toFixed(1);
      cards[1].qualB.textContent = (3.72 * p1).toFixed(2);
      cards.forEach((entry, index) => {
        entry.card.classList.toggle('is-now', step === index + 1);
        entry.card.classList.toggle('is-wait', step < index + 1);
      });
      const mix = fraction(step, progress, 3);
      good.style.width = `${93 / 173 * 100 * mix}%`;
      neutral.style.width = `${65 / 173 * 100 * mix}%`;
      bad.style.width = `${15 / 173 * 100 * mix}%`;
      key.style.opacity = String(0.35 + 0.65 * mix);
      ui.caption.textContent = L(beats[step][0], beats[step][1]);
      ui.bar.style.width = `${((step + progress) / beats.length) * 100}%`;
    }
    const api = play(ui.root, beats.length, 720, render);
    ui.replay.addEventListener('click', () => api.replay());
    refreshers.push(() => { ui.caption.textContent = L(beats[stepNow][0], beats[stepNow][1]); });
  }

  function buildTools(host) {
    const ui = shell(host,
      ['流式工具调用', 'Stream-Aware Tool Calling'],
      ['打开工具之后，两边的准确率都上升', 'Enabling tools improves accuracy on both benchmarks']);
    const grid = document.createElement('div');
    grid.className = 'compare-grid';
    const sets = [
      { name: ['StreamArena Tool', 'StreamArena Tool'], n: '1,732', off: 13, on: 18.5, use: 62.6, calls: 2305 },
      { name: ['Internal YouTube', 'Internal YouTube'], n: '167', off: 35.9, on: 48.5, use: 41.3, calls: 73 }
    ];
    const views = sets.map((set) => {
      const card = document.createElement('article');
      card.className = 'compare-card';
      const header = document.createElement('header');
      header.append(T('strong', '', set.name[0], set.name[1]), T('span', '', `${set.n} 题`, `${set.n} questions`));
      card.append(header);
      const accOff = barRow(card, ['准确率 · 关闭工具', 'Accuracy · tools off'], false);
      const accOn = barRow(card, ['准确率 · 打开工具', 'Accuracy · tools on'], true);
      const use = barRow(card, ['至少调用一次', 'At least one call'], true);
      const calls = document.createElement('p');
      calls.className = 'sv-note';
      calls.style.margin = '8px 0 0';
      card.append(calls);
      grid.append(card);
      return { accOff, accOn, use, calls, set };
    });
    ui.note.dataset.zh = 'StreamArena Tool 共 1,732 题，内部 YouTube 共 167 题。工具使用率是至少调用一次的题目占比。';
    ui.note.dataset.en = 'StreamArena Tool has 1,732 questions and the internal YouTube set has 167. Tool usage is the share of questions with at least one call.';
    leaves.push(ui.note);
    ui.note.textContent = L(ui.note.dataset.zh, ui.note.dataset.en);
    ui.meter.after(grid);
    const beats = [
      ['先看关闭工具时的准确率。StreamArena Tool 13.0%，内部 YouTube 35.9%。', 'Start with tools disabled: 13.0% on StreamArena Tool and 35.9% on the internal YouTube set.'],
      ['StreamArena Tool 打开工具后升到 18.5%，62.6% 的题至少调用一次，共 2,305 次。', 'On StreamArena Tool, tools raise accuracy to 18.5%. 62.6% of questions make at least one call, 2,305 calls in total.'],
      ['内部 YouTube 从 35.9% 升到 48.5%，41.3% 的题发生调用，共 73 次。', 'On internal YouTube, accuracy rises from 35.9% to 48.5%. 41.3% of questions use a tool, 73 calls in total.'],
      ['两个基准上都是同一方向：有工具可用时，回答更准确。', 'On both benchmarks the direction is the same: access to tools makes answers more accurate.']
    ];
    let stepNow = 0;
    function render(step, progress) {
      stepNow = step;
      const grow = [0, fraction(step, progress, 1), fraction(step, progress, 2)];
      views.forEach((view, index) => {
        const on = index === 0 ? grow[1] : index === 1 ? grow[2] : 0;
        const shownOn = index === 0 ? (step > 1 ? 1 : on) : (step > 2 ? 1 : on);
        view.accOff.i.style.width = `${view.set.off / view.set.on * 100}%`;
        view.accOff.b.textContent = view.set.off.toFixed(1);
        view.accOn.i.style.width = `${shownOn * 100}%`;
        view.accOn.b.textContent = (view.set.on * shownOn).toFixed(1);
        view.use.i.style.width = `${view.set.use * shownOn}%`;
        view.use.b.textContent = `${(view.set.use * shownOn).toFixed(1)}%`;
        const callCount = Math.round(view.set.calls * shownOn);
        view.calls.textContent = L(`工具调用 ${callCount.toLocaleString('zh-CN')} 次`, `${callCount.toLocaleString('en-US')} tool calls`);
      });
      ui.caption.textContent = L(beats[step][0], beats[step][1]);
      ui.bar.style.width = `${((step + progress) / beats.length) * 100}%`;
    }
    const api = play(ui.root, beats.length, 720, render);
    ui.replay.addEventListener('click', () => api.replay());
    refreshers.push(() => { ui.caption.textContent = L(beats[stepNow][0], beats[stepNow][1]); render(stepNow, stepNow === beats.length - 1 ? 1 : 0); });
  }

  function barRow(card, label, aura) {
    const line = document.createElement('div');
    line.className = 'bar-line';
    const name = T('span', '', label[0], label[1]);
    const track = document.createElement('div');
    track.className = 'track';
    const i = document.createElement('i');
    if (aura) i.className = 'aura';
    track.append(i);
    const b = document.createElement('b');
    b.textContent = '0';
    line.append(name, track, b);
    card.append(line);
    return { i, b };
  }

  function buildIvg(host) {
    const ui = shell(host,
      ['交互式视觉定位', 'Interactive Visual Grounding'],
      ['50 张诊断图上的定位', 'Grounding on a 50-image diagnostic set']);
    const grid = document.createElement('div');
    grid.className = 'compare-grid';
    const models = [
      { zh: 'Qwen3.5-9B', en: 'Qwen3.5-9B', iou: 0.635, acc: 76, box: '26/37', hits: '25/37', abs: '13/13', aura: false },
      { zh: 'AURA 2.0', en: 'AURA 2.0', iou: 0.906, acc: 94, box: '37/37', hits: '36/37', abs: '11/13', aura: true }
    ];
    const views = models.map((model) => {
      const card = document.createElement('article');
      card.className = 'compare-card';
      card.append(T('strong', '', model.zh, model.en));
      const iou = barRow(card, ['mIoU', 'mIoU'], model.aura);
      const acc = barRow(card, ['准确率', 'Accuracy'], model.aura);
      grid.append(card);
      return { card, iou, acc, model };
    });
    const fracs = document.createElement('div');
    fracs.className = 'fracs';
    const head = document.createElement('div');
    head.append(T('strong', '', '细项', 'Breakdown'));
    fracs.append(head);
    const columns = [
      ['有框的正例', 'Positive queries with a box'],
      ['命中 IoU ≥ 0.5', 'Positive hits, IoU ≥ 0.5'],
      ['正确拒绝', 'Correct abstentions']
    ];
    const fracCells = columns.map((column) => {
      const cell = document.createElement('div');
      cell.append(T('strong', '', column[0], column[1]));
      const text = document.createElement('span');
      cell.append(text);
      fracs.append(cell);
      return text;
    });
    ui.note.dataset.zh = 'mIoU 只在目标出现时计算，漏框记 0。正例命中要求 IoU ≥ 0.5；缺席目标只有不出框才算正确拒绝。';
    ui.note.dataset.en = 'mIoU is computed on present targets, and a missing box scores zero. Positive hits require IoU ≥ 0.5. Correct abstention means no box when the target is absent.';
    leaves.push(ui.note);
    ui.note.textContent = L(ui.note.dataset.zh, ui.note.dataset.en);
    ui.meter.after(grid, fracs);
    const beats = [
      ['mIoU 只在目标出现时计算，漏框记 0。正例命中要求 IoU ≥ 0.5，缺席目标要正确拒绝。', 'mIoU is computed on present targets, and a missing box scores zero. A positive hit needs IoU ≥ 0.5. An absent target is correct only with no box.'],
      ['Qwen3.5-9B：mIoU 0.635，准确率 76.0%。有框 26/37，命中 25/37，正确拒绝 13/13。', 'Qwen3.5-9B: mIoU 0.635, accuracy 76.0%. Boxes on 26/37 positive queries, 25/37 hits, and 13/13 correct abstentions.'],
      ['AURA 2.0：mIoU 0.906，准确率 94.0%。正例全部出框 37/37，命中 36/37。', 'AURA 2.0: mIoU 0.906, accuracy 94.0%. It boxes every positive query, 37/37, with 36/37 hits.'],
      ['正确拒绝是 11/13，低于 Qwen 的 13/13。定位和命中更高，拒绝缺席目标这一项并没有同步提高。', 'Correct abstentions are 11/13, below Qwen’s 13/13. Localization and hits are higher; abstaining on absent targets is not.']
    ];
    let stepNow = 0;
    function render(step, progress) {
      stepNow = step;
      const p0 = fraction(step, progress, 1);
      const p1 = fraction(step, progress, 2);
      const shown = [p0, p1];
      views.forEach((view, index) => {
        const amount = shown[index];
        view.iou.i.style.width = `${view.model.iou * 100 * amount}%`;
        view.iou.b.textContent = (view.model.iou * amount).toFixed(3);
        view.acc.i.style.width = `${view.model.acc * amount}%`;
        view.acc.b.textContent = (view.model.acc * amount).toFixed(1);
        view.card.classList.toggle('is-now', step === index + 1);
      });
      const bits = [
        [models[0].box, models[1].box],
        [models[0].hits, models[1].hits],
        [models[0].abs, models[1].abs]
      ];
      fracCells.forEach((cell, index) => {
        const left = p0 > 0 ? bits[index][0] : '–';
        const right = p1 > 0 ? bits[index][1] : '–';
        cell.textContent = `${left} → ${right}`;
      });
      ui.caption.textContent = L(beats[step][0], beats[step][1]);
      ui.bar.style.width = `${((step + progress) / beats.length) * 100}%`;
    }
    const api = play(ui.root, beats.length, 720, render);
    ui.replay.addEventListener('click', () => api.replay());
    refreshers.push(() => { ui.caption.textContent = L(beats[stepNow][0], beats[stepNow][1]); });
  }

  function buildMix() {
    const fig = document.querySelector('#data .composition-figure');
    if (!fig) return;
    const title = fig.querySelector('h3');
    const total = 484459;
    const neon = document.body.classList.contains('vivid');
    const stages = [
      { n: 1, samples: 249992, share: 51.6, tokens: '5.65B', tokenShare: '49.4%', silent: '96.3%', resp: '3.7%', color: neon ? '#3399FF' : '#4f86d6' },
      { n: 2, samples: 164365, share: 33.9, tokens: '3.49B', tokenShare: '30.5%', silent: '94.9%', resp: '5.1%', color: neon ? '#00FFC8' : '#6fbf8a' },
      { n: 3, samples: 70102, share: 14.5, tokens: '2.29B', tokenShare: '20.0%', silent: '96.7%', resp: '3.3%', color: neon ? '#B87FFF' : '#b89be0' }
    ];
    const outer = neon ? [
      { value: 130399, color: '#00C8A0' }, { value: 47267, color: '#7DFFE4' }, { value: 52643, color: '#3399FF' }, { value: 19683, color: '#FFB020' },
      { value: 35104, color: '#00FFC8' }, { value: 12724, color: '#B8FFF0' }, { value: 43738, color: '#7CB8FF' }, { value: 6000, color: '#FFD27A' }, { value: 25047, color: '#B87FFF' }, { value: 41752, color: '#D4B6FF' },
      { value: 32030, color: '#9A62F0' }, { value: 21624, color: '#FFB020' }, { value: 5905, color: '#E4D2FF' }, { value: 10543, color: '#5AA8FF' }
    ] : [
      { value: 130399, color: '#2f8f6e' }, { value: 47267, color: '#9dcfb0' }, { value: 52643, color: '#6ea0e0' }, { value: 19683, color: '#d4a24a' },
      { value: 35104, color: '#3e9a78' }, { value: 12724, color: '#b7ddc4' }, { value: 43738, color: '#8eb4ea' }, { value: 6000, color: '#e0b56a' }, { value: 25047, color: '#d48fb0' }, { value: 41752, color: '#c4b0ea' },
      { value: 32030, color: '#c46b98' }, { value: 21624, color: '#e0b06a' }, { value: 5905, color: '#d8c8f2' }, { value: 10543, color: '#a9c4ef' }
    ];
    const tasks = neon ? [
      ['Real-Time QA', 165503, 34.2, '#00FFC8'],
      ['Proactive QA', 106924, 22.1, '#3399FF'],
      ['Multi-Response QA', 59991, 12.4, '#7DFFE4'],
      ['MIC', 57077, 11.8, '#B87FFF'],
      ['IVG', 47657, 9.8, '#D4B6FF'],
      ['SATC', 25683, 5.3, '#FFB020'],
      ['Mixed-capability', 21624, 4.5, '#FFD27A']
    ] : [
      ['Real-Time QA', 165503, 34.2, '#2f8f6e'],
      ['Proactive QA', 106924, 22.1, '#6ea0e0'],
      ['Multi-Response QA', 59991, 12.4, '#9dcfb0'],
      ['MIC', 57077, 11.8, '#d48fb0'],
      ['IVG', 47657, 9.8, '#c4b0ea'],
      ['SATC', 25683, 5.3, '#d4a24a'],
      ['Mixed-capability', 21624, 4.5, '#e0b06a']
    ];
    fig.replaceChildren(title);
    const panel = document.createElement('div');
    panel.className = 'sv-panel';
    const top = document.createElement('div');
    top.className = 'sv-top';
    const copy = document.createElement('div');
    copy.append(T('h3', '', '三个阶段的样本、token 与任务分布', 'Samples, tokens, and tasks across three stages'));
    const replay = T('button', 'sv-replay', '↻ 重放', '↻ Replay');
    replay.type = 'button';
    top.append(copy, replay);
    const meter = document.createElement('div');
    meter.className = 'sv-meter';
    const bar = document.createElement('i');
    meter.append(bar);
    const caption = document.createElement('p');
    caption.className = 'sv-caption';

    const layout = document.createElement('div');
    layout.className = 'mix';
    const donut = document.createElement('div');
    donut.className = 'mix-donut';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 240 240');
    const ns = 'http://www.w3.org/2000/svg';
    function ring(segments, radius, width) {
      const circ = 2 * Math.PI * radius;
      let acc = 0;
      const circles = segments.map((seg) => {
        const len = circ * (seg.value / total);
        const node = document.createElementNS(ns, 'circle');
        node.setAttribute('cx', '120');
        node.setAttribute('cy', '120');
        node.setAttribute('r', String(radius));
        node.setAttribute('fill', 'none');
        node.setAttribute('stroke', seg.color);
        node.setAttribute('stroke-width', String(width));
        node.setAttribute('transform', 'rotate(-90 120 120)');
        node.dataset.len = String(len);
        node.dataset.off = String(acc);
        acc += len;
        svg.append(node);
        return node;
      });
      return { circles, circ };
    }
    const inner = ring(stages.map((stage) => ({ value: stage.samples, color: stage.color })), 62, 16);
    const outerRing = ring(outer, 96, 20);
    const center = document.createElement('div');
    center.className = 'mix-center';
    const name = document.createElement('b');
    name.textContent = 'AURA 2.0';
    const samples = document.createElement('strong');
    samples.textContent = '0';
    const unit = T('span', '', '条样本', 'samples');
    const tokens = document.createElement('small');
    tokens.textContent = '11.43B tokens';
    center.append(name, samples, unit, tokens);
    donut.append(svg, center);

    const stageCol = document.createElement('div');
    stageCol.append(T('h4', '', 'b  各阶段统计', 'b  Training-stage statistics'));
    const stageRows = stages.map((stage) => {
      const row = document.createElement('div');
      row.className = 'mix-stage is-wait';
      const dot = document.createElement('i');
      dot.style.background = stage.color;
      const label = document.createElement('b');
      label.textContent = String(stage.n);
      const count = document.createElement('strong');
      count.textContent = '0';
      const meta = document.createElement('span');
      meta.textContent = `${stage.share}% · ${stage.tokens} · ${stage.tokenShare} tokens · silent ${stage.silent}`;
      row.append(dot, label, count, meta);
      stageCol.append(row);
      return { row, count, stage };
    });

    const taskCol = document.createElement('div');
    taskCol.className = 'mix-tasks';
    taskCol.append(T('h4', '', 'c  任务总体分布', 'c  Overall task distribution'));
    const taskRows = tasks.map(([label, value, share, color]) => {
      const row = document.createElement('div');
      row.className = 'mix-task';
      const nameEl = document.createElement('span');
      nameEl.textContent = label;
      const track = document.createElement('div');
      track.className = 'track';
      const fill = document.createElement('i');
      fill.style.background = color;
      track.append(fill);
      const num = document.createElement('b');
      num.textContent = '0';
      row.append(nameEl, track, num);
      taskCol.append(row);
      return { fill, num, value, share };
    });

    const facts = document.createElement('div');
    facts.className = 'mix-facts';
    [['5,400 h', '视频', 'video'], ['40M', '帧', 'frames'], ['6', '核心交互类型', 'core interaction types']].forEach(([value, zh, en]) => {
      const chip = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = value;
      chip.append(strong, T('span', '', zh, en));
      facts.append(chip);
    });
    layout.append(donut, stageCol, taskCol, facts);
    const note = T('p', 'sv-note',
      '内环是三个训练阶段的样本占比，外环是各阶段里的任务构成。右侧表给出样本、token 和沉默比例；下方是跨阶段汇总后的任务分布。',
      'The inner ring is the sample share of the three training stages. The outer ring splits each stage by task. The tables report samples, tokens, silence, and the task mix aggregated across stages.');
    panel.append(top, meter, caption, layout, note);
    fig.append(panel);

    const paint = (group, amount) => {
      let remain = Math.max(0, amount) * group.circ;
      group.circles.forEach((node) => {
        const len = Number(node.dataset.len);
        const show = Math.max(0, Math.min(len, remain));
        remain -= len;
        node.setAttribute('stroke-dasharray', `${show} ${group.circ - show}`);
        node.setAttribute('stroke-dashoffset', String(-Number(node.dataset.off)));
      });
    };
    const beats = [
      ['一共 484,459 条样本，11.43B tokens。', '484,459 samples and 11.43B tokens in total.'],
      ['阶段 1：249,992 条，占 51.6%，5.65B tokens，96.3% 的决策是沉默。', 'Stage 1: 249,992 samples, 51.6%, 5.65B tokens, and 96.3% silent decisions.'],
      ['阶段 2：164,365 条，占 33.9%，3.49B tokens，94.9% 沉默。', 'Stage 2: 164,365 samples, 33.9%, 3.49B tokens, and 94.9% silence.'],
      ['阶段 3：70,102 条，占 14.5%，2.29B tokens，96.7% 沉默。', 'Stage 3: 70,102 samples, 14.5%, 2.29B tokens, and 96.7% silence.'],
      ['外环按阶段展开任务：问答、主动对话、工具、定位和混合能力。', 'The outer ring splits each stage into QA, model-initiated conversation, tools, grounding, and mixed capability.'],
      ['跨阶段汇总后，实时问答占 34.2%，主动问答占 22.1%。', 'Across stages, real-time QA is 34.2% and proactive QA is 22.1%.'],
      ['这套混合数据覆盖 5,400 小时视频、4000 万帧和 6 类核心交互。', 'The mixture covers 5,400 hours of video, 40M frames, and 6 core interaction types.']
    ];
    let stepNow = 0;
    function render(step, progress) {
      stepNow = step;
      const cuts = [0, 249992, 414357, total];
      let innerAmount = 0;
      if (step >= 1 && step <= 3) innerAmount = (cuts[step - 1] + (cuts[step] - cuts[step - 1]) * progress) / total;
      else if (step > 3) innerAmount = 1;
      paint(inner, innerAmount);
      paint(outerRing, step > 4 ? 1 : step === 4 ? progress : 0);
      samples.textContent = Math.round(innerAmount * total).toLocaleString('en-US');
      stageRows.forEach((item, index) => {
        const amount = step > index + 1 ? 1 : step === index + 1 ? progress : 0;
        item.row.classList.toggle('is-wait', amount === 0);
        item.row.classList.toggle('is-now', step === index + 1);
        item.count.textContent = Math.round(item.stage.samples * amount).toLocaleString('en-US');
      });
      const taskAmount = step > 5 ? 1 : step === 5 ? progress : 0;
      taskRows.forEach((item) => {
        item.fill.style.width = `${item.share * taskAmount}%`;
        item.num.textContent = taskAmount > 0.98 ? `${item.value.toLocaleString('en-US')} · ${item.share}%` : `${Math.round(item.share * taskAmount)}%`;
      });
      facts.style.opacity = step >= 6 ? '1' : '0.35';
      caption.textContent = L(beats[step][0], beats[step][1]);
      bar.style.width = `${((step + progress) / beats.length) * 100}%`;
    }
    const api = play(panel, beats.length, 780, render);
    replay.addEventListener('click', () => api.replay());
    refreshers.push(() => { caption.textContent = L(beats[stepNow][0], beats[stepNow][1]); });
  }

  function animateBenchmarks() {
    const host = document.querySelector('.benchmarks');
    if (!host) return;
    const cards = [...host.querySelectorAll('.benchmark-card')];
    if (!cards.length) return;
    const series = cards.map((card) => ({
      card,
      bars: [...card.querySelectorAll('.benchmark-bar')].map((bar) => ({ bar, h: parseFloat(bar.style.height) || 0 })),
      scores: [...card.querySelectorAll('.benchmark-score')].map((node) => ({ node, v: parseFloat(node.textContent) || 0 }))
    }));
    const replay = T('button', 'sv-replay', '↻ 重放', '↻ Replay');
    replay.type = 'button';
    host.querySelector('.benchmark-heading')?.append(replay);
    const meter = document.createElement('div');
    meter.className = 'sv-meter';
    const bar = document.createElement('i');
    meter.append(bar);
    host.querySelector('.benchmark-heading')?.after(meter);
    function render(step, progress) {
      series.forEach((item, index) => {
        const amount = step >= series.length ? 1 : fraction(step, progress, index);
        item.bars.forEach(({ bar: node, h }) => { node.style.height = `${h * amount}px`; });
        item.scores.forEach(({ node, v }) => { node.textContent = (v * amount).toFixed(2); });
        item.card.classList.toggle('is-live', step === index);
      });
      bar.style.width = `${((Math.min(step, series.length - 1) + (step >= series.length ? 1 : progress)) / series.length) * 100}%`;
    }
    const api = play(host, series.length + 1, 620, render);
    replay.addEventListener('click', () => api.replay());
  }
})();

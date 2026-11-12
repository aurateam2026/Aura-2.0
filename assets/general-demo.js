(function () {
  var demos = window.AURA_CONTENT && window.AURA_CONTENT.demos;
  if (!demos) return;

  function fill(id, patch) {
    var demo = demos.find(function (item) { return item.id === id; });
    if (demo) Object.assign(demo, patch);
  }

  fill('market', {
    title: '逛超市',
    desc: '一起在超市买牛排，以及做牛排要用的食材。',
    video: 'https://huggingface.co/datasets/aurateam/Aura_2_0_DEMOS/resolve/main/composite/shop_part1_cropped-web.mp4',
    events: [
      { time: 4, role: 'User', text: '今天我想做牛排，你陪我在这家超市一起买东西吧' },
      { time: 9, role: 'User', text: '家里已经有盐，黑胡椒，黄油了，我还需要买牛排，芦笋，大蒜和迷迭香，我们先买肉吧' },
      { time: 50, role: 'User', text: '这两种牛排有什么区别，我应该怎么选？' },
      { time: 137, role: 'User', text: '接下来我该买什么了？' },
      { time: 218, role: 'User', text: '是这瓶吗？' },
      { time: 281, role: 'User', text: '这里几款红酒怎么选呀，我想买左边这瓶怎么样？' },
      { time: 316, role: 'User', text: '感觉可以结帐了，帮我找找自助收银机怎么去' }
    ]
  });

  fill('coffee', {
    title: '做咖啡',
    desc: '看着咖啡机，一步一步做一杯咖啡。',
    video: 'https://huggingface.co/datasets/aurateam/Aura_2_0_DEMOS/resolve/main/composite/coffee_2-silent.mp4',
    events: [
      { time: 3, role: 'User', text: '我想用这杯咖啡机做一杯咖啡，请你一步一步指导我' },
      { time: 8, role: 'User', text: '帮我查查这两种咖啡豆有什么区别？' },
      { time: 35, role: 'User', text: '这些分别是什么意思，我要怎么调？' },
      { time: 52, role: 'User', text: '可以点开始制作了吗' },
      { time: 95, role: 'User', text: '现在做好了吗，我可以喝了吗' }
    ]
  });

  demos.push({
    id: 'flea',
    title: '跳蚤市场',
    kind: 'coupled',
    tags: ['proactive', 'tool'],
    art: 'market',
    color: '#e7e3db',
    desc: '逛二手市场，看看有什么值得买。',
    steps: [],
    poster: '',
    video: 'https://huggingface.co/datasets/aurateam/Aura_2_0_DEMOS/resolve/main/composite/market_cut-silent.mp4',
    events: [
      { time: 1, role: 'User', text: '带我逛一逛这个二手市场，帮我看看有什么值得买的东西' },
      { time: 30, role: 'User', text: '这两个红色的罐子是干什么用的？' },
      { time: 47, role: 'User', text: '这里面有没有适合小孩玩的东西？' },
      { time: 81, role: 'User', text: '这个白色罐子好大，帮我查查是干什么的？' },
      { time: 100, role: 'User', text: '这些画有没有值得买的' },
      { time: 167, role: 'User', text: '查查这个茶壶什么来头？' },
      { time: 178, role: 'User', text: '这三个小娃娃好像挺好看的，值得买吗' },
      { time: 209, role: 'User', text: '这写的什么意思，翻译一下' },
      { time: 212, role: 'User', text: '我逛累了' }
    ]
  });


  var drop = { airport: 1, furniture: 1, cooking: 1, football: 1 };
  for (var i = demos.length - 1; i >= 0; i--) {
    if (drop[demos[i].id]) demos.splice(i, 1);
  }
})();

// Single-file API handler for Vercel — no require paths
const crypto = require('crypto');

const WORKS = [{"id":"w001","name":"Nuit Étoilée","nameZh":"星夜","collection":"c001","inspiration":"Inspired by the night sky over the Seine on a winter evening. Hand-embroidered with 4,200 glass beads and silver thread.","inspirationZh":"灵感源于塞纳河畔冬夜的星空。4200颗玻璃珠与银线手工刺绣。","craft":"French Alençon lace base, hand-pleated silk tulle overlay, glass bead embroidery, silk crepe lining. 210 hours of handwork.","craftZh":"法国阿朗松蕾丝底，手工打褶真丝薄纱覆层，玻璃珠刺绣，真丝缎内衬。210小时手工。","images":["images/works/nuit-etoilee-01.jpg","images/works/nuit-etoilee-03.jpg","images/works/nuit-etoilee-b1.jpg"],"featured":true,"order":1},{"id":"w002","name":"Jardin Secret","nameZh":"秘密花园","collection":"c002","inspiration":"A hidden garden in Provence at dawn. Silk petals hand-cut and individually sewn onto tulle.","inspirationZh":"普罗旺斯黎明时分的秘密花园。真丝花瓣手工裁剪，逐片缝于薄纱。","craft":"Hand-painted silk organza, 3D floral appliqués, feather trim, corset bodice. 280 hours.","craftZh":"手绘真丝欧根纱，3D立体花卉贴花，羽毛饰边，紧身胸衣。280小时。","images":["images/works/jardin-secret-01.jpg","images/works/jardin-secret-b1.jpg","images/works/jardin-secret-b2.jpg","images/works/jardin-secret-b3.jpg"],"featured":true,"order":2},{"id":"w003","name":"Larme de Lune","nameZh":"月之泪","collection":"c001","inspiration":"Tears of the moon, captured in silk and crystal. A meditation on light and shadow.","inspirationZh":"月之泪，凝结于丝绸与水晶之中。光与影的冥想。","craft":"Silk chiffon draping, crystal beadwork, hand-painted gradient, invisible hem. 195 hours.","craftZh":"真丝雪纺褶裥，水晶珠饰，手绘渐变色，隐形卷边。195小时。","images":["images/works/larme-de-lune-01.jpg","images/works/larme-de-lune-b1.jpg","images/works/larme-de-lune-b2.jpg"],"featured":true,"order":3},{"id":"w004","name":"Forêt Enchantée","nameZh":"迷幻森林","collection":"c002","inspiration":"An enchanted forest where moss meets moonlight. Layers of green silk create depth like ancient woods.","inspirationZh":"苔藓与月光交汇的迷幻森林。层层绿色真丝营造古木参天的深邃。","craft":"Layered silk georgette, hand-embroidered vine motifs, beaded fringe. 230 hours.","craftZh":"层叠真丝乔其纱，手绣藤蔓纹样，珠饰流苏。230小时。","images":["images/works/foret-enchantee-01.jpg","images/works/foret-enchantee-b1.jpg","images/works/foret-enchantee-b2.jpg"],"featured":false,"order":4},{"id":"w005","name":"Blanche Colombe","nameZh":"白鸽","collection":"c003","inspiration":"The white dove — symbol of peace and new beginnings. A bridal gown for the woman who walks her own path.","inspirationZh":"白鸽——和平与新生的象征。为走自己路的女人而制的新娘礼服。","craft":"Duchesse satin sculptural bodice, cascading silk tulle train, hand-sewn pearl buttons. 320 hours.","craftZh":"公爵缎雕塑上身，瀑布式真丝薄纱拖尾，手工缝制珍珠纽扣。320小时。","images":["images/works/blanche-colombe-01.jpg","images/works/blanche-colombe-02.jpg","images/works/blanche-colombe-b1.jpg","images/works/blanche-colombe-detail.jpg"],"featured":true,"order":5},{"id":"w006","name":"Rose Éternelle","nameZh":"永恒玫瑰","collection":"c003","inspiration":"The eternal rose that never wilts. A gown for timeless love — structured yet ethereal.","inspirationZh":"永不凋零的永恒玫瑰。为永恒之爱而制的礼服——结构感与空灵并存。","craft":"Silk faille sculptural construction, hand-molded rose appliqués, cathedral-length veil. 350 hours.","craftZh":"真丝罗缎雕塑结构，手工塑形玫瑰贴花，大教堂长度头纱。350小时。","images":["images/works/rose-eternelle-01.jpg","images/works/rose-eternelle-02.jpg","images/works/rose-eternelle-b1.jpg"],"featured":false,"order":6}];

const COLS = [{"id":"c001","name":"Celestial Dreams","nameZh":"天穹之梦","description":"Dresses born from the night: stars, moons, and the infinite sky translated into silk.","descriptionZh":"由夜晚诞生的礼服：星辰、月亮与无垠天际化为丝绸。","coverImage":"images/collections/celestial-cover.jpg","active":true,"order":1},{"id":"c002","name":"Les Floraisons","nameZh":"花之绽放","description":"A botanical reverie. Each gown is a bloom, each silhouette a petal unfurling.","descriptionZh":"植物学幻想曲。每件礼服是一朵花，每个轮廓是绽放的花瓣。","coverImage":"images/collections/ombre-cover.jpg","active":true,"order":2},{"id":"c003","name":"Brides de Légende","nameZh":"传奇新娘","description":"For the woman who becomes a legend on her wedding day.","descriptionZh":"为在婚礼之日成为传奇的女人。","coverImage":"images/collections/bridal-cover.jpg","active":true,"order":3}];

const SETTINGS = {"siteName":"ALTESSE","siteTagline":"Haute Couture · Paris","email":"atelier@altesse-couture.com","instagram":"@altesse","address":"31 Rue Cambon, 75001 Paris","announcement":{"active":true,"text":"By Appointment Only — 31 Rue Cambon, Paris","textZh":"仅限预约 — 31 Rue Cambon, Paris"}};

const USERS = [{"id":"u001","username":"admin","password":"e13b26a477650ba2373ac9dc79ab928c:e9f8ad33d19743c96cecd38f7a3d899d46643631b9ea03adcff4063b420f9c6a65995d7b66293101f5427bef9c17470301ad514c13ed0aa51d171424e301825c","role":"owner"}];

const MSGS = [];

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.end(JSON.stringify(data));
}

function bodyParser(req) {
  return new Promise(r => {
    let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ try{r(JSON.parse(b))}catch{r({})} });
  });
}

function verifyPwd(pw, stored) {
  const [salt,hash] = stored.split(':');
  if(!salt||!hash) return false;
  return hash === crypto.scryptSync(pw, salt, 64).toString('hex');
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const m = req.method.toUpperCase();
  const auth = req.headers.authorization || '';

  try {
    // Public API
    if (p === '/api/works') {
      const feat = url.searchParams.get('featured');
      return json(res, 200, feat==='true' ? WORKS.filter(w=>w.featured) : WORKS);
    }
    if (p === '/api/collections') return json(res, 200, COLS);
    if (p === '/api/settings') return json(res, 200, SETTINGS);
    if (p === '/api/contact' && m === 'POST') {
      const d = await bodyParser(req);
      if (!d.name||!d.email||!d.message) return json(res, 400, {error:'Missing fields'});
      return json(res, 200, {success:true, message:'Merci!'});
    }

    // Login — no auth required
    if (p === '/api/admin/login' && m === 'POST') {
      const {username, password} = await bodyParser(req);
      const u = USERS.find(x=>x.username===username);
      if (!u||!verifyPwd(password, u.password)) return json(res, 401, {error:'Invalid credentials'});
      return json(res, 200, {token:'altesse_vercel_token', role:u.role});
    }
    // Auth-gated admin APIs below
    if (!auth.startsWith('Bearer ')) return json(res, 401, {error:'Unauthorized'});

    if (p === '/api/admin/logout') return json(res, 200, {success:true});
    if (p === '/api/admin/check') return json(res, 200, {authenticated:true, role:'admin'});
    if (p === '/api/admin/works') return json(res, 200, WORKS);
    if (p === '/api/admin/collections') return json(res, 200, COLS);
    if (p === '/api/admin/messages') return json(res, 200, MSGS);
    if (p === '/api/admin/settings') return json(res, 200, SETTINGS);

    json(res, 404, {error:'Not found'});
  } catch(e) {
    json(res, 500, {error:e.message});
  }
};

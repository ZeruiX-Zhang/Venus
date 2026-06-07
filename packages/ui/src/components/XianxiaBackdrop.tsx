// 用途：古风夜色背景（朦胧月 + 水墨远山 + 雾气 + 飘落花瓣），纯 CSS/SVG 实现，无需图片资源。
// 主舞台和桌宠共用。floating=true 时（桌宠）四周渐隐成透明，保持漂浮感。

export function XianxiaBackdrop({ floating = false }: { floating?: boolean }) {
  return (
    <div className={`pca-xianxia${floating ? " pca-xianxia--floating" : ""}`} aria-hidden="true">
      {/* 朦胧月 */}
      <div className="pca-xianxia__moon" />
      {/* 水墨远山（淡/浓两层） */}
      <svg className="pca-xianxia__mountains" viewBox="0 0 360 200" preserveAspectRatio="none">
        <path className="pca-xianxia__range pca-xianxia__range--far" d="M0,140 L55,95 L120,124 L190,74 L255,112 L320,82 L360,112 L360,200 L0,200 Z" />
        <path className="pca-xianxia__range pca-xianxia__range--near" d="M0,172 L80,132 L150,162 L230,122 L300,152 L360,138 L360,200 L0,200 Z" />
      </svg>
      {/* 山间雾气 */}
      <div className="pca-xianxia__mist" />
      {/* 飘落花瓣 */}
      <span className="pca-xianxia__petal pca-xianxia__petal--1" />
      <span className="pca-xianxia__petal pca-xianxia__petal--2" />
      <span className="pca-xianxia__petal pca-xianxia__petal--3" />
      <span className="pca-xianxia__petal pca-xianxia__petal--4" />
      <span className="pca-xianxia__petal pca-xianxia__petal--5" />
      <span className="pca-xianxia__petal pca-xianxia__petal--6" />
    </div>
  );
}

export default XianxiaBackdrop;

import { Compass, Heart, LockKeyhole, X } from 'lucide-react';
export function Intro() {
  return <aside className="discover-intro">
    <div className="eyebrow"><Compass size={16} /> Discover</div>
    <h2>Meet someone<br /><span>new.</span></h2>
    <p className="intro-description">Swipe right if you’re interested. If they feel the same, it’s a match.</p>
    <div className="swipe-guide"><h3>Swipe your way</h3>
      <div className="swipe-guide-directions">
        <p><X size={20} /><span>Pass<small>Swipe left</small></span></p>
        <p><Heart size={20} /><span>Like<small>Swipe right</small></span></p>
      </div>
    </div>
    <p className="privacy-note"><LockKeyhole size={16} />Your likes stay private until they’re mutual.</p>
    <p className="demo-footnote">Discover demo · Fictional profiles · 18+</p>
  </aside>;
}

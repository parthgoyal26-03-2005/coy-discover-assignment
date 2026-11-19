import { Heart, LockKeyhole, MousePointer2, Sparkles } from 'lucide-react';
export function Intro() {
  return <aside className="discover-intro">
    <div className="eyebrow"><span className="tiny-flower">✳</span> A NEW WAY TO COY</div>
    <h1>Meet your next<br />little <span className="pink-underline">plot twist.</span></h1>
    <p className="intro-description">Someone new. Something unexpected.<br />See where a little curiosity takes you.</p>
    <div className="how-it-works"><h2>Good things start with a hello.</h2>
      <div><span className="step-icon lavender"><MousePointer2 size={18} /></span><p>Explore a profile.<small>There’s a person behind every card.</small></p></div>
      <div><span className="step-icon peach"><Heart size={18} /></span><p>Go with your feeling.<small>Swipe right to like. Left to pass.</small></p></div>
      <div><span className="step-icon pale-pink"><Sparkles size={18} /></span><p>When it’s mutual, you’ll know.<small>Two likes. One lovely beginning.</small></p></div>
    </div>
    <div className="privacy-note"><LockKeyhole size={20} /><p>Some things should stay between you two.<small>Your likes are private until you both like each other.</small></p></div>
    <p className="demo-footnote">A small demo of a new idea for Coy.<br />All profiles are fictional and 18+.</p>
  </aside>;
}

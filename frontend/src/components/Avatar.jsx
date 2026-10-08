import { initials } from '../utils/format';

// Soft, harmonious tones; the same name always gets the same colour.
const TONES = [
  ['#e0eaff', '#1f4bc4'], ['#eee9fd', '#4b2fb5'], ['#dff3e8', '#176a43'],
  ['#fdf1d8', '#8a5708'], ['#fde7ec', '#a3274a'], ['#dff3f6', '#0f6b7a'],
];

export default function Avatar({ name = '', size = 34 }) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length;
  const [bg, fg] = TONES[i];
  return (
    <span className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

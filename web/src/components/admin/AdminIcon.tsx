import { ICON_PATHS, type IconName } from './iconPaths';

/** A Phosphor icon. It is decoration: the words next to it carry the meaning, so it is hidden from readers. */
export default function AdminIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="a-icon"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

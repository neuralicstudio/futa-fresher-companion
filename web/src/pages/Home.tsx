import { APP_NAME, APP_TAGLINE } from '../appName';

export default function Home() {
  return (
    <>
      <h1>{APP_NAME}</h1>
      <p className="muted">{APP_TAGLINE}</p>
    </>
  );
}

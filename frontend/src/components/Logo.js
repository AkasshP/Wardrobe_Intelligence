export default function Logo({ size = 52 }) {
  return (
    <div className="logo-mark">
      <img src="/images/logo-crest.png" alt="WI" width={size} height={size} style={{ objectFit: 'contain' }} />
    </div>
  );
}

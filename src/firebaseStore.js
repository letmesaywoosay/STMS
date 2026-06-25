const FIRESTORE_API_KEY =
  import.meta.env.VITE_FIRESTORE_API_KEY || "AIzaSyCarxTqSx__7AfzVNHzN-ilnk0gNN6PkTU";
const FIRESTORE_PROJECT =
  import.meta.env.VITE_FIRESTORE_PROJECT || "solutiontestsystem";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/app_data`;

export const fbGet = async (key) => {
  const res = await fetch(`${FIRESTORE_BASE}/${key}?key=${FIRESTORE_API_KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = await res.json();
  const raw = doc?.fields?.value?.stringValue;
  return raw ? JSON.parse(raw) : null;
};

export const fbSet = async (key, value) => {
  const body = { fields: { value: { stringValue: JSON.stringify(value) } } };
  const res = await fetch(`${FIRESTORE_BASE}/${key}?key=${FIRESTORE_API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
};

export const buildSearchIndex = (...fields: string[]) => {
  const result = new Set<string>();

  const normalize = (text: string) => text.toLowerCase().trim();

  const addCombinations = (text: string) => {
    if (!text) return;

    const cleaned = normalize(text);

    // ✅ split intelligently for names, emails, usernames
    const words = cleaned.split(/[\s@._-]+/).filter(Boolean);

    // single words
    words.forEach(w => result.add(w));

    // full string
    result.add(cleaned);

    // combinations (ordered)
    for (let i = 0; i < words.length; i++) {
      let combo = '';

      for (let j = i; j < words.length; j++) {
        combo = combo ? `${combo} ${words[j]}` : words[j];
        result.add(combo);
      }
    }
  };

  fields.forEach(addCombinations);

  return Array.from(result);
};

export const checkUsernameAvailability = async (
  username: string,
  firestore: any,
) => {
  const doc = await firestore().collection('usernames').doc(username).get();

  if (!doc.exists) return username;

  throw new Error('Please choose a different username');
};

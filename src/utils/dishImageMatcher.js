/**
 * Matches dish name keywords to appropriate photos or food emojis.
 * Prevents showing mismatched stock photos (e.g. French fries for Chicken & Thyme or Spinach & Corn).
 */
export function resolveDishImage(name, rawSrc, isVeg) {
  if (!name) return { src: rawSrc, emoji: isVeg ? '🥗' : '🍗', usePhoto: Boolean(rawSrc) };

  const lowerName = name.toLowerCase();

  // Known mismatched photo IDs (like fries photo-1585109649139-366815a0d713 or photo-1576107232684)
  const isFriesPhoto = rawSrc && (rawSrc.includes('1585109649139') || rawSrc.includes('1576107232684'));
  const isFriesDish = /fries|french fry|potato wedges/i.test(lowerName);

  // If photo is fries but dish is NOT fries (e.g. Chicken & Thyme, Spinach & Corn, Puff, Tart)
  if (isFriesPhoto && !isFriesDish) {
    let emoji = '🥐';
    if (/puff|pastry|croissant/i.test(lowerName)) emoji = '🥐';
    else if (/quiche|pie|tart/i.test(lowerName)) emoji = '🥧';
    else if (/chicken|poultry/i.test(lowerName)) emoji = '🍗';
    else if (/spinach|corn|salad|greens/i.test(lowerName)) emoji = '🥗';
    else emoji = isVeg ? '🥗' : '🍗';
    return { src: null, emoji, usePhoto: false };
  }

  // Explicit check for Puffs and Quiches that were assigned unrelated photos
  if (/chicken & thyme|spinach & corn/i.test(lowerName)) {
    const emoji = /chicken/i.test(lowerName) ? '🍗' : '🥗';
    return { src: null, emoji, usePhoto: false };
  }

  if (/puff|quiche/i.test(lowerName)) {
    return { src: null, emoji: /quiche/i.test(lowerName) ? '🥧' : '🥐', usePhoto: false };
  }

  // Confident keyword matches
  if (/biryani|biriyani|pulav|pulao/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍚', usePhoto: Boolean(rawSrc) };
  }
  if (/pizza|calzone/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍕', usePhoto: Boolean(rawSrc) };
  }
  if (/burger|slider/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍔', usePhoto: Boolean(rawSrc) };
  }
  if (/dosa|idli|vada|uttapam/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🥞', usePhoto: Boolean(rawSrc) };
  }
  if (/coffee|cappuccino|latte|espresso|mocha/i.test(lowerName)) {
    return { src: rawSrc, emoji: '☕', usePhoto: Boolean(rawSrc) };
  }
  if (/tea|chai/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍵', usePhoto: Boolean(rawSrc) };
  }
  if (/shake|frappe|smoothie/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🥤', usePhoto: Boolean(rawSrc) };
  }
  if (/cake|brownie|pastry|lava|sundae|ice cream/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍰', usePhoto: Boolean(rawSrc) };
  }
  if (/noodle|chowmein|maggi|ramen/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍜', usePhoto: Boolean(rawSrc) };
  }
  if (/momo|dumpling/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🥟', usePhoto: Boolean(rawSrc) };
  }
  if (/naan|roti|paratha|kulcha/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🫓', usePhoto: Boolean(rawSrc) };
  }
  if (/paneer|tikka|kebab|tandoori/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍢', usePhoto: Boolean(rawSrc) };
  }
  if (/curry|gravy|dal|makhani|butter chicken|korma|masala/i.test(lowerName)) {
    return { src: rawSrc, emoji: '🍛', usePhoto: Boolean(rawSrc) };
  }

  // Default
  return { src: rawSrc, emoji: isVeg ? '🥗' : '🍗', usePhoto: Boolean(rawSrc) };
}


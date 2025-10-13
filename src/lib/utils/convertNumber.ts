export const convertNumber = (n: number): number => {
	if (n <= 0) return 1; // voll sichtbar
	if (n >= 100) return 0; // ganz unsichtbar
	return parseFloat((0.99 - (n / 100) * 0.99).toFixed(2));
};

// Umgekehrte Logik: 0 → 0, 100 → 1
export const convertNumberInverse = (n: number): number => {
    if (n <= 0) return 0;
    if (n >= 100) return 1;
    return parseFloat(((n / 100) * 0.99).toFixed(2));
};

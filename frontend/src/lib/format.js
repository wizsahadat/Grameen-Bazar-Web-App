export const bn = (n) => Number(n ?? 0).toLocaleString('bn-BD');

export const price = (n) => (n === null || n === undefined || n === '' ? 'দাম আলোচনা সাপেক্ষে' : `৳ ${bn(n)}`);

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${bn(Math.floor(diff / 60))} মিনিট আগে`;
  if (diff < 86400) return `${bn(Math.floor(diff / 3600))} ঘণ্টা আগে`;
  if (diff < 86400 * 30) return `${bn(Math.floor(diff / 86400))} দিন আগে`;
  if (diff < 86400 * 365) return `${bn(Math.floor(diff / (86400 * 30)))} মাস আগে`;
  return `${bn(Math.floor(diff / (86400 * 365)))} বছর আগে`;
}

export const conditionLabel = (c) => (c === 'new' ? 'নতুন' : c === 'used' ? 'ব্যবহৃত' : '');

export const statusLabel = {
  pending: 'অনুমোদনের অপেক্ষায়',
  approved: 'সক্রিয়',
  rejected: 'বাতিল',
  sold: 'বিক্রি হয়েছে',
};

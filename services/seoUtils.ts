import type { Artwork, ImaginationArtwork } from '../types';

/**
 * 구글 검색 노출(SEO)을 위한 작품 이미지 alt(대체 텍스트) 생성 함수
 * 형식: "작가명 김명진 - 작품 제목, 재료/기법, 제작년도, 크기"
 */
export function getArtworkAltText(
  artwork: Partial<Artwork> | Partial<ImaginationArtwork> | null | undefined,
  imageIndex?: number
): string {
  if (!artwork) return '작가명 김명진 미술 작품';

  const artistName = ('artist' in artwork && artwork.artist?.trim()) ? artwork.artist.trim() : '김명진';
  const prefix = `작가명 ${artistName}`;

  const title = artwork.title?.trim() || '작품';
  const details: string[] = [title];

  // 재료 / 기법 (Artwork.memo)
  if ('memo' in artwork && artwork.memo?.trim()) {
    // 줄바꿈이나 긴 텍스트를 깔끔한 단일 라인으로 정제
    const cleanMemo = artwork.memo.trim().replace(/\s+/g, ' ');
    details.push(cleanMemo);
  }

  // 제작년도
  if (artwork.year) {
    const yearStr = String(artwork.year).endsWith('년') ? String(artwork.year) : `${artwork.year}년`;
    details.push(yearStr);
  }

  // 크기
  if (artwork.size?.trim()) {
    details.push(artwork.size.trim());
  }

  const detailText = details.join(', ');
  const indexSuffix = imageIndex !== undefined && imageIndex > 0 ? ` (상세 이미지 ${imageIndex + 1})` : '';

  return `${prefix} - ${detailText}${indexSuffix}`;
}

/**
 * The columns of wishlist_items that every signed-in user may read. The claim
 * columns (is_taken, taken_by_name, taken_at) are only readable through the
 * wishlist_items_admin view, so `select('*')` on the table is refused.
 */
export const ITEM_COLUMNS =
  'id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap';
